import type Phaser from 'phaser';
import type { DebugParams } from '../debug/params';

const PARAMS_KEY = 'debugParams';

export function setParams(game: Phaser.Game, params: DebugParams): void {
	game.registry.set(PARAMS_KEY, params);
}

/** Debug/URL params (?seed, char, wave, god, debug, skipMenu). */
export function getParams(scene: Phaser.Scene): DebugParams {
	return (
		(scene.registry.get(PARAMS_KEY) as DebugParams | undefined) ?? {
			god: false,
			debug: false,
			skipMenu: false,
			unlockAll: false,
		}
	);
}
