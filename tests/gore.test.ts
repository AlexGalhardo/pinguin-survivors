import { describe, expect, test } from 'bun:test';
import { ARENA } from '../src/data/arena';
import { arenaBounds } from '../src/logic/arena';
import { type Decal, DecalLog, decalLocal } from '../src/logic/gore';

const decal = (i: number): Decal => ({
	x: (i % 50) * 10 - 250,
	y: Math.floor(i / 50) * 10 - 250,
	key: 'fx.splat.blood.0',
	scale: 1,
	rot: i,
	flip: false,
	alpha: 1,
});

describe('DecalLog', () => {
	test('keeps the newest marks past the cap, oldest first', () => {
		const log = new DecalLog(4);
		for (let i = 0; i < 6; i++) log.add(decal(i));
		const rots: number[] = [];
		log.forEach((d) => {
			rots.push(d.rot);
		});
		expect(rots).toEqual([2, 3, 4, 5]);
		expect(log.size).toBe(4);
		expect(log.total).toBe(6);
	});

	test('default cap is the arena decal cap', () => {
		const log = new DecalLog();
		for (let i = 0; i < ARENA.decalCap + 10; i++) log.add(decal(i));
		expect(log.size).toBe(ARENA.decalCap);
	});
});

describe('growing keeps decals (A7)', () => {
	test('500 decals keep count and world position; only the texture offset changes', () => {
		const log = new DecalLog();
		for (let i = 0; i < 500; i++) log.add(decal(i));
		const before = arenaBounds(1);
		const after = arenaBounds(2);
		const worldBefore: number[] = [];
		const worldAfter: number[] = [];
		log.forEach((d) => {
			const a = decalLocal(d, before);
			const b = decalLocal(d, after);
			// Growth is centered: each side gains half a tile.
			expect(b.x - a.x).toBe(ARENA.tile / 2);
			expect(b.y - a.y).toBe(ARENA.tile / 2);
			worldBefore.push(a.x + before.minX);
			worldAfter.push(b.x + after.minX);
		});
		expect(log.size).toBe(500);
		expect(worldAfter).toEqual(worldBefore);
	});
});
