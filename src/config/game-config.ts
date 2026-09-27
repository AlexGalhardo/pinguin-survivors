import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { GameOverScene } from '../scenes/GameOverScene';
import { GameScene } from '../scenes/GameScene';
import { HudScene } from '../scenes/HudScene';
import { PALETTE, toCss } from './palette';

export const gameConfig: Phaser.Types.Core.GameConfig = {
	type: Phaser.WEBGL,
	parent: 'game',
	backgroundColor: toCss(PALETTE.night),
	pixelArt: true,
	scale: {
		mode: Phaser.Scale.RESIZE,
		width: '100%',
		height: '100%',
	},
	input: { keyboard: true, mouse: true, touch: false, gamepad: false },
	disableContextMenu: true,
	scene: [BootScene, GameScene, HudScene, GameOverScene],
};
