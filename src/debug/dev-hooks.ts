import type Phaser from 'phaser';
import { keyEvent } from '../core/synthetic-keys';
import type { RunState } from '../logic/run-state';
import { AudioSystem } from '../systems/AudioSystem';
import type { DebugParams } from './params';

/** Handle exposed on window.__GAME__ in dev builds so agents/tests can inspect and drive the game. */
export interface DevHandle {
	game: Phaser.Game;
	params: DebugParams;
	/** The running GameScene (typed loosely to avoid an import cycle). */
	readonly scene: Phaser.Scene | undefined;
	readonly state: RunState | undefined;
	readonly audio: AudioSystem | null;
	/**
	 * Holds a key for `ms` (synthetic events with keyCode; the agent-browser CLI sends keyCode 0,
	 * which Phaser ignores). Example: __GAME__.hold('KeyD', 1000).
	 */
	hold(code: string, ms: number): Promise<void>;
	/** Single key press (keydown + keyup). */
	press(code: string): void;
}

declare global {
	interface Window {
		__GAME__?: DevHandle;
	}
}

export function installDevHooks(game: Phaser.Game, params: DebugParams): void {
	if (!import.meta.env.DEV) return;
	window.__GAME__ = {
		game,
		params,
		get scene() {
			return game.scene.getScene('Game') ?? undefined;
		},
		get state() {
			return (this.scene as { state?: RunState } | undefined)?.state;
		},
		get audio() {
			return AudioSystem.get();
		},
		hold(code, ms) {
			keyEvent('keydown', code);
			return new Promise((resolve) =>
				setTimeout(() => {
					keyEvent('keyup', code);
					resolve();
				}, ms),
			);
		},
		press(code) {
			keyEvent('keydown', code);
			setTimeout(() => keyEvent('keyup', code), 30);
		},
	};
}
