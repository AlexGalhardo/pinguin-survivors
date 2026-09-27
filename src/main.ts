import '@fontsource/pixelify-sans/400.css';
import Phaser from 'phaser';
import { gameConfig } from './config/game-config';
import { setParams, setSave } from './core/context';
import { attachGame, currentRenderSize, initDisplay } from './core/display';
import { installGamepad } from './core/gamepad';
import { loadSave } from './core/storage';
import { parseDebugParams } from './debug/params';
import { detectLang, setLang } from './i18n';

const params = parseDebugParams(window.location.search);
const save = loadSave(detectLang(navigator.language));
setLang(save.settings.lang);
initDisplay(save.settings.resolution);

// Text objects rasterize once, so the pixel font must be ready before the first scene.
await document.fonts.load('16px "Pixelify Sans"').catch(() => undefined);

const initial = currentRenderSize();
const game = new Phaser.Game({
	...gameConfig,
	scale: {
		...gameConfig.scale,
		width: initial.width,
		height: initial.height,
		zoom: initial.cssScale,
	},
});
setParams(game, params);
setSave(game, save);
attachGame(game);
installGamepad(game, () => game.scene.isActive('Game'));

if (import.meta.env.DEV) {
	(window as unknown as { __GAME__: Phaser.Game }).__GAME__ = game;
}
