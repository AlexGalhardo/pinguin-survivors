import { SUPER } from '../data/superpowers';

export function superUnlocked(heroLevel: number): boolean {
	return heroLevel >= SUPER.unlockLevel;
}

/** Charge gained for a kill: elites count triple, bosses do not count (balancing §4.2). */
export function chargeFor(kind: 'common' | 'elite' | 'boss'): number {
	return kind === 'boss' ? 0 : kind === 'elite' ? SUPER.eliteCharge : 1;
}

/** Kills needed for the next cast after `uses` casts this run: 100, 105, 110… */
export function superCost(uses: number): number {
	return SUPER.charge + SUPER.chargeStep * Math.max(0, uses);
}

export function addCharge(current: number, amount: number, cost: number = SUPER.charge): number {
	return Math.min(cost, current + amount);
}

export function superReady(
	charge: number,
	heroLevel: number,
	cost: number = SUPER.charge,
): boolean {
	return superUnlocked(heroLevel) && charge >= cost;
}
