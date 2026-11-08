import { HEAL_POTION } from '../data/potions';
import type { Rarity } from '../data/rarity';
import type { Rng } from './rng';

/** The run's healing potion (SDD-014 RF-20); level 0 = not bought yet. */
export interface HealPotionState {
	/** Potions bought from the merchant (0 to 10): the most carried at once. */
	level: number;
	rarity: Rarity;
	charges: number;
	/** Seconds until the next potion may be drunk. */
	cooldown: number;
	/** Kills in this round toward the next refill (0 to `killsPerPotion` - 1; 0 while full). */
	kills: number;
}

export const emptyHealPotion = (): HealPotionState => ({
	level: 0,
	rarity: 1,
	charges: 0,
	cooldown: 0,
	kills: 0,
});

/** Share of max HP one potion of `rarity` heals. */
export const healShare = (rarity: Rarity): number => HEAL_POTION.heal[rarity - 1] ?? 0;

export const canBuyHealPotion = (p: HealPotionState): boolean => p.level < HEAL_POTION.maxLevel;

/** One more potion carried (it fills by kills in the next round); false at the top level. */
export function buyHealPotion(p: HealPotionState): boolean {
	if (!canBuyHealPotion(p)) return false;
	p.level++;
	return true;
}

/** Every round starts with the potions empty; kills refill them (developer rule, 2026-11-08). */
export function emptyHealPotionCharges(p: HealPotionState): void {
	p.charges = 0;
	p.kills = 0;
	p.cooldown = 0;
}

/** Counts kills toward refilling: every `killsPerPotion` kills one empty potion fills, never past the level. */
export function addPotionKills(p: HealPotionState, n = 1): void {
	if (p.level === 0 || p.charges >= p.level) return;
	p.kills += n;
	while (p.kills >= HEAL_POTION.killsPerPotion && p.charges < p.level) {
		p.kills -= HEAL_POTION.killsPerPotion;
		p.charges++;
	}
	if (p.charges >= p.level) p.kills = 0;
}

/**
 * A drop raises the rarity to its own when higher, otherwise by one step. Elite drops (II, III)
 * never push past III: IV and V only come from Bosses (developer rule).
 */
export function upgradeRarity(current: Rarity, drop: Rarity): Rarity {
	if (drop > current) return drop;
	const cap = drop <= 3 ? 3 : 5;
	return Math.max(current, Math.min(cap, current + 1)) as Rarity;
}

/** Rarity of a potion upgrade dropped by an Elite or a Boss, or null (no potion, already V, no luck). */
export function rollPotionDrop(
	rng: Rng,
	kind: 'common' | 'elite' | 'boss',
	p: HealPotionState,
): Rarity | null {
	if (kind === 'common' || p.level === 0 || p.rarity >= 5) return null;
	// Elites stop dropping upgrades once the potion is III: they cannot raise it further.
	if (kind === 'elite' && p.rarity >= 3) return null;
	if (kind === 'elite' && rng.next() >= HEAL_POTION.drop.eliteChance) return null;
	return rng.pick([...HEAL_POTION.drop[kind]]) as Rarity;
}

/**
 * Ticks the cooldown and drinks one potion when HP is at or below the threshold. Returns the
 * amount of HP to heal (0 when nothing was drunk). One potion at a time.
 */
export function tickHealPotion(p: HealPotionState, dt: number, hp: number, maxHp: number): number {
	p.cooldown = Math.max(0, p.cooldown - dt);
	if (p.charges <= 0 || p.cooldown > 0 || hp <= 0 || hp > maxHp * HEAL_POTION.drinkBelow)
		return 0;
	p.charges--;
	p.cooldown = HEAL_POTION.cooldown;
	return maxHp * healShare(p.rarity);
}
