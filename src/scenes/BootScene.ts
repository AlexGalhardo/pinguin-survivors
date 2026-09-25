import Phaser from 'phaser';
import { installPixelFont, installPlaceholders } from '../art/placeholders/install';
import { getParams } from '../core/context';

/** First scene: generates every placeholder texture and the bitmap font, then starts the game. */
export class BootScene extends Phaser.Scene {
	constructor() {
		super('Boot');
	}

	create(): void {
		installPlaceholders(this);
		installPixelFont(this);
		const params = getParams(this);
		if (params.debug) this.scene.launch('Debug');
		this.scene.start('Game');
		this.game.events.emit('boot-ready');
	}
}
