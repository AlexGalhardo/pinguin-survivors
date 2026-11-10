import type { BossProfile, EnemyDef, HazardKind } from '../data/enemies';

/** Timings of special behaviors (docs/gdd.md §11). */
export const AI = {
	rangedHold: 0.7,
	chargeWindup: 0.5,
	chargeTime: 0.8,
	chargeSpeed: 3,
	recover: 0.4,
} as const;

export type AiMode = 'move' | 'windup' | 'charge' | 'recover';
export type AiMove = 'seek' | 'hold' | 'charge';
export type AiAction =
	| 'shoot'
	| 'explode'
	| 'swipe'
	| 'chargeStart'
	| 'summon'
	| 'volley'
	| 'pool'
	| 'hazard'
	| null;

export interface AiState {
	mode: AiMode;
	timer: number;
	cooldown: number;
	/** Boss only: timers for charge, roar, volley and hazard pools. */
	chargeCd: number;
	roarCd: number;
	volleyCd: number;
	poolCd: number;
	hazardCd: number;
	/** Index of the next area attack in the boss `hazards` rotation. */
	hazardIdx: number;
	/** What the current wind-up leads to. */
	pending: 'swipe' | 'charge' | null;
	chargeMul: number;
}

export function newAi(def?: EnemyDef): AiState {
	const b = def?.boss;
	return {
		mode: 'move',
		timer: 0,
		cooldown: 0,
		chargeCd: b?.chargeEvery ?? 0,
		roarCd: b?.roarEvery ?? 0,
		volleyCd: b?.volleyEvery ?? 0,
		poolCd: b?.poolEvery ?? 0,
		hazardCd: b?.hazardEvery ?? 0,
		hazardIdx: 0,
		pending: null,
		chargeMul: 1,
	};
}

export interface AiStep {
	move: AiMove;
	action: AiAction;
}

/** One decision tick for an enemy `dist` world units away from the hero. */
export function stepAi(def: EnemyDef, ai: AiState, dist: number, dt: number): AiStep {
	ai.cooldown -= dt;
	const range = def.range ?? 0;
	switch (def.behavior) {
		case 'ranged': {
			const move: AiMove = dist <= range * AI.rangedHold ? 'hold' : 'seek';
			if (dist <= range && ai.cooldown <= 0) {
				ai.cooldown = def.cooldown ?? 2;
				return { move, action: 'shoot' };
			}
			return { move, action: null };
		}
		case 'bomber':
			return { move: 'seek', action: dist <= range ? 'explode' : null };
		case 'charger':
			return chargeCycle(ai, dt, dist <= range && ai.cooldown <= 0, def.cooldown ?? 4, {
				windup: AI.chargeWindup,
				time: AI.chargeTime,
				speed: AI.chargeSpeed,
			});
		case 'boss':
			return def.boss
				? bossStep(def, def.boss, ai, dist, dt)
				: { move: 'seek', action: null };
		default:
			return { move: 'seek', action: null };
	}
}

function chargeCycle(
	ai: AiState,
	dt: number,
	start: boolean,
	cooldown: number,
	c: { windup: number; time: number; speed: number },
): AiStep {
	ai.timer -= dt;
	switch (ai.mode) {
		case 'move':
			if (start) {
				ai.mode = 'windup';
				ai.timer = c.windup;
				ai.pending = 'charge';
				return { move: 'hold', action: null };
			}
			return { move: 'seek', action: null };
		case 'windup':
			if (ai.timer > 0) return { move: 'hold', action: null };
			if (ai.pending === 'swipe') {
				ai.mode = 'recover';
				ai.timer = AI.recover;
				return { move: 'hold', action: 'swipe' };
			}
			ai.mode = 'charge';
			ai.timer = c.time;
			ai.chargeMul = c.speed;
			return { move: 'charge', action: 'chargeStart' };
		case 'charge':
			if (ai.timer > 0) return { move: 'charge', action: null };
			ai.mode = 'recover';
			ai.timer = AI.recover;
			ai.cooldown = cooldown;
			return { move: 'hold', action: null };
		case 'recover':
			if (ai.timer <= 0) ai.mode = 'move';
			return { move: 'hold', action: null };
	}
}

/** Next area attack of the boss rotation (call when the 'hazard' action fires). */
export function nextHazard(b: BossProfile, ai: AiState): HazardKind {
	return b.hazards[ai.hazardIdx++ % b.hazards.length] as HazardKind;
}

/** A timer of 0 in the profile means the boss never uses that attack. */
function due(every: number, left: number): boolean {
	return every > 0 && left <= 0;
}

function bossStep(def: EnemyDef, b: BossProfile, ai: AiState, dist: number, dt: number): AiStep {
	ai.chargeCd -= dt;
	ai.roarCd -= dt;
	ai.volleyCd -= dt;
	ai.poolCd -= dt;
	ai.hazardCd -= dt;
	if (ai.mode === 'move') {
		if (due(b.roarEvery, ai.roarCd)) {
			ai.roarCd = b.roarEvery;
			return { move: 'hold', action: 'summon' };
		}
		if (due(b.volleyEvery, ai.volleyCd)) {
			ai.volleyCd = b.volleyEvery;
			return { move: 'seek', action: 'volley' };
		}
		if (due(b.poolEvery, ai.poolCd)) {
			ai.poolCd = b.poolEvery;
			return { move: 'seek', action: 'pool' };
		}
		if (b.hazards.length > 0 && due(b.hazardEvery, ai.hazardCd)) {
			ai.hazardCd = b.hazardEvery;
			return { move: 'seek', action: 'hazard' };
		}
		if (dist <= (def.range ?? 90) && ai.cooldown <= 0) {
			ai.mode = 'windup';
			ai.timer = b.swipeWindup;
			ai.pending = 'swipe';
			ai.cooldown = def.cooldown ?? 3;
			return { move: 'hold', action: null };
		}
		if (due(b.chargeEvery, ai.chargeCd)) {
			ai.chargeCd = b.chargeEvery;
			ai.mode = 'windup';
			ai.timer = b.chargeWindup;
			ai.pending = 'charge';
			return { move: 'hold', action: null };
		}
		return { move: 'seek', action: null };
	}
	return chargeCycle(ai, dt, false, def.cooldown ?? 3, {
		windup: b.chargeWindup,
		time: b.chargeTime,
		speed: b.chargeSpeed,
	});
}

/** Camouflaged enemies fade in as the hero closes the distance: 0.25 far away, 1 inside `range`. */
export function cloakAlpha(distance: number, range: number): number {
	if (distance <= range) return 1;
	return Math.max(0.25, 1 - (distance - range) / range);
}
