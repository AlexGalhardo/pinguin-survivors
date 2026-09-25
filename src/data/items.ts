import type { StatMods } from '../logic/stats';
import type { Rarity } from './rarity';
import type { Tag } from './synergies';

export interface ItemDef {
	id: string;
	name: string;
	rarity: Rarity;
	basePrice: number;
	mods: StatMods;
	/** Icon id (icon.<id>); code-drawn stat icons until the final art. */
	icon: string;
	tags: Tag[];
}

/** Items with Brotato-style trade-offs (docs/balancing.md §7). */
export const ITEMS: readonly ItemDef[] = [
	// Alpha (12)
	{
		id: 'nano_plating',
		name: 'NANO PLATING',
		rarity: 'common',
		basePrice: 15,
		mods: { armor: 3, moveSpeed: -0.03 },
		icon: 'armor',
		tags: ['tech'],
	},
	{
		id: 'overclocked_core',
		name: 'OVERCLOCKED CORE',
		rarity: 'rare',
		basePrice: 30,
		mods: { attackSpeed: 0.25, maxHpPct: -0.1 },
		icon: 'attackSpeed',
		tags: ['energy'],
	},
	{
		id: 'glass_cannon_lens',
		name: 'GLASS CANNON LENS',
		rarity: 'epic',
		basePrice: 55,
		mods: { damage: 0.4, maxHpPct: -0.25 },
		icon: 'damage',
		tags: ['energy'],
	},
	{
		id: 'medi_gel_pack',
		name: 'MEDI-GEL PACK',
		rarity: 'common',
		basePrice: 12,
		mods: { hpRegen: 1 },
		icon: 'hpRegen',
		tags: ['bio'],
	},
	{
		id: 'vampiric_circuit',
		name: 'VAMPIRIC CIRCUIT',
		rarity: 'rare',
		basePrice: 35,
		mods: { lifesteal: 0.06, hpRegen: -1 },
		icon: 'lifesteal',
		tags: ['bio'],
	},
	{
		id: 'gravity_magnet',
		name: 'GRAVITY MAGNET',
		rarity: 'common',
		basePrice: 10,
		mods: { pickupRange: 60 },
		icon: 'pickupRange',
		tags: ['tech'],
	},
	{
		id: 'lucky_clover_chip',
		name: 'LUCKY CLOVER CHIP',
		rarity: 'rare',
		basePrice: 30,
		mods: { luck: 25 },
		icon: 'luck',
		tags: ['tech'],
	},
	{
		id: 'heavy_boots',
		name: 'HEAVY BOOTS',
		rarity: 'common',
		basePrice: 15,
		mods: { maxHp: 8, moveSpeed: -0.05 },
		icon: 'maxHp',
		tags: ['kinetic'],
	},
	{
		id: 'psi_amplifier',
		name: 'PSI AMPLIFIER',
		rarity: 'epic',
		basePrice: 55,
		mods: { abilityPower: 0.35, damage: -0.1 },
		icon: 'abilityPower',
		tags: ['psi'],
	},
	{
		id: 'targeting_module',
		name: 'TARGETING MODULE',
		rarity: 'rare',
		basePrice: 30,
		mods: { critChance: 0.12 },
		icon: 'critChance',
		tags: ['tech'],
	},
	{
		id: 'ion_thrusters',
		name: 'ION THRUSTERS',
		rarity: 'rare',
		basePrice: 28,
		mods: { moveSpeed: 0.15, armor: -2 },
		icon: 'moveSpeed',
		tags: ['energy'],
	},
	{
		id: 'singularity_shard',
		name: 'SINGULARITY SHARD',
		rarity: 'legendary',
		basePrice: 90,
		mods: { projectiles: 1, pierce: 1, attackSpeed: -0.15 },
		icon: 'projectiles',
		tags: ['psi'],
	},
	// Beta: evolution items (10)
	{
		id: 'drone_bay',
		name: 'DRONE BAY',
		rarity: 'rare',
		basePrice: 32,
		mods: { attackSpeed: 0.08, armor: 1 },
		icon: 'orbital_drones',
		tags: ['kinetic'],
	},
	{
		id: 'tesla_coil',
		name: 'TESLA COIL',
		rarity: 'rare',
		basePrice: 32,
		mods: { damage: 0.1 },
		icon: 'chain_lightning',
		tags: ['energy'],
	},
	{
		id: 'fusion_reactor',
		name: 'FUSION REACTOR',
		rarity: 'epic',
		basePrice: 50,
		mods: { abilityPower: 0.15, maxHp: 5 },
		icon: 'plasma_nova',
		tags: ['energy'],
	},
	{
		id: 'cryo_core',
		name: 'CRYO CORE',
		rarity: 'rare',
		basePrice: 30,
		mods: { armor: 2, dodge: 0.03 },
		icon: 'cryo_field',
		tags: ['cryo'],
	},
	{
		id: 'guidance_ai',
		name: 'GUIDANCE AI',
		rarity: 'rare',
		basePrice: 30,
		mods: { critChance: 0.06, range: 0.1 },
		icon: 'homing_missiles',
		tags: ['tech'],
	},
	{
		id: 'focusing_prism',
		name: 'FOCUSING PRISM',
		rarity: 'epic',
		basePrice: 50,
		mods: { range: 0.2, critDamage: 0.2 },
		icon: 'laser_beam',
		tags: ['energy'],
	},
	{
		id: 'auto_loader',
		name: 'AUTO LOADER',
		rarity: 'rare',
		basePrice: 30,
		mods: { attackSpeed: 0.15, moveSpeed: -0.03 },
		icon: 'arc_turret',
		tags: ['kinetic'],
	},
	{
		id: 'diamond_edge',
		name: 'DIAMOND EDGE',
		rarity: 'rare',
		basePrice: 32,
		mods: { critDamage: 0.3 },
		icon: 'saw_disc',
		tags: ['kinetic'],
	},
	{
		id: 'event_horizon',
		name: 'EVENT HORIZON',
		rarity: 'epic',
		basePrice: 55,
		mods: { abilityPower: 0.2, moveSpeed: -0.05 },
		icon: 'gravity_well',
		tags: ['psi'],
	},
	{
		id: 'hive_mind',
		name: 'HIVE MIND',
		rarity: 'epic',
		basePrice: 50,
		mods: { hpRegen: 1, abilityPower: 0.1 },
		icon: 'nanite_swarm',
		tags: ['bio'],
	},
	// Beta: general items (18)
	{
		id: 'frost_plating',
		name: 'FROST PLATING',
		rarity: 'common',
		basePrice: 14,
		mods: { armor: 2, moveSpeed: -0.02 },
		icon: 'armor',
		tags: ['cryo'],
	},
	{
		id: 'cryo_boots',
		name: 'CRYO BOOTS',
		rarity: 'common',
		basePrice: 12,
		mods: { moveSpeed: 0.06, dodge: 0.02 },
		icon: 'moveSpeed',
		tags: ['cryo'],
	},
	{
		id: 'berserker_chip',
		name: 'BERSERKER CHIP',
		rarity: 'rare',
		basePrice: 30,
		mods: { damage: 0.2, armor: -2 },
		icon: 'damage',
		tags: ['kinetic'],
	},
	{
		id: 'adrenal_injector',
		name: 'ADRENAL INJECTOR',
		rarity: 'common',
		basePrice: 12,
		mods: { attackSpeed: 0.08, hpRegen: -0.3 },
		icon: 'attackSpeed',
		tags: ['bio'],
	},
	{
		id: 'scrap_armor',
		name: 'SCRAP ARMOR',
		rarity: 'common',
		basePrice: 10,
		mods: { maxHp: 5, dodge: -0.02 },
		icon: 'maxHp',
		tags: ['tech'],
	},
	{
		id: 'regen_matrix',
		name: 'REGEN MATRIX',
		rarity: 'rare',
		basePrice: 32,
		mods: { hpRegen: 1.5, damage: -0.05 },
		icon: 'hpRegen',
		tags: ['bio'],
	},
	{
		id: 'psionic_crown',
		name: 'PSIONIC CROWN',
		rarity: 'legendary',
		basePrice: 90,
		mods: { abilityPower: 0.5, maxHpPct: -0.1 },
		icon: 'abilityPower',
		tags: ['psi'],
	},
	{
		id: 'phase_cloak',
		name: 'PHASE CLOAK',
		rarity: 'epic',
		basePrice: 55,
		mods: { dodge: 0.12, maxHpPct: -0.1 },
		icon: 'dodge',
		tags: ['psi'],
	},
	{
		id: 'railgun_barrel',
		name: 'RAILGUN BARREL',
		rarity: 'epic',
		basePrice: 55,
		mods: { damage: 0.25, range: 0.2, attackSpeed: -0.1 },
		icon: 'range',
		tags: ['kinetic'],
	},
	{
		id: 'energy_shield',
		name: 'ENERGY SHIELD',
		rarity: 'epic',
		basePrice: 50,
		mods: { maxHp: 15, armor: 2, moveSpeed: -0.05 },
		icon: 'armor',
		tags: ['energy'],
	},
	{
		id: 'scanner_visor',
		name: 'SCANNER VISOR',
		rarity: 'common',
		basePrice: 10,
		mods: { range: 0.1, luck: 5 },
		icon: 'range',
		tags: ['tech'],
	},
	{
		id: 'blood_pump',
		name: 'BLOOD PUMP',
		rarity: 'rare',
		basePrice: 30,
		mods: { lifesteal: 0.04, maxHp: 5 },
		icon: 'lifesteal',
		tags: ['bio'],
	},
	{
		id: 'overdrive_battery',
		name: 'OVERDRIVE BATTERY',
		rarity: 'legendary',
		basePrice: 95,
		mods: { attackSpeed: 0.35, damage: 0.15, maxHpPct: -0.15 },
		icon: 'attackSpeed',
		tags: ['energy'],
	},
	{
		id: 'quantum_dice',
		name: 'QUANTUM DICE',
		rarity: 'rare',
		basePrice: 28,
		mods: { luck: 30, critChance: 0.03 },
		icon: 'luck',
		tags: ['psi'],
	},
	{
		id: 'titan_frame',
		name: 'TITAN FRAME',
		rarity: 'legendary',
		basePrice: 90,
		mods: { maxHp: 30, armor: 5, moveSpeed: -0.1 },
		icon: 'armor',
		tags: ['tech'],
	},
	{
		id: 'mind_link',
		name: 'MIND LINK',
		rarity: 'rare',
		basePrice: 30,
		mods: { abilityPower: 0.12, range: 0.05 },
		icon: 'abilityPower',
		tags: ['psi'],
	},
	{
		id: 'spare_battery',
		name: 'SPARE BATTERY',
		rarity: 'common',
		basePrice: 11,
		mods: { attackSpeed: 0.05, abilityPower: 0.05 },
		icon: 'attackSpeed',
		tags: ['energy'],
	},
	{
		id: 'hunter_goggles',
		name: 'HUNTER GOGGLES',
		rarity: 'common',
		basePrice: 12,
		mods: { critChance: 0.05 },
		icon: 'critChance',
		tags: ['tech'],
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
	/** Selling (recycling) an owned item refunds this share of its current price. */
	sellRefund: 0.5,
} as const;

export const MEDKIT = {
	/** Drop chance per kill: 0.5% · (1 + Luck/100). */
	baseChance: 0.005,
	/** Heals 20% of max HP. */
	healPct: 0.2,
} as const;
