import Phaser from 'phaser';
import { installIcons, installPlaceholders, installSheets } from '../art/placeholders/install';
import { SHEETS } from '../art/placeholders/sheets';
import { PALETTE } from '../config/palette';
import { STRINGS } from '../config/strings';
import { getParams } from '../core/context';
import { fitUiCamera } from '../core/viewport';
import { AudioSystem } from '../systems/AudioSystem';
import { MusicSystem } from '../systems/MusicSystem';
import { Bar } from '../ui/Bar';
import { addText } from '../ui/text';

/** Set by vite.config.ts: true when public/assets/atlas.json exists (final art, 1.0). */
declare const __HAS_ATLAS__: boolean;

const ATLAS = 'atlas';
const BAR_W = 160;

/**
 * Loads the real art atlas when it exists (1.0) and falls back, key by key, to the
 * code-drawn placeholders. Shows a pixel loading bar. Then starts the menu (or the game).
 */
export class PreloadScene extends Phaser.Scene {
	private bar!: Bar;
	private label!: Phaser.GameObjects.BitmapText;

	constructor() {
		super('Preload');
	}

	preload(): void {
		this.label = addText(this, 0, 0, STRINGS.loading, { color: PALETTE.amber, originX: 0.5 });
		this.bar = new Bar(this, 0, 0, BAR_W, 8, PALETTE.amber).setRatio(0);
		fitUiCamera(this, (view) => {
			const cx = Math.round(view.width / 2);
			const cy = Math.round(view.height / 2);
			this.label.setPosition(cx, cy - 14);
			this.bar.setPosition(cx - BAR_W / 2, cy);
		});
		this.load.on('progress', (p: number) => this.bar.setRatio(p));
		this.load.on('loaderror', () => {
			// Missing/broken atlas: the placeholders cover every key.
		});
		if (__HAS_ATLAS__) this.load.atlas(ATLAS, 'assets/atlas.png', 'assets/atlas.json');
	}

	create(): void {
		this.registerAtlasFrames();
		installPlaceholders(this);
		installIcons(this);
		installSheets(this);
		AudioSystem.init(this.game);
		MusicSystem.init(this.game);
		this.bar.setRatio(1);
		const params = getParams(this);
		if (params.debug) this.scene.launch('Debug');
		this.scene.start(params.skipMenu ? 'Game' : 'MainMenu');
		this.game.events.emit('boot-ready');
	}

	/** Every atlas frame named after a manifest key becomes a texture with that key. */
	private registerAtlasFrames(): void {
		if (!this.textures.exists(ATLAS)) return;
		const atlas = this.textures.get(ATLAS);
		for (const name of atlas.getFrameNames()) {
			if (this.textures.exists(name)) continue;
			const frame = atlas.get(name);
			const sheet = SHEETS[name];
			this.textures.addSpriteSheetFromAtlas(name, {
				atlas: ATLAS,
				frame: name,
				frameWidth: sheet ? sheet.frameW : frame.width,
				frameHeight: sheet ? sheet.frameH : frame.height,
			});
		}
	}
}
