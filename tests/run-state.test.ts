import { expect, test } from 'bun:test';
import { HEROES } from '../src/data/heroes';
import { createRunState, damageHero, healHero, startRound } from '../src/logic/run-state';

test('run starts with the hero profile and round timer', () => {
	const s = createRunState(HEROES.lucia, { seed: 5, round: 3 });
	expect(s.hp).toBe(70);
	expect(s.timeLeft).toBe(30);
	startRound(s, 10);
	expect(s.timeLeft).toBe(180);
});

test('damage and healing are clamped', () => {
	const s = createRunState(HEROES.jack, { seed: 1 });
	healHero(s, 50);
	expect(s.hp).toBe(140);
	expect(damageHero(s, 100)).toBe(false);
	expect(damageHero(s, 100)).toBe(true);
	expect(s.hp).toBe(0);
});
