import Phaser from 'phaser';
import { PLACEHOLDERS } from '../art/placeholders/textures';
import { PALETTE } from '../config/palette';
import { STRINGS } from '../config/strings';
import { fitUiCamera } from '../core/viewport';
import { addText } from '../ui/text';

/** Main gameplay scene (Phase 1.1: shows the generated textures and font as a smoke test). */
export class GameScene extends Phaser.Scene {
	constructor() {
		super('Game');
	}

	create(): void {
		addText(this, 8, 8, STRINGS.gameTitle, { scale: 2, color: PALETTE.amber });
		addText(this, 8, 28, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789 .,!?:;-+/%()\'"#<>=_*[]&~$^|@');
		let x = 8;
		let y = 44;
		for (const key of Object.keys(PLACEHOLDERS)) {
			const img = this.add.image(x, y, key).setOrigin(0, 0);
			x += Math.max(img.width, 16) + 4;
			if (x > 440) {
				x = 8;
				y += 70;
			}
		}
		fitUiCamera(this);
	}
}
