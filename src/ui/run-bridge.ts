import type { DemoEndData } from './components/DemoEnd';
import type { GameOverData } from './components/GameOver';
import type { LevelUpData } from './components/LevelUpCards';
import type { PauseData } from './components/Pause';
import type { UnlockData } from './components/Unlock';
import { createStore } from './store';

/** What the game publishes for the in-run React screens (SDD-004): level-up cards, pause, run end. */
export interface RunOverView {
	over: GameOverData;
	/** Shown one by one, before the summary. */
	unlocks: UnlockData[];
}

export const runUiStore = createStore<{
	levelUp: LevelUpData | null;
	pause: PauseData | null;
	over: RunOverView | null;
	demoEnd: DemoEndData | null;
}>({ levelUp: null, pause: null, over: null, demoEnd: null });

/** `null` closes the screen. */
export const publishLevelUp = (levelUp: LevelUpData | null): void => runUiStore.set({ levelUp });
export const publishPause = (pause: PauseData | null): void => runUiStore.set({ pause });
export const publishDemoEnd = (demoEnd: DemoEndData | null): void => runUiStore.set({ demoEnd });
export const publishRunOver = (over: RunOverView | null): void => runUiStore.set({ over });

/** Drops the first unlock notice after the player dismissed it. */
export function dismissUnlock(): void {
	const over = runUiStore.get().over;
	if (over) runUiStore.set({ over: { ...over, unlocks: over.unlocks.slice(1) } });
}
