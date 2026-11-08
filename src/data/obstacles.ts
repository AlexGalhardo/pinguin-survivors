/** Hero width in world units (the sprite is ~72 tall); obstacle sizes are multiples of it. */
const HERO_WIDTH = 52;
/** Drawn width per decoration variant: 3x, 3.5x, 4x and 5x the hero (developer, 2026-11-08). */
const WIDTH_BY_VARIANT = [3, 3.5, 4, 5].map((k) => Math.round(k * HERO_WIDTH));
/** Collision circle radius as a share of the drawn width (rocks are roughly round). */
const FOOTPRINT = 0.4;

/**
 * Solid obstacles (P-11): ground decorations the hero and walkers bump into and steer around.
 * Big on purpose (3-5x the hero), so the layout keeps wide lanes between them; flyers ignore them.
 */
export const OBSTACLES = {
	widthByVariant: WIDTH_BY_VARIANT,
	radiusByVariant: WIDTH_BY_VARIANT.map((w) => Math.round(w * FOOTPRINT)),
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
