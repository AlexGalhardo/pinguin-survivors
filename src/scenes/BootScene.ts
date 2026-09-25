import Phaser from 'phaser';
import {
	installIcons,
	installPixelFont,
	installPlaceholders,
	installSheets,
} from '../art/placeholders/install';
import { getParams } from '../core/context';
import { AudioSystem } from '../systems/AudioSystem';
import { MusicSystem } from '../systems/MusicSystem';
import { SaveSystem } from '../systems/SaveSystem';

/** First scene: generates every placeholder texture and the bitmap font, then starts the game. */
export class BootScene extends Phaser.Scene {
	constructor() {
		super('Boot');
	}

	create(): void {
		installPlaceholders(this);
		installPixelFont(this);
		installIcons(this);
		installSheets(this);
		const save = SaveSystem.load();
		if (getParams(this).unlockAll) save.unlocked = ['warrior', 'ranger', 'mage'];
		AudioSystem.init(this.game);
		MusicSystem.init(this.game);
		const params = getParams(this);
		if (params.debug) this.scene.launch('Debug');
		this.scene.start(params.skipMenu ? 'Game' : 'MainMenu');
		this.game.events.emit('boot-ready');
	}
}
