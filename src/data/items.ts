import type { StatMods } from '../logic/stats';
import type { Rarity } from './rarity';

export interface ItemDef {
	id: string;
	name: string;
	rarity: Rarity;
	basePrice: number;
	mods: StatMods;
	/** Icon id (icon.<id>); Alpha reuses the stat icons. */
	icon: string;
}

/** Alpha items with Brotato-style trade-offs (docs/balancing.md §7). */
export const ITEMS: readonly ItemDef[] = [
	{
		id: 'nano_plating',
		name: 'NANO PLATING',
		rarity: 'common',
		basePrice: 15,
		mods: { armor: 3, moveSpeed: -0.03 },
		icon: 'armor',
	},
	{
		id: 'overclocked_core',
		name: 'OVERCLOCKED CORE',
		rarity: 'rare',
		basePrice: 30,
		mods: { attackSpeed: 0.25, maxHpPct: -0.1 },
		icon: 'attackSpeed',
	},
	{
		id: 'glass_cannon_lens',
		name: 'GLASS CANNON LENS',
		rarity: 'epic',
		basePrice: 55,
		mods: { damage: 0.4, maxHpPct: -0.25 },
		icon: 'damage',
	},
	{
		id: 'medi_gel_pack',
		name: 'MEDI-GEL PACK',
		rarity: 'common',
		basePrice: 12,
		mods: { hpRegen: 1 },
		icon: 'hpRegen',
	},
	{
		id: 'vampiric_circuit',
		name: 'VAMPIRIC CIRCUIT',
		rarity: 'rare',
		basePrice: 35,
		mods: { lifesteal: 0.06, hpRegen: -1 },
		icon: 'lifesteal',
	},
	{
		id: 'gravity_magnet',
		name: 'GRAVITY MAGNET',
		rarity: 'common',
		basePrice: 10,
		mods: { pickupRange: 60 },
		icon: 'pickupRange',
	},
	{
		id: 'lucky_clover_chip',
		name: 'LUCKY CLOVER CHIP',
		rarity: 'rare',
		basePrice: 30,
		mods: { luck: 25 },
		icon: 'luck',
	},
	{
		id: 'heavy_boots',
		name: 'HEAVY BOOTS',
		rarity: 'common',
		basePrice: 15,
		mods: { maxHp: 8, moveSpeed: -0.05 },
		icon: 'maxHp',
	},
	{
		id: 'psi_amplifier',
		name: 'PSI AMPLIFIER',
		rarity: 'epic',
		basePrice: 55,
		mods: { abilityPower: 0.35, damage: -0.1 },
		icon: 'abilityPower',
	},
	{
		id: 'targeting_module',
		name: 'TARGETING MODULE',
		rarity: 'rare',
		basePrice: 30,
		mods: { critChance: 0.12 },
		icon: 'critChance',
	},
	{
		id: 'ion_thrusters',
		name: 'ION THRUSTERS',
		rarity: 'rare',
		basePrice: 28,
		mods: { moveSpeed: 0.15, armor: -2 },
		icon: 'moveSpeed',
	},
	{
		id: 'singularity_shard',
		name: 'SINGULARITY SHARD',
		rarity: 'legendary',
		basePrice: 90,
		mods: { projectiles: 1, pierce: 1, attackSpeed: -0.15 },
		icon: 'projectiles',
	},
];

const BY_ID = new Map(ITEMS.map((i) => [i.id, i]));

export function getItem(id: string): ItemDef | undefined {
	return BY_ID.get(id);
}

/** Item modifiers lookup for runStats(). */
export function itemMods(id: string): StatMods | undefined {
	return BY_ID.get(id)?.mods;
}

/** Shop and economy constants (docs/balancing.md §7 and §9). */
export const SHOP = {
	slots: 4,
	/** price = basePrice · (1 + 0.1(N-1)) */
	pricePerWave: 0.1,
	/** re-roll = 1 + N (+1 per re-roll) */
	rerollBase: 1,
	rerollPerWave: 1,
	rerollPerReroll: 1,
} as const;

export const MEDKIT = {
	/** Drop chance per kill: 0.5% · (1 + Luck/100). */
	baseChance: 0.005,
	/** Heals 20% of max HP. */
	healPct: 0.2,
} as const;
