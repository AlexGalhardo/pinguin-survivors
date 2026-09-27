import type Phaser from 'phaser';
import type { DebugParams } from '../debug/params';

const PARAMS = 'debugParams';

export function setParams(game: Phaser.Game, params: DebugParams): void {
	game.registry.set(PARAMS, params);
}

export function getParams(scene: Phaser.Scene): DebugParams {
	return scene.game.registry.get(PARAMS) as DebugParams;
}
