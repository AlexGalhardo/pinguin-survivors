import Phaser from 'phaser';
import { TEX } from '../art/manifest';
import { PALETTE } from '../config/palette';
import { MENU } from '../config/strings';
import { fitUiCamera } from '../core/viewport';
import { MusicSystem } from '../systems/MusicSystem';
import { addStarfield } from '../ui/backdrop';
import { MenuList } from '../ui/MenuList';
import { addText } from '../ui/text';
import { pixelIn, pixelOut } from '../ui/transition';

declare const __APP_VERSION__: string;

/** Title screen: Play and Settings. */
export class MainMenuScene extends Phaser.Scene {
	constructor() {
		super('MainMenu');
	}

	create(): void {
		addStarfield(this);
		MusicSystem.get()?.duck(false);
		MusicSystem.get()?.play('menu');
		const keyArt = this.add.image(0, 0, TEX.uiKeyArt).setOrigin(0.5, 1);
		const title = this.add.image(0, 0, TEX.uiLogo).setOrigin(0.5, 0);
		const subtitle = addText(this, 0, 0, MENU.subtitle, { color: PALETTE.steel, originX: 0.5 });
		const heroes = [TEX.playerWarrior, TEX.playerRanger, TEX.playerMage].map((key, i) =>
			this.add
				.image(0, 0, key)
				.setScale(2)
				.setFlipX(i === 2),
		);
		const menu = new MenuList(this, [
			{
				label: MENU.play,
				onSelect: () => pixelOut(this, () => this.scene.start('CharacterSelect')),
			},
			{
				label: MENU.upgrades,
				onSelect: () => pixelOut(this, () => this.scene.start('Upgrades')),
			},
			{
				label: MENU.records,
				onSelect: () => pixelOut(this, () => this.scene.start('Records')),
			},
			{
				label: MENU.achievements,
				onSelect: () => pixelOut(this, () => this.scene.start('Achievements')),
			},
			{
				label: MENU.settings,
				onSelect: () => {
					this.scene.pause();
					this.scene.launch('Settings', { from: 'MainMenu' });
				},
			},
			{
				label: MENU.credits,
				onSelect: () => pixelOut(this, () => this.scene.start('Credits')),
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
			const top = Math.round(view.height * 0.18) - 18;
			keyArt.setPosition(cx, view.height);
			title.setPosition(cx, top - 12);
			subtitle.setPosition(cx, top + 48);
			// Small views drop the hero row so the 6 buttons fit.
			const roomy = view.height >= 340;
			heroes.forEach((h, i) => {
				h.setPosition(cx + (i - 1) * 48, top + 92).setVisible(roomy);
			});
			menu.layout(cx, top + (roomy ? 126 : 78));
			hint.setPosition(cx, view.height - 16);
			version.setPosition(view.width - 4, view.height - 4);
		});
		pixelIn(this);
	}
}
