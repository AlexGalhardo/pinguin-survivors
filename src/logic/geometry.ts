/** Smallest signed difference between two angles (radians), in (-PI, PI]. */
export function angleDiff(a: number, b: number): number {
	let d = (a - b) % (Math.PI * 2);
	if (d > Math.PI) d -= Math.PI * 2;
	if (d <= -Math.PI) d += Math.PI * 2;
	return d;
}

/**
 * True if point (px, py) is inside the circular sector centered at (cx, cy) facing `facing`
 * (radians) with total `arc` (radians) and `radius`. `pad` enlarges the radius (target size).
 */
export function inArc(
	cx: number,
	cy: number,
	facing: number,
	arc: number,
	radius: number,
	px: number,
	py: number,
	pad = 0,
): boolean {
	const dx = px - cx;
	const dy = py - cy;
	const d = Math.hypot(dx, dy);
	if (d > radius + pad) return false;
	if (d <= pad) return true;
	return Math.abs(angleDiff(Math.atan2(dy, dx), facing)) <= arc / 2;
}

/** Evenly spread angles for `count` projectiles centered on `base` (spread in radians). */
export function spreadAngles(base: number, count: number, spread: number): number[] {
	if (count <= 1) return [base];
	const start = base - (spread * (count - 1)) / 2;
	return Array.from({ length: count }, (_, i) => start + spread * i);
}
