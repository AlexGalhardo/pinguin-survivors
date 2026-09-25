import type { StatKey } from './stats';

/** Stats shown as percentages (stored as fractions). */
const PERCENT_STATS: ReadonlySet<StatKey> = new Set<StatKey>([
	'maxHpPct',
	'lifesteal',
	'damage',
	'attackSpeed',
	'critChance',
	'critDamage',
	'abilityPower',
	'range',
	'moveSpeed',
	'dodge',
]);

export function isPercentStat(stat: StatKey): boolean {
	return PERCENT_STATS.has(stat);
}

/** Formats a stat delta: "+8%", "-3%", "+5", "+0.3". */
export function formatStatDelta(stat: StatKey, value: number): string {
	const sign = value >= 0 ? '+' : '-';
	const abs = Math.abs(value);
	if (isPercentStat(stat)) return `${sign}${Math.round(abs * 1000) / 10}%`;
	return `${sign}${Math.round(abs * 10) / 10}`;
}

/** Formats a current stat value: "35%", "12", "0.6". */
export function formatStatValue(stat: StatKey, value: number): string {
	if (isPercentStat(stat)) return `${Math.round(value * 1000) / 10}%`;
	return `${Math.round(value * 10) / 10}`;
}

/** Seconds as M:SS. */
export function formatTime(seconds: number): string {
	const s = Math.max(0, Math.floor(seconds));
	return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
