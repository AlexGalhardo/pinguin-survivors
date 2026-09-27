import type { StatKey } from '../logic/stats';

/**
 * RPG equipment dropped during a run (P-66, user request): 5 slots, 10 items each
 * (3 common, 4 rare, 3 legendary). Common zombies drop commons, elites drop rares and bosses
 * drop legendaries. Items belong to the run: equip/unequip them in the pause menu.
 */
export const GEAR_SLOTS = ['helmet', 'armor', 'legs', 'ring', 'amulet'] as const;
export type GearSlot = (typeof GEAR_SLOTS)[number];

export const GEAR_RARITIES = ['common', 'rare', 'legendary'] as const;
export type GearRarity = (typeof GEAR_RARITIES)[number];

export interface GearDef {
	id: string;
	slot: GearSlot;
	rarity: GearRarity;
	stats: Partial<Record<StatKey, number>>;
}

const g = (
	id: string,
	slot: GearSlot,
	rarity: GearRarity,
	stats: Partial<Record<StatKey, number>>,
): GearDef => ({ id, slot, rarity, stats });

export const GEAR: readonly GearDef[] = [
	// Helmets: HP, regen, resistances.
	g('helmet.wool', 'helmet', 'common', { maxHp: 6 }),
	g('helmet.pot', 'helmet', 'common', { armor: 1 }),
	g('helmet.goggles', 'helmet', 'common', { 'resist.ice': 0.06 }),
	g('helmet.miner', 'helmet', 'rare', { maxHp: 12, regen: 0.2 }),
	g('helmet.diver', 'helmet', 'rare', { 'resist.fire': 0.1, 'resist.energy': 0.1 }),
	g('helmet.viking', 'helmet', 'rare', { maxHp: 10, armor: 2 }),
	g('helmet.hood', 'helmet', 'rare', { dodge: 0.03, regen: 0.15 }),
	g('helmet.crown', 'helmet', 'legendary', { maxHp: 25, regen: 0.5, luck: 0.05 }),
	g('helmet.skull', 'helmet', 'legendary', { armor: 4, 'resist.earth': 0.15, maxHp: 15 }),
	g('helmet.halo', 'helmet', 'legendary', { regen: 0.8, xpGain: 0.15 }),
	// Body armor: armor and HP.
	g('armor.parka', 'armor', 'common', { maxHp: 8 }),
	g('armor.leather', 'armor', 'common', { armor: 1.5 }),
	g('armor.lifevest', 'armor', 'common', { maxHp: 5, regen: 0.1 }),
	g('armor.chainmail', 'armor', 'rare', { armor: 3, maxHp: 8 }),
	g('armor.kevlar', 'armor', 'rare', { armor: 4 }),
	g('armor.bloodcoat', 'armor', 'rare', { maxHp: 15, lifesteal: 0.01 }),
	g('armor.hazmat', 'armor', 'rare', { 'resist.fire': 0.12, 'resist.earth': 0.12 }),
	g('armor.juggernaut', 'armor', 'legendary', { armor: 7, maxHp: 30 }),
	g('armor.dragonscale', 'armor', 'legendary', { armor: 5, 'resist.fire': 0.25, regen: 0.4 }),
	g('armor.phantom', 'armor', 'legendary', { dodge: 0.08, armor: 3, moveSpeed: 8 }),
	// Legs: speed and dodge.
	g('legs.boots', 'legs', 'common', { moveSpeed: 5 }),
	g('legs.skates', 'legs', 'common', { moveSpeed: 8 }),
	g('legs.padded', 'legs', 'common', { dodge: 0.015 }),
	g('legs.cargo', 'legs', 'rare', { moveSpeed: 8, pickupRange: 15 }),
	g('legs.ninja', 'legs', 'rare', { dodge: 0.04 }),
	g('legs.greaves', 'legs', 'rare', { armor: 2, moveSpeed: 5 }),
	g('legs.flippers', 'legs', 'rare', { moveSpeed: 12 }),
	g('legs.windwalkers', 'legs', 'legendary', { moveSpeed: 18, dodge: 0.05 }),
	g('legs.titan', 'legs', 'legendary', { armor: 4, maxHp: 20, parry: 0.05 }),
	g('legs.hermes', 'legs', 'legendary', { moveSpeed: 15, attackSpeed: 0.1 }),
	// Rings: offense.
	g('ring.copper', 'ring', 'common', { damage: 0.04 }),
	g('ring.bone', 'ring', 'common', { crit: 0.02 }),
	g('ring.iron', 'ring', 'common', { attackSpeed: 0.04 }),
	g('ring.ruby', 'ring', 'rare', { damage: 0.08, 'tagMul.magic': 0.05 }),
	g('ring.onyx', 'ring', 'rare', { crit: 0.04, critDamage: 0.15 }),
	g('ring.silver', 'ring', 'rare', { attackSpeed: 0.08 }),
	g('ring.fang', 'ring', 'rare', { bleedChance: 0.1, 'tagMul.melee': 0.06 }),
	g('ring.doom', 'ring', 'legendary', { damage: 0.18, crit: 0.05 }),
	g('ring.berserker', 'ring', 'legendary', { attackSpeed: 0.15, lifesteal: 0.02 }),
	g('ring.eclipse', 'ring', 'legendary', { critDamage: 0.4, crit: 0.06 }),
	// Amulets: utility and elements.
	g('amulet.shell', 'amulet', 'common', { xpGain: 0.06 }),
	g('amulet.clover', 'amulet', 'common', { luck: 0.03 }),
	g('amulet.magnet', 'amulet', 'common', { pickupRange: 20 }),
	g('amulet.ember', 'amulet', 'rare', { burnChance: 0.08, 'tagMul.firearm': 0.06 }),
	g('amulet.frost', 'amulet', 'rare', { chillChance: 0.08, 'resist.ice': 0.1 }),
	g('amulet.storm', 'amulet', 'rare', { shockChance: 0.08, 'resist.energy': 0.1 }),
	g('amulet.venom', 'amulet', 'rare', { poisonChance: 0.1, area: 0.08 }),
	g('amulet.phoenix', 'amulet', 'legendary', { regen: 0.6, maxHp: 20, burnChance: 0.1 }),
	g('amulet.void', 'amulet', 'legendary', { area: 0.25, damage: 0.1 }),
	g('amulet.fortune', 'amulet', 'legendary', { luck: 0.12, xpGain: 0.2, pickupRange: 30 }),
];

export const GEAR_BY_ID: Readonly<Record<string, GearDef>> = Object.fromEntries(
	GEAR.map((d) => [d.id, d]),
);

/** Drops (per kill) and their rarity by enemy kind; health packs heal a share of max HP. */
export const DROPS = {
	gear: { commonChance: 0.004, eliteChance: 0.3, bossChance: 1 },
	heal: {
		commonChance: 0.012,
		eliteChance: 0.25,
		bossChance: 1,
		/** 50% small (+25%), 30% medium (+50%), 20% big (+75%) (user request). */
		tiers: [
			{ heal: 0.25, weight: 50 },
			{ heal: 0.5, weight: 30 },
			{ heal: 0.75, weight: 20 },
		],
	},
	/** Seconds a dropped gear item blinks on the ground before it fades away. */
	gearLifetime: 60,
} as const;
