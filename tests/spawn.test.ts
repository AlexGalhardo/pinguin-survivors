import { describe, expect, it } from 'bun:test';
import { Rng } from '../src/logic/rng';
import { groupSize, pickEnemyType, unlockedTypes } from '../src/logic/spawn';

describe('spawn pool', () => {
	it('unlocks one type per wave until wave 4', () => {
		expect(unlockedTypes(1)).toEqual(['chaser']);
		expect(unlockedTypes(2)).toEqual(['chaser', 'runner']);
		expect(unlockedTypes(4)).toEqual(['chaser', 'runner', 'shooter', 'tank']);
		expect(unlockedTypes(30)).not.toContain('boss');
	});

	it('follows the weights roughly', () => {
		const rng = new Rng(11);
		const counts: Record<string, number> = {};
		for (let i = 0; i < 10_000; i++) {
			const t = pickEnemyType(4, rng);
			counts[t] = (counts[t] ?? 0) + 1;
		}
		expect(counts.chaser ?? 0).toBeGreaterThan(4500);
		expect(counts.chaser ?? 0).toBeLessThan(5500);
		expect(counts.tank ?? 0).toBeGreaterThan(700);
		expect(counts.tank ?? 0).toBeLessThan(1300);
	});

	it('runners come in groups of 3-5', () => {
		const rng = new Rng(5);
		for (let i = 0; i < 100; i++) {
			const n = groupSize('runner', rng);
			expect(n).toBeGreaterThanOrEqual(3);
			expect(n).toBeLessThanOrEqual(5);
		}
		expect(groupSize('chaser', rng)).toBe(1);
	});
});

describe('beta enemies', () => {
	it('unlock from wave 6 to 9 and never include bosses or splitlings', () => {
		expect(unlockedTypes(6)).toContain('splitter');
		expect(unlockedTypes(9)).toEqual([
			'chaser',
			'runner',
			'shooter',
			'tank',
			'splitter',
			'bomber',
			'healer',
			'burrower',
		]);
		expect(unlockedTypes(99)).not.toContain('splitling');
		expect(unlockedTypes(99)).not.toContain('boss2');
	});
});
