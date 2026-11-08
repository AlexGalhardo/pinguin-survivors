import type { HeroId } from '../config/constants';
import {
	ALL_CARDS,
	type CardDef,
	LEVEL_UP_CARDS,
	RARITIES,
	RARITY_WEIGHTS,
	type Rarity,
} from '../data/cards';
import { type Build, canTake } from './build';
import type { Rng } from './rng';

export interface CardOffer {
	card: CardDef;
	rarity: Rarity;
}

/** Rarity weights for a round and luck (docs/balancing-and-simulation.md §7). */
export function rarityWeights(round: number, luck: number): number[] {
	const w = RARITY_WEIGHTS;
	const t = Math.min(1, Math.max(0, (round - 1) / (w.endRound - 1)));
	const weights = w.start.map((s, i) => s + ((w.end[i] as number) - s) * t);
	const shift = Math.min((weights[0] as number) - 5, luck * w.luckShift);
	if (shift > 0) {
		weights[0] = (weights[0] as number) - shift;
		const rest = weights.slice(1).reduce((a, b) => a + b, 0);
		for (let i = 1; i < weights.length; i++)
			weights[i] = (weights[i] as number) + (shift * (weights[i] as number)) / rest;
	}
	return weights;
}

export function rollRarity(rng: Rng, round: number, luck: number): Rarity {
	return RARITIES[rng.weightedIndex(rarityWeights(round, luck))] as Rarity;
}

/** Distinct level-up cards (4 by default): stats and hero exclusives only, never weapons or items. */
export function drawCards(
	rng: Rng,
	ctx: { hero: HeroId; round: number; luck: number; build: Build },
	pool: readonly CardDef[] = ALL_CARDS,
	count = LEVEL_UP_CARDS,
): CardOffer[] {
	const offers: CardOffer[] = [];
	const candidates = pool.filter(
		(c) =>
			c.weight > 0 && (c.hero === undefined || c.hero === ctx.hero) && canTake(ctx.build, c),
	);
	while (offers.length < count && candidates.length > 0) {
		const i = rng.weightedIndex(candidates.map((c) => c.weight));
		const card = candidates.splice(i, 1)[0] as CardDef;
		offers.push({ card, rarity: rollRarity(rng, ctx.round, ctx.luck) });
	}
	return offers;
}
