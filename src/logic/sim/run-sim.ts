import { ABILITY_DATA, type AbilityId, EVOLUTION } from '../../data/abilities';
import type { Card } from '../../data/cards';
import { CHARACTERS, type CharacterId } from '../../data/characters';
import { ELITE, ENEMIES } from '../../data/enemies';
import { getItem } from '../../data/items';
import { SIM } from '../../data/sim';
import { WEAPONS } from '../../data/weapons';
import {
	chainAt,
	cryoAt,
	dronesAt,
	gravityAt,
	laserAt,
	missilesAt,
	nanitesAt,
	novaAt,
	sawAt,
	turretAt,
} from '../abilities';
import { applyEvolutions, buildStats } from '../build';
import { applyCard, generateCards } from '../cards';
import { Rng } from '../rng';
import { createRunState, type RunState } from '../run-state';
import { dmgMul, elitesForWave, hpMul, isBossWave, spawnRate, waveDuration } from '../scaling';
import { buyOffer, generateShop } from '../shop';
import { unlockedTypes } from '../spawn';
import {
	abilityDamage,
	armorReduction,
	critMultiplier,
	dodgeChance,
	finalMaxHp,
	type Stats,
	weaponCooldown,
	weaponDamage,
} from '../stats';

export type BuildStrategy = 'random' | 'good';

export interface SimResult {
	character: CharacterId;
	strategy: BuildStrategy;
	/** Wave where the run ended (death), or SIM.maxWave + 1 if it survived the cap. */
	deathWave: number;
}

/** Expected weapon DPS (damage · crit · attacks/s · targets). */
export function weaponDps(state: RunState, s: Stats): number {
	const w = WEAPONS[CHARACTERS[state.character].weapon];
	const critAvg = 1 + Math.min(1, s.critChance) * (critMultiplier(s) - 1);
	const perHit = weaponDamage(w.damage, s, false) * critAvg;
	const shots = 1 + Math.max(0, Math.floor(s.projectiles));
	const pierce = (w.pierce ?? 0) + Math.max(0, Math.floor(s.pierce));
	const targets =
		(SIM.targets[w.id] ?? 1) + (w.kind === 'projectile' ? pierce * SIM.pierceTargets : 0);
	return (perHit * shots * targets) / weaponCooldown(w.cooldown, s);
}

/** Expected DPS of the owned abilities. */
export function abilitiesDps(state: RunState, s: Stats): number {
	let total = 0;
	const t = SIM.abilityTargets;
	for (const a of state.abilities) {
		const l = a.level;
		let dps = 0;
		switch (a.id as AbilityId) {
			case 'orbital_drones': {
				const d = dronesAt(l);
				dps += (d.count * d.damage * t.drones) / ABILITY_DATA.orbital_drones.tick / 3;
				break;
			}
			case 'chain_lightning': {
				const c = chainAt(l);
				dps += (c.damage * (c.jumps + 1)) / c.cooldown;
				break;
			}
			case 'plasma_nova': {
				const n = novaAt(l);
				dps += (n.damage * t.nova) / n.cooldown;
				break;
			}
			case 'cryo_field':
				dps += cryoAt(l).dps * t.cryo;
				break;
			case 'homing_missiles': {
				const m = missilesAt(l);
				dps += (m.count * m.damage) / ABILITY_DATA.homing_missiles.cooldown;
				break;
			}
			case 'laser_beam': {
				const z = laserAt(l);
				const ticks = z.duration / ABILITY_DATA.laser_beam.tick;
				dps +=
					(z.damage * ticks * t.laser) / (ABILITY_DATA.laser_beam.cooldown + z.duration);
				break;
			}
			case 'arc_turret': {
				const u = turretAt(l);
				dps += (u.turrets * u.damage) / ABILITY_DATA.arc_turret.fireEvery;
				break;
			}
			case 'saw_disc': {
				const w = sawAt(l);
				dps += (w.count * w.damage * t.saw) / ABILITY_DATA.saw_disc.cooldown;
				break;
			}
			case 'gravity_well': {
				const gw = ABILITY_DATA.gravity_well;
				const ticks = gw.duration / gw.tick;
				dps += (gravityAt(l).damage * ticks * t.gravity) / gw.cooldown;
				break;
			}
			case 'nanite_swarm': {
				const n = nanitesAt(l);
				const ns = ABILITY_DATA.nanite_swarm;
				dps += (n.targets * n.dps * ns.duration) / ns.cooldown;
				break;
			}
		}
		total += dps * (a.evolved ? EVOLUTION.damageMul * 1.3 : 1);
	}
	return abilityDamage(total, s);
}

/** Average enemy of the wave's pool, weighted by spawn weight. */
function averageEnemy(wave: number): { hp: number; damage: number; gold: number } {
	// Per-enemy composition: packs (runners) contribute weight x pack size.
	const types = unlockedTypes(wave);
	const pack = (t: (typeof types)[number]) => {
		const g = ENEMIES[t].group;
		return g ? (g[0] + g[1]) / 2 : 1;
	};
	const total = types.reduce((sum, t) => sum + ENEMIES[t].weight * pack(t), 0);
	const avg = { hp: 0, damage: 0, gold: 0 };
	for (const t of types) {
		const e = ENEMIES[t];
		const w = (e.weight * pack(t)) / total;
		avg.hp += e.hp * w;
		avg.damage += e.damage * w;
		avg.gold += e.gold * w;
	}
	return avg;
}

/** Heuristic value of a card for the "good" strategy (DPS gain + survivability). */
function scoreCard(state: RunState, card: Card): number {
	const before = buildStats(state);
	const copy: RunState = structuredClone(state);
	applyCard(copy, card, (s) => finalMaxHp(buildStats(s)));
	const after = buildStats(copy);
	const dps = (x: RunState, s: Stats) => weaponDps(x, s) + abilitiesDps(x, s);
	const dpsGain = dps(copy, after) / Math.max(1, dps(state, before)) - 1;
	const ehp = (s: Stats) =>
		finalMaxHp(s) / Math.max(0.1, 1 - armorReduction(s.armor)) / (1 - dodgeChance(s));
	const hpGain = ehp(after) / Math.max(1, ehp(before)) - 1;
	const revive = card.kind === 'special' && card.special === 'revive' ? 0.3 : 0;
	return dpsGain + hpGain * 0.8 + revive + after.hpRegen * 0.01;
}

/** Simulates one run until death (or the wave cap). Deterministic for a seed. */
export interface WaveTrace {
	wave: number;
	hp: number;
	maxHp: number;
	dps: number;
	killed: number;
	taken: number;
	gold: number;
	items: number;
	abilities: string;
}

export function simulateRun(
	character: CharacterId,
	strategy: BuildStrategy,
	seed: number,
	trace?: (t: WaveTrace) => void,
): SimResult {
	const rng = new Rng(seed);
	const state = createRunState(character, seed);
	for (let wave = 1; wave <= SIM.maxWave; wave++) {
		state.wave = wave;
		const s = buildStats(state);
		const maxHp = finalMaxHp(s);
		const duration = waveDuration(wave);
		const avg = averageEnemy(wave);
		const count = spawnRate(wave) * duration;
		let hpPool = count * avg.hp * hpMul(wave);
		const elites = elitesForWave(wave);
		hpPool += elites * ENEMIES.chaser.hp * ELITE.hp * hpMul(wave);

		const dps = (weaponDps(state, s) + abilitiesDps(state, s)) * SIM.uptime;
		const killed = Math.min(1, (dps * duration) / hpPool);
		// The boss must die before the wave can end (the rest is purged by the timer).
		// Only part of the damage goes to it while the horde keeps coming.
		if (isBossWave(wave)) {
			const bossHp = ENEMIES.boss.hp * hpMul(wave);
			if (dps * SIM.bossFocus * (duration + SIM.bossOvertime) < bossHp) {
				if (state.revives > 0) state.revives--;
				else return { character, strategy, deathWave: wave };
			}
		}

		const hitsPerSecond = Math.min(
			SIM.maxHitsPerSecond,
			SIM.baseHitsPerSecond + SIM.overwhelmHitsPerSecond * (1 - killed),
		);
		const perHit = Math.max(1, avg.damage * dmgMul(wave) * (1 - armorReduction(s.armor)));
		const taken = hitsPerSecond * (1 - dodgeChance(s)) * perHit * duration;
		const healed =
			Math.max(0, s.hpRegen) * duration +
			Math.min(10, Math.max(0, s.lifesteal) * 3) * duration;
		state.hp = Math.min(maxHp, state.hp - taken + healed);
		trace?.({
			wave,
			hp: Math.round(state.hp),
			maxHp,
			dps: Math.round(dps),
			killed: Math.round(killed * 100) / 100,
			taken: Math.round(taken),
			gold: state.gold,
			items: state.items.length,
			abilities: state.abilities.map((a) => `${a.id}:${a.level}`).join(','),
		});
		if (state.hp <= 0) {
			if (state.revives > 0) {
				state.revives--;
				state.hp = Math.ceil(maxHp * 0.5);
			} else return { character, strategy, deathWave: wave };
		}

		state.gold += Math.round(
			(count * killed * avg.gold +
				elites * ELITE.gold +
				(isBossWave(wave) ? ENEMIES.boss.gold : 0)) *
				SIM.goldCollected,
		);

		// Card pick
		const cards = generateCards(
			{ wave, luck: s.luck, abilities: state.abilities, revives: state.revives },
			rng,
		);
		const pick =
			strategy === 'random'
				? rng.pick(cards)
				: cards.reduce((best, c) =>
						scoreCard(state, c) > scoreCard(state, best) ? c : best,
					);
		applyCard(state, pick, (x) => finalMaxHp(buildStats(x)));

		// Shop
		const offers = generateShop(rng, wave, s.luck);
		const order =
			strategy === 'random' ? offers : [...offers].sort((a, b) => b.price - a.price);
		for (const o of order) {
			if (strategy === 'random' && !rng.chance(0.5)) continue;
			const item = getItem(o.itemId);
			if (!item) continue;
			// The good build skips items whose trade-off lowers its main damage source.
			if (strategy === 'good' && character !== 'mage' && (item.mods.damage ?? 0) < 0)
				continue;
			buyOffer(state, o);
		}
		applyEvolutions(state);
		state.hp = Math.min(state.hp, finalMaxHp(buildStats(state)));
	}
	return { character, strategy, deathWave: SIM.maxWave + 1 };
}

export interface SimSummary {
	character: CharacterId;
	strategy: BuildStrategy;
	median: number;
	min: number;
	max: number;
}

/** Runs `runs` seeds and summarizes the death waves. */
export function simulateMany(
	character: CharacterId,
	strategy: BuildStrategy,
	runs: number,
	seed = 1,
): SimSummary {
	const waves = Array.from(
		{ length: runs },
		(_, i) => simulateRun(character, strategy, seed + i * 7919).deathWave,
	).sort((a, b) => a - b);
	return {
		character,
		strategy,
		median: waves[Math.floor(waves.length / 2)] ?? 0,
		min: waves[0] ?? 0,
		max: waves[waves.length - 1] ?? 0,
	};
}
