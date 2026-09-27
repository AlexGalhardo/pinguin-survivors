import type Phaser from 'phaser';
import type { HeroId } from '../config/constants';
import type { DebugParams } from '../debug/params';
import type { SaveData } from '../logic/save';
import { writeSave } from './storage';

const PARAMS = 'debugParams';
const SAVE = 'save';
const RUN_HERO = 'runHero';

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
