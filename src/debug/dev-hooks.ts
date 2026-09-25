import type Phaser from 'phaser';
import type { DebugParams } from './params';

/** Handle exposed on window.__GAME__ in dev builds so agents/tests can inspect and drive the game. */
export interface DevHandle {
	game: Phaser.Game;
	params: DebugParams;
}

declare global {
	interface Window {
		__GAME__?: DevHandle;
	}
}

export function installDevHooks(game: Phaser.Game, params: DebugParams): void {
	if (!import.meta.env.DEV) return;
	window.__GAME__ = { game, params };
}
