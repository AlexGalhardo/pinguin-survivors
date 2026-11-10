import { BOSS_HAZARD, type HazardKind } from '../data/enemies';
import type { Rng } from './rng';

/** Ground shapes in world units (world = screen, top-down). */
export type HazardShape =
	| { kind: 'circle'; x: number; y: number; r: number }
	| { kind: 'annulus'; x: number; y: number; r0: number; r1: number }
	| { kind: 'line'; x: number; y: number; angle: number; length: number; width: number }
	| { kind: 'cell'; x: number; y: number; size: number }
	/** Pie slice of radius `r` centered on `angle`, `arc` radians wide (elite cone). */
	| { kind: 'sector'; x: number; y: number; angle: number; r: number; arc: number };

/**
 * One red ground mark: it starts `at` seconds after the attack, fills up for `telegraph` seconds
 * and detonates once. Marks of the same `group` detonate together and hurt the hero at most once.
 */
export interface HazardMark {
	shape: HazardShape;
	at: number;
	telegraph: number;
	group: number;
	/** Fraction of the boss damage. */
	damage: number;
}

interface Point {
	x: number;
	y: number;
}

/** Plans one area attack of `kind` from the boss toward the hero (deterministic for a given rng). */
export function planHazard(
	kind: HazardKind,
	boss: Point,
	hero: Point,
	rng: Rng,
	cfg = BOSS_HAZARD,
): HazardMark[] {
	const aim = Math.atan2(hero.y - boss.y, hero.x - boss.x);
	switch (kind) {
		case 'circles': {
			const c = cfg.circles;
			const marks: HazardMark[] = [];
			for (let i = 0; i < c.count; i++) {
				// The first lands on the hero; the rest scatter around and ahead of them.
				const a = rng.next() * Math.PI * 2;
				const d = i === 0 ? 0 : c.spread * (0.35 + rng.next() * 0.65);
				marks.push({
					shape: {
						kind: 'circle',
						x: hero.x + Math.cos(a) * d,
						y: hero.y + Math.sin(a) * d,
						r: c.radius,
					},
					at: i * c.stagger,
					telegraph: c.telegraph,
					group: i,
					damage: c.damage,
				});
			}
			return marks;
		}
		case 'ring': {
			const c = cfg.ring;
			return Array.from({ length: c.waves }, (_, i) => {
				const r0 = c.start + i * (c.width + c.gap);
				return {
					shape: { kind: 'annulus', x: boss.x, y: boss.y, r0, r1: r0 + c.width },
					at: i * c.stagger,
					telegraph: c.telegraph,
					group: i,
					damage: c.damage,
				} satisfies HazardMark;
			});
		}
		case 'lines': {
			const c = cfg.lines;
			const marks: HazardMark[] = [];
			for (let phase = 0; phase < 2; phase++) {
				// The second volley is rotated half a step, so the safe wedges of the first get hit.
				const offset = (phase * Math.PI) / c.count;
				for (let i = 0; i < c.count; i++)
					marks.push({
						shape: {
							kind: 'line',
							x: boss.x,
							y: boss.y,
							angle: aim + offset + (i * Math.PI * 2) / c.count,
							length: c.length,
							width: c.width,
						},
						at: phase * c.stagger,
						telegraph: c.telegraph,
						group: phase,
						damage: c.damage,
					});
			}
			return marks;
		}
		case 'tiles': {
			const c = cfg.tiles;
			const marks: HazardMark[] = [];
			// Grid snapped to the world so the checkerboard reads as the floor, centered near the hero.
			const cx = Math.round(hero.x / c.cell);
			const cy = Math.round(hero.y / c.cell);
			for (let i = -c.reach; i <= c.reach; i++)
				for (let j = -c.reach; j <= c.reach; j++) {
					const parity = (((cx + i + cy + j) % 2) + 2) % 2;
					marks.push({
						shape: {
							kind: 'cell',
							x: (cx + i) * c.cell,
							y: (cy + j) * c.cell,
							size: c.cell,
						},
						at: parity * c.stagger,
						telegraph: c.telegraph,
						group: parity,
						damage: c.damage,
					});
				}
			return marks;
		}
	}
}

/** Does a circle of `radius` at (x, y) touch the shape? */
export function hazardHits(s: HazardShape, x: number, y: number, radius: number): boolean {
	switch (s.kind) {
		case 'circle':
			return Math.hypot(x - s.x, y - s.y) <= s.r + radius;
		case 'annulus': {
			const d = Math.hypot(x - s.x, y - s.y);
			return d + radius >= s.r0 && d - radius <= s.r1;
		}
		case 'line': {
			const dx = x - s.x;
			const dy = y - s.y;
			const along = dx * Math.cos(s.angle) + dy * Math.sin(s.angle);
			const across = -dx * Math.sin(s.angle) + dy * Math.cos(s.angle);
			return (
				along >= -radius &&
				along <= s.length + radius &&
				Math.abs(across) <= s.width / 2 + radius
			);
		}
		case 'cell': {
			const h = s.size / 2;
			return Math.abs(x - s.x) <= h + radius && Math.abs(y - s.y) <= h + radius;
		}
		case 'sector': {
			const d = Math.hypot(x - s.x, y - s.y);
			if (d > s.r + radius) return false;
			if (d <= radius) return true;
			// Widen the wedge by the angle the hero's body subtends.
			const turn = Math.atan2(y - s.y, x - s.x) - s.angle;
			const off = Math.abs(Math.atan2(Math.sin(turn), Math.cos(turn)));
			return off <= s.arc / 2 + Math.asin(radius / d);
		}
	}
}

/** Total time from the attack start to its last detonation. */
export function hazardDuration(marks: readonly HazardMark[]): number {
	return marks.reduce((t, m) => Math.max(t, m.at + m.telegraph), 0);
}
