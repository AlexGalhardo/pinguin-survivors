export type AbilityId =
	| 'orbital_drones'
	| 'chain_lightning'
	| 'plasma_nova'
	| 'cryo_field'
	| 'homing_missiles'
	| 'laser_beam';

export const ABILITY_IDS: readonly AbilityId[] = [
	'orbital_drones',
	'chain_lightning',
	'plasma_nova',
	'cryo_field',
	'homing_missiles',
	'laser_beam',
];

export const MAX_ABILITIES = 6;
export const MAX_ABILITY_LEVEL = 5;

/**
 * Level 1 values and growth per level (docs/balancing.md §8).
 * Damage is multiplied by (1 + Damage%) · (1 + Ability Power%); radii/lengths by Range%.
 */
export const ABILITY_DATA = {
	orbital_drones: {
		count: { base: 2, perLevel: 1 },
		damage: { base: 4, perLevel: 2 },
		orbitRadius: 40,
		hitRadius: 7,
		/** Each enemy can be hit by the drones once every `tick` seconds. */
		tick: 0.3,
		/** Orbit angular speed (rad/s). */
		spin: 3,
	},
	chain_lightning: {
		damage: { base: 8, perLevel: 3 },
		jumps: { base: 3, perLevel: 1 },
		cooldown: { base: 2.0, perLevel: -0.15 },
		range: 180,
		jumpRange: 90,
	},
	plasma_nova: {
		damage: { base: 10, perLevel: 4 },
		radius: { base: 60, perLevel: 10 },
		cooldown: { base: 3.0, perLevel: -0.2 },
		knockback: 80,
	},
	cryo_field: {
		dps: { base: 1.5, perLevel: 1 },
		radius: { base: 50, perLevel: 8 },
		slow: { base: 0.25, perLevel: 0.05 },
		tick: 0.5,
	},
	homing_missiles: {
		count: { base: 2, perLevel: 1 },
		damage: { base: 7, perLevel: 2 },
		cooldown: 2.5,
		speed: 200,
		turnRate: 6,
		range: 420,
		targetRange: 300,
	},
	laser_beam: {
		damage: { base: 5, perLevel: 2 },
		duration: { base: 0.8, perLevel: 0.2 },
		width: { base: 6, perLevel: 2 },
		cooldown: 4.0,
		tick: 0.15,
		length: 260,
		densityRadius: 48,
	},
} as const;
