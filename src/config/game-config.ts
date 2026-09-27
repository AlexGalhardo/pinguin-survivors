import Phaser from 'phaser';
import { AchievementsScene } from '../scenes/AchievementsScene';
import { BootScene } from '../scenes/BootScene';
import { CardPickScene } from '../scenes/CardPickScene';
import { ControlsScene } from '../scenes/ControlsScene';
import { GameOverScene } from '../scenes/GameOverScene';
import { GameScene } from '../scenes/GameScene';
import { HeroScene } from '../scenes/HeroScene';
import { HeroSelectScene } from '../scenes/HeroSelectScene';
import { HistoryScene } from '../scenes/HistoryScene';
import { HudScene } from '../scenes/HudScene';
import { MainMenuScene } from '../scenes/MainMenuScene';
import { PauseScene } from '../scenes/PauseScene';
import { SettingsScene } from '../scenes/SettingsScene';
import { UnlockScene } from '../scenes/UnlockScene';
import { WorkshopScene } from '../scenes/WorkshopScene';
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
	scene: [
		BootScene,
		MainMenuScene,
		HeroSelectScene,
		HeroScene,
		WorkshopScene,
		GameScene,
		HudScene,
		CardPickScene,
		PauseScene,
		SettingsScene,
		ControlsScene,
		AchievementsScene,
		HistoryScene,
		GameOverScene,
		UnlockScene,
	],
};
