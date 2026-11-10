/** Elite area attacks (SDD-016 RF-09). */
export const ELITE_HAZARD_KINDS = ['nova', 'cone', 'cross', 'stomp', 'cage'] as const;
export type EliteHazardKind = (typeof ELITE_HAZARD_KINDS)[number];

/**
 * Distances in world units (hero ≈ 72 tall), times in seconds, `damage` as a fraction of the elite
 * damage. `telegraph` ≥ 0.8 s so a mark can always be dodged. Smaller than `BOSS_HAZARD`.
 */
export const ELITE_HAZARD = {
	/** Seconds between attacks of one elite, first-attack delay, casting reach and screen-wide cap. */
	every: 6,
	firstDelay: 2.5,
	maxDist: 450,
	retry: 0.5,
	maxActive: 4,
	nova: { radius: 150, telegraph: 1, damage: 0.6 },
	cone: { length: 260, arc: Math.PI / 3, telegraph: 0.9, damage: 0.6 },
	cross: { length: 240, width: 40, stagger: 0.9, telegraph: 0.9, damage: 0.5 },
	stomp: { count: 3, radius: 56, step: 110, stagger: 0.45, telegraph: 0.9, damage: 0.5 },
	cage: { count: 8, ringRadius: 150, radius: 50, telegraph: 1, damage: 0.6 },
	/** Sim premise: share of attacks that land on a hero who dodges by habit, and mean damage fraction. */
	simHitChance: 0.2,
	simDamage: 0.55,
} as const;
