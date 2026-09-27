import { COMBAT } from '../data/combat';

export type DamageTag = 'melee' | 'firearm' | 'magic';
export type Element = 'fire' | 'earth' | 'ice' | 'energy';

/** Fraction of physical damage removed by armor: armor / (armor + K), capped. */
export function armorReduction(armor: number): number {
	if (armor <= 0) return 0;
	return Math.min(COMBAT.armorCap, armor / (armor + COMBAT.armorK));
}

/** Elemental resistance, capped; negative values amplify damage. */
export function resistMultiplier(resist: number): number {
	return 1 - Math.min(COMBAT.resistCap, resist);
}

export interface HitRoll {
	/** Uniform rolls in [0, 1). */
	crit: number;
}

export interface Attack {
	base: number;
	tag: DamageTag;
	/** Hero multiplier for the tag (P-37) times card/stat bonuses. */
	multiplier: number;
	critChance: number;
	critDamage: number;
	element?: Element;
}

export interface Outgoing {
	amount: number;
	crit: boolean;
}

export function rollOutgoing(attack: Attack, roll: HitRoll): Outgoing {
	const crit = roll.crit < attack.critChance;
	const amount = attack.base * attack.multiplier * (crit ? attack.critDamage : 1);
	return { amount, crit };
}

export interface Defender {
	armor: number;
	resist?: Partial<Record<Element, number>>;
	dodge: number;
	parry: number;
}

export type IncomingResult =
	| { kind: 'dodged' }
	| { kind: 'parried'; reflected: number }
	| { kind: 'hit'; amount: number };

/**
 * Damage taken by a defender. Dodge avoids anything; parry only melee/contact hits and reflects
 * part of it; armor only reduces physical damage, resistances only elemental damage.
 */
export function resolveIncoming(
	amount: number,
	defender: Defender,
	opts: { contact: boolean; element?: Element },
	rolls: { dodge: number; parry: number },
): IncomingResult {
	if (rolls.dodge < Math.min(COMBAT.dodgeCap, defender.dodge)) return { kind: 'dodged' };
	if (opts.contact && rolls.parry < Math.min(COMBAT.parryCap, defender.parry))
		return { kind: 'parried', reflected: amount * COMBAT.parryReflect };
	const mitigated = opts.element
		? amount * resistMultiplier(defender.resist?.[opts.element] ?? 0)
		: amount * (1 - armorReduction(defender.armor));
	return { kind: 'hit', amount: mitigated };
}
