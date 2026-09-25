import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { CardPickScene } from '../scenes/CardPickScene';
import { CharacterSelectScene } from '../scenes/CharacterSelectScene';
import { DebugScene } from '../scenes/DebugScene';
import { GameOverScene } from '../scenes/GameOverScene';
import { GameScene } from '../scenes/GameScene';
import { HudScene } from '../scenes/HudScene';
import { MainMenuScene } from '../scenes/MainMenuScene';
import { PauseScene } from '../scenes/PauseScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { RecordsScene } from '../scenes/RecordsScene';
import { SettingsScene } from '../scenes/SettingsScene';
import { ShopScene } from '../scenes/ShopScene';
import { UnlockScene } from '../scenes/UnlockScene';
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
	scene: [
		BootScene,
		PreloadScene,
		MainMenuScene,
		CharacterSelectScene,
		GameScene,
		HudScene,
		CardPickScene,
		ShopScene,
		PauseScene,
		SettingsScene,
		GameOverScene,
		UnlockScene,
		RecordsScene,
		DebugScene,
	],
};
