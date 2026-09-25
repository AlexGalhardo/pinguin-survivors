import Phaser from 'phaser';
import { installPixelFont } from '../art/placeholders/install';
import { getParams } from '../core/context';
import { SaveSystem } from '../systems/SaveSystem';

/** First scene: bitmap font and save data, then the PreloadScene (art, audio). */
export class BootScene extends Phaser.Scene {
	constructor() {
		super('Boot');
	}

	create(): void {
		installPixelFont(this);
		const save = SaveSystem.load();
		if (getParams(this).unlockAll) save.unlocked = ['warrior', 'ranger', 'mage'];
		this.scene.start('Preload');
	}
}
