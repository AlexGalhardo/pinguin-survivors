import { SUPER } from '../data/superpowers';

export function superUnlocked(heroLevel: number): boolean {
	return heroLevel >= SUPER.unlockLevel;
}

/** Charge gained for a kill: elites count triple, bosses do not count (balancing §4.2). */
export function chargeFor(kind: 'common' | 'elite' | 'boss'): number {
	return kind === 'boss' ? 0 : kind === 'elite' ? SUPER.eliteCharge : 1;
}

export function addCharge(current: number, amount: number): number {
	return Math.min(SUPER.charge, current + amount);
}

export function superReady(charge: number, heroLevel: number): boolean {
	return superUnlocked(heroLevel) && charge >= SUPER.charge;
}
