import { describe, expect, test } from 'bun:test';
import { ENEMIES } from '../src/data/enemies';
import { AI, newAi, stepAi } from '../src/logic/enemy-ai';

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
		const ai = newAi();
		const d = ENEMIES.polarBear;
		stepAi(d, ai, 50, 0.1);
		expect(ai.pending).toBe('swipe');
		expect(stepAi(d, ai, 50, AI.boss.swipeWindup).action).toBe('swipe');
		const far = newAi();
		far.roarCd = 0;
		expect(stepAi(d, far, 500, 0.1).action).toBe('summon');
	});
});
