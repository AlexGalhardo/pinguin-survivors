import { describe, expect, test } from 'bun:test';
import { ALL_CARDS } from '../src/data/cards';
import { HEROES } from '../src/data/heroes';
import { applyCard, canTake, emptyBuild, slotsUsed } from '../src/logic/build';
import { drawCards, rarityWeights } from '../src/logic/cards';
import { Rng } from '../src/logic/rng';
import { baseStats } from '../src/logic/stats';

const card = (id: string) => {
	const c = ALL_CARDS.find((x) => x.id === id);
	if (!c) throw new Error(id);
	return c;
};

describe('rarity', () => {
	test('weights shift from round 1 to 30 and with luck', () => {
		expect(rarityWeights(1, 0)).toEqual([70, 22, 7, 1]);
		expect(rarityWeights(30, 0)).toEqual([40, 35, 18, 7]);
		const lucky = rarityWeights(1, 0.2);
		expect(lucky[0]).toBeCloseTo(50);
		expect(lucky.reduce((a, b) => a + b, 0)).toBeCloseTo(100);
	});
});

describe('drawCards', () => {
	test('3 distinct cards, exclusives only for the hero', () => {
		const rng = new Rng(1);
		for (let i = 0; i < 300; i++) {
			const offers = drawCards(rng, { hero: 'bob', round: 5, luck: 0, build: emptyBuild() });
			expect(offers).toHaveLength(3);
			expect(new Set(offers.map((o) => o.card.id)).size).toBe(3);
			for (const o of offers)
				expect(o.card.hero === undefined || o.card.hero === 'bob').toBe(true);
		}
	});

	test('hero actives stop being offered at the max level', () => {
		const build = emptyBuild();
		build.secondaries = { arcaneChain: 5, frostNova: 2 };
		expect(canTake(build, card('active.arcaneChain'))).toBe(false);
		expect(canTake(build, card('active.frostNova'))).toBe(true);
	});
});

describe('applyCard', () => {
	test('stat cards scale with rarity and report max hp gains', () => {
		const stats = baseStats(HEROES.jack);
		const build = emptyBuild();
		const r = applyCard(build, stats, card('maxHp'), 'epic');
		expect(r.maxHpDelta).toBeCloseTo(12 * 2.4);
		expect(stats.maxHp).toBeCloseTo(140 + 28.8);
		applyCard(build, stats, card('resistIce'), 'common');
		expect(stats.resist.ice).toBeCloseTo(0.13);
	});

	test('hero actives and perks level up', () => {
		const stats = baseStats(HEROES.jack);
		const build = emptyBuild();
		applyCard(build, stats, card('active.seismicStomp'), 'common');
		applyCard(build, stats, card('active.seismicStomp'), 'rare');
		expect(build.secondaries.seismicStomp).toBe(2);
		expect(slotsUsed(build)).toBe(1);
		const r = applyCard(build, stats, card('perk.ironSkin'), 'common');
		expect(r.exclusive).toBe(true);
		expect(stats.armor).toBe(18);
		expect(build.cards).toHaveLength(3);
	});
});

describe('1.0 card pool (SDD-002 RF-06/RF-07)', () => {
	test('exclusives that became weapons are not cards; new passives are', () => {
		const ids = ALL_CARDS.map((c) => c.id);
		for (const w of ['bladeWhirl', 'grenadeBelt', 'droneSentinel'])
			expect(ids).not.toContain(`weapon.${w}`);
		for (const p of ['ironBreath', 'quickReload', 'arcaneEcho'])
			expect(ids).toContain(`perk.${p}`);
		expect(card('perk.ironBreath').hero).toBe('jack');
		expect(card('perk.quickReload').hero).toBe('bob');
		expect(card('perk.arcaneEcho').hero).toBe('lucia');
	});
});

describe('level-up pool has no weapons or evolutions (SDD-003 A6)', () => {
	test('only stat cards, hero actives and perks', () => {
		for (const c of ALL_CARDS) {
			expect(c.id.startsWith('weapon.') || c.id.startsWith('evolve.')).toBe(false);
			expect(['stat', 'secondary', 'perk']).toContain(c.effect.type);
			expect(['stat', 'onhit', 'exclusive']).toContain(c.kind);
		}
	});
});
