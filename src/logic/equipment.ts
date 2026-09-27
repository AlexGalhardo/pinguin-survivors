import {
	DROPS,
	GEAR,
	GEAR_BY_ID,
	GEAR_SLOTS,
	type GearDef,
	type GearRarity,
	type GearSlot,
} from '../data/equipment';
import type { Rng } from './rng';
import { addStat, type PlayerStats, type StatKey } from './stats';

export type KillKind = 'common' | 'elite' | 'boss';

/** Gear found this run: the bag plus what is worn in each slot (ids from GEAR). */
export interface RunGear {
	bag: string[];
	equipped: Record<GearSlot, string | null>;
}

export function emptyGear(): RunGear {
	return {
		bag: [],
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

function applyStats(stats: PlayerStats, def: GearDef, sign: 1 | -1): void {
	for (const [key, value] of Object.entries(def.stats))
		addStat(stats, key as StatKey, sign * (value as number));
}

/**
 * Wears `id` from the bag; whatever was in that slot goes back to the bag. Stats are updated in
 * place. Returns false for unknown ids or items not in the bag.
 */
export function equip(gear: RunGear, stats: PlayerStats, id: string): boolean {
	const def = GEAR_BY_ID[id];
	const i = gear.bag.indexOf(id);
	if (!def || i < 0) return false;
	gear.bag.splice(i, 1);
	const old = gear.equipped[def.slot];
	if (old) unequipTo(gear, stats, def.slot);
	gear.equipped[def.slot] = id;
	applyStats(stats, def, 1);
	return true;
}

/** Takes off what is worn in `slot` and puts it in the bag. */
export function unequip(gear: RunGear, stats: PlayerStats, slot: GearSlot): boolean {
	return unequipTo(gear, stats, slot);
}

function unequipTo(gear: RunGear, stats: PlayerStats, slot: GearSlot): boolean {
	const id = gear.equipped[slot];
	const def = id ? GEAR_BY_ID[id] : undefined;
	if (!id || !def) return false;
	applyStats(stats, def, -1);
	gear.equipped[slot] = null;
	gear.bag.push(id);
	return true;
}

/** Picked up from the ground: goes to the bag and is worn right away when the slot is free. */
export function pickUpGear(gear: RunGear, stats: PlayerStats, id: string): 'equipped' | 'bag' {
	const def = GEAR_BY_ID[id];
	gear.bag.push(id);
	if (def && !gear.equipped[def.slot]) {
		equip(gear, stats, id);
		return 'equipped';
	}
	return 'bag';
}
