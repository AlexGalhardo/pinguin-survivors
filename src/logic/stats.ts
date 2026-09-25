/**
 * Player stat model. All percentage stats are fractions (0.08 = +8%).
 * Flat stats: maxHp, hpRegen, armor, pickupRange, luck, projectiles, pierce.
 */
export const STAT_KEYS = [
	'maxHp',
	'maxHpPct',
	'hpRegen',
	'lifesteal',
	'damage',
	'attackSpeed',
	'critChance',
	'critDamage',
	'abilityPower',
	'range',
	'moveSpeed',
	'armor',
	'dodge',
	'pickupRange',
	'luck',
	'projectiles',
	'pierce',
] as const;

export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;
export type StatMods = Partial<Stats>;

export function emptyStats(): Stats {
	const s = {} as Stats;
	for (const k of STAT_KEYS) s[k] = 0;
	return s;
}

/** Returns target + mods * times (does not mutate the inputs). */
export function addMods(target: StatMods, mods: StatMods, times = 1): StatMods {
	const out: StatMods = { ...target };
	for (const k of STAT_KEYS) {
		const v = mods[k];
		if (v !== undefined) out[k] = (out[k] ?? 0) + v * times;
	}
	return out;
}

/** Sums a base and any number of modifier sets into a full Stats object. */
export function computeStats(base: StatMods, ...mods: StatMods[]): Stats {
	let acc: StatMods = { ...base };
	for (const m of mods) acc = addMods(acc, m);
	return { ...emptyStats(), ...acc };
}

/** Max HP after the percentage modifier (never below 1). */
export function finalMaxHp(s: Stats): number {
	return Math.max(1, Math.round(s.maxHp * (1 + s.maxHpPct)));
}

/** Movement speed in px/s (never below 30% of base). */
export function finalMoveSpeed(baseSpeed: number, s: Stats): number {
	return baseSpeed * Math.max(0.3, 1 + s.moveSpeed);
}
