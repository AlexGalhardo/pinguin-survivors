/**
 * Light solid obstacles (P-11): ground decorations the hero and walkers bump into and slide
 * around. World radius per decoration variant (variants grow in size); flyers ignore them.
 */
export const OBSTACLES = {
	radiusByVariant: [7, 10, 13],
	/** Chunks kept in the collision cache (the camera shows ~12–16). */
	cacheChunks: 64,
} as const;
