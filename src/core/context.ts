import type Phaser from 'phaser';
import type { HeroId } from '../config/constants';
import type { Difficulty } from '../data/difficulty';
import type { WeaponId } from '../data/weapons';
import type { DebugParams } from '../debug/params';
import type { SaveData } from '../logic/save';
import { writeSave } from './storage';

const PARAMS = 'debugParams';
const SAVE = 'save';
const RUN_HERO = 'runHero';
const RUN_DIFFICULTY = 'runDifficulty';
const RUN_WEAPON = 'runWeapon';
const RUN_CLASS = 'runClass';

export function setParams(game: Phaser.Game, params: DebugParams): void {
	game.registry.set(PARAMS, params);
}

export function getParams(scene: Phaser.Scene): DebugParams {
	return scene.game.registry.get(PARAMS) as DebugParams;
}

export function setSave(game: Phaser.Game, save: SaveData): void {
	game.registry.set(SAVE, save);
}

/** The one in-memory save; mutate it and call persist(). */
export function getSave(scene: Phaser.Scene): SaveData {
	return scene.game.registry.get(SAVE) as SaveData;
}

export function persist(scene: Phaser.Scene): void {
	writeSave(getSave(scene));
}

/** Hero picked in the hero select screen for the next run. */
export function setRunHero(game: Phaser.Game, hero: HeroId): void {
	game.registry.set(RUN_HERO, hero);
}

export function getRunHero(scene: Phaser.Scene): HeroId | undefined {
	return scene.game.registry.get(RUN_HERO) as HeroId | undefined;
}

/** Difficulty picked in the hero select screen for the next run (0-2). */
export function setRunDifficulty(game: Phaser.Game, difficulty: Difficulty): void {
	game.registry.set(RUN_DIFFICULTY, difficulty);
}

export function getRunDifficulty(scene: Phaser.Scene): Difficulty | undefined {
	return scene.game.registry.get(RUN_DIFFICULTY) as Difficulty | undefined;
}

/** Starting weapon picked for the next run. */
export function setRunWeapon(game: Phaser.Game, weapon: WeaponId): void {
	game.registry.set(RUN_WEAPON, weapon);
}

export function getRunWeapon(scene: Phaser.Scene): WeaponId | undefined {
	return scene.game.registry.get(RUN_WEAPON) as WeaponId | undefined;
}

/** Hero class picked for the next run (SDD-024); the game validates it against the hero and its level. */
export function setRunClass(game: Phaser.Game, heroClass: string | undefined): void {
	game.registry.set(RUN_CLASS, heroClass);
}

export function getRunClass(scene: Phaser.Scene): string | undefined {
	return scene.game.registry.get(RUN_CLASS) as string | undefined;
}
