import { describe, expect, test } from 'bun:test';
import { ENEMIES } from '../src/data/enemies';
import { AI, newAi, nextHazard, stepAi } from '../src/logic/enemy-ai';

describe('enemy AI', () => {
	test('chasers always seek', () => {
		expect(stepAi(ENEMIES.zombiePenguin, newAi(), 5, 0.1)).toEqual({
			move: 'seek',
			action: null,
		});
	});

	test('ranged keeps distance and shoots on cooldown', () => {
		const ai = newAi();
		const d = ENEMIES.zombieScientist;
		expect(stepAi(d, ai, 400, 0.1)).toEqual({ move: 'seek', action: null });
		expect(stepAi(d, ai, 100, 0.1)).toEqual({ move: 'hold', action: 'shoot' });
		expect(stepAi(d, ai, 100, 0.1).action).toBeNull();
	});

	test('bombers explode in range', () => {
		expect(stepAi(ENEMIES.bloaterPenguin, newAi(), 30, 0.1).action).toBe('explode');
	});

	test('charger: wind-up, charge, recover, cooldown', () => {
		const ai = newAi();
		const d = ENEMIES.zombieWalrus;
		expect(stepAi(d, ai, 150, 0.1).move).toBe('hold');
		expect(ai.mode).toBe('windup');
		const start = stepAi(d, ai, 150, AI.chargeWindup);
		expect(start).toEqual({ move: 'charge', action: 'chargeStart' });
		expect(stepAi(d, ai, 150, AI.chargeTime + 0.01).move).toBe('hold');
		expect(ai.mode).toBe('recover');
		stepAi(d, ai, 150, AI.recover + 0.01);
		expect(ai.mode).toBe('move');
		expect(stepAi(d, ai, 150, 0.1).move).toBe('seek');
	});

	test('boss swipes in range, charges and roars on timers', () => {
		const d = ENEMIES.polarBear;
		const ai = newAi(d);
		stepAi(d, ai, 50, 0.1);
		expect(ai.pending).toBe('swipe');
		expect(stepAi(d, ai, 50, d.boss.swipeWindup).action).toBe('swipe');
		const far = newAi(d);
		far.roarCd = 0;
		expect(stepAi(d, far, 500, 0.1).action).toBe('summon');
	});

	test('kraken fires volleys and never charges; abomination drops pools and charges', () => {
		const k = ENEMIES.kraken;
		const ai = newAi(k);
		const actions = new Set<string | null>();
		for (let i = 0; i < 600; i++) actions.add(stepAi(k, ai, 400, 0.05).action);
		expect(actions.has('volley')).toBe(true);
		expect(actions.has('pool')).toBe(false);
		expect(actions.has('chargeStart')).toBe(false);
		const a = ENEMIES.abomination;
		const ai2 = newAi(a);
		const seen = new Set<string | null>();
		for (let i = 0; i < 600; i++) seen.add(stepAi(a, ai2, 400, 0.05).action);
		expect(seen.has('pool')).toBe(true);
		expect(seen.has('chargeStart')).toBe(true);
		expect(seen.has('volley')).toBe(false);
	});

	test('boss area attacks fire every hazardEvery and rotate through the profile', () => {
		const d = ENEMIES.polarBear;
		const b = d.boss;
		const ai = newAi(d);
		expect(ai.hazardCd).toBe(b.hazardEvery);
		ai.hazardCd = 0;
		ai.roarCd = ai.volleyCd = ai.poolCd = 999;
		const step = stepAi(d, ai, 500, 0.1);
		expect(step.action).toBe('hazard');
		expect(step.move).toBe('seek');
		expect(ai.hazardCd).toBe(b.hazardEvery);
		const kinds = Array.from({ length: b.hazards.length + 1 }, () => nextHazard(b, ai));
		expect(kinds.slice(0, -1)).toEqual([...b.hazards]);
		expect(kinds.at(-1)).toBe(b.hazards[0]);
	});
});
