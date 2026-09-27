import type { BiomeId } from '../config/constants';

/** Enemies of the 3 biomes (docs/game-design.md §11, balancing §2). Radii/speeds in world units. */
export type EnemyBehavior = 'chaser' | 'tank' | 'flyer' | 'ranged' | 'charger' | 'bomber' | 'boss';

/** Boss attack pattern (each boss has its own AI mix; docs/game-design.md §11). */
export interface BossProfile {
	/** Melee swipe wind-up (seconds) when the hero is within `range`. */
	swipeWindup: number;
	/** Swipe reach multiplier over `range` (the kraken's tentacles reach far). */
	swipeReach: number;
	chargeEvery: number;
	chargeWindup: number;
	chargeTime: number;
	chargeSpeed: number;
	/** Roar: summons `summonCount` of `summon` around the boss. */
	roarEvery: number;
	summon: string;
	summonCount: number;
	/** Volley: `volleyCount` projectiles in a fan toward the hero (0 = none). */
	volleyEvery: number;
	volleyCount: number;
	/** Hazard: poison/acid pools dropped around the hero (0 = none). */
	poolEvery: number;
	poolCount: number;
}

export interface EnemyDef {
	id: string;
	biome: BiomeId;
	behavior: EnemyBehavior;
	hp: number;
	/** World units per second. */
	speed: number;
	/** Contact damage (or explosion/projectile damage for bombers/ranged). */
	damage: number;
	radius: number;
	xp: number;
	/** First round where it can spawn; 0 = never from the regular pool (bosses). */
	fromRound: number;
	weight: number;
	/** Placeholder look until PixelLab art (P-05 sizes). */
	placeholder: { color: number; height: number };
	/** Ranged/charger/bomber parameters. */
	range?: number;
	cooldown?: number;
	boss?: BossProfile;
}

export const ENEMIES = {
	zombiePenguin: {
		id: 'zombiePenguin',
		biome: 'antarctica',
		behavior: 'chaser',
		hp: 12,
		speed: 80,
		damage: 4,
		radius: 10,
		xp: 1,
		fromRound: 1,
		weight: 10,
		placeholder: { color: 0x8fb48a, height: 40 },
	},
	zombieSkua: {
		id: 'zombieSkua',
		biome: 'antarctica',
		behavior: 'flyer',
		hp: 10,
		speed: 115,
		damage: 3,
		radius: 9,
		xp: 1,
		fromRound: 2,
		weight: 5,
		placeholder: { color: 0xb0b8a0, height: 36 },
	},
	zombieSeal: {
		id: 'zombieSeal',
		biome: 'antarctica',
		behavior: 'tank',
		hp: 45,
		speed: 40,
		damage: 8,
		radius: 16,
		xp: 3,
		fromRound: 3,
		weight: 4,
		placeholder: { color: 0x6f8a86, height: 36 },
	},
	zombieScientist: {
		id: 'zombieScientist',
		biome: 'antarctica',
		behavior: 'ranged',
		hp: 20,
		speed: 55,
		damage: 6,
		radius: 11,
		xp: 2,
		fromRound: 4,
		weight: 3,
		placeholder: { color: 0xd8e0d0, height: 56 },
		range: 220,
		cooldown: 2.5,
	},
	bloaterPenguin: {
		id: 'bloaterPenguin',
		biome: 'antarctica',
		behavior: 'bomber',
		hp: 18,
		speed: 60,
		damage: 14,
		radius: 12,
		xp: 2,
		fromRound: 5,
		weight: 3,
		placeholder: { color: 0x9ccf5a, height: 44 },
		range: 40,
	},
	zombieWalrus: {
		id: 'zombieWalrus',
		biome: 'antarctica',
		behavior: 'charger',
		hp: 60,
		speed: 50,
		damage: 12,
		radius: 18,
		xp: 4,
		fromRound: 7,
		weight: 2,
		placeholder: { color: 0x8a6f5a, height: 52 },
		range: 200,
		cooldown: 4,
	},
	polarBear: {
		id: 'polarBear',
		biome: 'antarctica',
		behavior: 'boss',
		hp: 3000,
		speed: 70,
		damage: 25,
		radius: 40,
		xp: 100,
		fromRound: 0,
		weight: 0,
		placeholder: { color: 0xe8ecd8, height: 160 },
		range: 90,
		cooldown: 3,
		boss: {
			swipeWindup: 0.4,
			swipeReach: 1.3,
			chargeEvery: 8,
			chargeWindup: 0.6,
			chargeTime: 1,
			chargeSpeed: 2.5,
			roarEvery: 12,
			summon: 'zombiePenguin',
			summonCount: 6,
			volleyEvery: 0,
			volleyCount: 0,
			poolEvery: 0,
			poolCount: 0,
		},
	},
	// --- Biome 2: research station / harbor (rounds 11–20) ---
	zombieSailor: {
		id: 'zombieSailor',
		biome: 'station',
		behavior: 'chaser',
		hp: 14,
		speed: 85,
		damage: 4,
		radius: 10,
		xp: 1,
		fromRound: 11,
		weight: 10,
		placeholder: { color: 0x5a7a9a, height: 44 },
	},
	zombieGull: {
		id: 'zombieGull',
		biome: 'station',
		behavior: 'flyer',
		hp: 12,
		speed: 125,
		damage: 3,
		radius: 9,
		xp: 1,
		fromRound: 11,
		weight: 5,
		placeholder: { color: 0xc8ccc0, height: 34 },
	},
	zombieSeaLion: {
		id: 'zombieSeaLion',
		biome: 'station',
		behavior: 'tank',
		hp: 55,
		speed: 45,
		damage: 9,
		radius: 17,
		xp: 3,
		fromRound: 12,
		weight: 4,
		placeholder: { color: 0x7a5e48, height: 40 },
	},
	zombieMedic: {
		id: 'zombieMedic',
		biome: 'station',
		behavior: 'ranged',
		hp: 24,
		speed: 55,
		damage: 6,
		radius: 11,
		xp: 2,
		fromRound: 13,
		weight: 3,
		placeholder: { color: 0xe0e8f0, height: 56 },
		range: 240,
		cooldown: 2.2,
	},
	fuelBloater: {
		id: 'fuelBloater',
		biome: 'station',
		behavior: 'bomber',
		hp: 22,
		speed: 62,
		damage: 14,
		radius: 12,
		xp: 2,
		fromRound: 14,
		weight: 3,
		placeholder: { color: 0xd07a2a, height: 46 },
		range: 42,
	},
	zombieNarwhal: {
		id: 'zombieNarwhal',
		biome: 'station',
		behavior: 'charger',
		hp: 65,
		speed: 55,
		damage: 12,
		radius: 18,
		xp: 4,
		fromRound: 16,
		weight: 2,
		placeholder: { color: 0x8a9aa8, height: 44 },
		range: 220,
		cooldown: 3.5,
	},
	kraken: {
		id: 'kraken',
		biome: 'station',
		behavior: 'boss',
		hp: 3000,
		speed: 45,
		damage: 22,
		radius: 44,
		xp: 120,
		fromRound: 0,
		weight: 0,
		placeholder: { color: 0x7a3a6a, height: 150 },
		range: 150,
		cooldown: 2.6,
		boss: {
			swipeWindup: 0.55,
			swipeReach: 1.2,
			chargeEvery: 0,
			chargeWindup: 0,
			chargeTime: 0,
			chargeSpeed: 0,
			roarEvery: 14,
			summon: 'zombieSailor',
			summonCount: 6,
			volleyEvery: 4,
			volleyCount: 7,
			poolEvery: 0,
			poolCount: 0,
		},
	},
	// --- Biome 3: ruined city (rounds 21–30) ---
	zombieCitizen: {
		id: 'zombieCitizen',
		biome: 'ruins',
		behavior: 'chaser',
		hp: 20,
		speed: 85,
		damage: 6,
		radius: 10,
		xp: 1,
		fromRound: 21,
		weight: 9,
		placeholder: { color: 0x9a8a6a, height: 48 },
	},
	zombieRat: {
		id: 'zombieRat',
		biome: 'ruins',
		behavior: 'chaser',
		hp: 8,
		speed: 130,
		damage: 3,
		radius: 7,
		xp: 1,
		fromRound: 21,
		weight: 6,
		placeholder: { color: 0x6a5a58, height: 20 },
	},
	zombiePigeon: {
		id: 'zombiePigeon',
		biome: 'ruins',
		behavior: 'flyer',
		hp: 14,
		speed: 125,
		damage: 5,
		radius: 9,
		xp: 1,
		fromRound: 22,
		weight: 4,
		placeholder: { color: 0x8a8aa0, height: 32 },
	},
	zombieRiotCop: {
		id: 'zombieRiotCop',
		biome: 'ruins',
		behavior: 'tank',
		hp: 80,
		speed: 45,
		damage: 12,
		radius: 16,
		xp: 3,
		fromRound: 22,
		weight: 4,
		placeholder: { color: 0x2a3a5a, height: 54 },
	},
	zombieSoldier: {
		id: 'zombieSoldier',
		biome: 'ruins',
		behavior: 'ranged',
		hp: 30,
		speed: 60,
		damage: 8,
		radius: 11,
		xp: 2,
		fromRound: 23,
		weight: 3,
		placeholder: { color: 0x5a6a3a, height: 56 },
		range: 260,
		cooldown: 2,
	},
	acidBloater: {
		id: 'acidBloater',
		biome: 'ruins',
		behavior: 'bomber',
		hp: 26,
		speed: 64,
		damage: 18,
		radius: 12,
		xp: 2,
		fromRound: 24,
		weight: 3,
		placeholder: { color: 0xa8d83a, height: 48 },
		range: 44,
	},
	zombieBrute: {
		id: 'zombieBrute',
		biome: 'ruins',
		behavior: 'charger',
		hp: 90,
		speed: 55,
		damage: 16,
		radius: 19,
		xp: 5,
		fromRound: 26,
		weight: 2,
		placeholder: { color: 0x8a4a3a, height: 64 },
		range: 220,
		cooldown: 3.5,
	},
	abomination: {
		id: 'abomination',
		biome: 'ruins',
		behavior: 'boss',
		hp: 3500,
		speed: 80,
		damage: 28,
		radius: 42,
		xp: 150,
		fromRound: 0,
		weight: 0,
		placeholder: { color: 0x8aa84a, height: 170 },
		range: 95,
		cooldown: 2.6,
		boss: {
			swipeWindup: 0.35,
			swipeReach: 1.3,
			chargeEvery: 5,
			chargeWindup: 0.5,
			chargeTime: 0.9,
			chargeSpeed: 2.8,
			roarEvery: 13,
			summon: 'zombieRat',
			summonCount: 10,
			volleyEvery: 0,
			volleyCount: 0,
			poolEvery: 6,
			poolCount: 4,
		},
	},
} as const satisfies Record<string, EnemyDef>;

export type EnemyId = keyof typeof ENEMIES;

/** Kraken ink volley: speed/range in world units, damage as a fraction of the boss damage. */
export const BOSS_VOLLEY = { speed: 170, range: 520, damage: 0.35, spread: 1.1 } as const;
/** Abomination acid pools: dps as a fraction of the boss damage; scatter around the hero. */
export const BOSS_POOL = { radius: 46, duration: 4, dps: 0.35, scatter: 150 } as const;
export const ENEMY_LIST: readonly EnemyDef[] = Object.values(ENEMIES);
export const BOSS_BY_BIOME = {
	antarctica: 'polarBear',
	station: 'kraken',
	ruins: 'abomination',
} as const satisfies Record<BiomeId, EnemyId>;
