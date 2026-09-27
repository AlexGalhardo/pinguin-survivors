/**
 * Isometric 2:1 projection. The simulation lives in a cartesian world plane (x, y) with an
 * optional height z; the screen is only a projection of it (docs/architecture.md).
 */

export interface Vec2 {
	x: number;
	y: number;
}

export const DIRS = ['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw'] as const;
export type Dir = (typeof DIRS)[number];

export function worldToScreen(x: number, y: number, z = 0): Vec2 {
	return { x: x - y, y: (x + y) / 2 - z };
}

export function screenToWorld(sx: number, sy: number): Vec2 {
	return { x: sy + sx / 2, y: sy - sx / 2 };
}

/** Draw order: larger = closer to the viewer. */
export function isoDepth(x: number, y: number): number {
	return x + y;
}

// Indexed by round(angle / 45°) with screen y pointing down: 0 = east, 2 = south.
const SECTOR_DIRS: readonly Dir[] = ['e', 'se', 's', 'sw', 'w', 'nw', 'n', 'ne'];

/** 8-way facing from a screen-space vector (y down). Zero vector → `fallback`. */
export function dirFromScreen(sx: number, sy: number, fallback: Dir = 's'): Dir {
	if (sx === 0 && sy === 0) return fallback;
	const sector = Math.round(Math.atan2(sy, sx) / (Math.PI / 4));
	return SECTOR_DIRS[(sector + 8) % 8] as Dir;
}

/**
 * 8-way facing from a world vector. Uses the unsquashed screen axes so that a world diagonal
 * (which is horizontal-ish on the 2:1 screen) maps to the diagonal sprites PixelLab draws.
 */
export function dirFromWorld(vx: number, vy: number, fallback: Dir = 's'): Dir {
	return dirFromScreen(vx - vy, vx + vy, fallback);
}

/**
 * Converts screen-relative input (W = up on screen) into a unit world vector, so pressing
 * "up" walks straight up the screen like in Diablo.
 */
export function inputToWorld(ix: number, iy: number): Vec2 {
	if (ix === 0 && iy === 0) return { x: 0, y: 0 };
	const w = screenToWorld(ix, iy);
	const len = Math.hypot(w.x, w.y);
	return { x: w.x / len, y: w.y / len };
}
