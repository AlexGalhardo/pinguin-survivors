import {
	ABILITY_IDS,
	ABILITY_TAGS,
	type AbilityId,
	EVOLUTION_ITEM,
	MAX_ABILITY_LEVEL,
} from '../data/abilities';
import { getItem, itemMods } from '../data/items';
import { SYNERGIES, TAGS, type Tag } from '../data/synergies';
import type { RunState } from './run-state';
import { runStats } from './run-state';
import { addMods, type StatMods, type Stats } from './stats';

/** How many abilities + items of each tag the run owns (items count per copy). */
export function tagCounts(state: RunState): Record<Tag, number> {
	const counts = {} as Record<Tag, number>;
	for (const t of TAGS) counts[t] = 0;
	for (const a of state.abilities) {
		const tag = ABILITY_TAGS[a.id as AbilityId];
		if (tag) counts[tag]++;
	}
	for (const id of state.items) for (const t of getItem(id)?.tags ?? []) counts[t]++;
	return counts;
}

/** Highest synergy tier reached per tag (0 = none). */
export function synergyTiers(counts: Record<Tag, number>): Record<Tag, number> {
	const tiers = {} as Record<Tag, number>;
	for (const t of TAGS) tiers[t] = SYNERGIES[t].filter((tier) => counts[t] >= tier.count).length;
	return tiers;
}

/** Bonus stats from the active synergies. */
export function synergyMods(counts: Record<Tag, number>): StatMods {
	let mods: StatMods = {};
	const tiers = synergyTiers(counts);
	for (const t of TAGS) {
		const tier = SYNERGIES[t][tiers[t] - 1];
		if (tier) mods = addMods(mods, tier.mods);
	}
	return mods;
}

/** Full current stats: class base + cards + items + synergies. */
export function buildStats(state: RunState): Stats {
	const base = runStats(state, itemMods);
	const syn = synergyMods(tagCounts(state));
	const out = { ...base };
	for (const [k, v] of Object.entries(syn)) out[k as keyof Stats] += v ?? 0;
	return out;
}

/** Abilities that can evolve now (level 5 + evolution item owned + not evolved yet). */
export function pendingEvolutions(state: RunState): AbilityId[] {
	return state.abilities
		.filter(
			(a) =>
				!a.evolved &&
				a.level >= MAX_ABILITY_LEVEL &&
				ABILITY_IDS.includes(a.id as AbilityId) &&
				state.items.includes(EVOLUTION_ITEM[a.id as AbilityId]),
		)
		.map((a) => a.id as AbilityId);
}

/** Evolves every eligible ability. Returns the evolved ids. */
export function applyEvolutions(state: RunState): AbilityId[] {
	const ids = pendingEvolutions(state);
	for (const a of state.abilities) if (ids.includes(a.id as AbilityId)) a.evolved = true;
	return ids;
}
