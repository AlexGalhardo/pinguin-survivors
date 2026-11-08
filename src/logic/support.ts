import {
	MAGNETIC,
	SUPPORT_IDS,
	SUPPORT_MAX_LEVEL,
	SUPPORT_SLOTS,
	SUPPORT_STATS,
	type SupportId,
} from '../data/support';
import { addStat, type PlayerStats } from './stats';

/** Support item levels of a run (absent = not owned). */
export type SupportLevels = Partial<Record<SupportId, number>>;

export const isSupportId = (id: string): id is SupportId =>
	(SUPPORT_IDS as readonly string[]).includes(id);

export const supportLevel = (owned: SupportLevels, id: SupportId): number => owned[id] ?? 0;

/** A new item needs a free slot (max 4); an owned one just needs to be below the top level. */
export function canBuySupport(owned: SupportLevels, id: SupportId): boolean {
	const level = supportLevel(owned, id);
	if (level >= SUPPORT_MAX_LEVEL) return false;
	return level > 0 || Object.keys(owned).length < SUPPORT_SLOTS;
}

/** Raises the level by one and applies the stat difference to `stats`; false when not allowed. */
export function buySupport(owned: SupportLevels, id: SupportId, stats: PlayerStats): boolean {
	if (!canBuySupport(owned, id)) return false;
	const from = supportLevel(owned, id);
	owned[id] = from + 1;
	if (id !== 'magnetic') {
		const def = SUPPORT_STATS[id];
		addStat(stats, def.stat, (def.values[from] ?? 0) - (def.values[from - 1] ?? 0));
	}
	return true;
}

/** Value shown for level `level` (1..5) of `id`: pull radius for Magnetic, the stat bonus otherwise. */
export function supportValue(id: SupportId, level: number): number {
	const i = Math.max(1, Math.min(SUPPORT_MAX_LEVEL, level)) - 1;
	return id === 'magnetic' ? (MAGNETIC.radius[i] ?? 0) : (SUPPORT_STATS[id].values[i] ?? 0);
}

/** Extra pickup radius and speed multiplier the Magnetic item gives XP orbs and Fish. */
export function magnetBonus(owned: SupportLevels): { radius: number; pull: number } {
	const level = supportLevel(owned, 'magnetic');
	return level > 0
		? { radius: MAGNETIC.radius[level - 1] ?? 0, pull: MAGNETIC.pull[level - 1] ?? 1 }
		: { radius: 0, pull: 1 };
}
