/** Antarctica enemies (docs/game-design.md §11, balancing §2). Radii and speeds in world units. */
export type EnemyBehavior = 'chaser' | 'tank' | 'flyer' | 'ranged' | 'charger' | 'bomber' | 'boss';

export interface EnemyDef {
	id: string;
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
}

export const ENEMIES = {
	zombiePenguin: {
		id: 'zombiePenguin',
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
	},
} as const satisfies Record<string, EnemyDef>;

export type EnemyId = keyof typeof ENEMIES;
export const ENEMY_LIST: readonly EnemyDef[] = Object.values(ENEMIES);
export const BOSS_BY_BIOME = { antarctica: 'polarBear' } as const satisfies Record<string, EnemyId>;
