/** Normalized movement direction from the 4 directional inputs (diagonals are not faster). */
export function moveVector(
	up: boolean,
	down: boolean,
	left: boolean,
	right: boolean,
): { x: number; y: number } {
	const x = (right ? 1 : 0) - (left ? 1 : 0);
	const y = (down ? 1 : 0) - (up ? 1 : 0);
	if (x === 0 && y === 0) return { x: 0, y: 0 };
	const len = Math.hypot(x, y);
	return { x: x / len, y: y / len };
}
