/**
 * Top-down 2D projection (ADR-003). World units are screen pixels: `screenX = x`,
 * `screenY = y - z`, with `z` the height above the ground. Draw order is by `y`.
 */

export interface Vec2 {
	x: number;
	y: number;
}

export const DIRS = ['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw'] as const;
export type Dir = (typeof DIRS)[number];

export function worldToScreen(x: number, y: number, z = 0): Vec2 {
	return { x, y: y - z };
}

export function screenToWorld(sx: number, sy: number): Vec2 {
	return { x: sx, y: sy };
}

/** Draw order: larger y = closer to the viewer. */
export function depthOf(_x: number, y: number): number {
	return y;
}

// Indexed by round(angle / 45°) with y pointing down: 0 = east, 2 = south.
const SECTOR_DIRS: readonly Dir[] = ['e', 'se', 's', 'sw', 'w', 'nw', 'n', 'ne'];

/** 8-way facing from a world vector (y down). Zero vector → `fallback`. */
export function dirFromWorld(vx: number, vy: number, fallback: Dir = 's'): Dir {
	if (vx === 0 && vy === 0) return fallback;
	const sector = Math.round(Math.atan2(vy, vx) / (Math.PI / 4));
	return SECTOR_DIRS[(sector + 8) % 8] as Dir;
}

/** Keyboard intent (W = up) to a unit world vector; no rotation. */
export function inputToWorld(ix: number, iy: number): Vec2 {
	if (ix === 0 && iy === 0) return { x: 0, y: 0 };
	const len = Math.hypot(ix, iy);
	return { x: ix / len, y: iy / len };
}
