import Phaser from 'phaser';
import { SFX } from '../art/manifest';
import { PALETTE } from '../config/palette';
import { CREDITS, MENU } from '../config/strings';
import { fitUiCamera } from '../core/viewport';
import { playSfx } from '../systems/AudioSystem';
import { addStarfield } from '../ui/backdrop';
import { MenuList } from '../ui/MenuList';
import { addText } from '../ui/text';
import { pixelIn, pixelOut } from '../ui/transition';

/** Credits and licenses (1.0). */
export class CreditsScene extends Phaser.Scene {
	constructor() {
		super('Credits');
	}

	create(): void {
		addStarfield(this);
		const title = addText(this, 0, 0, MENU.credits, {
			scale: 2,
			color: PALETTE.amber,
			originX: 0.5,
		});
		const lines = CREDITS.map(([head, body]) => [
			addText(this, 0, 0, head, { color: PALETTE.cyan, originX: 0.5 }),
			addText(this, 0, 0, body, { color: PALETTE.silver, originX: 0.5 }),
		]);
		const menu = new MenuList(this, [{ label: MENU.back, onSelect: () => this.back() }]);
		this.input.keyboard?.on('keydown-ESC', () => this.back());
		fitUiCamera(this, (view) => {
			const cx = Math.round(view.width / 2);
			const top = Math.max(24, Math.round(view.height / 2 - (CREDITS.length * 22) / 2 - 10));
			title.setPosition(cx, top - 20);
			lines.forEach(([h, b], i) => {
				h?.setPosition(cx, top + i * 22);
				b?.setPosition(cx, top + i * 22 + 9);
			});
			menu.layout(cx, top + CREDITS.length * 22 + 10);
		});
		pixelIn(this);
	}

	private back(): void {
		playSfx(SFX.uiClick);
		pixelOut(this, () => this.scene.start('MainMenu'));
	}
}
