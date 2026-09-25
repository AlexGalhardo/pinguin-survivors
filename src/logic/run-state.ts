import { CHARACTERS, type CharacterId } from '../data/characters';
import { computeStats, finalMaxHp, type StatMods, type Stats } from './stats';

export const RUN_STATE_VERSION = 1;

export interface AbilityState {
	id: string;
	level: number;
	/** Evolved (level 5 + evolution item). */
	evolved?: boolean;
}

export interface RunTotals {
	kills: number;
	damageDealt: number;
	goldEarned: number;
	timeSec: number;
}

/** Everything about the current run in one serializable object. */
export interface RunState {
	version: number;
	seed: number;
	character: CharacterId;
	wave: number;
	gold: number;
	hp: number;
	revives: number;
	abilities: AbilityState[];
	items: string[];
	/** Sum of every stat card picked so far. */
	cardMods: StatMods;
	/** Item ids locked in the shop (kept for the next shop). */
	shopLocks: string[];
	totals: RunTotals;
}

export function createRunState(character: CharacterId, seed: number, wave = 1): RunState {
	const state: RunState = {
		version: RUN_STATE_VERSION,
		seed,
		character,
		wave,
		gold: 0,
		hp: 0,
		revives: 0,
		abilities: [],
		items: [],
		cardMods: {},
		shopLocks: [],
		totals: { kills: 0, damageDealt: 0, goldEarned: 0, timeSec: 0 },
	};
	state.hp = finalMaxHp(runStats(state));
	return state;
}

/** Item modifiers are injected so this module stays independent from the item data. */
export type ItemModsLookup = (itemId: string) => StatMods | undefined;

/** Current stats: character base + stat cards + items. */
export function runStats(state: RunState, itemMods: ItemModsLookup = () => undefined): Stats {
	const items = state.items.map(itemMods).filter((m): m is StatMods => m !== undefined);
	return computeStats(CHARACTERS[state.character].stats, state.cardMods, ...items);
}

export function serializeRun(state: RunState): string {
	return JSON.stringify(state);
}

export function deserializeRun(json: string): RunState | undefined {
	try {
		const data = JSON.parse(json) as RunState;
		return data.version === RUN_STATE_VERSION ? data : undefined;
	} catch {
		return undefined;
	}
}
