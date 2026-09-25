import type Phaser from 'phaser';
import { applyDeadzone, BUTTON_KEYS, buttonEdges, stickDirection } from '../logic/gamepad';
import { keyEvent } from './synthetic-keys';

const DEADZONE = 0.2;
/** Stick threshold and repeat delays for menu navigation. */
const MENU_THRESHOLD = 0.55;
const MENU_REPEAT_FIRST = 380;
const MENU_REPEAT = 160;

/** Analog movement from the left stick (read by the Player every frame). */
export const gamepadMove = { x: 0, y: 0, connected: false };

/**
 * Polls the Gamepad API every frame and turns it into input the game already understands:
 * the left stick drives the player analog movement; buttons and the d-pad dispatch
 * synthetic keyboard events so every menu works without changes; the stick also taps
 * arrow keys in menus. Works with the DualSense (standard mapping in Chromium/Firefox).
 */
export function installGamepad(game: Phaser.Game, isGameplay: () => boolean): void {
	let prev: boolean[] = [];
	let menuDir: string | null = null;
	let nextRepeat = 0;
	game.events.on('prestep', () => {
		const pads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : [];
		const pad = Array.from(pads).find((p) => p?.connected) ?? null;
		gamepadMove.connected = pad !== null;
		if (!pad) {
			gamepadMove.x = 0;
			gamepadMove.y = 0;
			prev = [];
			return;
		}
		const stick = applyDeadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0, DEADZONE);
		gamepadMove.x = stick.x;
		gamepadMove.y = stick.y;

		const cur = pad.buttons.map((b) => b.pressed);
		const { pressed, released } = buttonEdges(prev, cur);
		for (const b of pressed) {
			const code = BUTTON_KEYS[b];
			if (code) keyEvent('keydown', code);
		}
		for (const b of released) {
			const code = BUTTON_KEYS[b];
			if (code) keyEvent('keyup', code);
		}
		prev = cur;

		// Left stick navigates menus (taps with auto-repeat); in gameplay it is analog only.
		if (isGameplay()) {
			menuDir = null;
			return;
		}
		const dir = stickDirection(pad.axes[0] ?? 0, pad.axes[1] ?? 0, MENU_THRESHOLD);
		const now = performance.now();
		if (dir !== menuDir) {
			menuDir = dir;
			nextRepeat = now + MENU_REPEAT_FIRST;
			if (dir) tap(dir);
		} else if (dir && now >= nextRepeat) {
			nextRepeat = now + MENU_REPEAT;
			tap(dir);
		}
	});
}

function tap(code: string): void {
	keyEvent('keydown', code);
	setTimeout(() => keyEvent('keyup', code), 30);
}
