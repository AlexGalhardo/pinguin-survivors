import { MEDKIT, SHOP } from '../data/items';

/** Item price at a wave: round(basePrice · (1 + 0.1(N-1))). */
export function itemPrice(basePrice: number, wave: number): number {
	return Math.round(basePrice * (1 + SHOP.pricePerWave * (wave - 1)));
}

/** Shop re-roll price: 1 + N (+1 per re-roll in the same shop). */
export function shopRerollCost(wave: number, rerollsDone: number): number {
	return SHOP.rerollBase + SHOP.rerollPerWave * wave + SHOP.rerollPerReroll * rerollsDone;
}

/** Medkit drop chance per kill: 0.5% · (1 + Luck/100). */
export function medkitChance(luck: number): number {
	return MEDKIT.baseChance * Math.max(0, 1 + luck / 100);
}

/** Spends gold if affordable. Returns the new gold or null if too poor. */
export function spend(gold: number, price: number): number | null {
	return price <= gold ? gold - price : null;
}
