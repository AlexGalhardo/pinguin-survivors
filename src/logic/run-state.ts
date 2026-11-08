import type { HeroId } from '../config/constants';
import type { Danger, Difficulty } from '../data/difficulty';
import { ECONOMY, PEARLS, SHOP } from '../data/economy';
import type { HeroDef } from '../data/heroes';
import { WEAPON_LINES, WEAPON_TIERS } from '../data/weapons';
import type { Build } from './build';
import { type CardOffer, drawCards } from './cards';
import type { RunGear } from './equipment';
import { roundEndFish } from './progression';
import type { Rng } from './rng';
import { cycle, isBossRound, roundDuration } from './round';
import type { RunCounters, SaveData } from './save';
import {
	type Offer,
	rollOffers,
	type ShopCandidate,
	type ShopContext,
	type ShopState,
} from './shop';

export type RunPhase = 'round' | 'cards' | 'shop';

/** Everything about the current run; serializable for the save snapshot (P-43). */
export interface RunState {
	hero: HeroId;
	tier: 1 | 2 | 3;
	/** Chosen before the run (P-62); missing in snapshots older than the feature = normal. */
	difficulty?: Difficulty;
	/** Danger 0–5 of the run (ADR-008); replaces `difficulty`. */
	danger: Danger;
	seed: number;
	round: number;
	/** Seconds left in the current round. */
	timeLeft: number;
	hp: number;
	maxHp: number;
	kills: number;
	xp: number;
	fish: number;
	/** Kills toward the superpower (P-39); persists between rounds. */
	superCharge: number;
	elapsed: number;
	damageDealt: number;
	/** Equipment found this run (bag + worn); missing in older snapshots. */
	gear?: RunGear;
	/** Lifetime counters gathered this run; added to the save when the run ends. */
	counters: RunCounters;
	phase: RunPhase;
	/** Level-ups waiting for a card pick; resolved before the shop opens. */
	pendingLevelUps: number;
	/** Open shop (phase `shop`), otherwise null. */
	shop: ShopState | null;
	/** Offers locked in the previous shop, by slot; they come back in the next one. */
	lockedOffers: (Offer | null)[];
	/** Pearls earned by finished rounds, paid out at `finishRun`. */
	pearlsEarned: number;
	/** Level-up card rerolls left this run (from the Workshop `insight` upgrade). */
	cardRerollsLeft: number;
}

export function createRunState(
	hero: HeroDef,
	opts: {
		seed: number;
		round?: number;
		tier?: 1 | 2 | 3;
		difficulty?: Difficulty;
		danger?: Danger;
		cardRerolls?: number;
	},
): RunState {
	const round = opts.round ?? 1;
	return {
		hero: hero.id,
		tier: opts.tier ?? 1,
		difficulty: opts.difficulty ?? 'normal',
		danger: opts.danger ?? 1,
		seed: opts.seed,
		round,
		timeLeft: roundDuration(round),
		hp: hero.hp,
		maxHp: hero.hp,
		kills: 0,
		xp: 0,
		fish: 0,
		superCharge: 0,
		elapsed: 0,
		damageDealt: 0,
		counters: {},
		phase: 'round',
		pendingLevelUps: 0,
		shop: null,
		lockedOffers: [],
		pearlsEarned: 0,
		cardRerollsLeft: opts.cardRerolls ?? 0,
	};
}

export function startRound(state: RunState, round: number): void {
	state.round = round;
	state.timeLeft = roundDuration(round);
}

/** Applies damage to the hero; returns true when the hero died. */
export function damageHero(state: RunState, amount: number): boolean {
	state.hp = Math.max(0, state.hp - amount);
	return state.hp <= 0;
}

export function healHero(state: RunState, amount: number): void {
	state.hp = Math.min(state.maxHp, state.hp + amount);
}

/** Increments one run counter (achievement progress). */
export function countRun(state: RunState, key: keyof RunCounters & string, by = 1): void {
	const c = state.counters as Record<string, number | boolean | undefined>;
	c[key] = ((c[key] as number | undefined) ?? 0) + by;
}

/** Fish for finishing round N: `(2 + floor(N/2)) × (1 + harvesting)`, plus the boss bonus. */
export function roundClearFish(round: number, harvesting: number): number {
	const base = Math.floor(roundEndFish(round) * (1 + harvesting));
	const boss = isBossRound(round) ? ECONOMY.fish.bossPerCycle * (1 + cycle(round)) : 0;
	return base + boss;
}

export function roundClearPearls(round: number): number {
	const base = PEARLS.roundBase + Math.floor(round / PEARLS.roundEvery);
	return base + (isBossRound(round) ? PEARLS.boss : 0);
}

/** Shop candidates for a hero from the weapon lines: one entry per tier, same id (never both). */
export function weaponCandidates(hero: HeroId): ShopCandidate[] {
	return WEAPON_LINES.filter((w) => !w.hero || w.hero === hero).flatMap((w) =>
		WEAPON_TIERS.map(
			(tier): ShopCandidate => ({
				kind: 'weapon',
				id: w.id,
				tier,
				sets: w.sets,
				...(w.hero && { hero: w.hero }),
			}),
		),
	);
}

export interface ShopRoll {
	rng: Rng;
	pool: readonly ShopCandidate[];
	ctx: ShopContext;
}

export function queueLevelUps(state: RunState, count: number): void {
	state.pendingLevelUps += count;
}

function openShop(state: RunState, roll: ShopRoll): void {
	const locks = Array.from({ length: SHOP.offers }, (_, i) => state.lockedOffers[i] != null);
	const offers = rollOffers(
		roll.rng,
		state.round,
		roll.ctx,
		roll.pool,
		locks,
		state.lockedOffers,
	);
	state.shop = { offers, locks, rerolls: 0 };
	state.phase = 'shop';
}

/** Round cleared: pays Fish and Pearls, then goes to pending cards or straight to the shop. */
export function endRound(state: RunState, roll: ShopRoll, harvesting = 0): void {
	state.fish += roundClearFish(state.round, harvesting);
	state.pearlsEarned += roundClearPearls(state.round);
	if (state.pendingLevelUps > 0) state.phase = 'cards';
	else openShop(state, roll);
}

/** One card pick done; when the queue empties the shop opens. */
export function resolveLevelUp(state: RunState, roll: ShopRoll): void {
	if (state.pendingLevelUps <= 0) return;
	state.pendingLevelUps--;
	if (state.pendingLevelUps === 0 && state.phase === 'cards') openShop(state, roll);
}

/** "Next round": keeps the locked offers and starts round N+1 (caller autosaves). */
export function leaveShop(state: RunState): void {
	if (!state.shop) return;
	const { offers, locks } = state.shop;
	state.lockedOffers = offers.map((o, i) => (locks[i] ? o : null));
	state.shop = null;
	state.phase = 'round';
	startRound(state, state.round + 1);
}

/** Closes the run: Pearls from rounds plus `floor(fish / 10)` go to the save; returns the gain. */
export function finishRun(state: RunState, save: SaveData): number {
	const gain = state.pearlsEarned + Math.floor(state.fish / SHOP.fishToPearls);
	save.pearls += gain;
	state.pearlsEarned = 0;
	state.fish = 0;
	return gain;
}

/** Spends one card reroll and draws a fresh set of level-up cards; null when none is left. */
export function rerollCards(
	state: RunState,
	rng: Rng,
	ctx: { luck: number; build: Build },
): CardOffer[] | null {
	if (state.cardRerollsLeft <= 0) return null;
	state.cardRerollsLeft--;
	return drawCards(rng, { hero: state.hero, round: state.round, ...ctx });
}
