/** keyCode of the keys the game listens to (Phaser reads keyCode). */
export const KEY_CODES: Record<string, number> = {
	KeyW: 87,
	KeyA: 65,
	KeyS: 83,
	KeyD: 68,
	KeyL: 76,
	KeyR: 82,
	ArrowUp: 38,
	ArrowDown: 40,
	ArrowLeft: 37,
	ArrowRight: 39,
	Enter: 13,
	Space: 32,
	Escape: 27,
	Tab: 9,
	PageUp: 33,
	PageDown: 34,
	Digit1: 49,
	Digit2: 50,
	Digit3: 51,
	Digit4: 52,
};

/** Dispatches a synthetic keyboard event (gamepad bridge and dev hooks). */
export function keyEvent(type: 'keydown' | 'keyup', code: string): void {
	const keyCode = KEY_CODES[code] ?? 0;
	window.dispatchEvent(
		new KeyboardEvent(type, { code, key: code, keyCode, which: keyCode } as KeyboardEventInit),
	);
}
