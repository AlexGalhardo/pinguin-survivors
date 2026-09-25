import Phaser from 'phaser';
import { gameConfig } from './config/game-config';
import { setParams } from './core/context';
import { installDevHooks } from './debug/dev-hooks';
import { parseDebugParams } from './debug/params';

const params = parseDebugParams(window.location.search);
const game = new Phaser.Game(gameConfig);
setParams(game, params);

installDevHooks(game, params);
