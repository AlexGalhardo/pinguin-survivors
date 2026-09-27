import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/700.css';
import '@fontsource/rubik/500.css';
import '@fontsource/rubik/700.css';
import Phaser from 'phaser';
import { gameConfig } from './config/game-config';
import { setParams, setSave } from './core/context';
import { attachGame, currentRenderSize, initDisplay } from './core/display';
import { installGamepad } from './core/gamepad';
import { loadSave } from './core/storage';
import { parseDebugParams } from './debug/params';
import { detectLang, setLang } from './i18n';
import { installCrispText } from './ui/text-quality';

const params = parseDebugParams(window.location.search);
const save = loadSave(detectLang(navigator.language));
setLang(save.settings.lang);
initDisplay(save.settings.resolution);

// Text objects rasterize once, so the pixel font must be ready before the first scene.
await Promise.all(
	[
		'16px "Pixelify Sans"',
		'bold 16px "Pixelify Sans"',
		'500 16px "Rubik"',
		'bold 16px "Rubik"',
	].map((f) => document.fonts.load(f).catch(() => undefined)),
);

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
// Scenes boot on the next frame, so the text patch is in place before any Text exists.
installCrispText(game);
setParams(game, params);
setSave(game, save);
attachGame(game);
installGamepad(game, () => game.scene.isActive('Game'));

if (import.meta.env.DEV) {
	(window as unknown as { __GAME__: Phaser.Game }).__GAME__ = game;
}
