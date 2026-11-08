import { type CardDef, RARITY_MUL, type Rarity } from '../data/cards';
import { WEAPON_FUSE_MAX } from '../data/rarity';
import {
	MAX_LEVEL,
	MAX_SECONDARY_SLOTS,
	PERKS,
	type PerkId,
	type SecondaryId,
} from '../data/secondaries';
import { SET_BONUSES, SET_IDS, SET_THRESHOLDS, type SetId, type SetModifier } from '../data/sets';
import {
	MAX_WEAPON_SLOTS,
	WEAPON_LINE_BY_ID,
	type WeaponId,
	type WeaponTier,
} from '../data/weapons';
import { type Affix, growAffixes } from './affixes';
import type { Rng } from './rng';
import { addStat, type PlayerStats } from './stats';

/** One weapon slot (SDD-002 RF-01). */
export interface WeaponInstance {
	id: WeaponId;
	/** Rarity I–V (ADR-017). */
	tier: WeaponTier;
	/** Random affixes rolled for this copy: stat bonuses while it is in the build. */
	affixes?: Affix[];
}

/** What the hero picked this run (serialized in the run snapshot). */
export interface Build {
	tier: 1 | 2 | 3;
	secondaries: Partial<Record<SecondaryId, number>>;
	perks: Partial<Record<PerkId, number>>;
	cards: string[];
	/** 1.0 weapon slots; coexists with `secondaries` until T2.3 removes them. */
	weapons: WeaponInstance[];
}

export function emptyBuild(tier: 1 | 2 | 3 = 1): Build {
	return { tier, secondaries: {}, perks: {}, cards: [], weapons: [] };
}

export function slotsUsed(build: Build): number {
	return Object.keys(build.secondaries).length;
}

/** Whether a card can be offered to this build (levels and slots). */
export function canTake(build: Build, card: CardDef): boolean {
	const e = card.effect;
	switch (e.type) {
		case 'stat':
			return true;
		case 'secondary': {
			const lv = build.secondaries[e.weapon];
			return lv !== undefined ? lv < MAX_LEVEL : slotsUsed(build) < MAX_SECONDARY_SLOTS;
		}
		case 'perk':
			return (build.perks[e.perk] ?? 0) < MAX_LEVEL;
	}
}

export interface ApplyResult {
	/** Max HP gained (the caller heals the same amount). */
	maxHpDelta: number;
	exclusive: boolean;
}

export function applyCard(
	build: Build,
	stats: PlayerStats,
	card: CardDef,
	rarity: Rarity,
): ApplyResult {
	build.cards.push(card.id);
	const result: ApplyResult = { maxHpDelta: 0, exclusive: card.kind === 'exclusive' };
	const e = card.effect;
	switch (e.type) {
		case 'stat': {
			const value = e.value * RARITY_MUL[rarity];
			addStat(stats, e.stat, value);
			if (e.stat === 'maxHp') result.maxHpDelta = value;
			break;
		}
		case 'secondary':
			build.secondaries[e.weapon] = (build.secondaries[e.weapon] ?? 0) + 1;
			break;
		case 'perk':
			build.perks[e.perk] = (build.perks[e.perk] ?? 0) + 1;
			// Iron Skin is a flat armor bonus per level; other perks are read by the systems.
			if (e.perk === 'ironSkin') addStat(stats, 'armor', PERKS.ironSkin.value);
			break;
	}
	return result;
}

/** Adds a weapon to a free slot; false (and no change) when all slots are taken. */
export function addWeapon(
	build: Build,
	id: WeaponId,
	tier: WeaponTier = 1,
	affixes: readonly Affix[] = [],
): boolean {
	if (build.weapons.length >= MAX_WEAPON_SLOTS) return false;
	build.weapons.push(affixes.length > 0 ? { id, tier, affixes: [...affixes] } : { id, tier });
	return true;
}

/** Slots `a` and `b` (indices into `build.weapons`) can fuse: same id and tier, tier < III (ADR-017). */
export function canFuse(build: Build, a: number, b: number): boolean {
	const wa = build.weapons[a];
	const wb = build.weapons[b];
	return (
		!!wa &&
		!!wb &&
		a !== b &&
		wa.id === wb.id &&
		wa.tier === wb.tier &&
		wa.tier < WEAPON_FUSE_MAX
	);
}

/**
 * Merges two slots into one weapon a rarity higher (kept in the lower slot). The result keeps the
 * kept copy's affixes and, with `roll`, gains new ones up to the new rarity's count.
 */
export function fuse(
	build: Build,
	a: number,
	b: number,
	roll?: { rng: Rng; round: number },
): boolean {
	if (!canFuse(build, a, b)) return false;
	const keep = Math.min(a, b);
	const w = build.weapons[keep] as WeaponInstance;
	const tier = (w.tier + 1) as WeaponTier;
	const kept = w.affixes ?? [];
	const affixes = roll ? growAffixes(roll.rng, kept, tier, 'weapon', roll.round) : kept;
	build.weapons[keep] =
		affixes.length > 0 ? { id: w.id, tier, affixes: [...affixes] } : { id: w.id, tier };
	build.weapons.splice(Math.max(a, b), 1);
	return true;
}

/**
 * Merges a bought copy straight into the weapon owned in `slot` (bar full): one rarity higher, the
 * owned affixes kept and the missing ones rolled, the same rule as `fuse`.
 */
export function mergeInto(
	build: Build,
	slot: number,
	copy: { id: WeaponId; tier: WeaponTier },
	roll: { rng: Rng; round: number },
): boolean {
	const w = build.weapons[slot];
	if (!w || w.id !== copy.id || w.tier !== copy.tier || w.tier >= WEAPON_FUSE_MAX) return false;
	const tier = (w.tier + 1) as WeaponTier;
	const affixes = growAffixes(roll.rng, w.affixes ?? [], tier, 'weapon', roll.round);
	build.weapons[slot] = affixes.length > 0 ? { id: w.id, tier, affixes } : { id: w.id, tier };
	return true;
}

export function setCounts(build: Build): Partial<Record<SetId, number>> {
	const counts: Partial<Record<SetId, number>> = {};
	for (const w of build.weapons)
		for (const set of WEAPON_LINE_BY_ID[w.id].sets) counts[set] = (counts[set] ?? 0) + 1;
	return counts;
}

/**
 * Modifiers the build adds to the hero: the highest set step reached per set (none below 2
 * weapons) plus the affixes of every weapon in the bar.
 */
export function setBonuses(build: Build): SetModifier[] {
	const counts = setCounts(build);
	const mods: SetModifier[] = [];
	for (const w of build.weapons)
		for (const a of w.affixes ?? []) mods.push({ stat: a.stat, value: a.value });
	for (const set of SET_IDS) {
		const n = counts[set] ?? 0;
		const step = SET_THRESHOLDS.filter((t) => n >= t).length - 1;
		if (step >= 0) mods.push(...SET_BONUSES[set][step as 0 | 1 | 2]);
	}
	return mods;
}
