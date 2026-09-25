import Phaser from 'phaser';

export interface MoveKeys {
	up: Phaser.Input.Keyboard.Key[];
	down: Phaser.Input.Keyboard.Key[];
	left: Phaser.Input.Keyboard.Key[];
	right: Phaser.Input.Keyboard.Key[];
}

/** WASD + arrow keys. */
export function createMoveKeys(scene: Phaser.Scene): MoveKeys {
	const kb = scene.input.keyboard;
	if (!kb) throw new Error('Keyboard input is disabled');
	const K = Phaser.Input.Keyboard.KeyCodes;
	const add = (...codes: number[]) => codes.map((c) => kb.addKey(c, false));
	return {
		up: add(K.W, K.UP),
		down: add(K.S, K.DOWN),
		left: add(K.A, K.LEFT),
		right: add(K.D, K.RIGHT),
	};
}

export function anyDown(keys: Phaser.Input.Keyboard.Key[]): boolean {
	return keys.some((k) => k.isDown);
}
