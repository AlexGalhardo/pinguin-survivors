import { ELITE_HAZARD, ELITE_HAZARD_KINDS, type EliteHazardKind } from '../data/elite-hazard';
import type { HazardMark } from './boss-hazard';
import type { Rng } from './rng';

interface Point {
	x: number;
	y: number;
}

/** The one attack an elite uses for its whole life, drawn when it spawns. */
export function drawEliteHazard(rng: Rng): EliteHazardKind {
	return rng.pick(ELITE_HAZARD_KINDS);
}

/** Can the elite cast now: hero within reach, timer up and room on screen. */
export function eliteCanCast(dist: number, cooldown: number, active: number): boolean {
	return cooldown <= 0 && dist <= ELITE_HAZARD.maxDist && active < ELITE_HAZARD.maxActive;
}

/** Plans one elite area attack from `elite` toward `hero` (pure; no rng, the kind is the draw). */
export function planEliteHazard(
	kind: EliteHazardKind,
	elite: Point,
	hero: Point,
	cfg = ELITE_HAZARD,
): HazardMark[] {
	const aim = Math.atan2(hero.y - elite.y, hero.x - elite.x);
	switch (kind) {
		case 'nova': {
			const c = cfg.nova;
			return [
				{
					shape: { kind: 'circle', x: elite.x, y: elite.y, r: c.radius },
					at: 0,
					telegraph: c.telegraph,
					group: 0,
					damage: c.damage,
				},
			];
		}
		case 'cone': {
			const c = cfg.cone;
			return [
				{
					shape: {
						kind: 'sector',
						x: elite.x,
						y: elite.y,
						angle: aim,
						r: c.length,
						arc: c.arc,
					},
					at: 0,
					telegraph: c.telegraph,
					group: 0,
					damage: c.damage,
				},
			];
		}
		case 'cross': {
			const c = cfg.cross;
			const marks: HazardMark[] = [];
			// "+" first, then "x": the safe wedges of the first volley are the hit ones of the second.
			for (let phase = 0; phase < 2; phase++)
				for (let i = 0; i < 4; i++)
					marks.push({
						shape: {
							kind: 'line',
							x: elite.x,
							y: elite.y,
							angle: (phase * Math.PI) / 4 + (i * Math.PI) / 2,
							length: c.length,
							width: c.width,
						},
						at: phase * c.stagger,
						telegraph: c.telegraph,
						group: phase,
						damage: c.damage,
					});
			return marks;
		}
		case 'stomp': {
			const c = cfg.stomp;
			const dx = Math.cos(aim);
			const dy = Math.sin(aim);
			// A trail that starts where the hero stood and runs on away from the elite.
			return Array.from({ length: c.count }, (_, i) => ({
				shape: {
					kind: 'circle' as const,
					x: hero.x + dx * c.step * i,
					y: hero.y + dy * c.step * i,
					r: c.radius,
				},
				at: i * c.stagger,
				telegraph: c.telegraph,
				group: i,
				damage: c.damage,
			}));
		}
		case 'cage': {
			const c = cfg.cage;
			return Array.from({ length: c.count }, (_, i) => {
				const a = aim + (i * Math.PI * 2) / c.count;
				return {
					shape: {
						kind: 'circle' as const,
						x: hero.x + Math.cos(a) * c.ringRadius,
						y: hero.y + Math.sin(a) * c.ringRadius,
						r: c.radius,
					},
					at: 0,
					telegraph: c.telegraph,
					group: 0,
					damage: c.damage,
				};
			});
		}
	}
}
