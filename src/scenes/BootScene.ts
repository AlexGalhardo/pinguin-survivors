import Phaser from 'phaser';
import { FILES } from '../art/manifest';
import { installPlaceholders } from '../art/placeholders';
import { setSave } from '../core/context';
import { loadSave } from '../core/storage';
import { detectLang, setLang } from '../i18n';

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
		const save = loadSave(detectLang(navigator.language));
		setLang(save.settings.lang);
		setSave(this.game, save);
		installPlaceholders(this);
		this.scene.start('Game');
	}
}
