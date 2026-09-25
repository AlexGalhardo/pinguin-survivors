/**
 * Coarse model constants for the headless balance simulation (src/logic/sim).
 * They approximate what happens in the arena; they are NOT gameplay numbers.
 * Calibrate them against real playtests (PLAN 2.8).
 */
export const SIM = {
	maxWave: 60,
	/** Fraction of the wave the weapon is actually firing (moving, retargeting, spawn gaps). */
	uptime: 0.75,
	/** Average enemies hit per attack. */
	targets: { energy_blade: 2.2, blaster: 1, psi_orb: 1.8 } as Record<string, number>,
	/** Extra targets per point of Pierce (projectile weapons). */
	pierceTargets: 0.6,
	/** Average targets of area abilities. */
	abilityTargets: { nova: 4, cryo: 3, laser: 3, drones: 2, saw: 3, gravity: 5 },
	/** Contact hits per second while the arena is under control (kiting chip damage). */
	baseHitsPerSecond: 0.02,
	/** Extra hits per second per fraction of the wave's HP left alive (overwhelmed). */
	overwhelmHitsPerSecond: 1.0,
	/** Share of the DPS that goes to the boss on boss waves. */
	bossFocus: 0.5,
	/** Extra seconds a player can survive after the timer while finishing the boss. */
	bossOvertime: 20,
	/** Player i-frames cap the hit rate (1 / 0.4 s). */
	maxHitsPerSecond: 2.5,
	/** Gold multiplier (coins lost when the wave ends are auto-collected, so ~1). */
	goldCollected: 1,
} as const;
