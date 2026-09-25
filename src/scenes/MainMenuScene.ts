import Phaser from 'phaser';
import { TEX } from '../art/manifest';
import { PALETTE } from '../config/palette';
import { MENU, STRINGS } from '../config/strings';
import { fitUiCamera } from '../core/viewport';
import { addStarfield } from '../ui/backdrop';
import { MenuList } from '../ui/MenuList';
import { addText } from '../ui/text';

declare const __APP_VERSION__: string;

/** Title screen: Play and Settings. */
export class MainMenuScene extends Phaser.Scene {
	constructor() {
		super('MainMenu');
	}

	create(): void {
		addStarfield(this);
		const title = addText(this, 0, 0, STRINGS.gameTitle, {
			scale: 4,
			color: PALETTE.amber,
			originX: 0.5,
		});
		const subtitle = addText(this, 0, 0, MENU.subtitle, { color: PALETTE.cyan, originX: 0.5 });
		const heroes = [TEX.playerWarrior, TEX.playerRanger, TEX.playerMage].map((key, i) =>
			this.add
				.image(0, 0, key)
				.setScale(2)
				.setFlipX(i === 2),
		);
		const menu = new MenuList(this, [
			{ label: MENU.play, onSelect: () => this.scene.start('CharacterSelect') },
			{
				label: MENU.settings,
				onSelect: () => {
					this.scene.pause();
					this.scene.launch('Settings', { from: 'MainMenu' });
				},
			},
		]);
		const hint = addText(this, 0, 0, MENU.menuHint, { color: PALETTE.steel, originX: 0.5 });
		const version = addText(this, 0, 0, `v${__APP_VERSION__}`, {
			color: PALETTE.slate,
			originX: 1,
			originY: 1,
		});
		fitUiCamera(this, (view) => {
			const cx = Math.round(view.width / 2);
			const top = Math.round(view.height * 0.18);
			title.setPosition(cx, top);
			subtitle.setPosition(cx, top + 34);
			heroes.forEach((h, i) => {
				h.setPosition(cx + (i - 1) * 48, top + 78);
			});
			menu.layout(cx, top + 124);
			hint.setPosition(cx, view.height - 16);
			version.setPosition(view.width - 4, view.height - 4);
		});
	}
}
