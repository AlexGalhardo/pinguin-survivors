import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { CardPickScene } from '../scenes/CardPickScene';
import { GameOverScene } from '../scenes/GameOverScene';
import { GameScene } from '../scenes/GameScene';
import { HudScene } from '../scenes/HudScene';
import { PALETTE, toCss } from './palette';

export const gameConfig: Phaser.Types.Core.GameConfig = {
	type: Phaser.WEBGL,
	parent: 'game',
	backgroundColor: toCss(PALETTE.night),
	pixelArt: true,
	// Size and zoom are driven by core/display.ts (render resolution setting).
	scale: {
		mode: Phaser.Scale.NONE,
		width: 1280,
		height: 720,
	},
	input: { keyboard: true, mouse: true, touch: false, gamepad: false },
	disableContextMenu: true,
	scene: [BootScene, GameScene, HudScene, CardPickScene, GameOverScene],
};
