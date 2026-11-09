/**
 * One rarity scale for weapons and equipment (ADR-017): I white, II blue, III green, IV purple,
 * V orange. The rarity decides how many random affixes (stat bonuses) the item carries, where it
 * can come from and, for weapons, which art and stat tier it uses.
 */
export const RARITIES = [1, 2, 3, 4, 5] as const;
export type Rarity = (typeof RARITIES)[number];

export const RARITY_NUMERALS: Readonly<Record<Rarity, string>> = {
	1: 'I',
	2: 'II',
	3: 'III',
	4: 'IV',
	5: 'V',
};

/** Random affixes by rarity: I has none, each step adds one. */
export const AFFIX_COUNT: Readonly<Record<Rarity, number>> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 };

/** The shop sells rarities I to V; IV and V also ask for a material (ADR-021). */
export const SHOP_MAX_RARITY: Rarity = 5;

/** Weapon fusion (and so the shop) stops at III; IV and V only come from drops. */
export const WEAPON_FUSE_MAX: Rarity = 3;

/** Where the higher rarities come from: IV only from Elite enemies, V only from Bosses. */
export const DROP_RARITY = { elite: 4, boss: 5 } as const satisfies Record<string, Rarity>;

/**
 * Weapon stats and art by rarity: I to IV use the four existing tiers (`weapon.<id>.t1…t4`); V
 * reuses the tier IV art (orange glow) and multiplies its damage by this factor.
 */
export const WEAPON_V_DAMAGE_MUL = 1.0;
export const weaponVisualTier = (rarity: Rarity): 1 | 2 | 3 | 4 =>
	Math.min(4, rarity) as 1 | 2 | 3 | 4;

/** Legacy equipment rarities (saves and drops before the unified scale) → the new scale. */
export const LEGACY_GEAR_RARITY = { common: 1, rare: 2, legendary: 3 } as const satisfies Record<
	string,
	Rarity
>;

export const isRarity = (v: unknown): v is Rarity => RARITIES.includes(v as Rarity);
