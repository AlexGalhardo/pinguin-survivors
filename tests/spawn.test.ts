import { describe, expect, test } from 'bun:test';
import { ENEMY_LIST } from '../src/data/enemies';
import { worldToScreen } from '../src/logic/iso';
import { Rng } from '../src/logic/rng';
import { pickEnemy, SPAWN_MARGIN, spawnPosition } from '../src/logic/spawn';

describe('spawnPosition', () => {
	test.each([
		[1280, 540],
		[960, 540],
		[1366, 768],
	])('always just outside a %ix%i view', (w, h) => {
		const rng = new Rng(3);
		const hero = { x: 500, y: -200 };
		const hs = worldToScreen(hero.x, hero.y);
		for (let i = 0; i < 500; i++) {
			const w0 = spawnPosition(rng, hero, w, h);
			const p = worldToScreen(w0.x, w0.y);
			const dx = Math.abs(p.x - hs.x);
			const dy = Math.abs(p.y - hs.y);
			const outside = dx >= w / 2 + SPAWN_MARGIN - 1e-6 || dy >= h / 2 + SPAWN_MARGIN - 1e-6;
			expect(outside).toBe(true);
			expect(dx).toBeLessThanOrEqual(w / 2 + SPAWN_MARGIN + 1e-6);
			expect(dy).toBeLessThanOrEqual(h / 2 + SPAWN_MARGIN + 1e-6);
		}
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
