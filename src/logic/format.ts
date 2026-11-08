/** m:ss for round timers. */
export function formatTime(seconds: number): string {
	const s = Math.max(0, Math.ceil(seconds));
	return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const PERCENT_STATS = new Set<string>([
	'dodge',
	'parry',
	'crit',
	'critDamage',
	'damage',
	'attackSpeed',
	'area',
	'luck',
	'xpGain',
	'lifesteal',
	'bleedChance',
	'poisonChance',
	'burnChance',
	'chillChance',
	'shockChance',
]);

export function formatStat(key: string, value: number, signed = false): string {
	const isPct = PERCENT_STATS.has(key) || key.startsWith('resist.') || key.startsWith('tagMul.');
	const v = isPct ? Math.round(value * 1000) / 10 : Math.round(value * 10) / 10;
	const sign = signed && v > 0 ? '+' : '';
	return `${sign}${v}${isPct ? '%' : ''}`;
}
