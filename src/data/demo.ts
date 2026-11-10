import type { HeroId } from '../config/constants';
import type { Difficulty } from './difficulty';

/**
 * Marker the bundle check looks for (SDD-006 A1, `scripts/build-demo.ts`). Written against the
 * env literals so the bundler folds it: only the demo bundle contains `demo-build`.
 */
export const BUILD_TAG: 'demo-build' | 'full-build' =
	import.meta.env?.VITE_DEMO === '1' || import.meta.env?.VITE_DEMO === 'true'
		? 'demo-build'
		: 'full-build';

/** Build flag: `VITE_DEMO=1` (or `true`) produces the demo bundle (SDD-006, ADR-013). */
export function isDemoBuild(): boolean {
	return BUILD_TAG === 'demo-build';
}

export interface DemoConfig {
	enabled: boolean;
	/** The run ends (won or lost) at this round. */
	maxRound: number;
	heroes: readonly HeroId[];
	maxDifficulty: Difficulty;
}

/** The demo is a cut of the full game: same code and content, only these limits (RF-07). */
export const DEMO: DemoConfig = {
	enabled: isDemoBuild(),
	maxRound: 10,
	heroes: ['jack'],
	maxDifficulty: 1,
};

/** Steam store page for the wishlist button. Placeholder until the app id exists (T15.1). */
export const STEAM_URL = 'https://store.steampowered.com/app/TBD';
