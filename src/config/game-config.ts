import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { PALETTE, toCss } from './palette';

export const gameConfig: Phaser.Types.Core.GameConfig = {
	type: Phaser.AUTO,
	parent: 'game',
	backgroundColor: toCss(PALETTE.void),
	pixelArt: true,
	scale: {
		mode: Phaser.Scale.RESIZE,
		width: '100%',
		height: '100%',
	},
	physics: {
		default: 'arcade',
		arcade: { gravity: { x: 0, y: 0 }, debug: false },
	},
	scene: [BootScene],
};
