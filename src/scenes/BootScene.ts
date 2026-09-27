import Phaser from 'phaser';
import { FILES } from '../art/manifest';
import { installPlaceholders } from '../art/placeholders';
import { HERO_IDS } from '../config/constants';
import { getParams } from '../core/context';

export class BootScene extends Phaser.Scene {
	constructor() {
		super('Boot');
	}

	preload(): void {
		// Only files that exist are queued; placeholders drawn in create() cover the rest.
		const present = new Set(__ASSET_FILES__);
		for (const [key, url] of Object.entries(FILES.images))
			if (present.has(url)) this.load.image(key, url);
		// PixelLab animation atlases (scripts/pack-heroes.ts), one per hero tier.
		for (const hero of HERO_IDS)
			for (const tier of [1, 2, 3]) {
				const key = `hero.${hero}.t${tier}`;
				const json = `assets/heroes/${key}.json`;
				if (present.has(json)) this.load.atlas(key, `assets/heroes/${key}.png`, json);
			}
		for (const [key, url] of Object.entries(FILES.audio))
			if (present.has(url)) this.load.audio(key, url);
	}

	create(): void {
		installPlaceholders(this);
		this.scene.start(getParams(this).skipMenu ? 'Game' : 'MainMenu');
	}
}
