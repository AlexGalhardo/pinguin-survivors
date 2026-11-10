import '@fontsource/cinzel/700.css';
import '@fontsource/cinzel/900.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource/roboto/900.css';
import Phaser from 'phaser';
import { gameConfig } from './config/game-config';
import { sfx } from './core/audio';
import { setParams, setRunDanger, setRunHero, setRunWeapon, setSave } from './core/context';
import { attachGame, currentRenderSize, initDisplay } from './core/display';
import { installGamepad } from './core/gamepad';
import { refreshMusicVolume } from './core/music';
import { platform } from './core/platform';
import { loadSave } from './core/storage';
import { forceTier } from './core/tier';
import type { WeaponId } from './data/weapons';
import { parseDebugParams } from './debug/params';
import { detectLang, setLang } from './i18n';
import { queueResume, type RunResume } from './scenes/GameScene';
import { bindMenuCommands } from './ui/commands';
import { ensureLangFont } from './ui/lang-font';
import { mountUi } from './ui/mount';
import { publishSave } from './ui/save-bridge';
import { uiStore } from './ui/store';
import { bindUiSound } from './ui/ui-sound';

const params = parseDebugParams(window.location.search);
const save = loadSave(detectLang(navigator.language));
setLang(save.settings.lang);
await ensureLangFont(save.settings.lang);
initDisplay(save.settings.resolution);

// Text objects rasterize once, so the font must be ready before the first scene.
await Promise.all(
	[
		'500 16px "Roboto"',
		'bold 16px "Roboto"',
		'900 16px "Roboto"',
		'700 16px "Cinzel"',
		'900 16px "Cinzel"',
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
setParams(game, params);
forceTier(params.fxTier);
setSave(game, save);
publishSave(save);
if (!params.skipMenu) uiStore.set({ screen: 'main-menu' });
bindUiSound((key) => sfx(game.scene.getScene('Boot'), key));
bindMenuCommands({
	startRun: ({ hero, danger, weapon }) => {
		setRunHero(game, hero);
		setRunDanger(game, danger);
		// GameScene only accepts it if it is one of the hero's starting weapons.
		setRunWeapon(game, weapon as WeaponId);
		game.scene.start('Game');
	},
	continueRun: () => {
		if (!save.activeRun) return;
		queueResume(game, structuredClone(save.activeRun.state) as unknown as RunResume);
		game.scene.start('Game');
	},
	refreshAudio: () => refreshMusicVolume(game.scene.getScene('Boot')),
	toggleFullscreen: () => platform().fullscreen.toggle(),
});
attachGame(game);
mountUi(document.getElementById('ui'));
installGamepad(game, () => game.scene.isActive('Game'));

if (import.meta.env.DEV) {
	(window as unknown as { __GAME__: Phaser.Game }).__GAME__ = game;
	(window as unknown as { __UI__: typeof uiStore }).__UI__ = uiStore;
}
