import { PALETTE } from '../config/palette';
import { COMBAT, STATUS } from '../data/combat';
import type { Enemy } from '../entities/Enemy';
import type { Hero } from '../entities/Hero';
import { type Element, resolveIncoming } from '../logic/combat';
import type { Rng } from '../logic/rng';
import { countRun, damageHero, healHero, type RunState } from '../logic/run-state';
import type { PlayerStats } from '../logic/stats';
import {
	applyBleed,
	applyBurn,
	applyEarth,
	applyIce,
	applyPoison,
	shredFactor,
	type Tick,
} from '../logic/status';
import type { EnemySystem } from './EnemySystem';
import type { FxSystem } from './FxSystem';

export const HERO_RADIUS = 12;

export interface HitOptions {
	element?: Element;
	/** Extra bleed chance of the weapon on top of the hero's. */
	bleedChance?: number;
	/** Damage-number color override. */
	color?: number;
	/** Applies a poison stack regardless of the hero's poison chance (toxic zones). */
	poison?: boolean;
	/** Hits that should not chain again (the chain itself, area ticks). */
	noChain?: boolean;
}

/** Perk reactions wired by the scene (docs/gdd.md §5.1). */
export interface CombatHooks {
	/** Critical hits apply bleed (Hollow Points). */
	critBleed: boolean;
	/** Returns true when a shield absorbed the hit (Arcane Barrier). */
	absorb: () => boolean;
	onDodge: () => void;
	onParry: (source: Enemy | undefined) => void;
	/** Damage actually taken, after mitigation (Frost Nova, thorns). */
	onHurt: (source: Enemy | undefined) => void;
	/** Hit-stop requests: short freezes that sell the weight of big hits (seconds). */
	hitStop: (seconds: number) => void;
	/** Shield potion: returns the damage left after the shield soaks what it can. */
	shield: (amount: number) => number;
}

/** All damage rules applied inside the scene: on-hit effects, DoTs, kills and hero contact. */
/** Sound of an elemental hit (the sfx limiter keeps hordes from stacking them). */
const ELEMENT_SFX = {
	fire: 'sfx.fire',
	ice: 'sfx.ice',
	earth: 'sfx.earth',
	energy: 'sfx.lightning',
} as const;

export class CombatSystem {
	iFrames = 0;
	god = false;

	constructor(
		private readonly rng: Rng,
		private readonly run: RunState,
		private readonly stats: PlayerStats,
		private readonly hero: Hero,
		private readonly enemies: EnemySystem,
		private readonly fx: FxSystem,
		private readonly onKill: (enemy: Enemy) => void,
		private readonly onHeroDeath: () => void,
		readonly hooks: CombatHooks,
	) {}

	/** A weapon or ability hit: applies on-hit statuses, elements, lifesteal and knockback. */
	weaponHit(e: Enemy, amount: number, crit: boolean, opts: HitOptions = {}): void {
		if (!e.alive) return;
		const s = e.status;
		if (this.rng.next() < (opts.bleedChance ?? 0) + this.stats.bleedChance)
			applyBleed(s, amount);
		if (opts.poison || this.rng.next() < this.stats.poisonChance) applyPoison(s, amount);
		if (crit && this.hooks.critBleed) applyBleed(s, amount);
		if (opts.element === 'fire' || this.rng.next() < this.stats.burnChance)
			applyBurn(s, amount);
		if (opts.element === 'ice' || this.rng.next() < this.stats.chillChance) applyIce(s);
		else if (opts.element === 'earth') applyEarth(s, this.rng.next());
		if (crit) countRun(this.run, 'crits');
		if (this.stats.lifesteal > 0) healHero(this.run, amount * this.stats.lifesteal);
		e.lastElement = opts.element ?? null;
		if (opts.element) this.fx.play(ELEMENT_SFX[opts.element]);
		this.damage(e, amount, crit, opts.color, true);
		const shock = !opts.noChain && this.rng.next() < this.stats.shockChance;
		if ((opts.element === 'energy' && !opts.noChain) || shock) this.chain(e, amount);
	}

	/** Energy jumps to nearby enemies with reduced damage (balancing §3). */
	private chain(from: Enemy, amount: number): void {
		const c = STATUS.energy;
		let current = from;
		const hit = new Set<Enemy>([from]);
		for (let j = 0; j < c.jumps; j++) {
			const next = this.enemies.grid.nearest(
				current.x,
				current.y,
				c.range,
				(e) => e.alive && !hit.has(e),
			);
			if (!next) return;
			hit.add(next);
			next.lastElement = 'energy';
			this.damage(next, amount * c.share, false, PALETTE.elEnergy, false);
			current = next;
		}
	}

	dot(e: Enemy, t: Tick): void {
		// Kill credit goes to the strongest DoT of this tick (achievement counters).
		const kind =
			t.poison >= t.bleed && t.poison >= t.burn
				? 'poison'
				: t.bleed >= t.burn
					? 'bleed'
					: 'burn';
		e.lastDot = kind;
		const color =
			kind === 'poison'
				? PALETTE.dotPoison
				: kind === 'bleed'
					? PALETTE.dotBleed
					: PALETTE.dotBurn;
		this.damage(e, t.bleed + t.poison + t.burn, false, color, false);
	}

	/** Raw damage to an enemy (already rolled); handles shred, numbers, knockback and death. */
	damage(
		e: Enemy,
		raw: number,
		crit: boolean,
		color: number | undefined,
		knockback: boolean,
	): void {
		if (!e.alive) return;
		const amount = raw * shredFactor(e.status);
		e.hp -= amount;
		// DoT ticks don't flash; direct hits flash at a limited rate (Enemy.flash).
		if (knockback) e.flash();
		if (knockback) e.lastDot = null;
		this.run.damageDealt += amount;
		this.fx.damage(e.x, e.y, amount, crit, color);
		if (knockback) {
			this.fx.spray(e.x, e.y, crit ? 10 : 4);
			this.fx.play('sfx.hit', crit ? 1 : 0.7);
		}
		if (crit) this.hooks.hitStop(0.04);
		if (knockback && e.def.behavior !== 'boss') {
			const dx = e.x - this.hero.x;
			const dy = e.y - this.hero.y;
			const d = Math.hypot(dx, dy) || 1;
			const push = (COMBAT.knockback * 0.05) / (e.elite ? 2 : 1);
			e.x += (dx / d) * push;
			e.y += (dy / d) * push;
		}
		if (e.hp <= 0) this.kill(e);
	}

	private kill(e: Enemy): void {
		const run = this.run;
		run.kills++;
		countRun(run, 'kills');
		if (e.elite === 'purple') countRun(run, 'elitePurpleKills');
		if (e.elite === 'orange') countRun(run, 'eliteOrangeKills');
		if (e.def.behavior === 'boss') countRun(run, 'bossKills');
		if (e.lastDot === 'bleed') countRun(run, 'bleedKills');
		else if (e.lastDot === 'poison') countRun(run, 'poisonKills');
		else if (e.lastDot === 'burn' || e.lastElement === 'fire') countRun(run, 'fireKills');
		else if (e.lastElement === 'ice') countRun(run, 'iceKills');
		else if (e.lastElement === 'earth') countRun(run, 'earthKills');
		else if (e.lastElement === 'energy') countRun(run, 'energyKills');
		const size = e.radius / 10;
		this.fx.bloodAt(e.x, e.y, size * 1.4);
		this.fx.burst(e.x, e.y, e.def.behavior === 'boss' ? 24 : e.elite ? 8 : 3);
		this.fx.spray(e.x, e.y, 12);
		this.fx.play('sfx.splat');
		this.fx.play('sfx.zombieDeath');
		if (e.def.behavior === 'boss') this.hooks.hitStop(0.25);
		else if (e.elite) this.hooks.hitStop(0.08);
		for (let i = 0; i < 2; i++)
			this.fx.bloodAt(
				e.x + this.rng.range(-14, 14),
				e.y + this.rng.range(-14, 14),
				size * 0.5,
			);
		this.onKill(e);
		this.enemies.kill(e);
	}

	/** Enemy bodies touching the hero; one resolution per invulnerability window. */
	contact(dt: number): void {
		this.iFrames -= dt;
		if (this.iFrames > 0 || this.god) return;
		const near = this.enemies.grid.queryRadius(this.hero.x, this.hero.y, 64);
		for (const e of near) {
			const dx = e.x - this.hero.x;
			const dy = e.y - this.hero.y;
			if (dx * dx + dy * dy > (e.radius + HERO_RADIUS) ** 2) continue;
			this.heroHit(e.damage, true, undefined, e);
			return;
		}
	}

	/** Damage coming at the hero (contact, projectiles, explosions). */
	heroHit(amount: number, contact: boolean, element?: Element, source?: Enemy): void {
		if (this.god || this.iFrames > 0) return;
		const result = resolveIncoming(
			amount,
			this.stats,
			{ contact, element },
			{ dodge: this.rng.next(), parry: this.rng.next() },
		);
		this.iFrames = COMBAT.heroIFrames;
		if (result.kind === 'dodged') {
			countRun(this.run, 'dodges');
			this.fx.label(this.hero.x, this.hero.y, 'dodge');
			this.hooks.onDodge();
		} else if (result.kind === 'parried') {
			countRun(this.run, 'parries');
			this.fx.label(this.hero.x, this.hero.y, 'parry');
			if (source) this.damage(source, result.reflected, false, undefined, false);
			this.hooks.onParry(source);
		} else if (this.hooks.absorb()) {
			this.fx.label(this.hero.x, this.hero.y, 'block');
		} else {
			this.hero.flash();
			this.hero.hurt();
			this.fx.play('sfx.heroHurt');
			this.hooks.onHurt(source);
			const left = this.hooks.shield(result.amount);
			if (left > 0 && damageHero(this.run, left)) this.onHeroDeath();
		}
	}
}
