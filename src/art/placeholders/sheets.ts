import { PALETTE as P } from '../../config/palette';
import { PixelCanvas } from './pixel-canvas';

/**
 * Animated placeholder sheets (Beta): frames drawn by code side by side.
 * Keys follow the manifest contract: `<texture>.idle` (2 frames) and `<texture>.walk` (4 frames);
 * the animation key is the same as the sheet key.
 */
export interface SheetSpec {
	frameW: number;
	frameH: number;
	frames: number;
	/** Frames per second of the animation. */
	fps: number;
	draw: (c: PixelCanvas, frame: number) => void;
}

/** Two- and three-tone ramps (shadow, highlight) inside Endesga 32. */
export const RAMPS: Record<number, [number, number]> = {
	[P.steel]: [P.slate, P.silver],
	[P.silver]: [P.steel, P.white],
	[P.slate]: [P.darkSlate, P.steel],
	[P.darkSlate]: [P.midnight, P.slate],
	[P.orange]: [P.rust, P.amber],
	[P.amber]: [P.orange, P.yellow],
	[P.green]: [P.forest, P.yellow],
	[P.forest]: [P.pine, P.green],
	[P.pine]: [P.deepTeal, P.forest],
	[P.deepTeal]: [P.midnight, P.pine],
	[P.plum]: [P.darkBrown, P.orchid],
	[P.orchid]: [P.plum, P.salmon],
	[P.brown]: [P.darkBrown, P.clay],
	[P.clay]: [P.brown, P.tan],
	[P.peach]: [P.mocha, P.sand],
	[P.navy]: [P.midnight, P.blue],
	[P.red]: [P.crimson, P.salmon],
};

/** Per-frame (leftLegDy, rightLegDy, bodyDy). */
const WALK: readonly [number, number, number][] = [
	[-1, 1, 0],
	[0, 0, -1],
	[1, -1, 0],
	[0, 0, -1],
];
const IDLE: readonly [number, number, number][] = [
	[0, 0, 0],
	[0, 0, 1],
];

type Pose = [number, number, number];

function warrior(c: PixelCanvas, [l, r, b]: Pose): void {
	c.rect(11, 25 + l, 4, 5 - Math.max(0, l), P.darkSlate);
	c.rect(17, 25 + r, 4, 5 - Math.max(0, r), P.darkSlate);
	c.ellipse(16, 20 + b, 8, 7, P.slate);
	c.ellipse(16, 19 + b, 6, 5, P.steel);
	c.circle(8.5, 17.5 + b, 3.5, P.silver);
	c.circle(23.5, 17.5 + b, 3.5, P.silver);
	c.circle(16, 11 + b, 6, P.silver);
	c.rect(11, 9 + b, 10, 3, P.orange);
	c.rect(12, 9 + b, 3, 1, P.yellow);
	c.shade(RAMPS);
	c.line(27, 5 + b, 27, 21 + b, P.cyan);
	c.line(28, 6 + b, 28, 20 + b, P.white);
	c.rect(26, 22 + b, 3, 3, P.amber);
	c.outline(P.void);
}

function ranger(c: PixelCanvas, [l, r, b]: Pose): void {
	c.rect(12, 25 + l, 3, 5 - Math.max(0, l), P.pine);
	c.rect(17, 25 + r, 3, 5 - Math.max(0, r), P.pine);
	c.ellipse(16, 20 + b, 6, 6, P.forest);
	c.ellipse(16, 19 + b, 4, 4, P.green);
	c.rect(10, 16 + b, 12, 2, P.amber);
	c.circle(16, 11 + b, 5, P.peach);
	c.rect(11, 6 + b, 10, 4, P.brown);
	c.shade(RAMPS);
	c.rect(12, 11 + b, 8, 2, P.darkBrown);
	c.rect(13, 11 + b, 2, 1, P.yellow);
	c.rect(17, 11 + b, 2, 1, P.yellow);
	c.rect(22, 18 + b, 7, 3, P.darkSlate);
	c.rect(28, 18 + b, 2, 2, P.orange);
	c.outline(P.void);
}

function mage(c: PixelCanvas, [l, r, b]: Pose): void {
	// Robe hem sways instead of legs.
	c.ellipse(16 + (l - r) * 0.5, 22 + b, 8, 8, P.plum);
	c.ellipse(16, 21 + b, 6, 6, P.orchid);
	c.rect(15, 15 + b, 2, 14, P.amber);
	c.circle(16, 11 + b, 6, P.plum);
	c.shade(RAMPS);
	c.circle(16, 12 + b, 4, P.darkBrown);
	c.rect(13, 11 + b, 2, 2, P.cyan);
	c.rect(17, 11 + b, 2, 2, P.cyan);
	c.circle(26, 9 + b * 2 - l, 3, P.orchid);
	c.px(26, 8 + b * 2 - l, P.white);
	c.outline(P.void);
}

function sheet(
	draw: (c: PixelCanvas, pose: Pose) => void,
	poses: readonly Pose[],
	fps: number,
): SheetSpec {
	return {
		frameW: 32,
		frameH: 32,
		frames: poses.length,
		fps,
		draw: (c, f) => draw(c, poses[f] ?? [0, 0, 0]),
	};
}

export const SHEETS: Record<string, SheetSpec> = {
	'player.warrior.idle': sheet(warrior, IDLE, 2),
	'player.warrior.walk': sheet(warrior, WALK, 8),
	'player.ranger.idle': sheet(ranger, IDLE, 2),
	'player.ranger.walk': sheet(ranger, WALK, 10),
	'player.mage.idle': sheet(mage, IDLE, 2),
	'player.mage.walk': sheet(mage, WALK, 6),
};

/** Renders a sheet: frames side by side on one canvas. */
export function renderSheet(key: string): PixelCanvas {
	const s = SHEETS[key];
	if (!s) throw new Error(`Unknown sheet ${key}`);
	const out = new PixelCanvas(s.frameW * s.frames, s.frameH);
	for (let f = 0; f < s.frames; f++) {
		const frame = new PixelCanvas(s.frameW, s.frameH);
		s.draw(frame, f);
		out.blit(frame, f * s.frameW, 0);
	}
	return out;
}
