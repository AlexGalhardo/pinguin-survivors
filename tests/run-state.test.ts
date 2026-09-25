import { describe, expect, it } from 'bun:test';
import { createRunState, deserializeRun, runStats, serializeRun } from '../src/logic/run-state';

describe('RunState', () => {
	it('starts at full HP for the chosen class', () => {
		const s = createRunState('warrior', 42);
		expect(s.hp).toBe(30);
		expect(s.wave).toBe(1);
		expect(s.gold).toBe(0);
		expect(s.revives).toBe(0);
	});

	it('includes stat cards and items in the current stats', () => {
		const s = createRunState('ranger', 1);
		s.cardMods = { maxHp: 5 };
		s.items = ['heavy_boots'];
		const stats = runStats(s, (id) => (id === 'heavy_boots' ? { maxHp: 8 } : undefined));
		expect(stats.maxHp).toBe(33);
	});

	it('round-trips through JSON and rejects other versions', () => {
		const s = createRunState('mage', 7, 5);
		expect(deserializeRun(serializeRun(s))).toEqual(s);
		expect(deserializeRun('{"version":99}')).toBeUndefined();
		expect(deserializeRun('not json')).toBeUndefined();
	});
});
