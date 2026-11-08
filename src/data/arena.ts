/** Square top-down arena (SDD-001, ADR-003). Sizes in world units (1 u = 1 px at zoom 1). */
export const ARENA = {
	tile: 64,
	startSide: 10,
	growth: 1,
	maxSide: 40,
	/** Seconds a spawn mark shows before an enemy appears inside the camera view. */
	spawnTelegraph: 0.5,
	/** Extra margin around the visible rectangle that spawns avoid (px). */
	spawnViewMargin: 48,
	/** Persistent blood decals per run. */
	decalCap: 4000,
	/** Props never closer than this many tiles to the hero spawn (arena center). */
	propClearTiles: 2,
} as const;
