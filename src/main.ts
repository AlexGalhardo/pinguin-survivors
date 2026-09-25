import Phaser from 'phaser';
import { gameConfig } from './config/game-config';
import { setParams } from './core/context';
import { installGamepad } from './core/gamepad';
import { installDevHooks } from './debug/dev-hooks';
import { parseDebugParams } from './debug/params';

const params = parseDebugParams(window.location.search);
const game = new Phaser.Game(gameConfig);
setParams(game, params);

installGamepad(game, () => game.scene.isActive('Game') && !game.scene.isPaused('Game'));
installDevHooks(game, params);
