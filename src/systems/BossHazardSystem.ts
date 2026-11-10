import Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { getSave } from '../core/context';
import { shake } from '../core/feel';
import { type HazardMark, type HazardShape, hazardHits } from '../logic/boss-hazard';
import type { PendingMark } from '../logic/hazard-escape';
import { GROUND_DEPTH } from '../world/Arena';

/** Seconds a detonated mark stays lit, and the fill alpha range while it charges. */
const FLASH = 0.2;
const FILL_FROM = 0.25;
const FILL_TO = 0.6;
/** The last share of the telegraph pulses so the moment to leave reads at a glance. */
const PULSE_FROM = 0.7;
const REDUCED_FLASH = 0.35;

/** One attack's shared state: groups that already hurt the hero or shook the camera (bit masks). */
interface Attack {
	hurt: number;
	shook: number;
	bossDamage: number;
	/** Marks not finished yet; the attack counts as on screen until it reaches 0. */
	left: number;
}

interface Entry {
	mark: HazardMark;
	attack: Attack;
	t: number;
	detonated: boolean;
	alive: boolean;
}

/**
 * Telegraphed red ground marks of boss and elite area attacks (SDD-016): each mark waits `at`, charges for
 * `telegraph` (fill and outline grow), then detonates once and hurts the hero at most once per group.
 * One Graphics redrawn only while marks are alive; entries are pooled.
 */
export class BossHazardSystem {
	private readonly gfx: Phaser.GameObjects.Graphics;
	private readonly entries: Entry[] = [];
	private readonly quad = Array.from({ length: 4 }, () => new Phaser.Math.Vector2());
	private active = 0;
	private attacks = 0;

	constructor(
		private readonly scene: Phaser.Scene,
		private readonly onHitHero: (damage: number) => void,
	) {
		this.gfx = scene.add.graphics().setDepth(GROUND_DEPTH + 3);
	}

	spawn(marks: readonly HazardMark[], bossDamage: number): void {
		const attack: Attack = { hurt: 0, shook: 0, bossDamage, left: marks.length };
		if (marks.length > 0) this.attacks++;
		for (const mark of marks) {
			let e = this.entries.find((q) => !q.alive);
			if (!e) {
				e = { mark, attack, t: 0, detonated: false, alive: true };
				this.entries.push(e);
			}
			e.mark = mark;
			e.attack = attack;
			e.t = 0;
			e.detonated = false;
			e.alive = true;
			this.active++;
		}
	}

	/** Attacks (not marks) still charging or flashing. */
	activeAttacks(): number {
		return this.attacks;
	}

	/** Marks that have not detonated yet (read by the playtest bot, which has to dodge them). */
	pending(): PendingMark[] {
		const out: PendingMark[] = [];
		for (const e of this.entries) {
			const remaining = e.mark.at + e.mark.telegraph - e.t;
			if (e.alive && remaining > 0)
				out.push({ shape: e.mark.shape, remaining, group: e.mark.group });
		}
		return out;
	}

	update(dt: number, hx: number, hy: number, heroRadius: number): void {
		if (this.active === 0) return;
		const peak = getSave(this.scene).settings.reducedFlashes ? REDUCED_FLASH : 1;
		const g = this.gfx.clear();
		for (const e of this.entries) {
			if (!e.alive) continue;
			e.t += dt;
			const m = e.mark;
			const local = e.t - m.at;
			if (local < 0) continue;
			if (local < m.telegraph) {
				const k = local / m.telegraph;
				const pulse = k < PULSE_FROM ? 1 : 0.75 + 0.25 * Math.cos(local * 40);
				this.draw(
					g,
					m.shape,
					(FILL_FROM + (FILL_TO - FILL_FROM) * k) * pulse,
					0.8 + 0.2 * k,
					PALETTE.hazard,
				);
				continue;
			}
			if (!e.detonated) {
				e.detonated = true;
				this.detonate(e, hx, hy, heroRadius);
			}
			const f = 1 - (local - m.telegraph) / FLASH;
			if (f <= 0) {
				e.alive = false;
				this.active--;
				if (--e.attack.left === 0) this.attacks--;
				continue;
			}
			this.draw(g, m.shape, 0.9 * f * peak, f * peak, PALETTE.textLight);
		}
	}

	clear(): void {
		for (const e of this.entries) e.alive = false;
		this.active = 0;
		this.attacks = 0;
		this.gfx.clear();
	}

	private detonate(e: Entry, hx: number, hy: number, heroRadius: number): void {
		const bit = 1 << e.mark.group;
		if (!(e.attack.shook & bit)) {
			e.attack.shook |= bit;
			shake(this.scene, 140, 0.004);
		}
		if (e.attack.hurt & bit || !hazardHits(e.mark.shape, hx, hy, heroRadius)) return;
		e.attack.hurt |= bit;
		this.onHitHero(e.attack.bossDamage * e.mark.damage);
	}

	private draw(
		g: Phaser.GameObjects.Graphics,
		s: HazardShape,
		fill: number,
		line: number,
		color: number,
	): void {
		g.fillStyle(color, fill).lineStyle(3, color, line);
		switch (s.kind) {
			case 'circle':
				g.fillCircle(s.x, s.y, s.r).strokeCircle(s.x, s.y, s.r);
				break;
			case 'annulus': {
				// A thick stroke fills the band (Graphics fills have no holes).
				g.lineStyle(s.r1 - s.r0, color, fill).strokeCircle(s.x, s.y, (s.r0 + s.r1) / 2);
				g.lineStyle(3, color, line)
					.strokeCircle(s.x, s.y, s.r0)
					.strokeCircle(s.x, s.y, s.r1);
				break;
			}
			case 'line': {
				const c = Math.cos(s.angle);
				const n = Math.sin(s.angle);
				const hw = s.width / 2;
				const q = this.quad;
				for (let i = 0; i < 4; i++) {
					const a = i === 1 || i === 2 ? s.length : 0;
					const b = i < 2 ? -hw : hw;
					const p = q[i] as Phaser.Math.Vector2;
					p.x = s.x + a * c - b * n;
					p.y = s.y + a * n + b * c;
				}
				g.fillPoints(q, true).strokePoints(q, true);
				break;
			}
			case 'sector': {
				const a0 = s.angle - s.arc / 2;
				g.beginPath()
					.moveTo(s.x, s.y)
					.arc(s.x, s.y, s.r, a0, a0 + s.arc)
					.closePath();
				g.fillPath().strokePath();
				break;
			}
			case 'cell': {
				const h = s.size / 2;
				g.fillRect(s.x - h, s.y - h, s.size, s.size).strokeRect(
					s.x - h,
					s.y - h,
					s.size,
					s.size,
				);
				break;
			}
		}
	}
}
