import type Phaser from 'phaser';
import type { HeroId } from '../config/constants';
import type { Danger } from '../data/difficulty';
import type { WeaponId } from '../data/weapons';
import type { DebugParams } from '../debug/params';
import type { SaveData } from '../logic/save';
import { writeSave } from './storage';

const PARAMS = 'debugParams';
const SAVE = 'save';
const RUN_HERO = 'runHero';
const RUN_DANGER = 'runDanger';
const RUN_WEAPON = 'runWeapon';

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

/** Danger picked in the hero select screen for the next run (0-5). */
export function setRunDanger(game: Phaser.Game, danger: Danger): void {
	game.registry.set(RUN_DANGER, danger);
}

export function getRunDanger(scene: Phaser.Scene): Danger | undefined {
	return scene.game.registry.get(RUN_DANGER) as Danger | undefined;
}

/** Starting weapon picked for the next run. */
export function setRunWeapon(game: Phaser.Game, weapon: WeaponId): void {
	game.registry.set(RUN_WEAPON, weapon);
}

export function getRunWeapon(scene: Phaser.Scene): WeaponId | undefined {
	return scene.game.registry.get(RUN_WEAPON) as WeaponId | undefined;
}
