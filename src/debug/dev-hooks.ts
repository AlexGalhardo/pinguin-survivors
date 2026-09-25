import type Phaser from 'phaser';
import type { RunState } from '../logic/run-state';
import type { DebugParams } from './params';

/** Handle exposed on window.__GAME__ in dev builds so agents/tests can inspect and drive the game. */
export interface DevHandle {
	game: Phaser.Game;
	params: DebugParams;
	/** The running GameScene (typed loosely to avoid an import cycle). */
	readonly scene: Phaser.Scene | undefined;
	readonly state: RunState | undefined;
	/**
	 * Holds a key for `ms` (synthetic events with keyCode; the agent-browser CLI sends keyCode 0,
	 * which Phaser ignores). Example: __GAME__.hold('KeyD', 1000).
	 */
	hold(code: string, ms: number): Promise<void>;
	/** Single key press (keydown + keyup). */
	press(code: string): void;
}

const KEY_CODES: Record<string, number> = {
	KeyW: 87,
	KeyA: 65,
	KeyS: 83,
	KeyD: 68,
	ArrowUp: 38,
	ArrowDown: 40,
	ArrowLeft: 37,
	ArrowRight: 39,
	Enter: 13,
	Space: 32,
	Escape: 27,
	Digit1: 49,
	Digit2: 50,
	Digit3: 51,
	KeyR: 82,
};

function keyEvent(type: 'keydown' | 'keyup', code: string): void {
	const keyCode = KEY_CODES[code] ?? 0;
	window.dispatchEvent(
		new KeyboardEvent(type, { code, key: code, keyCode, which: keyCode } as KeyboardEventInit),
	);
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
