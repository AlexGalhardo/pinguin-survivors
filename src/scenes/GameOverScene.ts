import Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { sfx } from '../core/audio';
import { stopMusic } from '../core/music';
import { getLang, t } from '../i18n';
import { formatTime } from '../logic/format';
import type { RunRecord } from '../logic/save';
import { TITLE_FONT } from '../ui/font';
import { MenuList } from '../ui/MenuList';
import { setupScreen, text } from '../ui/screen';

interface GameOverData {
	record: RunRecord;
	newBest: boolean;
}

/**
 * Run summary (docs/gdd.md §21 §GameOver) with a real menu: in fullscreen the browser eats Esc
 * (it leaves fullscreen), so "main menu" must also work with arrows/Enter and the mouse.
 */
export class GameOverScene extends Phaser.Scene {
	constructor() {
		super('GameOver');
	}

	create(data: GameOverData): void {
		stopMusic(this);
		sfx(this, 'sfx.gameOver');
		const r = data.record;
		const round = this.add
			.text(0, 0, t('over.round', { n: r.round }), text(22, PALETTE.textLight))
			.setOrigin(0.5, 0);
		const stats = this.add
			.text(
				0,
				0,
				t('over.stats', {
					kills: r.kills.toLocaleString(getLang()),
					time: formatTime(r.durationSec),
					damage: r.damageDealt.toLocaleString(getLang()),
				}),
				text(14, PALETTE.textDim),
			)
			.setOrigin(0.5, 0);
		const rewards = this.add
			.text(
				0,
				0,
				t('over.rewards', { xp: r.xpEarned, fish: r.fishEarned, levels: r.levelsGained }),
				text(14, PALETTE.crit),
			)
			.setOrigin(0.5, 0);
		const best = data.newBest
			? this.add.text(0, 0, t('over.newBest'), text(18, PALETTE.crit)).setOrigin(0.5, 0)
			: null;
		const toMenu = () => this.scene.start('MainMenu');
		const menu = new MenuList(
			this,
			[
				{ label: () => t('over.playAgain'), onSelect: () => this.scene.start('Game') },
				{ label: () => t('over.mainMenu'), onSelect: toMenu },
			],
			{ x: 0, y: 0, fontSize: 18, spacing: 30, onBack: toMenu },
		);
		// M also works: Esc may be swallowed by the browser in fullscreen.
		this.input.keyboard?.on('keydown-M', toMenu);
		const heading = setupScreen(
			this,
			t(r.outcome === 'bossTimeout' ? 'over.bossTimeout' : 'over.title'),
			(view, cx) => {
				let y = Math.round(view.height * 0.26);
				for (const line of [round, stats, rewards, best]) {
					if (!line) continue;
					line.setPosition(cx, y);
					y += line.height + 10;
				}
				menu.layout(cx, y + 24);
			},
		);
		heading.setFontSize(40).setColor('#c4161c').setFontFamily(TITLE_FONT).setY(40);
	}
}
