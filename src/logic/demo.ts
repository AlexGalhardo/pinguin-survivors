import type { HeroId } from '../config/constants';
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
