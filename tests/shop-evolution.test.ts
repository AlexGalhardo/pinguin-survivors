import { describe, expect, test } from 'bun:test';
import { HEROES } from '../src/data/heroes';
import { HEAL_POTION } from '../src/data/potions';
import { MAX_WEAPON_SLOTS, WEAPON_LINES } from '../src/data/weapons';
import { addWeapon, emptyBuild, upgradeSlot } from '../src/logic/build';
import { emptyGear, pickUpGear } from '../src/logic/equipment';
import { buyHealPotion } from '../src/logic/heal-potion';
import {
	buyExtraHealPotion,
	createRunState,
	extraHealPotionPrice,
	purchase,
	shopPool,
} from '../src/logic/run-state';
import { buy, offerPrice, type ShopState, sellValue } from '../src/logic/shop';
import { baseStats } from '../src/logic/stats';

const shopWith = (offer: ShopState['offers'][number]): ShopState => ({
	offers: [offer, null, null, null],
	locks: [false, false, false, false],
	rerolls: 0,
});

describe('evolution shop (ADR-021, SDD-003 RF-14..RF-16)', () => {
	test('offers new weapons only with a free slot and owned ones only above the best copy', () => {
		const run = createRunState(HEROES.jack, { seed: 1 });
		const build = emptyBuild();
		addWeapon(build, 'machete', 2);
		addWeapon(build, 'machete', 3);
		const pool = shopPool('jack', 8, run, build).filter((c) => c.kind === 'weapon');
		expect(pool.filter((c) => c.id === 'machete').map((c) => c.tier)).toEqual([4, 5]);
		expect(pool.some((c) => c.id !== 'machete' && c.tier === 1)).toBe(true);
		const ids = WEAPON_LINES.filter((w) => !w.hero || w.hero === 'jack').map((w) => w.id);
		while (build.weapons.length < MAX_WEAPON_SLOTS) addWeapon(build, 'machete', 1);
		const full = shopPool('jack', 8, run, build).filter((c) => c.kind === 'weapon');
		expect(new Set(full.map((c) => c.id))).toEqual(new Set(['machete']));
		expect(ids.length).toBeGreaterThan(1);
	});

	test('offers gear for empty slots in any rarity and above the worn rarity otherwise', () => {
		const run = createRunState(HEROES.jack, { seed: 1 });
		run.gear = emptyGear();
		const build = emptyBuild();
		const helmets = () =>
			shopPool('jack', 8, run, build).filter(
				(c) => c.kind === 'gear' && c.id.startsWith('helmet.'),
			);
		expect(Math.min(...helmets().map((c) => c.tier))).toBe(1);
		pickUpGear(run.gear, baseStats(HEROES.jack), 'helmet.wool', { rarity: 3, affixes: [] });
		expect(helmets().length).toBeGreaterThan(0);
		for (const c of helmets()) expect(c.tier).toBeGreaterThan(3);
	});

	test('buying a better copy replaces the weakest one in its slot and sells it', () => {
		const run = createRunState(HEROES.jack, { seed: 1 });
		const build = emptyBuild();
		while (build.weapons.length < MAX_WEAPON_SLOTS) addWeapon(build, 'machete', 1);
		build.weapons[2] = { id: 'machete', tier: 2 };
		expect(upgradeSlot(build, 'machete', 3)).toBe(0);
		run.fish = 200;
		run.shop = shopWith({ kind: 'weapon', id: 'machete', tier: 3, price: 50 });
		expect(purchase(run, 0, { build, stats: baseStats(HEROES.jack) })?.tier).toBe(3);
		expect(build.weapons).toHaveLength(MAX_WEAPON_SLOTS);
		expect(build.weapons[0]?.tier).toBe(3);
		expect(run.fish).toBe(150 + sellValue(offerPrice('weapon', 1, run.round)));
	});

	test('rarity IV needs an Elite Mark and V a Boss Core, spent on purchase', () => {
		const materials = { elite: 0, boss: 1 };
		const iv = shopWith({
			kind: 'gear',
			id: 'helmet.wool',
			tier: 4,
			price: 10,
			material: 'elite',
		});
		expect(buy(iv, 100, 0, materials)).toBeNull();
		materials.elite = 1;
		expect(buy(iv, 100, 0, materials)?.fish).toBe(90);
		expect(materials).toEqual({ elite: 0, boss: 1 });
		const v = shopWith({
			kind: 'gear',
			id: 'helmet.wool',
			tier: 5,
			price: 10,
			material: 'boss',
		});
		expect(buy(v, 100, 0, materials)).not.toBeNull();
		expect(materials.boss).toBe(0);
	});

	test('the healing potion card shows until bought, then the fixed +1 button up to 10', () => {
		const run = createRunState(HEROES.jack, { seed: 1 });
		const build = emptyBuild();
		const potionCard = () =>
			shopPool('jack', 3, run, build).some((c) => c.kind === 'healPotion');
		expect(potionCard()).toBe(true);
		expect(extraHealPotionPrice(run)).toBeNull();
		buyHealPotion(run.healPotion);
		expect(potionCard()).toBe(false);
		run.fish = 0;
		expect(buyExtraHealPotion(run)).toBe(false);
		run.fish = 10_000;
		while (buyExtraHealPotion(run));
		expect(run.healPotion.level).toBe(HEAL_POTION.maxLevel);
		expect(extraHealPotionPrice(run)).toBeNull();
	});
});
