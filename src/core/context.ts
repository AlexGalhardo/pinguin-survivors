import type Phaser from 'phaser';
import type { DebugParams } from '../debug/params';
import type { SaveData } from '../logic/save';
import { writeSave } from './storage';

const PARAMS = 'debugParams';
const SAVE = 'save';

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
