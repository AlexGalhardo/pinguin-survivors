import Phaser from 'phaser';
import { DECORATIONS, FLOOR_TILES, TEX } from '../art/manifest';

/** Decorations stamped on the floor. */
const DECOR_COUNT = 42;

import { ARENA_H, ARENA_W, ARENA_WALL, TILE } from '../config/constants';
import type { Rng } from '../logic/rng';

/** Walkable rectangle inside the walls. */
export const PLAY_AREA = new Phaser.Geom.Rectangle(
	ARENA_WALL,
	ARENA_WALL,
	ARENA_W - ARENA_WALL * 2,
	ARENA_H - ARENA_WALL * 2,
);

/**
 * Builds the closed arena: floor tiles baked into one RenderTexture (random variants),
 * wall tiles on the border and 4 static physics bodies for collision.
 */
export function createArena(scene: Phaser.Scene, rng: Rng): Phaser.Physics.Arcade.StaticGroup {
	const rt = scene.add.renderTexture(0, 0, ARENA_W, ARENA_H).setOrigin(0, 0).setDepth(-10);
	const cols = Math.ceil(ARENA_W / TILE);
	const rows = Math.ceil(ARENA_H / TILE);
	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			const wall = x === 0 || y === 0 || x === cols - 1 || y === rows - 1;
			const key = wall
				? TEX.tileWall
				: rng.chance(0.8)
					? TEX.tileFloor0
					: rng.pick(FLOOR_TILES);
			rt.stamp(key, undefined, x * TILE, y * TILE, { originX: 0, originY: 0 });
		}
	}
	// Non-blocking decoration, kept away from the center where the player starts.
	for (let i = 0; i < DECOR_COUNT; i++) {
		const x = rng.range(ARENA_WALL + 16, ARENA_W - ARENA_WALL - 16);
		const y = rng.range(ARENA_WALL + 16, ARENA_H - ARENA_WALL - 16);
		if (Math.hypot(x - ARENA_W / 2, y - ARENA_H / 2) < 90) continue;
		rt.stamp(rng.pick(DECORATIONS), undefined, Math.round(x), Math.round(y), {
			alpha: 0.9,
		});
	}
	rt.render();

	const walls = scene.physics.add.staticGroup();
	const addWall = (x: number, y: number, w: number, h: number) => {
		const zone = scene.add.zone(x + w / 2, y + h / 2, w, h);
		walls.add(zone);
	};
	addWall(0, 0, ARENA_W, ARENA_WALL);
	addWall(0, ARENA_H - ARENA_WALL, ARENA_W, ARENA_WALL);
	addWall(0, 0, ARENA_WALL, ARENA_H);
	addWall(ARENA_W - ARENA_WALL, 0, ARENA_WALL, ARENA_H);
	scene.physics.world.setBounds(0, 0, ARENA_W, ARENA_H);
	return walls;
}
