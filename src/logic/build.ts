import { type CardDef, RARITY_MUL, type Rarity } from '../data/cards';
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
} from '../data/weapon-lines';
import { addStat, type PlayerStats } from './stats';

/** One weapon slot (SDD-002 RF-01). */
export interface WeaponInstance {
	id: WeaponId;
	tier: WeaponTier;
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
		case 'evolve':
			return build.tier === e.tier - 1;
	}
}

export interface ApplyResult {
	/** Max HP gained (the caller heals the same amount). */
	maxHpDelta: number;
	evolvedTo?: 2 | 3;
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
		case 'evolve':
			build.tier = e.tier;
			result.evolvedTo = e.tier;
			break;
	}
	return result;
}

/** Adds a weapon to a free slot; false (and no change) when all slots are taken. */
export function addWeapon(build: Build, id: WeaponId, tier: WeaponTier = 1): boolean {
	if (build.weapons.length >= MAX_WEAPON_SLOTS) return false;
	build.weapons.push({ id, tier });
	return true;
}

/** Slots `a` and `b` (indices into `build.weapons`) can fuse: same id and tier, tier < 4. */
export function canFuse(build: Build, a: number, b: number): boolean {
	const wa = build.weapons[a];
	const wb = build.weapons[b];
	return !!wa && !!wb && a !== b && wa.id === wb.id && wa.tier === wb.tier && wa.tier < 4;
}

/** Merges two slots into one weapon a tier higher (kept in the lower slot). */
export function fuse(build: Build, a: number, b: number): boolean {
	if (!canFuse(build, a, b)) return false;
	const keep = Math.min(a, b);
	const w = build.weapons[keep] as WeaponInstance;
	build.weapons[keep] = { id: w.id, tier: (w.tier + 1) as WeaponTier };
	build.weapons.splice(Math.max(a, b), 1);
	return true;
}

export function setCounts(build: Build): Partial<Record<SetId, number>> {
	const counts: Partial<Record<SetId, number>> = {};
	for (const w of build.weapons)
		for (const set of WEAPON_LINE_BY_ID[w.id].sets) counts[set] = (counts[set] ?? 0) + 1;
	return counts;
}

/** Modifiers from the highest step reached per set (none below 2 weapons). */
export function setBonuses(build: Build): SetModifier[] {
	const counts = setCounts(build);
	const mods: SetModifier[] = [];
	for (const set of SET_IDS) {
		const n = counts[set] ?? 0;
		const step = SET_THRESHOLDS.filter((t) => n >= t).length - 1;
		if (step >= 0) mods.push(...SET_BONUSES[set][step as 0 | 1 | 2]);
	}
	return mods;
}
