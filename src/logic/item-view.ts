import { GEAR_BY_ID, GEAR_SLOTS, type GearSlot } from '../data/equipment';
import type { Rarity } from '../data/rarity';
import {
	WEAPON_LINE_BY_ID,
	type WeaponId,
	type WeaponTier,
	weaponTierStats,
} from '../data/weapons';
import type { Affix } from './affixes';
import type { Build } from './build';
import { itemRoll, type RunGear } from './equipment';
import { offerPrice, sellValue } from './shop';
import { getStat, type PlayerStats, type StatKey } from './stats';

/**
 * Plain data for the item screens (shop, pause, HUD): everything a screen needs to show weapons and
 * equipment with their rarity, affixes and numbers, without reaching into the game (ADR-017).
 */
export type AffixView = Affix;

export interface WeaponStatsView {
	damage: number;
	/** Seconds between hits. */
	cooldown: number;
	range: number;
	/** `damage / cooldown`, a quick strength number. */
	dps: number;
}

export interface WeaponSlotView {
	slot: number;
	id: WeaponId;
	rarity: Rarity;
	affixes: AffixView[];
	stats: WeaponStatsView;
	sets: readonly string[];
	/** Fish for selling this weapon. */
	sellValue: number;
}

export interface GearItemView {
	id: string;
	rarity: Rarity;
	affixes: AffixView[];
	/** Stats of the catalog item, before the affixes. */
	baseStats: Partial<Record<StatKey, number>>;
}

export interface GearSlotView {
	slot: GearSlot;
	item: GearItemView | null;
}

export interface PlayerPanelView {
	/** Current hero stats (after cards, gear, affixes and set bonuses), in display order. */
	stats: { key: StatKey; value: number }[];
	weapons: WeaponSlotView[];
	/** The five equipment slots in order: helmet, armor, legs, ring, amulet. */
	gear: GearSlotView[];
	/** Equipment in the bag (not worn). */
	bag: GearItemView[];
}

export const PLAYER_PANEL_STATS: readonly StatKey[] = [
	'maxHp',
	'regen',
	'armor',
	'dodge',
	'parry',
	'crit',
	'critDamage',
	'damage',
	'attackSpeed',
	'moveSpeed',
	'area',
	'luck',
];

export function weaponStatsView(id: WeaponId, tier: WeaponTier): WeaponStatsView {
	const t = weaponTierStats(WEAPON_LINE_BY_ID[id], tier);
	return { damage: t.damage, cooldown: t.cooldown, range: t.range, dps: t.damage / t.cooldown };
}

export function gearItemView(gear: RunGear, id: string): GearItemView {
	const roll = itemRoll(gear, id);
	return {
		id,
		rarity: roll.rarity,
		affixes: roll.affixes,
		baseStats: GEAR_BY_ID[id]?.stats ?? {},
	};
}

/** Everything the player panel of the shop and the pause screen shows. */
export function buildPlayerPanel(ctx: {
	build: Build;
	gear: RunGear;
	stats: PlayerStats;
	round: number;
}): PlayerPanelView {
	const { build, gear, stats, round } = ctx;
	return {
		stats: PLAYER_PANEL_STATS.map((key) => ({ key, value: getStat(stats, key) })),
		weapons: build.weapons.map((w, slot) => ({
			slot,
			id: w.id,
			rarity: w.tier,
			affixes: w.affixes ?? [],
			stats: weaponStatsView(w.id, w.tier),
			sets: WEAPON_LINE_BY_ID[w.id].sets,
			sellValue: sellValue(offerPrice('weapon', w.tier, round)),
		})),
		gear: GEAR_SLOTS.map((slot) => {
			const id = gear.equipped[slot];
			return { slot, item: id ? gearItemView(gear, id) : null };
		}),
		bag: gear.bag.map((id) => gearItemView(gear, id)),
	};
}
