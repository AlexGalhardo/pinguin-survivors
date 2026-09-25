import { describe, expect, it } from 'bun:test';
import { formatStatDelta, formatStatValue, formatTime } from '../src/logic/format';

describe('format', () => {
	it('formats percent and flat deltas', () => {
		expect(formatStatDelta('damage', 0.08)).toBe('+8%');
		expect(formatStatDelta('moveSpeed', -0.05)).toBe('-5%');
		expect(formatStatDelta('maxHp', 5)).toBe('+5');
		expect(formatStatDelta('hpRegen', 0.3)).toBe('+0.3');
		expect(formatStatDelta('critChance', 0.132)).toBe('+13.2%');
	});

	it('formats values', () => {
		expect(formatStatValue('critChance', 0.05)).toBe('5%');
		expect(formatStatValue('armor', 3)).toBe('3');
	});

	it('formats time as M:SS', () => {
		expect(formatTime(0)).toBe('0:00');
		expect(formatTime(65.7)).toBe('1:05');
	});
});

describe('stat compare', () => {
	it('lists only the stats that change', async () => {
		const { statChanges } = await import('../src/logic/compare');
		const { computeStats } = await import('../src/logic/stats');
		const a = computeStats({ maxHp: 10, damage: 0.1 });
		const b = computeStats({ maxHp: 15, damage: 0.1, armor: 1 });
		expect(statChanges(a, b)).toEqual([
			{ stat: 'maxHp', before: 10, after: 15 },
			{ stat: 'armor', before: 0, after: 1 },
		]);
	});
});
