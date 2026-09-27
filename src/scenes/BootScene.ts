import Phaser from 'phaser';
import { FILES } from '../art/manifest';
import { installPlaceholders } from '../art/placeholders';

export class BootScene extends Phaser.Scene {
	constructor() {
		super('Boot');
	}

	preload(): void {
		// Only files that exist are queued; placeholders drawn in create() cover the rest.
		const present = new Set(__ASSET_FILES__);
		for (const [key, url] of Object.entries(FILES.images))
			if (present.has(url)) this.load.image(key, url);
		for (const [key, url] of Object.entries(FILES.audio))
			if (present.has(url)) this.load.audio(key, url);
	}

	create(): void {
		installPlaceholders(this);
		this.scene.start('Game');
	}
}
