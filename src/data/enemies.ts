import { TEX } from '../art/manifest';

export type EnemyType = 'chaser' | 'runner' | 'shooter' | 'tank' | 'boss';
export type EnemyAi = 'chase' | 'keepDistance' | 'boss';

export interface EnemyDef {
	type: EnemyType;
	texture: string;
	ai: EnemyAi;
	hp: number;
	/** Contact damage. */
	damage: number;
	/** px/s */
	speed: number;
	/** Collision radius (px). */
	radius: number;
	gold: number;
	/** Multiplier applied to knockback received (1 = full, 0.3 = resistant). */
	knockbackTaken: number;
	/** Spawn weight among unlocked types (0 = never from the random pool). */
	weight: number;
	/** First wave where this type can spawn from the random pool. */
	fromWave: number;
	/** Spawns in groups of [min, max]. */
	group?: [number, number];
	/** Ranged attack (shooter). */
	ranged?: { keepDistance: number; cooldown: number; projectileSpeed: number; damage: number };
}

/** Base values before wave multipliers (docs/balancing.md §2). */
export const ENEMIES: Record<EnemyType, EnemyDef> = {
	chaser: {
		type: 'chaser',
		texture: TEX.enemyChaser,
		ai: 'chase',
		hp: 10,
		damage: 5,
		speed: 60,
		radius: 10,
		gold: 1,
		knockbackTaken: 1,
		weight: 50,
		fromWave: 1,
	},
	runner: {
		type: 'runner',
		texture: TEX.enemyRunner,
		ai: 'chase',
		hp: 5,
		damage: 3,
		speed: 110,
		radius: 7,
		gold: 1,
		knockbackTaken: 1,
		weight: 25,
		fromWave: 2,
		group: [3, 5],
	},
	shooter: {
		type: 'shooter',
		texture: TEX.enemyShooter,
		ai: 'keepDistance',
		hp: 12,
		damage: 4,
		speed: 45,
		radius: 10,
		gold: 2,
		knockbackTaken: 1,
		weight: 15,
		fromWave: 3,
		ranged: { keepDistance: 150, cooldown: 2.5, projectileSpeed: 120, damage: 6 },
	},
	tank: {
		type: 'tank',
		texture: TEX.enemyTank,
		ai: 'chase',
		hp: 40,
		damage: 10,
		speed: 35,
		radius: 16,
		gold: 3,
		knockbackTaken: 0.3,
		weight: 10,
		fromWave: 4,
	},
	boss: {
		type: 'boss',
		texture: TEX.enemyBoss,
		ai: 'boss',
		hp: 400,
		damage: 15,
		speed: 40,
		radius: 28,
		gold: 50,
		knockbackTaken: 0,
		weight: 0,
		fromWave: 10,
	},
};

export const POOL_TYPES: readonly EnemyType[] = ['chaser', 'runner', 'shooter', 'tank'];

/** Contact damage cooldown per enemy (s) and player invulnerability after a hit (s). */
export const CONTACT_COOLDOWN = 0.5;
export const PLAYER_INVULN = 0.4;

/** Spawn rules. */
export const SPAWN = {
	telegraph: 0.8,
	minPlayerDistance: 140,
	edgeChance: 0.5,
	edgeInset: 16,
	groupSpread: 18,
} as const;

/** Enemy steering. */
export const STEERING = {
	/** Strength of the push between overlapping enemies (px/s per px of overlap). */
	separation: 18,
	/** Knockback velocity decay per second (exponential). */
	knockbackDecay: 8,
	/** Shooter band around keepDistance where it stops moving. */
	keepBand: 12,
} as const;
