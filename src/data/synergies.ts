import type { StatMods } from '../logic/stats';

export type Tag = 'energy' | 'kinetic' | 'cryo' | 'psi' | 'bio' | 'tech';

export const TAGS: readonly Tag[] = ['energy', 'kinetic', 'cryo', 'psi', 'bio', 'tech'];

/**
 * Synergies (Beta): owning abilities and items with the same tag grants a bonus.
 * Tiers are cumulative thresholds: the highest reached tier applies.
 */
export const SYNERGIES: Record<Tag, { count: number; mods: StatMods }[]> = {
	energy: [
		{ count: 2, mods: { damage: 0.1 } },
		{ count: 4, mods: { damage: 0.25 } },
		{ count: 6, mods: { damage: 0.4, attackSpeed: 0.1 } },
	],
	kinetic: [
		{ count: 2, mods: { attackSpeed: 0.1 } },
		{ count: 4, mods: { attackSpeed: 0.25 } },
		{ count: 6, mods: { attackSpeed: 0.35, projectiles: 1 } },
	],
	cryo: [
		{ count: 2, mods: { armor: 1, dodge: 0.05 } },
		{ count: 4, mods: { armor: 3, dodge: 0.1 } },
		{ count: 6, mods: { armor: 5, dodge: 0.15 } },
	],
	psi: [
		{ count: 2, mods: { abilityPower: 0.15 } },
		{ count: 4, mods: { abilityPower: 0.35 } },
		{ count: 6, mods: { abilityPower: 0.6 } },
	],
	bio: [
		{ count: 2, mods: { hpRegen: 0.5 } },
		{ count: 4, mods: { hpRegen: 1.5, lifesteal: 0.03 } },
		{ count: 6, mods: { hpRegen: 2.5, lifesteal: 0.06 } },
	],
	tech: [
		{ count: 2, mods: { pickupRange: 20, luck: 10 } },
		{ count: 4, mods: { pickupRange: 40, luck: 25, critChance: 0.05 } },
		{ count: 6, mods: { pickupRange: 60, luck: 40, critChance: 0.1 } },
	],
};
