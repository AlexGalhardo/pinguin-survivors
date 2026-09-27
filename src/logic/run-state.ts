import type { HeroId } from '../config/constants';
import type { HeroDef } from '../data/heroes';
import { roundDuration } from './round';
import type { RunCounters } from './save';

/** Everything about the current run; serializable for the save snapshot (P-43). */
export interface RunState {
	hero: HeroId;
	tier: 1 | 2 | 3;
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
	/** Lifetime counters gathered this run; added to the save when the run ends. */
	counters: RunCounters;
}

export function createRunState(
	hero: HeroDef,
	opts: { seed: number; round?: number; tier?: 1 | 2 | 3 },
): RunState {
	const round = opts.round ?? 1;
	return {
		hero: hero.id,
		tier: opts.tier ?? 1,
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
