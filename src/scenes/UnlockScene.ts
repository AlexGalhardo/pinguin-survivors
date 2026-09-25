import Phaser from 'phaser';
import { SFX } from '../art/manifest';
import { PALETTE } from '../config/palette';
import { CHARACTER_TEXT, MENU } from '../config/strings';
import { fitUiCamera } from '../core/viewport';
import { CHARACTERS, type CharacterId } from '../data/characters';
import { playSfx } from '../systems/AudioSystem';
import { MenuList } from '../ui/MenuList';
import { addPanel } from '../ui/PixelPanel';
import { addText } from '../ui/text';

export interface UnlockData {
	character: CharacterId;
	onClose: () => void;
}

const PANEL_W = 220;

/** "NEW SURVIVOR UNLOCKED" overlay shown the moment a character is unlocked. */
export class UnlockScene extends Phaser.Scene {
	private d!: UnlockData;

	constructor() {
		super('Unlock');
	}

	init(data: UnlockData): void {
		this.d = data;
	}

	create(): void {
		playSfx(SFX.revive);
		const def = CHARACTERS[this.d.character];
		const dim = this.add.rectangle(0, 0, 10, 10, PALETTE.void, 0.8).setOrigin(0, 0);
		const panel = addPanel(this, 0, 0, PANEL_W, 156);
		const title = addText(this, 0, 0, MENU.unlocked, {
			scale: 2,
			color: PALETTE.amber,
			originX: 0.5,
		});
		const sprite = this.add.image(0, 0, def.texture).setScale(3);
		const name = addText(this, 0, 0, CHARACTER_TEXT[this.d.character].name, {
			scale: 2,
			color: PALETTE.white,
			originX: 0.5,
		});
		this.tweens.add({ targets: sprite, y: '-=4', duration: 500, yoyo: true, repeat: -1 });
		const menu = new MenuList(this, [
			{ label: MENU.continueLabel, onSelect: () => this.close() },
		]);
		fitUiCamera(this, (view) => {
			const cx = Math.round(view.width / 2);
			const top = Math.round(view.height / 2 - 70);
			dim.setSize(view.width, view.height);
			panel.setPosition(cx - PANEL_W / 2, top);
			title.setPosition(cx, top + 8);
			sprite.setPosition(cx, top + 60);
			name.setPosition(cx, top + 106);
			menu.layout(cx, top + 138);
		});
	}

	private close(): void {
		this.scene.stop();
		this.d.onClose();
	}
}
