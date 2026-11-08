import { GEAR_BY_ID, type GearSlot } from '../data/equipment';
import { RARITY_NUMERALS, type Rarity, WEAPON_FUSE_MAX } from '../data/rarity';
import {
	MAX_WEAPON_SLOTS,
	WEAPON_LINE_BY_ID,
	type WeaponId,
	weaponTierStats,
} from '../data/weapons';
import type { Affix } from './affixes';
import { type Build, setBonuses } from './build';
import { itemRoll, type RunGear } from './equipment';
import type { Offer } from './shop';
import { addStat, getStat, type PlayerStats, type StatKey } from './stats';

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
	| { type: 'barFull' }
	| { type: 'equip'; slot: GearSlot }
	| { type: 'bag'; slot: GearSlot; worn: string }
	| { type: 'potion'; potion: string };

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
 * or, with the bar full, a fusion into the identical copy; equipment: worn at once or sent to the
 * bag when the slot is taken; potions: added to the run stock. Stat changes include the item's
 * affixes and any set bonus the purchase unlocks.
 */
export function describeOffer(
	offer: Offer,
	ctx: { build: Build; gear: RunGear; stats: PlayerStats },
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
		if (worn) return { ...result, outcome: { type: 'bag', slot, worn } };
		const delta = netChanges([
			...Object.entries(baseStats).map(([stat, value]) => ({
				stat: stat as StatKey,
				value: value as number,
			})),
			...affixes,
		]);
		return {
			...result,
			outcome: { type: 'equip', slot },
			statChanges: changesFrom(ctx.stats, delta),
		};
	}

	return base;
}

/** Rarity numeral of an owned equipment item, for the bag and the equipped slots. */
export const ownedRarity = (gear: RunGear, id: string): Rarity => itemRoll(gear, id).rarity;
