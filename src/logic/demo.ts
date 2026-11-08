import type { HeroId } from '../config/constants';
import type { AchievementDef } from '../data/achievements';
import { DEMO, type DemoConfig } from '../data/demo';
import type { Danger } from '../data/difficulty';

export type DemoEndReason = 'won' | 'lost';

/** Hero selectable in this build; the full game allows everyone. */
export function demoAllowsHero(hero: HeroId, demo: DemoConfig = DEMO): boolean {
	return !demo.enabled || demo.heroes.includes(hero);
}

export function demoAllowsRound(round: number, demo: DemoConfig = DEMO): boolean {
	return !demo.enabled || round <= demo.maxRound;
}

export function demoAllowsDanger(danger: Danger, demo: DemoConfig = DEMO): boolean {
	return !demo.enabled || danger <= demo.maxDanger;
}

/** The hero the game falls back to when a locked one is requested (e.g. `?hero=bob` in the demo). */
export function demoHero(hero: HeroId, demo: DemoConfig = DEMO): HeroId {
	return demoAllowsHero(hero, demo) ? hero : (demo.heroes[0] as HeroId);
}

/** Highest Danger the player may pick: the unlocked one, capped by the demo. */
export function demoDanger(unlocked: Danger, demo: DemoConfig = DEMO): Danger {
	return demo.enabled ? (Math.min(unlocked, demo.maxDanger) as Danger) : unlocked;
}

/**
 * Why the demo run ended: clearing the last round or dying at or before it. Null when the run
 * goes on (or this is the full game). `cleared` = the boss of `round` is dead.
 */
export function demoEndReason(
	round: number,
	state: { cleared: boolean; died: boolean },
	demo: DemoConfig = DEMO,
): DemoEndReason | null {
	if (!demo.enabled) return null;
	if (state.died) return 'lost';
	return state.cleared && round >= demo.maxRound ? 'won' : null;
}

/** Feats that need a boss beyond the demo's last round. */
const FEATS_BEYOND_DEMO = new Set(['unlockLucia', 'bossBiome2', 'bossBiome3']);

/**
 * Achievements the demo cannot reach (SDD-006 RF-04): rounds past `maxRound`, Danger wins
 * (they need the round 20 boss), later biomes and heroes the demo does not offer.
 */
export function demoHidesAchievement(def: AchievementDef, demo: DemoConfig = DEMO): boolean {
	if (!demo.enabled) return false;
	if (def.hero && !demoAllowsHero(def.hero, demo)) return true;
	const c = def.condition;
	switch (c.kind) {
		case 'runBest':
			return c.stat === 'maxRound' && c.value > demo.maxRound;
		case 'hero':
			return (
				(c.stat === 'bestRound' && c.value > demo.maxRound) || c.stat === 'dangerUnlocked'
			);
		case 'allHeroesStat':
			return c.stat === 'dangerUnlocked';
		case 'feat':
			return FEATS_BEYOND_DEMO.has(c.feat);
		default:
			return false;
	}
}
