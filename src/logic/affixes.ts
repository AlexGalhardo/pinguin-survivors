import { AFFIXES, type AffixScope, affixValue } from '../data/affixes';
import { AFFIX_COUNT, type Rarity } from '../data/rarity';
import type { Rng } from './rng';
import { addStat, type PlayerStats, type StatKey } from './stats';

/** One rolled affix: a stat bonus carried by a weapon or an equipment item. */
export interface Affix {
	stat: StatKey;
	value: number;
}

/**
 * Draws the affixes of an item of `rarity` (none at I, then one per step), never repeating a stat.
 * `taken` lists stats the item already has (used when fusion adds an affix to a kept set).
 */
export function rollAffixes(
	rng: Rng,
	rarity: Rarity,
	scope: AffixScope,
	round: number,
	count: number = AFFIX_COUNT[rarity],
	taken: readonly StatKey[] = [],
): Affix[] {
	const pool = AFFIXES.filter((a) => a.scope.includes(scope) && !taken.includes(a.stat));
	const out: Affix[] = [];
	for (let i = 0; i < count && pool.length > 0; i++) {
		const def = pool.splice(Math.floor(rng.next() * pool.length), 1)[0];
		if (def) out.push({ stat: def.stat, value: affixValue(def, rarity, round) });
	}
	return out;
}

/** Fusion result: the kept affixes plus new ones until the new rarity's count is reached. */
export function growAffixes(
	rng: Rng,
	kept: readonly Affix[],
	rarity: Rarity,
	scope: AffixScope,
	round: number,
): Affix[] {
	const missing = AFFIX_COUNT[rarity] - kept.length;
	if (missing <= 0) return [...kept];
	return [
		...kept,
		...rollAffixes(
			rng,
			rarity,
			scope,
			round,
			missing,
			kept.map((a) => a.stat),
		),
	];
}

export function applyAffixes(
	stats: PlayerStats,
	affixes: readonly Affix[],
	sign: 1 | -1 = 1,
): void {
	for (const a of affixes) addStat(stats, a.stat, sign * a.value);
}

const isAffix = (v: unknown): v is Affix =>
	typeof v === 'object' &&
	v !== null &&
	typeof (v as Affix).stat === 'string' &&
	typeof (v as Affix).value === 'number' &&
	Number.isFinite((v as Affix).value);

/** Validates affixes read from a snapshot (unknown shapes are dropped). */
export function parseAffixes(v: unknown): Affix[] {
	return Array.isArray(v) ? v.filter(isAffix).map((a) => ({ stat: a.stat, value: a.value })) : [];
}
