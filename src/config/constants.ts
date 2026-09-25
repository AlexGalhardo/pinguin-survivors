/** Logical (unzoomed) resolution the game is designed for. Cameras zoom by an integer factor. */
export const LOGICAL_W = 480;
export const LOGICAL_H = 270;

/** Closed arena size in logical pixels (~2x2 screens). */
export const ARENA_W = 960;
export const ARENA_H = 540;

/** Base grid size for sprites and tiles. */
export const TILE = 32;

/** Performance caps (see docs/architecture.md). */
export const MAX_ENEMIES_ALIVE = 300;
export const MAX_PROJECTILES = 500;

/** Wall thickness around the arena (one tile). */
export const ARENA_WALL = TILE;

/** Camera deadzone in logical px (the player moves freely inside it). */
export const CAMERA_DEADZONE_W = 48;
export const CAMERA_DEADZONE_H = 32;
