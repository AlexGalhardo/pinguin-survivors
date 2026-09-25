import { STAT_KEYS, type StatKey, type Stats } from './stats';

export interface StatChange {
	stat: StatKey;
	before: number;
	after: number;
}

/** Stats that differ between two snapshots (in STAT_KEYS order). */
export function statChanges(before: Stats, after: Stats): StatChange[] {
	return STAT_KEYS.filter((k) => Math.abs(after[k] - before[k]) > 1e-9).map((k) => ({
		stat: k,
		before: before[k],
		after: after[k],
	}));
}
