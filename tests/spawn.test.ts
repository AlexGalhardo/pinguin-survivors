import { describe, expect, test } from 'bun:test';
import { ENEMY_LIST } from '../src/data/enemies';
import { arenaBounds, insideBounds, spawnRing } from '../src/logic/arena';
import { Rng } from '../src/logic/rng';
import { pickEnemy, SpawnQueue } from '../src/logic/spawn';

describe('spawn ring on a large arena', () => {
	test('1000 spawns around a centered hero are never inside the view and need no telegraph', () => {
		const b = arenaBounds(31);
		const view = { minX: -480, minY: -270, maxX: 480, maxY: 270 };
		const pts = spawnRing(b, view, new Rng(3), 1000);
		for (const p of pts) {
			expect(p.telegraph).toBe(false);
			expect(insideBounds(p, view)).toBe(false);
		}
	});

	test('a view covering the whole arena forces a telegraph on every spawn', () => {
		const b = arenaBounds(1);
		const pts = spawnRing(b, b, new Rng(5), 50);
		expect(pts.every((p) => p.telegraph)).toBe(true);
	});
});

describe('SpawnQueue', () => {
	test('releases a spawn only after its telegraph delay', () => {
		const q = new SpawnQueue<string>();
		q.add(10, 20, 0.5, 'a');
		const out: string[] = [];
		q.update(0.3, (p) => out.push(p.data));
		expect(out).toEqual([]);
		expect(q.size).toBe(1);
		q.update(0.3, (p) => out.push(p.data));
		expect(out).toEqual(['a']);
		expect(q.size).toBe(0);
	});

	test('clear drops pending spawns', () => {
		const q = new SpawnQueue<number>();
		q.add(0, 0, 1, 1);
		q.clear();
		expect(q.size).toBe(0);
	});
});

describe('pickEnemy', () => {
	test('respects unlock rounds and never picks bosses', () => {
		const rng = new Rng(9);
		const seen = new Set<string>();
		for (let i = 0; i < 400; i++) seen.add(pickEnemy(rng, ENEMY_LIST, 1).id);
		expect([...seen]).toEqual(['zombiePenguin']);
		for (let i = 0; i < 2000; i++) seen.add(pickEnemy(rng, ENEMY_LIST, 10).id);
		expect(seen.has('zombieWalrus')).toBe(true);
		expect(seen.has('polarBear')).toBe(false);
	});
});
