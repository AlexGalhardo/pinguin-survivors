import type { Tag } from './synergies';

export type AbilityId =
	| 'orbital_drones'
	| 'chain_lightning'
	| 'plasma_nova'
	| 'cryo_field'
	| 'homing_missiles'
	| 'laser_beam'
	| 'arc_turret'
	| 'saw_disc'
	| 'gravity_well'
	| 'nanite_swarm';

export const ABILITY_IDS: readonly AbilityId[] = [
	'orbital_drones',
	'chain_lightning',
	'plasma_nova',
	'cryo_field',
	'homing_missiles',
	'laser_beam',
	'arc_turret',
	'saw_disc',
	'gravity_well',
	'nanite_swarm',
];

export const MAX_ABILITIES = 6;
export const MAX_ABILITY_LEVEL = 5;

/** Synergy tag of each ability. */
export const ABILITY_TAGS: Record<AbilityId, Tag> = {
	orbital_drones: 'kinetic',
	chain_lightning: 'energy',
	plasma_nova: 'energy',
	cryo_field: 'cryo',
	homing_missiles: 'tech',
	laser_beam: 'energy',
	arc_turret: 'tech',
	saw_disc: 'kinetic',
	gravity_well: 'psi',
	nanite_swarm: 'bio',
};

/**
 * Evolutions (Beta): ability at level 5 + this item owned -> evolved ability.
 * Evolved abilities deal EVOLUTION.damageMul more damage and get a special upgrade.
 */
export const EVOLUTION_ITEM: Record<AbilityId, string> = {
	orbital_drones: 'drone_bay',
	chain_lightning: 'tesla_coil',
	plasma_nova: 'fusion_reactor',
	cryo_field: 'cryo_core',
	homing_missiles: 'guidance_ai',
	laser_beam: 'focusing_prism',
	arc_turret: 'auto_loader',
	saw_disc: 'diamond_edge',
	gravity_well: 'event_horizon',
	nanite_swarm: 'hive_mind',
};

export const EVOLUTION = {
	damageMul: 1.75,
	/** Extra drones / jumps / missiles / discs / turrets when evolved. */
	extraCount: 2,
	/** Radius/area multiplier when evolved (nova, cryo, gravity well, laser width). */
	areaMul: 1.35,
	/** Cryo Field evolved slow. */
	cryoSlow: 0.7,
} as const;

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
	arc_turret: {
		damage: { base: 5, perLevel: 2 },
		turrets: { base: 1, perLevel: 0.5 },
		/** Seconds between turret shots. */
		fireEvery: 0.7,
		/** Seconds between deployments. */
		deployEvery: 5,
		lifetime: 10,
		range: 200,
		shotSpeed: 320,
	},
	saw_disc: {
		damage: { base: 6, perLevel: 3 },
		count: { base: 1, perLevel: 0.5 },
		cooldown: 2.2,
		speed: 170,
		range: 190,
		spin: 900,
	},
	gravity_well: {
		damage: { base: 3, perLevel: 1.5 },
		radius: { base: 60, perLevel: 8 },
		cooldown: 5,
		duration: 2.5,
		tick: 0.5,
		/** Pull speed toward the center (px/s). */
		pull: 90,
	},
	nanite_swarm: {
		dps: { base: 4, perLevel: 2 },
		targets: { base: 1, perLevel: 0.5 },
		cooldown: 3,
		duration: 3,
		spreadRadius: 40,
		range: 220,
	},
} as const;
