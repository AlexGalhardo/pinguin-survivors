import type { EnemyDef } from '../data/enemies';

/** Timings of special behaviors (docs/game-design.md §11). */
export const AI = {
	rangedHold: 0.7,
	chargeWindup: 0.5,
	chargeTime: 0.8,
	chargeSpeed: 3,
	recover: 0.4,
	boss: {
		swipeWindup: 0.4,
		chargeEvery: 8,
		chargeWindup: 0.6,
		chargeTime: 1,
		chargeSpeed: 2.5,
		roarEvery: 12,
		summonCount: 6,
	},
} as const;

export type AiMode = 'move' | 'windup' | 'charge' | 'recover';
export type AiMove = 'seek' | 'hold' | 'charge';
export type AiAction = 'shoot' | 'explode' | 'swipe' | 'chargeStart' | 'summon' | null;

export interface AiState {
	mode: AiMode;
	timer: number;
	cooldown: number;
	/** Boss only: timers for charge and roar. */
	chargeCd: number;
	roarCd: number;
	/** What the current wind-up leads to. */
	pending: 'swipe' | 'charge' | null;
	chargeMul: number;
}

export function newAi(): AiState {
	return {
		mode: 'move',
		timer: 0,
		cooldown: 0,
		chargeCd: AI.boss.chargeEvery,
		roarCd: AI.boss.roarEvery,
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
			return bossStep(def, ai, dist, dt);
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

function bossStep(def: EnemyDef, ai: AiState, dist: number, dt: number): AiStep {
	const b = AI.boss;
	ai.chargeCd -= dt;
	ai.roarCd -= dt;
	if (ai.mode === 'move') {
		if (ai.roarCd <= 0) {
			ai.roarCd = b.roarEvery;
			return { move: 'hold', action: 'summon' };
		}
		if (dist <= (def.range ?? 90) && ai.cooldown <= 0) {
			ai.mode = 'windup';
			ai.timer = b.swipeWindup;
			ai.pending = 'swipe';
			ai.cooldown = def.cooldown ?? 3;
			return { move: 'hold', action: null };
		}
		if (ai.chargeCd <= 0) {
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
