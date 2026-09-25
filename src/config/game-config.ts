import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { CardPickScene } from '../scenes/CardPickScene';
import { DebugScene } from '../scenes/DebugScene';
import { GameScene } from '../scenes/GameScene';
import { HudScene } from '../scenes/HudScene';
import { ShopScene } from '../scenes/ShopScene';
import { PALETTE, toCss } from './palette';

export const gameConfig: Phaser.Types.Core.GameConfig = {
	type: Phaser.WEBGL,
	parent: 'game',
	backgroundColor: toCss(PALETTE.void),
	pixelArt: true,
	roundPixels: true,
	antialias: false,
	scale: {
		mode: Phaser.Scale.RESIZE,
		width: '100%',
		height: '100%',
	},
	physics: {
		default: 'arcade',
		arcade: { gravity: { x: 0, y: 0 }, debug: false },
	},
	input: { keyboard: true, mouse: true, touch: false, gamepad: false },
	disableContextMenu: true,
	scene: [BootScene, GameScene, HudScene, CardPickScene, ShopScene, DebugScene],
};
