import Phaser from 'phaser';
import { ATLAS_DIR, atlasGroups, atlasKey, registerAtlasFrames } from '../art/atlas';
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
		// Final art packed by scripts/pack-atlas.ts; frames become textures named by manifest key.
		for (const group of atlasGroups(__ASSET_FILES__))
			this.load.atlas(
				atlasKey(group),
				`${ATLAS_DIR}${group}.png`,
				`${ATLAS_DIR}${group}.json`,
			);
		for (const [key, url] of Object.entries(FILES.images))
			if (present.has(url)) this.load.image(key, url);
		// PixelLab animation atlases (scripts/pack-heroes.ts): the weaponless set shared by the
		// three tiers (hero.<id>, P-56) or an optional per-tier override (hero.<id>.t<n>).
		for (const hero of HERO_IDS)
			for (const key of [
				`hero.${hero}`,
				`hero.${hero}.t1`,
				`hero.${hero}.t2`,
				`hero.${hero}.t3`,
			]) {
				const json = `assets/heroes/${key}.json`;
				if (present.has(json)) this.load.atlas(key, `assets/heroes/${key}.png`, json);
			}
		for (const [key, url] of Object.entries(FILES.audio))
			if (present.has(url)) this.load.audio(key, url);
	}

	create(): void {
		for (const group of atlasGroups(__ASSET_FILES__))
			registerAtlasFrames(this.textures, atlasKey(group));
		installPlaceholders(this);
		this.scene.start(getParams(this).skipMenu ? 'Game' : 'MainMenu');
	}
}
