import { HERO_IDS, type HeroId } from '../config/constants';
import type { PlatformTier } from '../core/platform/types';
import { ARENA } from '../data/arena';
import { DIFFICULTY_LEVELS, type Difficulty } from '../data/difficulty';
import {
	MAX_WEAPON_SLOTS,
	WEAPON_LINE_BY_ID,
	type WeaponId,
	type WeaponTier,
} from '../data/weapons';
import type { WeaponInstance } from '../logic/build';

/** Debug/test options from the URL, e.g. ?skipMenu=1&hero=bob&round=10&seed=1&debug=1&god=1&tier=2&difficulty=5&arena=40&weapon=hammer */
export interface DebugParams {
	seed?: number;
	hero?: HeroId;
	round?: number;
	/** Hero art tier 1-3 (`?tier=2`). */
	tier?: 1 | 2 | 3;
	/** Effects tier for QA (`?tier=low|mid|high`, SDD-007); the numeric form is the hero art tier. */
	fxTier?: PlatformTier;
	/** Difficulty 0-2 of the run (ADR-025). */
	difficulty?: Difficulty;
	/** Starting weapon (QA); `weapons` forces the whole bar. */
	weapon?: WeaponId;
	/** Hero class id (QA, `?class=jack.berserker`); ignored when the hero level does not allow it. */
	heroClass?: string;
	/** Forces the arena side in tiles (QA). */
	arena?: number;
	/** Forces the run's weapons (QA): `?weapons=machete:2,knives`, up to 6 slots. */
	weapons?: WeaponInstance[];
	god: boolean;
	debug: boolean;
	skipMenu: boolean;
}

const PLATFORM_TIERS: readonly PlatformTier[] = ['low', 'mid', 'high'];

function flag(value: string | null): boolean {
	return value === '1' || value === 'true';
}

function nonNegativeInt(value: string | null): number | undefined {
	if (value === null || value === '') return undefined;
	const n = Number(value);
	return Number.isInteger(n) && n >= 0 ? n : undefined;
}

function weaponList(value: string | null): WeaponInstance[] | undefined {
	if (!value) return undefined;
	const out: WeaponInstance[] = [];
	for (const part of value.split(',')) {
		const [id, tier] = part.split(':');
		const t = tier === undefined ? 1 : Number(tier);
		if (!id || !(id in WEAPON_LINE_BY_ID) || ![1, 2, 3, 4].includes(t)) continue;
		out.push({ id: id as WeaponId, tier: t as WeaponTier });
	}
	return out.length > 0 ? out.slice(0, MAX_WEAPON_SLOTS) : undefined;
}

export function parseDebugParams(search: string): DebugParams {
	const p = new URLSearchParams(search);
	const hero = p.get('hero');
	const round = nonNegativeInt(p.get('round'));
	const tier = nonNegativeInt(p.get('tier'));
	const difficulty = nonNegativeInt(p.get('difficulty'));
	const weapon = p.get('weapon');
	const arena = nonNegativeInt(p.get('arena'));
	return {
		seed: nonNegativeInt(p.get('seed')),
		hero: HERO_IDS.find((h) => h === hero),
		round: round !== undefined && round >= 1 ? round : undefined,
		fxTier: PLATFORM_TIERS.find((x) => x === p.get('tier')),
		tier: tier === 1 || tier === 2 || tier === 3 ? tier : undefined,
		difficulty: DIFFICULTY_LEVELS.find((d) => d === difficulty),
		weapon: weapon && weapon in WEAPON_LINE_BY_ID ? (weapon as WeaponId) : undefined,
		heroClass: p.get('class') ?? undefined,
		arena: arena !== undefined && arena >= 1 ? Math.min(arena, ARENA.maxSide) : undefined,
		weapons: weaponList(p.get('weapons')),
		god: flag(p.get('god')),
		debug: flag(p.get('debug')),
		skipMenu: flag(p.get('skipMenu')),
	};
}
