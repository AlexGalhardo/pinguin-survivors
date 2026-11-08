import { describe, expect, test } from 'bun:test';
import { PALETTE, rarityColor } from '../src/config/palette';
import { AFFIXES, affixValue } from '../src/data/affixes';
import { GEAR_BY_ID } from '../src/data/equipment';
import { HEROES } from '../src/data/heroes';
import {
	AFFIX_COUNT,
	LEGACY_GEAR_RARITY,
	RARITIES,
	type Rarity,
	SHOP_MAX_RARITY,
	WEAPON_FUSE_MAX,
	weaponVisualTier,
} from '../src/data/rarity';
import { WEAPON_LINE_BY_ID, type WeaponTier, weaponTierStats } from '../src/data/weapons';
import { growAffixes, rollAffixes } from '../src/logic/affixes';
import { addWeapon, canFuse, emptyBuild, fuse, mergeInto, setBonuses } from '../src/logic/build';
import {
	emptyGear,
	equip,
	itemRoll,
	normalizeGear,
	pickUpGear,
	rollItemDrops,
	unequip,
} from '../src/logic/equipment';
import { emptyHealPotion } from '../src/logic/heal-potion';
import { buildPlayerPanel } from '../src/logic/item-view';
import { Rng } from '../src/logic/rng';
import { createRunState, gearCandidates, purchase, shopPool } from '../src/logic/run-state';
import { rollOffers } from '../src/logic/shop';
import { describeOffer } from '../src/logic/shop-describe';
import { baseStats } from '../src/logic/stats';
import { hudWeapons } from '../src/ui/hud-bridge';

describe('rarity scale', () => {
	test('I to V: white, blue, green, purple, orange, one color source', () => {
		const colors = RARITIES.map((r) => rarityColor(r));
		expect(new Set(colors).size).toBe(5);
		expect(rarityColor(5)).toBe(PALETTE.rarity5);
		expect(AFFIX_COUNT).toEqual({ 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 });
		expect(SHOP_MAX_RARITY).toBe(3);
		expect(WEAPON_FUSE_MAX).toBe(3);
	});

	test('V uses the tier IV art; legacy gear maps to I, II, III', () => {
		const def = WEAPON_LINE_BY_ID.machete;
		expect(weaponVisualTier(5)).toBe(4);
		expect(weaponTierStats(def, 5).damage).toBeGreaterThanOrEqual(
			weaponTierStats(def, 4).damage,
		);
		expect(weaponTierStats(def, 3)).toBe(def.tiers[2]);
		expect(LEGACY_GEAR_RARITY).toEqual({ common: 1, rare: 2, legendary: 3 });
	});
});

describe('affixes', () => {
	test('count follows the rarity, never repeats a stat and respects the scope', () => {
		for (let seed = 0; seed < 200; seed++) {
			const rng = new Rng(seed);
			for (const r of RARITIES) {
				for (const scope of ['weapon', 'gear'] as const) {
					const a = rollAffixes(rng, r, scope, 10);
					expect(a).toHaveLength(AFFIX_COUNT[r]);
					expect(new Set(a.map((x) => x.stat)).size).toBe(a.length);
					for (const x of a)
						expect(AFFIXES.find((d) => d.stat === x.stat)?.scope).toContain(scope);
				}
			}
		}
	});

	test('deterministic by seed; value grows with rarity and round', () => {
		expect(rollAffixes(new Rng(3), 4, 'gear', 8)).toEqual(
			rollAffixes(new Rng(3), 4, 'gear', 8),
		);
		const def = AFFIXES[0] as (typeof AFFIXES)[number];
		expect(affixValue(def, 5, 10)).toBeGreaterThan(affixValue(def, 2, 10));
		expect(affixValue(def, 3, 20)).toBeGreaterThan(affixValue(def, 3, 1));
	});

	test('fusion keeps the affixes and grows to the new count without repeating a stat', () => {
		const kept = rollAffixes(new Rng(1), 2, 'weapon', 5);
		const grown = growAffixes(new Rng(2), kept, 3, 'weapon', 5);
		expect(grown).toHaveLength(2);
		expect(grown[0]).toEqual(kept[0]);
		expect(new Set(grown.map((a) => a.stat)).size).toBe(2);
	});
});

describe('weapons: upgrade only to III, affixes in the build', () => {
	test('fusion stops at III and IV/V cannot fuse', () => {
		const b = emptyBuild();
		addWeapon(b, 'machete', 1);
		addWeapon(b, 'machete', 1);
		expect(fuse(b, 0, 1)).toBe(true);
		expect(b.weapons[0]?.tier).toBe(2);
		addWeapon(b, 'machete', 2);
		expect(fuse(b, 0, 1)).toBe(true);
		expect(b.weapons[0]?.tier).toBe(3);
		addWeapon(b, 'machete', 3);
		expect(canFuse(b, 0, 1)).toBe(false);
		const high = emptyBuild();
		addWeapon(high, 'hammer', 4 as WeaponTier);
		addWeapon(high, 'hammer', 4 as WeaponTier);
		expect(canFuse(high, 0, 1)).toBe(false);
	});

	test('a fused weapon gains affixes up to its rarity and they add to the build modifiers', () => {
		const b = emptyBuild();
		addWeapon(b, 'knives', 2, rollAffixes(new Rng(5), 2, 'weapon', 4));
		addWeapon(b, 'knives', 2, rollAffixes(new Rng(6), 2, 'weapon', 4));
		expect(fuse(b, 0, 1, { rng: new Rng(7), round: 4 })).toBe(true);
		const w = b.weapons[0];
		expect(w?.tier).toBe(3);
		expect(w?.affixes).toHaveLength(2);
		const mods = setBonuses(b);
		for (const a of w?.affixes ?? [])
			expect(mods).toContainEqual({ stat: a.stat, value: a.value });
	});
});

describe('shop shelf: only I to III, weapons, equipment and speed potions', () => {
	test('offers never pass III, carry the affixes of their rarity and sell only haste potions', () => {
		const kinds = new Set<string>();
		for (let seed = 0; seed < 300; seed++) {
			const offers = rollOffers(
				new Rng(seed),
				9,
				{ hero: 'jack', buildSets: [], luck: 5 },
				shopPool('jack', 9),
				[],
			);
			for (const o of offers) {
				kinds.add(o.kind);
				expect(o.tier).toBeLessThanOrEqual(3);
				if (o.kind === 'potion') expect(o.id).toBe('haste');
				else expect(o.affixes?.length ?? 0).toBe(AFFIX_COUNT[o.tier as Rarity]);
			}
		}
		expect(kinds).toEqual(new Set(['weapon', 'gear', 'potion']));
	});

	test('buying carries the rolled affixes to the weapon and the equipment roll', () => {
		const run = createRunState(HEROES.jack, { seed: 1 });
		const build = emptyBuild();
		const stats = baseStats(HEROES.jack);
		const affixes = [{ stat: 'damage' as const, value: 0.05 }];
		run.fish = 500;
		run.shop = {
			offers: [
				{ kind: 'weapon', id: 'machete', tier: 2, price: 20, affixes },
				{ kind: 'gear', id: 'helmet.pot', tier: 1, price: 12 },
				null,
				null,
			],
			locks: [false, false, false, false],
			rerolls: 0,
		};
		purchase(run, 0, { build, stats });
		expect(build.weapons[0]?.affixes).toEqual(affixes);
		purchase(run, 1, { build, stats });
		expect(run.gear && itemRoll(run.gear, 'helmet.pot').rarity).toBe(1);
	});
});

describe('describeOffer', () => {
	const stats = baseStats(HEROES.jack);
	const gear = emptyGear();
	const weaponOffer = (tier: number) => ({
		kind: 'weapon' as const,
		id: 'machete',
		tier,
		price: 20,
		affixes: [{ stat: 'crit' as const, value: 0.02 }],
	});

	test('a weapon goes to the next free slot and mentions the fusion you can do next', () => {
		const build = emptyBuild();
		addWeapon(build, 'machete', 2);
		const d = describeOffer(weaponOffer(2), { build, gear, stats });
		expect(d.outcome).toEqual({ type: 'newWeapon', slot: 1, fusableWith: 0 });
		expect(d.numeral).toBe('II');
		expect(d.weapon?.damage).toBeGreaterThan(0);
		expect(d.statChanges.find((c) => c.stat === 'crit')).toEqual({
			stat: 'crit',
			before: stats.crit,
			after: stats.crit + 0.02,
		});
	});

	test('with the bar full an identical copy fuses II to III; otherwise it is refused', () => {
		const build = emptyBuild();
		for (let i = 0; i < 5; i++) addWeapon(build, 'hammer', 1);
		addWeapon(build, 'machete', 2);
		const fuseD = describeOffer(weaponOffer(2), { build, gear, stats });
		expect(fuseD.outcome).toEqual({ type: 'fuse', slot: 5, fromRarity: 2, toRarity: 3 });
		expect(fuseD.newAffixes).toBe(2);
		expect(describeOffer(weaponOffer(1), { build, gear, stats }).outcome).toEqual({
			type: 'barFull',
		});
	});

	test('equipment is worn at once or goes to the bag when the slot is taken; potions are stock', () => {
		const build = emptyBuild();
		const offer = { kind: 'gear' as const, id: 'helmet.wool', tier: 1, price: 12 };
		const worn = describeOffer(offer, { build, gear, stats });
		expect(worn.outcome).toEqual({ type: 'equip', slot: 'helmet' });
		expect(worn.statChanges).toEqual([
			{ stat: 'maxHp', before: stats.maxHp, after: stats.maxHp + 6 },
		]);
		const taken = emptyGear();
		taken.equipped.helmet = 'helmet.pot';
		expect(describeOffer(offer, { build, gear: taken, stats }).outcome).toEqual({
			type: 'bag',
			slot: 'helmet',
			worn: 'helmet.pot',
		});
		const potion = describeOffer(
			{ kind: 'potion', id: 'haste', tier: 1, price: 25 },
			{ build, gear, stats },
		);
		expect(potion.outcome).toEqual({ type: 'potion', potion: 'haste' });
	});
});

describe('drops: IV from Elites, V from Bosses', () => {
	test('commons never drop; elites give IV; bosses give V', () => {
		const ctx = { round: 12, hero: 'jack' };
		expect(rollItemDrops(new Rng(1), 'common', ctx)).toEqual([]);
		const seen = { elite: new Set<number>(), boss: new Set<number>() };
		for (let seed = 0; seed < 4000; seed++) {
			for (const d of rollItemDrops(new Rng(seed), 'elite', ctx)) seen.elite.add(d.rarity);
			for (const d of rollItemDrops(new Rng(seed), 'boss', ctx)) {
				seen.boss.add(d.rarity);
				expect(d.affixes).toHaveLength(AFFIX_COUNT[d.rarity]);
				if (d.kind === 'weapon')
					expect(WEAPON_LINE_BY_ID[d.id].hero ?? 'jack').toBe('jack');
			}
		}
		expect([...seen.elite]).toEqual([4]);
		expect([...seen.boss]).toEqual([5]);
	});

	test('a gear drop keeps its roll and its affixes act while worn', () => {
		const gear = emptyGear();
		const stats = baseStats(HEROES.jack);
		const armor = stats.armor;
		const hp = stats.maxHp;
		pickUpGear(gear, stats, 'helmet.crown', {
			rarity: 5,
			affixes: [{ stat: 'armor', value: 3 }],
		});
		expect(itemRoll(gear, 'helmet.crown').rarity).toBe(5);
		expect(stats.armor).toBe(armor + 3);
		expect(stats.maxHp).toBe(hp + (GEAR_BY_ID['helmet.crown']?.stats.maxHp ?? 0));
		unequip(gear, stats, 'helmet');
		expect(stats.armor).toBe(armor);
		expect(equip(gear, stats, 'helmet.crown')).toBe(true);
	});
});

describe('save migration of equipment', () => {
	test('old gear (ids only, common / rare / legendary) reads as I / II / III with no affixes', () => {
		const old = normalizeGear({
			bag: ['helmet.pot', 'helmet.miner', 'nope'],
			equipped: { helmet: 'helmet.crown', armor: null, legs: 'helmet.wool' },
		});
		expect(old.bag).toEqual(['helmet.pot', 'helmet.miner']);
		expect(old.equipped.helmet).toBe('helmet.crown');
		expect(old.equipped.legs).toBeNull();
		expect(itemRoll(old, 'helmet.pot')).toEqual({ rarity: 1, affixes: [] });
		expect(itemRoll(old, 'helmet.miner')).toEqual({ rarity: 2, affixes: [] });
		expect(itemRoll(old, 'helmet.crown')).toEqual({ rarity: 3, affixes: [] });
	});

	test('new rolls survive normalization and junk is dropped', () => {
		const raw = {
			bag: ['helmet.crown'],
			equipped: {},
			rolls: {
				'helmet.crown': {
					rarity: 5,
					affixes: [{ stat: 'luck', value: 0.04 }, { junk: 1 }],
				},
				'helmet.pot': { rarity: 9, affixes: [] },
			},
		};
		const out = normalizeGear(JSON.parse(JSON.stringify(raw)));
		expect(out.rolls?.['helmet.crown']).toEqual({
			rarity: 5,
			affixes: [{ stat: 'luck', value: 0.04 }],
		});
		expect(out.rolls?.['helmet.pot']).toBeUndefined();
		expect(normalizeGear(null).bag).toEqual([]);
	});

	test('the shop catalog of gear still maps one-to-one to I to III', () => {
		expect(new Set(gearCandidates().map((g) => g.tier))).toEqual(new Set([1, 2, 3]));
	});
});

describe('scene hooks: merge on buy, player panel, HUD rarity', () => {
	test('merging a bought copy into the owned weapon keeps its affixes and rolls the missing ones', () => {
		const b = emptyBuild();
		const owned = rollAffixes(new Rng(8), 2, 'weapon', 6);
		addWeapon(b, 'knives', 2, owned);
		expect(mergeInto(b, 0, { id: 'knives', tier: 2 }, { rng: new Rng(9), round: 6 })).toBe(
			true,
		);
		expect(b.weapons[0]?.tier).toBe(3);
		expect(b.weapons[0]?.affixes?.[0]).toEqual(owned[0]);
		expect(b.weapons[0]?.affixes).toHaveLength(2);
		expect(mergeInto(b, 0, { id: 'knives', tier: 3 }, { rng: new Rng(1), round: 6 })).toBe(
			false,
		);
		expect(mergeInto(b, 0, { id: 'machete', tier: 3 }, { rng: new Rng(1), round: 6 })).toBe(
			false,
		);
	});

	test('the player panel carries rarity, affixes, stats and equipment for the screens', () => {
		const build = emptyBuild();
		addWeapon(build, 'hammer', 4 as WeaponTier, [{ stat: 'damage', value: 0.05 }]);
		const gear = emptyGear();
		const stats = baseStats(HEROES.jack);
		pickUpGear(gear, stats, 'helmet.crown', {
			rarity: 5,
			affixes: [{ stat: 'luck', value: 0.04 }],
		});
		pickUpGear(gear, stats, 'helmet.wool');
		const panel = buildPlayerPanel({
			build,
			gear,
			stats,
			round: 12,
			support: {},
			healPotion: emptyHealPotion(),
		});
		expect(panel.weapons[0]).toMatchObject({ id: 'hammer', rarity: 4, sets: ['blunt'] });
		expect(panel.weapons[0]?.stats.dps).toBeGreaterThan(0);
		expect(panel.weapons[0]?.sellValue).toBeGreaterThan(0);
		expect(panel.gear.map((g) => g.slot)).toEqual([
			'helmet',
			'armor',
			'legs',
			'ring',
			'amulet',
		]);
		expect(panel.gear[0]?.item).toMatchObject({ id: 'helmet.crown', rarity: 5 });
		expect(panel.gear[0]?.item?.affixes).toEqual([{ stat: 'luck', value: 0.04 }]);
		expect(panel.bag).toEqual([
			expect.objectContaining({ id: 'helmet.wool', rarity: 1, affixes: [] }),
		]);
		expect(panel.stats.find((s) => s.key === 'maxHp')?.value).toBe(stats.maxHp);
		expect(hudWeapons(build)[0]).toMatchObject({ id: 'hammer', tier: 4, rarity: 4 });
	});
});
