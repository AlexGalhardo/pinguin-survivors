import '@fontsource/pixelify-sans/400.css';
import Phaser from 'phaser';
import { gameConfig } from './config/game-config';
import { setParams } from './core/context';
import { installGamepad } from './core/gamepad';
import { parseDebugParams } from './debug/params';
import { detectLang, setLang } from './i18n';

const params = parseDebugParams(window.location.search);
setLang(detectLang(navigator.language));

// Text objects rasterize once, so the pixel font must be ready before the first scene.
await document.fonts.load('16px "Pixelify Sans"').catch(() => undefined);

const game = new Phaser.Game(gameConfig);
setParams(game, params);
installGamepad(game, () => game.scene.isActive('Game'));

if (import.meta.env.DEV) {
	(window as unknown as { __GAME__: Phaser.Game }).__GAME__ = game;
}
