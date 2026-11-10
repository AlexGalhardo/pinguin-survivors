/** Logical screen height; zoom = floor(innerHeight / LOGICAL_H) (P-06). */
export const LOGICAL_H = 540;

export const MAX_ENEMIES = 300;

export const HERO_IDS = ['jack', 'bob', 'lucia'] as const;
export type HeroId = (typeof HERO_IDS)[number];

/**
 * Campaign biomes in visit order (rounds 1-50, one per 10 rounds; ADR-023). Station and ruins
 * reuse the legacy PixelLab atlases. Round 51+ is endless (see ENDLESS_BIOMES).
 */
export const BIOME_IDS = ['antarctica', 'forest', 'city', 'station', 'ruins'] as const;
/** Visual and enemy sources for round 51+: a random one per block of 10 rounds. */
export const ENDLESS_BIOMES = BIOME_IDS;
export type BiomeId = (typeof ENDLESS_BIOMES)[number];

/** Game speed toggled with TAB (default 1x) and chosen in Settings. */
export const GAME_SPEEDS = [1, 1.5, 2] as const;
export type GameSpeed = (typeof GAME_SPEEDS)[number];
/** Longest world step in seconds: faster speeds run several of them per frame. */
export const MAX_STEP = 1 / 30;
