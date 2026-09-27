import { STATUS } from '../data/combat';

/** Per-enemy status effects. Mutable and reset on spawn (pooled enemies). */
export interface StatusState {
	bleedStacks: number;
	bleedDps: number;
	bleedTime: number;
	poisonStacks: number;
	poisonDps: number;
	poisonTime: number;
	burnDps: number;
	burnTime: number;
	iceStacks: number;
	iceTime: number;
	frozen: number;
	stunned: number;
	shredTime: number;
}

export function emptyStatus(): StatusState {
	return {
		bleedStacks: 0,
		bleedDps: 0,
		bleedTime: 0,
		poisonStacks: 0,
		poisonDps: 0,
		poisonTime: 0,
		burnDps: 0,
		burnTime: 0,
		iceStacks: 0,
		iceTime: 0,
		frozen: 0,
		stunned: 0,
		shredTime: 0,
	};
}

export function resetStatus(s: StatusState): void {
	Object.assign(s, emptyStatus());
}

/** Each stack deals share × hit over the duration; stacks refresh the timer. */
export function applyBleed(s: StatusState, hit: number): void {
	const b = STATUS.bleed;
	if (s.bleedStacks < b.maxStacks) {
		s.bleedStacks++;
		s.bleedDps += (hit * b.share) / b.duration;
	}
	s.bleedTime = b.duration;
}

export function applyPoison(s: StatusState, hit: number): void {
	const p = STATUS.poison;
	if (s.poisonStacks < p.maxStacks) {
		s.poisonStacks++;
		s.poisonDps += hit * p.sharePerSecond;
	}
	s.poisonTime = p.duration;
}

/** Burn does not stack: the strongest recent hit wins and the timer renews. */
export function applyBurn(s: StatusState, hit: number): void {
	s.burnDps = Math.max(s.burnDps, hit * STATUS.burn.sharePerSecond);
	s.burnTime = STATUS.burn.duration;
}

export function applyIce(s: StatusState): void {
	const i = STATUS.ice;
	s.iceTime = i.duration;
	s.iceStacks++;
	if (s.iceStacks >= i.maxStacks) {
		s.iceStacks = 0;
		s.frozen = i.freeze;
	}
}

export function applyEarth(s: StatusState, roll: number): void {
	const e = STATUS.earth;
	if (roll < e.stunChance) s.stunned = Math.max(s.stunned, e.stun);
	s.shredTime = e.shredDuration;
}

export interface Tick {
	bleed: number;
	poison: number;
	burn: number;
}

/** Advances timers and returns the damage dealt by each DoT during `dt`. */
export function tickStatus(s: StatusState, dt: number, out: Tick): Tick {
	out.bleed = s.bleedTime > 0 ? s.bleedDps * Math.min(dt, s.bleedTime) : 0;
	out.poison = s.poisonTime > 0 ? s.poisonDps * Math.min(dt, s.poisonTime) : 0;
	out.burn = s.burnTime > 0 ? s.burnDps * Math.min(dt, s.burnTime) : 0;
	s.bleedTime -= dt;
	if (s.bleedTime <= 0) {
		s.bleedStacks = 0;
		s.bleedDps = 0;
	}
	s.poisonTime -= dt;
	if (s.poisonTime <= 0) {
		s.poisonStacks = 0;
		s.poisonDps = 0;
	}
	s.burnTime -= dt;
	if (s.burnTime <= 0) s.burnDps = 0;
	s.iceTime -= dt;
	if (s.iceTime <= 0) s.iceStacks = 0;
	s.frozen = Math.max(0, s.frozen - dt);
	s.stunned = Math.max(0, s.stunned - dt);
	s.shredTime = Math.max(0, s.shredTime - dt);
	return out;
}

/** Movement multiplier from ice slow, freeze and stun. */
export function speedFactor(s: StatusState): number {
	if (s.frozen > 0 || s.stunned > 0) return 0;
	return 1 - STATUS.ice.slowPerStack * s.iceStacks;
}

/** Extra damage taken while earth has shredded the enemy's defenses. */
export function shredFactor(s: StatusState): number {
	return s.shredTime > 0 ? 1 + STATUS.earth.shred : 1;
}
