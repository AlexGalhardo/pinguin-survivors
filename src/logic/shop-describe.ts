import { GEAR_BY_ID, type GearSlot } from '../data/equipment';
import { RARITY_NUMERALS, type Rarity, WEAPON_FUSE_MAX } from '../data/rarity';
import {
	MAX_WEAPON_SLOTS,
	WEAPON_LINE_BY_ID,
	type WeaponId,
	weaponTierStats,
} from '../data/weapons';
import type { Affix } from './affixes';
import { type Build, setBonuses, upgradeSlot } from './build';
import { itemRoll, type RunGear } from './equipment';
import { type HealPotionState, healShare } from './heal-potion';
import { gearSellValue, type Offer, offerPrice, sellValue } from './shop';
import { addStat, getStat, type PlayerStats, type StatKey } from './stats';
import { isSupportId, type SupportLevels, supportLevel, supportValue } from './support';

/** One stat line of the "before → after" table the shop shows. */
export interface StatChange {
	stat: StatKey;
	before: number;
	after: number;
}

/** What buying an offer does, in terms the UI can spell out (SDD-003 RF-10). */
export type OfferOutcome =
	| {
			type: 'newWeapon';
			slot: number;
			/** Slot of an identical copy you could fuse it with afterwards (rarity → rarity + 1). */
			fusableWith: number | null;
	  }
	| { type: 'fuse'; slot: number; fromRarity: Rarity; toRarity: Rarity }
	/** A better copy of an owned weapon: replaces the one in `slot` (rarity `fromRarity`), sold for `sellFish`. */
	| { type: 'upgradeWeapon'; slot: number; fromRarity: Rarity; sellFish: number }
	| { type: 'barFull' }
	| { type: 'equip'; slot: GearSlot }
	/** The new item is worn at once; the one in the slot is sold for `sellFish`. */
	| { type: 'replace'; slot: GearSlot; worn: string; wornRarity: Rarity; sellFish: number }
	| { type: 'potion'; potion: string }
	/** Support item: level `from` (0 = new) to `to`; `value` is the item number at `to`. */
	| { type: 'support'; id: string; from: number; to: number; value: number }
	/** Healing potion: carried `from` to `to`, healing `healShare` of max HP. */
	| { type: 'healPotion'; from: number; to: number; healShare: number };

export interface OfferDescription {
	kind: Offer['kind'];
	id: string;
	rarity: Rarity;
	/** "I" to "V". */
	numeral: string;
	price: number;
	outcome: OfferOutcome;
	/** Random affixes carried by the item (rolled when the shelf was drawn). */
	affixes: readonly Affix[];
	/** Base stats of an equipment item (before affixes). */
	baseStats: Partial<Record<StatKey, number>>;
	/** Weapon numbers at this rarity (damage, seconds between hits, range). */
	weapon?: { damage: number; cooldown: number; range: number };
	/** On a fuse: how many extra random affixes the result will roll. */
	newAffixes: number;
	/** Player stats before → after the purchase (only the lines that change). */
	statChanges: StatChange[];
}

const sameStats = (a: number, b: number): boolean => Math.abs(a - b) < 1e-9;

/** Modifier list → net change per stat. */
function netChanges(mods: readonly { stat: StatKey; value: number }[]): Map<StatKey, number> {
	const out = new Map<StatKey, number>();
	for (const m of mods) out.set(m.stat, (out.get(m.stat) ?? 0) + m.value);
	return out;
}

function changesFrom(stats: PlayerStats, delta: Map<StatKey, number>): StatChange[] {
	const out: StatChange[] = [];
	for (const [stat, value] of delta) {
		if (sameStats(value, 0)) continue;
		const probe = structuredClone(stats);
		addStat(probe, stat, value);
		out.push({ stat, before: getStat(stats, stat), after: getStat(probe, stat) });
	}
	return out;
}

/**
 * Spells out exactly what buying `offer` does with the current build, gear and stats (pure; `stats`
 * are the hero's current effective stats). Weapons: a new slot (with the fusion you could do next)
 * or, with the bar full, a fusion into the identical copy; equipment: worn at once, selling the
 * item that was in the slot; potions: added to the run stock. Stat changes include the item's
 * affixes and any set bonus the purchase unlocks.
 */
export function describeOffer(
	offer: Offer,
	ctx: {
		build: Build;
		gear: RunGear;
		stats: PlayerStats;
		/** Round of the shop (sale prices grow with it). */
		round?: number;
		support?: SupportLevels;
		healPotion?: HealPotionState;
	},
): OfferDescription {
	const rarity = offer.tier as Rarity;
	const affixes = offer.affixes ?? [];
	const base: OfferDescription = {
		kind: offer.kind,
		id: offer.id,
		rarity,
		numeral: RARITY_NUMERALS[rarity],
		price: offer.price,
		outcome: { type: 'potion', potion: offer.id },
		affixes,
		baseStats: {},
		newAffixes: 0,
		statChanges: [],
	};

	if (offer.kind === 'weapon') {
		const def = WEAPON_LINE_BY_ID[offer.id as WeaponId];
		const t = def ? weaponTierStats(def, rarity) : undefined;
		const weapon = t ? { damage: t.damage, cooldown: t.cooldown, range: t.range } : undefined;
		const { build } = ctx;
		const partner = build.weapons.findIndex(
			(w) => w.id === offer.id && w.tier === rarity && w.tier < WEAPON_FUSE_MAX,
		);
		const up = upgradeSlot(build, offer.id, rarity);
		if (up >= 0) {
			const old = build.weapons[up] as { tier: Rarity };
			return {
				...base,
				...(weapon && { weapon }),
				outcome: {
					type: 'upgradeWeapon',
					slot: up,
					fromRarity: old.tier,
					sellFish: sellValue(offerPrice('weapon', old.tier, ctx.round ?? 0)),
				},
			};
		}
		if (build.weapons.length < MAX_WEAPON_SLOTS) {
			const after = {
				...build,
				weapons: [
					...build.weapons,
					{ id: offer.id as WeaponId, tier: rarity, affixes: [...affixes] },
				],
			};
			const delta = netChanges(setBonuses(after));
			for (const [stat, value] of netChanges(setBonuses(build)))
				delta.set(stat, (delta.get(stat) ?? 0) - value);
			return {
				...base,
				...(weapon && { weapon }),
				outcome: {
					type: 'newWeapon',
					slot: build.weapons.length,
					fusableWith: partner >= 0 ? partner : null,
				},
				statChanges: changesFrom(ctx.stats, delta),
			};
		}
		if (partner >= 0) {
			const toRarity = (rarity + 1) as Rarity;
			const next = def ? weaponTierStats(def, toRarity) : undefined;
			return {
				...base,
				...(weapon && { weapon }),
				...(next && {
					weapon: { damage: next.damage, cooldown: next.cooldown, range: next.range },
				}),
				outcome: { type: 'fuse', slot: partner, fromRarity: rarity, toRarity },
				newAffixes: Math.max(
					0,
					toRarity - 1 - (build.weapons[partner]?.affixes?.length ?? 0),
				),
			};
		}
		return { ...base, ...(weapon && { weapon }), outcome: { type: 'barFull' } };
	}

	if (offer.kind === 'gear') {
		const def = GEAR_BY_ID[offer.id];
		const slot = (def?.slot ?? 'ring') as GearSlot;
		const worn = ctx.gear.equipped[slot];
		const baseStats = def?.stats ?? {};
		const result: OfferDescription = { ...base, baseStats };
		const gained = [
			...Object.entries(baseStats).map(([stat, value]) => ({
				stat: stat as StatKey,
				value: value as number,
			})),
			...affixes,
		];
		const delta = netChanges(gained);
		if (!worn)
			return {
				...result,
				outcome: { type: 'equip', slot },
				statChanges: changesFrom(ctx.stats, delta),
			};
		const wornRoll = itemRoll(ctx.gear, worn);
		for (const [stat, value] of Object.entries(GEAR_BY_ID[worn]?.stats ?? {}))
			delta.set(stat as StatKey, (delta.get(stat as StatKey) ?? 0) - (value as number));
		for (const a of wornRoll.affixes) delta.set(a.stat, (delta.get(a.stat) ?? 0) - a.value);
		return {
			...result,
			outcome: {
				type: 'replace',
				slot,
				worn,
				wornRarity: wornRoll.rarity,
				sellFish: gearSellValue(wornRoll.rarity, ctx.round ?? 0),
			},
			statChanges: changesFrom(ctx.stats, delta),
		};
	}

	if (offer.kind === 'support' && isSupportId(offer.id)) {
		const from = supportLevel(ctx.support ?? {}, offer.id);
		const to = from + 1;
		return {
			...base,
			outcome: { type: 'support', id: offer.id, from, to, value: supportValue(offer.id, to) },
		};
	}

	if (offer.kind === 'healPotion') {
		const p = ctx.healPotion;
		return {
			...base,
			outcome: {
				type: 'healPotion',
				from: p?.level ?? 0,
				to: (p?.level ?? 0) + 1,
				healShare: healShare(p?.rarity ?? 1),
			},
		};
	}

	return base;
}

/** Rarity numeral of an owned equipment item, for the equipped slots. */
export const ownedRarity = (gear: RunGear, id: string): Rarity => itemRoll(gear, id).rarity;
