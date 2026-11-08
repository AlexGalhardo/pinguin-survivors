/** Logical screen height; zoom = floor(innerHeight / LOGICAL_H) (P-06). */
export const LOGICAL_H = 540;

export const MAX_ENEMIES = 300;

export const HERO_IDS = ['jack', 'bob', 'lucia'] as const;
export type HeroId = (typeof HERO_IDS)[number];

/** Campaign biomes in visit order (rounds 1-30, one per 10 rounds); round 31+ is endless (see ENDLESS_BIOMES). */
export const BIOME_IDS = ['antarctica', 'forest', 'city'] as const;
/** The original biomes 2 and 3 (research station, ruined city): kept as endless-mode biomes. */
export const LEGACY_BIOME_IDS = ['station', 'ruins'] as const;
/** Visual and enemy sources for round 31+: a random one per block of 10 rounds. */
export const ENDLESS_BIOMES = [...BIOME_IDS, ...LEGACY_BIOME_IDS] as const;
export type BiomeId = (typeof ENDLESS_BIOMES)[number];

/** Game speed toggled with TAB (default 1x). */
export const GAME_SPEEDS = [1, 2] as const;
export type GameSpeed = (typeof GAME_SPEEDS)[number];
