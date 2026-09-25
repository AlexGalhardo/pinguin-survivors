import { describe, expect, it } from 'bun:test';
import { rarityValue, rarityWeights, rollRarity } from '../src/logic/rarity';
import { Rng } from '../src/logic/rng';

describe('rarity (balancing §5)', () => {
	it('uses the base weights on wave 1 with no luck, without legendary', () => {
		expect(rarityWeights(1, 0)).toEqual({ common: 70, rare: 22, epic: 7, legendary: 0 });
	});

	it('unlocks legendary at wave 5 and boosts rare+ with wave and luck', () => {
		const w = rarityWeights(5, 50);
		const boost = 1.08 * 1.5;
		expect(w.common).toBe(70);
		expect(w.rare).toBeCloseTo(22 * boost);
		expect(w.legendary).toBeCloseTo(boost);
	});

	it('never rolls legendary before wave 5', () => {
		const rng = new Rng(9);
		for (let i = 0; i < 5000; i++) expect(rollRarity(rng, 4, 500)).not.toBe('legendary');
	});

	it('rolls common most of the time early', () => {
		const rng = new Rng(1);
		let common = 0;
		for (let i = 0; i < 10_000; i++) if (rollRarity(rng, 1, 0) === 'common') common++;
		expect(common / 10_000).toBeCloseTo(70 / 99, 1);
	});

	it('maps value multipliers', () => {
		expect(rarityValue('common')).toBe(1);
		expect(rarityValue('legendary')).toBe(3);
	});
});
