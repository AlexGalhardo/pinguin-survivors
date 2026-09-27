/**
 * Distance from the thrower of a boomerang `t` seconds after the throw: out to `range` and back
 * at constant speed. Returns -1 once it is back (the throw is over).
 */
export function boomerangDistance(t: number, range: number, speed: number): number {
	const out = range / speed;
	if (t <= out) return t * speed;
	if (t <= out * 2) return range - (t - out) * speed;
	return -1;
}

/** Deployables of a secondary at `level`: base count plus fractional growth, at least 1. */
export function scaledCount(base: number, perLevel: number, level: number): number {
	return Math.max(1, Math.floor(base + perLevel * (level - 1)));
}
