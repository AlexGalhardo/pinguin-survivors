import { COMBAT } from '../data/combat';

/**
 * Player stat model. All percentage stats are fractions (0.08 = +8%).
 * Flat stats: maxHp, hpRegen, armor, pickupRange, luck, projectiles, pierce.
 */
export const STAT_KEYS = [
	'maxHp',
	'maxHpPct',
	'hpRegen',
	'lifesteal',
	'damage',
	'attackSpeed',
	'critChance',
	'critDamage',
	'abilityPower',
	'range',
	'moveSpeed',
	'armor',
	'dodge',
	'pickupRange',
	'luck',
	'projectiles',
	'pierce',
] as const;

export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;
export type StatMods = Partial<Stats>;

export function emptyStats(): Stats {
	const s = {} as Stats;
	for (const k of STAT_KEYS) s[k] = 0;
	return s;
}

/** Returns target + mods * times (does not mutate the inputs). */
export function addMods(target: StatMods, mods: StatMods, times = 1): StatMods {
	const out: StatMods = { ...target };
	for (const k of STAT_KEYS) {
		const v = mods[k];
		if (v !== undefined) out[k] = (out[k] ?? 0) + v * times;
	}
	return out;
}

/** Sums a base and any number of modifier sets into a full Stats object. */
export function computeStats(base: StatMods, ...mods: StatMods[]): Stats {
	let acc: StatMods = { ...base };
	for (const m of mods) acc = addMods(acc, m);
	return { ...emptyStats(), ...acc };
}

/** Max HP after the percentage modifier (never below 1). */
export function finalMaxHp(s: Stats): number {
	return Math.max(1, Math.round(s.maxHp * (1 + s.maxHpPct)));
}

/** Movement speed in px/s (never below 30% of base). */
export function finalMoveSpeed(baseSpeed: number, s: Stats): number {
	return baseSpeed * Math.max(0.3, 1 + s.moveSpeed);
}

// ---------------------------------------------------------------------------
// Combat formulas (docs/balancing.md §4)
// ---------------------------------------------------------------------------

/** Crit multiplier: 1.5 + Crit Damage%. */
export function critMultiplier(s: Stats): number {
	return COMBAT.baseCritMultiplier + s.critDamage;
}

/** Weapon damage: base · (1 + Damage%) · (crit ? 1.5 + CritDamage% : 1). */
export function weaponDamage(base: number, s: Stats, crit: boolean): number {
	return base * Math.max(0, 1 + s.damage) * (crit ? critMultiplier(s) : 1);
}

/** Ability damage: abilityBase · (1 + Damage%) · (1 + AbilityPower%). */
export function abilityDamage(base: number, s: Stats): number {
	return base * Math.max(0, 1 + s.damage) * Math.max(0, 1 + s.abilityPower);
}

/** Cooldown: base / (1 + AttackSpeed%), with Attack Speed floored at -50%. */
export function weaponCooldown(base: number, s: Stats): number {
	return base / (1 + Math.max(COMBAT.minAttackSpeed, s.attackSpeed));
}

/** Armor / (Armor + 15). Negative armor gives a negative reduction (more damage). */
export function armorReduction(armor: number): number {
	if (armor >= 0) return armor / (armor + COMBAT.armorConstant);
	const a = -armor;
	return -(a / (a + COMBAT.armorConstant));
}

/** Damage the player takes after armor: max(1, round(raw · (1 − armorRed))). */
export function damageTaken(raw: number, armor: number): number {
	return Math.max(COMBAT.minDamageTaken, Math.round(raw * (1 - armorReduction(armor))));
}

/** Dodge chance capped at 60%. */
export function dodgeChance(s: Stats): number {
	return Math.min(Math.max(0, s.dodge), COMBAT.maxDodge);
}

/** Range multiplier (never below 20%). */
export function rangeMul(s: Stats): number {
	return Math.max(0.2, 1 + s.range);
}

/** HP regeneration accumulator: returns whole HP to heal and keeps the fraction. */
export class RegenAccumulator {
	private carry = 0;

	tick(regenPerSecond: number, dt: number): number {
		if (regenPerSecond <= 0) return 0;
		this.carry += regenPerSecond * dt;
		const whole = Math.floor(this.carry);
		this.carry -= whole;
		return whole;
	}
}

/** Lifesteal limiter: chance per hit, at most 10 heals per second. */
export class LifestealLimiter {
	private windowStart = 0;
	private count = 0;

	/** Returns HP to heal for this hit (0 or 1). `roll` is a uniform number in [0, 1). */
	onHit(chance: number, roll: number, nowSeconds: number): number {
		if (nowSeconds - this.windowStart >= 1) {
			this.windowStart = nowSeconds;
			this.count = 0;
		}
		if (chance <= 0 || roll >= chance || this.count >= COMBAT.maxLifestealPerSecond) return 0;
		this.count++;
		return COMBAT.lifestealHeal;
	}
}
