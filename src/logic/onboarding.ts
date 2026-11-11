import type { SaveData } from './save';

/** Systems hidden from a new player until they have a use (SDD-022 RF-01). */
export const SYSTEMS = ['tree', 'heroes'] as const;
export type SystemId = (typeof SYSTEMS)[number];

/** One-line hints of the first run, in the order they show (SDD-022 RF-03). */
export const TIPS = ['move', 'auto', 'super'] as const;
export type TipId = (typeof TIPS)[number];

/** Kills after which the "weapons attack on their own" hint has made its point. */
export const AUTO_TIP_KILLS = 3;

type Progress = Pick<SaveData, 'heroes' | 'history' | 'pearls' | 'potions'>;

/**
 * Whether a system is visible. `runLevel` is the level of the hero being played: tree points
 * arrive mid-run, before the save is written.
 */
export function systemUnlocked(save: Progress, id: SystemId, runLevel = 1): boolean {
	if (id === 'tree')
		return (
			runLevel >= 2 ||
			Object.values(save.heroes).some((h) => h.level >= 2 || h.tree.length > 0)
		);
	return (
		save.history.length > 0 || save.pearls > 0 || Object.values(save.potions).some((n) => n > 0)
	);
}

/** Systems that are unlocked and were never announced; the caller toasts them and calls `markSeen`. */
export function freshUnlocks(
	save: Progress & Pick<SaveData, 'onboarding'>,
	runLevel = 1,
): SystemId[] {
	return SYSTEMS.filter(
		(id) => systemUnlocked(save, id, runLevel) && !save.onboarding.seen.includes(id),
	);
}

/** Records announced systems or finished tips (`tip.move`); no duplicates. */
export function markSeen(save: Pick<SaveData, 'onboarding'>, ids: readonly string[]): void {
	for (const id of ids) if (!save.onboarding.seen.includes(id)) save.onboarding.seen.push(id);
}

export interface TipState {
	/** The hero has moved in this run. */
	moved: boolean;
	kills: number;
	/** The Super Magic is unlocked and fully charged. */
	superReady: boolean;
	/** The Super Magic was cast at least once in this run. */
	superUsed: boolean;
}

/** A tip is over once the player did what it says. */
function tipDone(tip: TipId, s: TipState): boolean {
	if (tip === 'move') return s.moved;
	if (tip === 'auto') return s.kills >= AUTO_TIP_KILLS;
	return s.superUsed;
}

/**
 * The hint to show now (at most one) and the tips this state has just finished, which the
 * caller stores with `markSeen` as `tip.<id>`. `super` only shows while the charge is ready.
 */
export function tipStep(
	seen: readonly string[],
	state: TipState,
): { show: TipId | null; done: TipId[] } {
	const open = TIPS.filter((tip) => !seen.includes(`tip.${tip}`));
	const done = open.filter((tip) => tipDone(tip, state));
	const left = open.filter((tip) => !done.includes(tip));
	// In order, one line at a time: `auto` waits for `move`, `super` for a full charge.
	return { show: left.find((tip) => tip !== 'super' || state.superReady) ?? null, done };
}
