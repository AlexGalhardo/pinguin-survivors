/** Logical screen height; zoom = floor(innerHeight / LOGICAL_H) (P-06). */
export const LOGICAL_H = 540;

export const MAX_ENEMIES = 300;

export const HERO_IDS = ['jack', 'bob', 'lucia'] as const;
export type HeroId = (typeof HERO_IDS)[number];

/** Biomes in visit order; the run moves to the next one every 10 rounds and loops (P-18). */
export const BIOME_IDS = ['antarctica', 'station', 'ruins'] as const;
export type BiomeId = (typeof BIOME_IDS)[number];

/** Game speed toggled with TAB (default 1x). */
export const GAME_SPEEDS = [1, 2] as const;
export type GameSpeed = (typeof GAME_SPEEDS)[number];
