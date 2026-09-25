import { TEX } from '../art/manifest';

export type EnemyType =
	| 'chaser'
	| 'runner'
	| 'shooter'
	| 'tank'
	| 'splitter'
	| 'splitling'
	| 'bomber'
	| 'healer'
	| 'burrower'
	| 'boss'
	| 'boss2'
	| 'boss3';
export type EnemyAi = 'chase' | 'keepDistance' | 'boss' | 'bomber' | 'burrower';

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
	/** Bosses: HUD bar, wave end condition, immune to pulls. */
	isBoss?: boolean;
	/** Special behaviors handled by SpecialAi (split on death, heal allies). */
	splitInto?: EnemyType;
	heals?: boolean;
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
	splitter: {
		type: 'splitter',
		texture: TEX.enemySplitter,
		ai: 'chase',
		hp: 18,
		damage: 5,
		speed: 55,
		radius: 11,
		gold: 2,
		knockbackTaken: 1,
		weight: 10,
		fromWave: 6,
		splitInto: 'splitling',
	},
	splitling: {
		type: 'splitling',
		texture: TEX.enemySplitling,
		ai: 'chase',
		hp: 4,
		damage: 2,
		speed: 95,
		radius: 6,
		gold: 0,
		knockbackTaken: 1,
		weight: 0,
		fromWave: 99,
	},
	bomber: {
		type: 'bomber',
		texture: TEX.enemyBomber,
		ai: 'bomber',
		hp: 8,
		damage: 0,
		speed: 80,
		radius: 9,
		gold: 1,
		knockbackTaken: 1,
		weight: 8,
		fromWave: 7,
	},
	healer: {
		type: 'healer',
		texture: TEX.enemyHealer,
		ai: 'keepDistance',
		hp: 16,
		damage: 3,
		speed: 40,
		radius: 10,
		gold: 3,
		knockbackTaken: 1,
		weight: 6,
		fromWave: 8,
		heals: true,
		ranged: { keepDistance: 120, cooldown: 99, projectileSpeed: 0, damage: 0 },
	},
	burrower: {
		type: 'burrower',
		texture: TEX.enemyBurrower,
		ai: 'burrower',
		hp: 20,
		damage: 7,
		speed: 50,
		radius: 10,
		gold: 2,
		knockbackTaken: 0.6,
		weight: 8,
		fromWave: 9,
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
		isBoss: true,
	},
	boss2: {
		type: 'boss2',
		texture: TEX.enemyBoss2,
		ai: 'boss',
		hp: 450,
		damage: 15,
		speed: 45,
		radius: 26,
		gold: 60,
		knockbackTaken: 0,
		weight: 0,
		fromWave: 20,
		isBoss: true,
	},
	boss3: {
		type: 'boss3',
		texture: TEX.enemyBoss3,
		ai: 'boss',
		hp: 520,
		damage: 18,
		speed: 35,
		radius: 28,
		gold: 70,
		knockbackTaken: 0,
		weight: 0,
		fromWave: 30,
		isBoss: true,
	},
};

/** Boss rotation: wave 10 -> boss, 20 -> boss2, 30 -> boss3, 40 -> boss… */
export const BOSS_ROTATION: readonly EnemyType[] = ['boss', 'boss2', 'boss3'];

/** Special enemy behaviors (Beta). */
export const SPECIAL = {
	splitCount: 2,
	bomberFuse: 0.6,
	bomberTrigger: 28,
	bomberRadius: 44,
	bomberDamage: 12,
	healEvery: 3,
	healRadius: 70,
	healPct: 0.2,
	burrowEvery: 4,
	burrowTime: 0.8,
	/** The burrower resurfaces this far from the player. */
	burrowMin: 50,
	burrowMax: 80,
} as const;

/** Second and third boss patterns. */
export const BOSS2 = {
	spiralEvery: 6,
	spiralDuration: 3,
	spiralShotEvery: 0.1,
	spiralTurn: 0.45,
	shotSpeed: 100,
	shotDamage: 7,
	summonEvery: 8,
	summonCount: 4,
} as const;

export const BOSS3 = {
	slamEvery: 3,
	slamCount: 3,
	slamWarn: 1,
	slamRadius: 36,
	slamDamage: 16,
	shotgunEvery: 2,
	shotgunPellets: 5,
	shotgunSpread: 0.5,
	shotSpeed: 150,
	shotDamage: 7,
} as const;

export const POOL_TYPES: readonly EnemyType[] = [
	'chaser',
	'runner',
	'shooter',
	'tank',
	'splitter',
	'bomber',
	'healer',
	'burrower',
];

/** Contact damage cooldown per enemy (s) and player invulnerability after a hit (s). */
export const CONTACT_COOLDOWN = 0.5;
export const PLAYER_INVULN = 0.5;
/** Knockback applied to an enemy right after it hits the player (breathing room). */
export const CONTACT_BOUNCE = 160;

/** Types that can become elites (fast/small types would be impossible to escape). */
export const ELITE_BASES: readonly EnemyType[] = ['chaser', 'shooter', 'tank', 'splitter'];

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

/** Elite multipliers over the base type (balancing §2). */
export const ELITE = {
	hp: 8,
	damage: 1.25,
	speed: 1.1,
	size: 1.5,
	gold: 15,
	/** `fast` modifier: extra speed multiplier. */
	fastSpeed: 1.2,
	/** `shielded` modifier: shield = 30% of HP (absorbs damage first). */
	shieldPct: 0.3,
	/** `volatile` modifier: explodes on death. */
	volatileRadius: 48,
	volatileDamage: 10,
	/** Delay between the death and the explosion (telegraph), seconds. */
	volatileDelay: 0.5,
} as const;

/** Boss patterns (balancing §2). */
export const BOSS = {
	burstShots: 16,
	burstEvery: 4,
	burstSpeed: 110,
	burstDamage: 8,
	chargeEvery: 7,
	chargeWarn: 1,
	chargeSpeed: 280,
	chargeDuration: 0.7,
} as const;

/** Wave transitions (seconds). */
export const WAVE_FLOW = {
	bannerTime: 1.2,
	purgeCollectTime: 1.0,
	/** Placeholder pause between waves until the card pick / shop exist. */
	intermission: 1.0,
} as const;
