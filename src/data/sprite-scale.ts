import type { HeroId } from '../config/constants';

/**
 * Visual scale of each sprite, to standardize heights like Brotato (docs/reports/proportions-2026-11-08.md).
 * Measured heights (opaque pixels, south frame) are in the report; scales change only what is drawn:
 * hit radii (`EnemyDef.radius`) and every gameplay number stay as they were.
 *
 * Targets in world units (1 tile = 64): hero 72 (~1.1 tile), common enemies ~60 (0.8x the hero),
 * elites x1.25 / x1.4 on top (`ROUNDS.elite`), bosses 2-3x the hero.
 */
export const HERO_SPRITE_SCALE: Readonly<Record<HeroId, number>> = {
	jack: 1,
	bob: 0.84,
	lucia: 0.9,
};

/** Per enemy id; missing = 1. Small sprites grow up to 1.3x so none is much shorter than the pack. */
export const ENEMY_SPRITE_SCALE: Readonly<Record<string, number>> = {
	zombiePenguin: 1.1,
	bloaterPenguin: 1.1,
	acidBloater: 1.2,
	fuelBloater: 1.2,
	zombieCitizen: 1.1,
	zombieGull: 1.1,
	zombieMedic: 1.15,
	zombieNarwhal: 1.3,
	zombiePigeon: 1.05,
	zombieRat: 1.3,
	zombieRiotCop: 1.1,
	zombieSailor: 1.15,
	zombieScientist: 1.1,
	zombieSeaLion: 1.3,
	zombieSeal: 1.15,
	zombieSkua: 1.05,
	zombieSoldier: 1.05,
	zombieWalrus: 1.2,
	polarBear: 1.25,
	// Forest boss (v3 canvas 208, 146 px tall): about 2.2x the hero, like the polar bear.
	mooseKing: 1.1,
	kraken: 1.1,
	'kraken-b': 1.25,
	// Opening boss of each biome, rounds 5-45 (ADR-023, SDD-016): [ajustar com a arte]
	leopardSeal: 1.2,
	rotTreant: 1.2,
	hiveQueen: 1.2,
	drownedDiver: 1.2,
	plagueHierophant: 1.2,
	// City faction (ADR-016): measured south frames 44-56 px, hero 72.
	acidSwarmer: 1.3,
	alienFlyer: 1.25,
	clawCharger: 1.1,
	armorGuard: 1.2,
	cystBloater: 1.15,
	camoStalker: 1.15,
	// Boss: 113-144 px in a 160 canvas, drawn at 164-209 u (2.3-2.9x the hero).
	biomechColossus: 1.45,
};

export const spriteScale = (id: string): number => ENEMY_SPRITE_SCALE[id] ?? 1;
