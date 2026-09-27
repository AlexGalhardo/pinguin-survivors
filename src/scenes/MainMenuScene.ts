import Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { getSave } from '../core/context';
import { t } from '../i18n';
import { availablePoints } from '../logic/achievements';
import { MenuBackground } from '../ui/MenuBackground';
import { MenuList } from '../ui/MenuList';
import { setupScreen, text } from '../ui/screen';

export class MainMenuScene extends Phaser.Scene {
	constructor() {
		super('MainMenu');
	}

	create(): void {
		const save = getSave(this);
		const background = new MenuBackground(this);
		const panel = this.add
			.rectangle(0, 0, 260, 150, 0x0b0e14, 0.72)
			.setStrokeStyle(1, 0x3a2418);
		const subtitle = this.add
			.text(0, 0, t('menu.subtitle'), text(10, PALETTE.textDim))
			.setOrigin(0.5, 0);
		const wallet = this.add
			.text(
				0,
				0,
				t('menu.wallet', { fish: save.fish, points: availablePoints(save.achievements) }),
				text(10, 0xff9a3c),
			)
			.setOrigin(0.5, 0);
		const go = (key: string) => () => this.scene.start(key);
		const menu = new MenuList(
			this,
			[
				{ label: () => t('menu.play'), onSelect: go('HeroSelect') },
				{ label: () => t('menu.hero'), onSelect: go('Hero') },
				{ label: () => t('menu.achievements'), onSelect: go('Achievements') },
				{ label: () => t('menu.history'), onSelect: go('History') },
				{
					label: () => t('menu.settings'),
					onSelect: () => this.scene.start('Settings', { from: 'MainMenu' }),
				},
			],
			{ x: 0, y: 0, fontSize: 16 },
		);
		const heading = setupScreen(this, t('game.title').toUpperCase(), (view, cx) => {
			background.layout(view);
			subtitle.setPosition(cx, 64);
			// Menu on the left third so the hero in the key art stays visible.
			const mx = Math.round(Math.max(150, view.width * 0.2));
			panel.setPosition(mx, Math.round(view.height / 2 + 4)).setSize(260, menu.height + 24);
			menu.layout(mx, Math.round(view.height / 2 - menu.height / 2 + 4));
			wallet.setPosition(mx, Math.round(view.height / 2 + menu.height / 2 + 26));
		});
		heading.setFontSize(32).setColor('#e8ecf2');
	}
}
