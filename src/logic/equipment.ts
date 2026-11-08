import {
	DROPS,
	GEAR,
	GEAR_BY_ID,
	GEAR_SLOTS,
	type GearDef,
	type GearRarity,
	type GearSlot,
} from '../data/equipment';
import { DROP_RARITY, isRarity, LEGACY_GEAR_RARITY, type Rarity } from '../data/rarity';
import { WEAPON_LINES, type WeaponId } from '../data/weapons';
import { type Affix, applyAffixes, parseAffixes, rollAffixes } from './affixes';
import type { Rng } from './rng';
import { addStat, type PlayerStats, type StatKey } from './stats';

export type KillKind = 'common' | 'elite' | 'boss';

/** Gear of this run: what is worn in each slot (ids from GEAR). There is no bag (SDD-014 RF-30). */
export interface RunGear {
	equipped: Record<GearSlot, string | null>;
	/**
	 * Rarity and affixes rolled for an item id (ADR-017). Items without a roll (drops from before
	 * the rarity scale) count as their catalog rarity with no affixes. One roll per id: picking up a
	 * second copy keeps the better one.
	 */
	rolls?: Record<string, ItemRoll>;
}

export interface ItemRoll {
	rarity: Rarity;
	affixes: Affix[];
}

/** Rarity I–V of an owned item: its roll, or the catalog rarity mapped to the new scale. */
export function itemRoll(gear: RunGear, id: string): ItemRoll {
	const roll = gear.rolls?.[id];
	if (roll) return roll;
	const def = GEAR_BY_ID[id];
	return { rarity: def ? LEGACY_GEAR_RARITY[def.rarity] : 1, affixes: [] };
}

export function emptyGear(): RunGear {
	return {
		equipped: Object.fromEntries(GEAR_SLOTS.map((s) => [s, null])) as Record<
			GearSlot,
			string | null
		>,
	};
}

/** Rarity dropped by an enemy kind: commons → common, elites → rare, bosses → legendary. */
export function gearRarityFor(kind: KillKind): GearRarity {
	return kind === 'boss' ? 'legendary' : kind === 'elite' ? 'rare' : 'common';
}

/** Gear item dropped by a kill, or null. */
export function rollGearDrop(rng: Rng, kind: KillKind): GearDef | null {
	const d = DROPS.gear;
	const chance =
		kind === 'boss' ? d.bossChance : kind === 'elite' ? d.eliteChance : d.commonChance;
	if (rng.next() >= chance) return null;
	const rarity = gearRarityFor(kind);
	return rng.pick(GEAR.filter((it) => it.rarity === rarity));
}

/** Share of max HP healed by a dropped health pack, or 0 for no drop. */
export function rollHealDrop(rng: Rng, kind: KillKind): number {
	const h = DROPS.heal;
	const chance =
		kind === 'boss' ? h.bossChance : kind === 'elite' ? h.eliteChance : h.commonChance;
	if (rng.next() >= chance) return 0;
	return h.tiers[rng.weightedIndex(h.tiers.map((t) => t.weight))]?.heal ?? 0;
}

function applyStats(stats: PlayerStats, gear: RunGear, id: string, sign: 1 | -1): void {
	const def = GEAR_BY_ID[id];
	if (!def) return;
	for (const [key, value] of Object.entries(def.stats))
		addStat(stats, key as StatKey, sign * (value as number));
	applyAffixes(stats, itemRoll(gear, id).affixes, sign);
}

/** What left the build when equipment came in: the replaced item, or the new one when it was rejected. */
export interface GearSale {
	id: string;
	rarity: Rarity;
}

export interface PickUp {
	result: 'equipped' | 'rejected';
	/** The item to sell for Fish (`gearSellValue`), or null when the slot was free. */
	sold: GearSale | null;
}

/**
 * Wears `id` at once in its slot; the item that was there leaves the run and is sold by the caller
 * (`sold`). Stats are updated in place. With `keepBetter` (ground drops) a worn item of higher
 * rarity stays and the newcomer is the one sold (`rejected`). Unknown ids are rejected unsold.
 */
export function pickUpGear(
	gear: RunGear,
	stats: PlayerStats,
	id: string,
	roll?: ItemRoll,
	opts: { keepBetter?: boolean } = {},
): PickUp {
	const def = GEAR_BY_ID[id];
	if (!def) return { result: 'rejected', sold: null };
	const incoming = roll ?? { rarity: LEGACY_GEAR_RARITY[def.rarity], affixes: [] };
	const old = gear.equipped[def.slot];
	let sold: GearSale | null = null;
	if (old) {
		const oldRarity = itemRoll(gear, old).rarity;
		if (opts.keepBetter && oldRarity > incoming.rarity)
			return { result: 'rejected', sold: { id, rarity: incoming.rarity } };
		applyStats(stats, gear, old, -1);
		if (gear.rolls) delete gear.rolls[old];
		sold = { id: old, rarity: oldRarity };
	}
	if (roll) gear.rolls = { ...gear.rolls, [id]: roll };
	gear.equipped[def.slot] = id;
	applyStats(stats, gear, id, 1);
	return { result: 'equipped', sold };
}

/** A rarity IV or V drop (ADR-017): a weapon or an equipment item with its rolled affixes. */
export type ItemDrop =
	| { kind: 'weapon'; id: WeaponId; rarity: Rarity; affixes: Affix[] }
	| { kind: 'gear'; id: string; rarity: Rarity; affixes: Affix[] };

/**
 * Elite and Boss drops: IV from an Elite, V from a Boss, each kind of item with its own chance
 * (`DROPS.item`); a kill can drop both a weapon and an equipment item. Commons never drop these.
 * Weapons exclusive to another hero are not offered.
 */
export function rollItemDrops(
	rng: Rng,
	kind: KillKind,
	ctx: { round: number; hero: string },
): ItemDrop[] {
	if (kind === 'common') return [];
	const cfg = kind === 'boss' ? DROPS.item.boss : DROPS.item.elite;
	const rarity: Rarity = kind === 'boss' ? DROP_RARITY.boss : DROP_RARITY.elite;
	const out: ItemDrop[] = [];
	if (rng.next() < cfg.weaponChance) {
		const def = rng.pick(WEAPON_LINES.filter((w) => !w.hero || w.hero === ctx.hero));
		out.push({
			kind: 'weapon',
			id: def.id as WeaponId,
			rarity,
			affixes: rollAffixes(rng, rarity, 'weapon', ctx.round),
		});
	}
	if (rng.next() < cfg.gearChance) {
		const base = rng.pick(GEAR.filter((it) => it.rarity === 'legendary'));
		out.push({
			kind: 'gear',
			id: base.id,
			rarity,
			affixes: rollAffixes(rng, rarity, 'gear', ctx.round),
		});
	}
	return out;
}

/**
 * Reads a `RunGear` from a snapshot, including the old format (ids only, `common` / `rare` /
 * `legendary` items): unknown ids are dropped and rolls are validated. Old items keep no roll, so
 * they read as I / II / III with no affixes through `itemRoll`.
 */
export function normalizeGear(raw: unknown): RunGear {
	const out = emptyGear();
	if (typeof raw !== 'object' || raw === null) return out;
	const r = raw as { equipped?: unknown; rolls?: unknown };
	const known = (v: unknown): v is string => typeof v === 'string' && v in GEAR_BY_ID;
	if (typeof r.equipped === 'object' && r.equipped !== null) {
		for (const slot of GEAR_SLOTS) {
			const id = (r.equipped as Record<string, unknown>)[slot];
			if (known(id) && GEAR_BY_ID[id]?.slot === slot) out.equipped[slot] = id;
		}
	}
	if (typeof r.rolls === 'object' && r.rolls !== null) {
		const rolls: Record<string, ItemRoll> = {};
		for (const [id, v] of Object.entries(r.rolls)) {
			const roll = v as { rarity?: unknown; affixes?: unknown };
			if (known(id) && isRarity(roll.rarity))
				rolls[id] = { rarity: roll.rarity, affixes: parseAffixes(roll.affixes) };
		}
		if (Object.keys(rolls).length > 0) out.rolls = rolls;
	}
	return out;
}
