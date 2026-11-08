import type { HeroId } from '../config/constants';
import type { WeaponId } from './weapon-lines';

/** Starting weapons each hero can pick from the start (GDD §6). */
export const STARTING_WEAPONS: Readonly<Record<HeroId, readonly [WeaponId, WeaponId, WeaponId]>> = {
	jack: ['machete', 'knives', 'fishBoomerang'],
	bob: ['doubleBarrel', 'auxPistol', 'crossbow'],
	lucia: ['elementStaff', 'iceShards', 'flameRing'],
};

/**
 * Extra starting weapons unlocked with Pearls (GDD §6). Placeholder costs: the Pearl economy
 * is tuned in T2.7.
 */
export const STARTING_WEAPON_UNLOCKS: readonly { weapon: WeaponId; cost: number }[] = [
	{ weapon: 'hammer', cost: 150 },
	{ weapon: 'bladeWhirl', cost: 250 },
	{ weapon: 'molotov', cost: 150 },
	{ weapon: 'mine', cost: 200 },
	{ weapon: 'grenadeBelt', cost: 300 },
	{ weapon: 'droneSentinel', cost: 300 },
	{ weapon: 'lightningTotem', cost: 200 },
	{ weapon: 'poisonCloud', cost: 150 },
];
