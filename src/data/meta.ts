import type { StatMods } from '../logic/stats';

/** Meta currency earned per run (D-41): 2·wave + kills/50 + 10·bosses. */
export const CORES = { perWave: 2, killsPerCore: 50, perBoss: 10 } as const;

export interface MetaUpgradeDef {
	id: string;
	name: string;
	desc: string;
	icon: string;
	/** Cost of each level (index = current level). */
	costs: readonly number[];
	/** Stat bonus per level. */
	mods?: StatMods;
	/** Starting gold per level. */
	startGold?: number;
	/** Starts the run with a revive charge (1 level). */
	startRevive?: boolean;
}

/** Permanent upgrade tree (D-42): small bonuses so the run balance still holds. */
export const META_UPGRADES: readonly MetaUpgradeDef[] = [
	{
		id: 'vitality',
		name: 'VITALITY',
		desc: '+3 MAX HP',
		icon: 'maxHp',
		costs: [20, 40, 70, 110, 160],
		mods: { maxHp: 3 },
	},
	{
		id: 'firepower',
		name: 'FIREPOWER',
		desc: '+3% DAMAGE',
		icon: 'damage',
		costs: [25, 50, 85, 130, 190],
		mods: { damage: 0.03 },
	},
	{
		id: 'reflexes',
		name: 'REFLEXES',
		desc: '+3% ATK SPEED',
		icon: 'attackSpeed',
		costs: [25, 50, 85, 130, 190],
		mods: { attackSpeed: 0.03 },
	},
	{
		id: 'plating',
		name: 'PLATING',
		desc: '+1 ARMOR',
		icon: 'armor',
		costs: [40, 90, 160],
		mods: { armor: 1 },
	},
	{
		id: 'fortune',
		name: 'FORTUNE',
		desc: '+5 LUCK',
		icon: 'luck',
		costs: [15, 30, 55, 85, 120],
		mods: { luck: 5 },
	},
	{
		id: 'magnet',
		name: 'MAGNET',
		desc: '+10 PICKUP RANGE',
		icon: 'pickupRange',
		costs: [10, 20, 35, 55, 80],
		mods: { pickupRange: 10 },
	},
	{
		id: 'funding',
		name: 'FUNDING',
		desc: '+10 STARTING GOLD',
		icon: 'gold',
		costs: [15, 30, 50, 75, 105],
		startGold: 10,
	},
	{
		id: 'second_wind',
		name: 'SECOND WIND',
		desc: 'START WITH A REVIVE',
		icon: 'revive',
		costs: [300],
		startRevive: true,
	},
];
