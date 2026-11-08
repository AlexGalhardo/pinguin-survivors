import { describe, expect, test } from 'bun:test';
import { HEROES } from '../src/data/heroes';
import { HEAL_POTION, POTION_TYPES } from '../src/data/potions';
import { MAGNETIC, SUPPORT_SLOTS } from '../src/data/support';
import { emptyBuild } from '../src/logic/build';
import { emptyGear } from '../src/logic/equipment';
import {
	buyHealPotion,
	emptyHealPotion,
	healShare,
	refillHealPotion,
	rollPotionDrop,
	tickHealPotion,
	upgradeRarity,
} from '../src/logic/heal-potion';
import { buildPlayerPanel } from '../src/logic/item-view';
import { Rng } from '../src/logic/rng';
import {
	createRunState,
	leaveShop,
	purchase,
	shopPool,
	supportCandidates,
} from '../src/logic/run-state';
import { describeOffer } from '../src/logic/shop-describe';
import { baseStats, getStat } from '../src/logic/stats';
import {
	buySupport,
	canBuySupport,
	magnetBonus,
	type SupportLevels,
	supportLevel,
	supportValue,
} from '../src/logic/support';

describe('support items (SDD-014 RF-10)', () => {
	test('buying again raises the level up to 5 and Magnetic grows radius and pull', () => {
		const stats = baseStats(HEROES.jack);
		const owned: SupportLevels = {};
		expect(magnetBonus(owned)).toEqual({ radius: 0, pull: 1 });
		for (let level = 1; level <= 5; level++) {
			expect(buySupport(owned, 'magnetic', stats)).toBe(true);
			expect(supportLevel(owned, 'magnetic')).toBe(level);
			expect(magnetBonus(owned)).toEqual({
				radius: MAGNETIC.radius[level - 1] as number,
				pull: MAGNETIC.pull[level - 1] as number,
			});
		}
		expect(buySupport(owned, 'magnetic', stats)).toBe(false);
		expect(canBuySupport(owned, 'magnetic')).toBe(false);
	});

	test('stat items add only the difference between levels', () => {
		const stats = baseStats(HEROES.jack);
		const speed = stats.moveSpeed;
		const owned: SupportLevels = {};
		buySupport(owned, 'swift', stats);
		buySupport(owned, 'swift', stats);
		expect(getStat(stats, 'moveSpeed')).toBe(speed + supportValue('swift', 2));
	});

	test('four slots of their own: a new item needs a free one, an owned one still levels', () => {
		expect(SUPPORT_SLOTS).toBe(4);
		// Four distinct ids cannot exist with three items, so fake the occupied slots.
		const full = { swift: 1, lucky: 1, a: 1, b: 1 } as SupportLevels;
		expect(canBuySupport(full, 'magnetic')).toBe(false);
		expect(canBuySupport(full, 'swift')).toBe(true);
	});

	test('the shop offers them at rarity I, hides maxed ones, and buying levels them up', () => {
		const run = createRunState(HEROES.jack, { seed: 1 });
		const stats = baseStats(HEROES.jack);
		const build = emptyBuild();
		expect(supportCandidates(run).map((c) => c.id)).toEqual([
			'magnetic',
			'swift',
			'lucky',
			'healPotion',
		]);
		expect(shopPool('jack', 1, run).some((c) => c.kind === 'support')).toBe(true);
		run.fish = 500;
		run.shop = {
			offers: [
				{ kind: 'support', id: 'magnetic', tier: 1, price: 20 },
				{ kind: 'support', id: 'magnetic', tier: 1, price: 20 },
				null,
				null,
			],
			locks: [false, false, false, false],
			rerolls: 0,
		};
		const offer = run.shop.offers[0];
		if (!offer) throw new Error('offer');
		expect(
			describeOffer(offer, { build, gear: emptyGear(), stats, support: run.support }).outcome,
		).toMatchObject({ type: 'support', from: 0, to: 1 });
		expect(purchase(run, 0, { build, stats })?.id).toBe('magnetic');
		expect(run.support.magnetic).toBe(1);
		expect(purchase(run, 1, { build, stats })?.id).toBe('magnetic');
		expect(run.support.magnetic).toBe(2);
		expect(run.fish).toBe(460);
		run.support.magnetic = 5;
		expect(supportCandidates(run).map((c) => c.id)).not.toContain('magnetic');
	});
});

describe('healing potion (SDD-014 RF-20)', () => {
	test('heal share by rarity, upgrade rule and level cap', () => {
		expect([1, 2, 3, 4, 5].map((r) => healShare(r as 1))).toEqual([0.25, 0.3, 0.35, 0.4, 0.5]);
		expect(upgradeRarity(1, 3)).toBe(3);
		// Elite drops (II, III) never reach IV; Boss drops (IV, V) keep climbing.
		expect(upgradeRarity(3, 2)).toBe(3);
		expect(upgradeRarity(3, 3)).toBe(3);
		expect(upgradeRarity(2, 2)).toBe(3);
		expect(upgradeRarity(4, 4)).toBe(5);
		expect(upgradeRarity(5, 5)).toBe(5);
		const p = emptyHealPotion();
		for (let i = 1; i <= HEAL_POTION.maxLevel; i++) expect(buyHealPotion(p)).toBe(true);
		expect(buyHealPotion(p)).toBe(false);
		expect(p.level).toBe(10);
		expect(p.charges).toBe(10);
	});

	test('drinks once at 50% HP or less, one at a time with a 2 s cooldown', () => {
		const p = emptyHealPotion();
		buyHealPotion(p);
		buyHealPotion(p);
		expect(tickHealPotion(p, 0.1, 51, 100)).toBe(0);
		expect(tickHealPotion(p, 0.1, 50, 100)).toBe(25);
		expect(p.charges).toBe(1);
		expect(tickHealPotion(p, 1, 20, 100)).toBe(0);
		expect(tickHealPotion(p, 1, 20, 100)).toBe(25);
		expect(tickHealPotion(p, 5, 20, 100)).toBe(0);
		expect(p.charges).toBe(0);
		p.charges = 2;
		expect(tickHealPotion(p, 0.1, 0, 100)).toBe(0);
		p.rarity = 5;
		expect(tickHealPotion(p, 0.1, 10, 200)).toBe(100);
	});

	test('each purchase adds one potion for the rest of the run; every round starts full', () => {
		const run = createRunState(HEROES.jack, { seed: 1 });
		buyHealPotion(run.healPotion);
		buyHealPotion(run.healPotion);
		expect(run.healPotion).toMatchObject({ level: 2, charges: 2 });
		run.healPotion.charges = 0;
		run.shop = {
			offers: [null, null, null, null],
			locks: [false, false, false, false],
			rerolls: 0,
		};
		leaveShop(run);
		expect(run.healPotion.charges).toBe(2);
		// Never more than 10 potions from the merchant.
		const p = emptyHealPotion();
		for (let i = 0; i < 15; i++) buyHealPotion(p);
		expect(p.level).toBe(10);
		refillHealPotion(p);
		expect(p.charges).toBe(10);
	});

	test('drops: only Elites (II, III) and Bosses (IV, V), only if you own one below V', () => {
		const p = emptyHealPotion();
		const rng = new Rng(1);
		expect(rollPotionDrop(rng, 'boss', p)).toBeNull();
		buyHealPotion(p);
		expect(rollPotionDrop(rng, 'common', p)).toBeNull();
		const elite = new Set<number | null>();
		const boss = new Set<number | null>();
		for (let i = 0; i < 300; i++) {
			elite.add(rollPotionDrop(rng, 'elite', p));
			boss.add(rollPotionDrop(rng, 'boss', p));
		}
		expect([...elite].sort()).toEqual([2, 3, null]);
		expect([...boss].sort()).toEqual([4, 5]);
		p.rarity = 5;
		expect(rollPotionDrop(rng, 'boss', p)).toBeNull();
	});

	test('the shop sells it and the panel reports it', () => {
		const run = createRunState(HEROES.jack, { seed: 1 });
		const stats = baseStats(HEROES.jack);
		const build = emptyBuild();
		run.fish = 100;
		run.shop = {
			offers: [
				{ kind: 'healPotion', id: 'healPotion', tier: 1, price: 20 },
				null,
				null,
				null,
			],
			locks: [false, false, false, false],
			rerolls: 0,
		};
		expect(purchase(run, 0, { build, stats })?.kind).toBe('healPotion');
		expect(run.healPotion).toMatchObject({ level: 1, charges: 1, rarity: 1 });
		const panel = buildPlayerPanel({
			build,
			gear: emptyGear(),
			stats,
			round: 1,
			support: run.support,
			healPotion: run.healPotion,
		});
		expect(panel.healPotion).toEqual({
			level: 1,
			maxLevel: 10,
			charges: 1,
			rarity: 1,
			healShare: 0.25,
		});
		expect(panel.support).toEqual([]);
	});

	test('the old heal potions are gone from the gambit stock', () => {
		expect(POTION_TYPES as readonly string[]).not.toContain('heal');
		expect(POTION_TYPES as readonly string[]).not.toContain('megaHeal');
	});
});
