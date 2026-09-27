/** Logical screen height; zoom = floor(innerHeight / LOGICAL_H) (P-06). */
export const LOGICAL_H = 540;

/** Iso tile size on screen (2:1) and its footprint in world units. */
export const TILE_W = 64;
export const TILE_H = 32;
export const TILE_WORLD = 32;

export const CHUNK_TILES = 16;
export const CHUNK_WORLD = CHUNK_TILES * TILE_WORLD;
/** Extra chunk ring kept alive around the camera to avoid pop-in. */
export const CHUNK_MARGIN = 1;

export const MAX_ENEMIES = 300;

export const HERO_IDS = ['jack', 'bob', 'lucia'] as const;
export type HeroId = (typeof HERO_IDS)[number];

/** Game speed toggled with TAB (default 1x). */
export const GAME_SPEEDS = [1, 2] as const;
export type GameSpeed = (typeof GAME_SPEEDS)[number];
