/** Hero width in world units (the sprite is ~72 tall). */
const HERO_WIDTH = 52;
/** Integer art scale per decoration variant: the current art drawn 2x or 3x (developer, 2026-11-08). */
const SCALE_BY_VARIANT = [2, 2, 3, 3];
/** Typical decoration art width (px); the collision circle is a share of the drawn width. */
const ART_WIDTH = 40;
const FOOTPRINT = 0.4;

/**
 * Solid obstacles (P-11): ground decorations the hero and walkers bump into and steer around.
 * Drawn 2-3x, so the layout keeps wide lanes between them; flyers ignore them.
 */
export const OBSTACLES = {
	scaleByVariant: SCALE_BY_VARIANT,
	radiusByVariant: SCALE_BY_VARIANT.map((k) => Math.round(ART_WIDTH * k * FOOTPRINT)),
	/** Minimum free lane between two obstacles, and between an obstacle and the arena edge. */
	minGap: 3 * HERO_WIDTH,
	/** Obstacles never cover more than this share of the arena floor. */
	maxCoverage: 0.08,
	/** Sprite anchor: the collision circle sits on the rock body, not under its base. */
	originY: 0.65,
	/** Walkers look this far ahead (world units) for an obstacle on their path to the hero. */
	avoidLookahead: 56,
	/** Extra gap kept between a walker and the obstacle it steers around. */
	avoidMargin: 4,
	/** Strength of the sideways steer, relative to the pull towards the hero. */
	avoidWeight: 2.2,
};
