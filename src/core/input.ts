import Phaser from 'phaser';
import type { Action, KeyBinds } from '../logic/keybinds';
import { gamepadMove } from './gamepad';

/** Arrow keys always move too, whatever the binds are. */
const ARROWS: Record<'up' | 'down' | 'left' | 'right', string> = {
	up: 'ArrowUp',
	down: 'ArrowDown',
	left: 'ArrowLeft',
	right: 'ArrowRight',
};

/** Max drag (screen px) of the touch joystick; farther drags count as full tilt. */
const TOUCH_RADIUS = 40;

/**
 * Gameplay input behind one interface (PLAN 1.3/7.1): rebindable keyboard actions, gamepad
 * analog stick and a floating touch joystick all feed the same `move()` vector, so a mobile
 * build only needs this class. Keys are matched by KeyboardEvent.code, which the gamepad bridge
 * also emits, so pad buttons trigger the same actions.
 */
export class GameInput {
	private readonly held = new Set<string>();
	private readonly handlers = new Map<Action, () => void>();
	private touchId: number | null = null;
	private readonly touchStart = { x: 0, y: 0 };
	private readonly touch = { x: 0, y: 0 };

	constructor(
		scene: Phaser.Scene,
		private readonly binds: KeyBinds,
	) {
		const kb = scene.input.keyboard;
		if (!kb) throw new Error('Keyboard input is disabled');
		// Tab and Space would move the browser focus / scroll.
		kb.addCapture([Phaser.Input.Keyboard.KeyCodes.TAB, Phaser.Input.Keyboard.KeyCodes.SPACE]);
		const onDown = (e: KeyboardEvent) => {
			if (e.repeat) return;
			this.held.add(e.code);
			for (const [action, fn] of this.handlers) if (this.binds[action] === e.code) fn();
		};
		const onUp = (e: KeyboardEvent) => this.held.delete(e.code);
		kb.on('keydown', onDown);
		kb.on('keyup', onUp);
		const clear = () => this.held.clear();
		scene.game.events.on(Phaser.Core.Events.BLUR, clear);
		if (scene.sys.game.device.input.touch) this.installTouch(scene);
		scene.events.once('shutdown', () => {
			kb.off('keydown', onDown);
			kb.off('keyup', onUp);
			scene.game.events.off(Phaser.Core.Events.BLUR, clear);
		});
	}

	on(action: Action, fn: () => void): void {
		this.handlers.set(action, fn);
	}

	/** Screen-space move intent in [-1, 1]² (keyboard wins, then gamepad, then touch). */
	move(): { x: number; y: number } {
		const dir = (a: 'up' | 'down' | 'left' | 'right') =>
			this.held.has(this.binds[a]) || this.held.has(ARROWS[a]) ? 1 : 0;
		const x = dir('right') - dir('left');
		const y = dir('down') - dir('up');
		if (x !== 0 || y !== 0) return { x, y };
		if (gamepadMove.connected && (gamepadMove.x !== 0 || gamepadMove.y !== 0))
			return { x: gamepadMove.x, y: gamepadMove.y };
		return this.touch;
	}

	/** Floating joystick: the first finger down anywhere becomes the stick center. */
	private installTouch(scene: Phaser.Scene): void {
		scene.input.addPointer(1);
		scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
			if (!p.wasTouch || this.touchId !== null) return;
			this.touchId = p.id;
			this.touchStart.x = p.x;
			this.touchStart.y = p.y;
		});
		scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
			if (p.id !== this.touchId) return;
			const dx = p.x - this.touchStart.x;
			const dy = p.y - this.touchStart.y;
			const len = Math.hypot(dx, dy);
			const k = len > TOUCH_RADIUS ? 1 / len : 1 / TOUCH_RADIUS;
			this.touch.x = dx * k;
			this.touch.y = dy * k;
		});
		const release = (p: Phaser.Input.Pointer) => {
			if (p.id !== this.touchId) return;
			this.touchId = null;
			this.touch.x = 0;
			this.touch.y = 0;
		};
		scene.input.on('pointerup', release);
		scene.input.on('pointerupoutside', release);
	}
}
