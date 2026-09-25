import { ABILITY_IDS, MAX_ABILITIES, MAX_ABILITY_LEVEL } from '../data/abilities';
import {
	CARD_FAMILY_WEIGHTS,
	CARD_REROLL,
	CARDS_PER_PICK,
	type Card,
	MAX_REVIVES,
	SPECIAL_CARDS,
	STAT_CARDS,
} from '../data/cards';
import { type Rarity, rarityRank } from '../data/rarity';
import { rarityValue, rollRarity } from './rarity';
import type { Rng } from './rng';
import type { AbilityState, RunState } from './run-state';
import { addMods } from './stats';

type Family = keyof typeof CARD_FAMILY_WEIGHTS;

export interface CardContext {
	wave: number;
	luck: number;
	abilities: readonly AbilityState[];
	revives: number;
}

/** Card value for a rarity (rounded: integers for flat stats, 3 decimals otherwise). */
export function statCardValue(base: number, rarity: Rarity, integer = false): number {
	const v = base * rarityValue(rarity);
	return integer ? Math.max(1, Math.round(v)) : Math.round(v * 1000) / 1000;
}

/** Every ability card that can be offered right now (respects 6 slots and level 5). */
export function abilityOptions(abilities: readonly AbilityState[]): Card[] {
	const owned = new Map(abilities.map((a) => [a.id, a.level]));
	const slotsFull = abilities.length >= MAX_ABILITIES;
	const out: Card[] = [];
	for (const id of ABILITY_IDS) {
		const level = owned.get(id);
		if (level === undefined && slotsFull) continue;
		if (level !== undefined && level >= MAX_ABILITY_LEVEL) continue;
		out.push({
			kind: 'ability',
			id: `ability.${id}`,
			rarity: 'common',
			ability: id,
			level: (level ?? 0) + 1,
		});
	}
	return out;
}

function candidates(ctx: CardContext, rarity: Rarity, family: Family): Card[] {
	if (family === 'stat') {
		return STAT_CARDS.filter(
			(c) => rarityRank(rarity) >= rarityRank(c.minRarity ?? 'common'),
		).map(
			(c): Card => ({
				kind: 'stat',
				id: `stat.${c.id}`,
				rarity,
				stat: c.stat,
				value: statCardValue(c.base, rarity, c.integer),
			}),
		);
	}
	if (family === 'ability') return abilityOptions(ctx.abilities).map((c) => ({ ...c, rarity }));
	return SPECIAL_CARDS.filter(
		(c) =>
			rarityRank(rarity) >= rarityRank(c.minRarity) &&
			!(c.id === 'revive' && ctx.revives >= MAX_REVIVES),
	).map((c): Card => ({ kind: 'special', id: `special.${c.id}`, rarity, special: c.id }));
}

/** Generates `count` distinct cards (default 3). */
export function generateCards(ctx: CardContext, rng: Rng, count = CARDS_PER_PICK): Card[] {
	const picked: Card[] = [];
	const used = new Set<string>();
	const families = Object.keys(CARD_FAMILY_WEIGHTS) as Family[];
	for (let attempt = 0; picked.length < count && attempt < 200; attempt++) {
		const rarity = rollRarity(rng, ctx.wave, ctx.luck);
		const pools = families.map((f) =>
			candidates(ctx, rarity, f).filter((c) => !used.has(c.id)),
		);
		const weights = families.map((f, i) =>
			(pools[i]?.length ?? 0) > 0 ? CARD_FAMILY_WEIGHTS[f] : 0,
		);
		if (weights.every((w) => w <= 0)) continue;
		const pool = pools[rng.weightedIndex(weights)] ?? [];
		const card = rng.pick(pool);
		used.add(card.id);
		picked.push(card);
	}
	return picked;
}

/**
 * Applies a card to the run. `maxHpOf` computes the max HP of a state (needed for
 * Full Heal and to heal Max HP gains).
 */
export function applyCard(state: RunState, card: Card, maxHpOf: (s: RunState) => number): void {
	switch (card.kind) {
		case 'stat': {
			const before = maxHpOf(state);
			state.cardMods = addMods(state.cardMods, { [card.stat]: card.value });
			const after = maxHpOf(state);
			if (after > before) state.hp += after - before;
			state.hp = Math.min(state.hp, after);
			break;
		}
		case 'ability': {
			const existing = state.abilities.find((a) => a.id === card.ability);
			if (existing) existing.level = Math.min(MAX_ABILITY_LEVEL, existing.level + 1);
			else if (state.abilities.length < MAX_ABILITIES) {
				state.abilities.push({ id: card.ability, level: 1 });
			}
			break;
		}
		case 'special':
			if (card.special === 'projectile') {
				state.cardMods = addMods(state.cardMods, { projectiles: 1 });
			} else if (card.special === 'pierce') {
				state.cardMods = addMods(state.cardMods, { pierce: 1 });
			} else if (card.special === 'revive') {
				state.revives = Math.min(MAX_REVIVES, state.revives + 1);
			} else {
				state.hp = maxHpOf(state);
			}
			break;
	}
}

/** Card re-roll price: 2 + N (+1 per re-roll on the same screen). */
export function cardRerollCost(wave: number, rerollsDone: number): number {
	return CARD_REROLL.base + CARD_REROLL.perWave * wave + CARD_REROLL.perReroll * rerollsDone;
}
