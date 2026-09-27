import Phaser from 'phaser';
import { PALETTE, toCss } from '../config/palette';
import { sfx } from '../core/audio';
import { stopMusic } from '../core/music';
import { trackZoom } from '../core/viewport';
import { getLang, t } from '../i18n';
import { formatTime } from '../logic/format';
import type { RunRecord } from '../logic/save';
import { UI_FONT } from '../ui/font';
import { addVersionFooter } from '../ui/version-footer';

interface GameOverData {
	record: RunRecord;
	newBest: boolean;
}

/** Run summary (docs/ui-hud.md §GameOver). The main menu will replace the direct retry. */
export class GameOverScene extends Phaser.Scene {
	constructor() {
		super('GameOver');
	}

	create(data: GameOverData): void {
		stopMusic(this);
		sfx(this, 'sfx.gameOver');
		const r = data.record;
		const style = (size: number, color: number = PALETTE.textLight) => ({
			fontFamily: UI_FONT,
			fontSize: `${size}px`,
			color: toCss(color),
			align: 'center',
		});
		const lines = [
			this.add.text(
				0,
				0,
				t(r.outcome === 'bossTimeout' ? 'over.bossTimeout' : 'over.title'),
				style(24, PALETTE.blood),
			),
			this.add.text(0, 0, t('over.round', { n: r.round }), style(16)),
			this.add.text(
				0,
				0,
				t('over.stats', {
					kills: r.kills.toLocaleString(getLang()),
					time: formatTime(r.durationSec),
					damage: r.damageDealt.toLocaleString(getLang()),
				}),
				style(10, PALETTE.textDim),
			),
			this.add.text(
				0,
				0,
				t('over.rewards', { xp: r.xpEarned, fish: r.fishEarned, levels: r.levelsGained }),
				style(10, PALETTE.crit),
			),
			...(data.newBest
				? [this.add.text(0, 0, t('over.newBest'), style(12, PALETTE.crit))]
				: []),
			this.add.text(
				0,
				0,
				`${t('over.retry')}   ·   ${t('over.menu')}`,
				style(10, PALETTE.textDim),
			),
		];
		for (const l of lines) l.setOrigin(0.5, 0);
		const footer = addVersionFooter(this);
		const cam = this.cameras.main;
		cam.setBackgroundColor(PALETTE.night);
		trackZoom(this, cam, (view) => {
			cam.centerOn(view.width / 2, view.height / 2);
			let y = Math.round(view.height * 0.3);
			for (const l of lines) {
				l.setPosition(Math.round(view.width / 2), y);
				y += l.height + 8;
			}
			footer.layout(view);
		});
		this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('Game'));
		this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('Game'));
		this.input.keyboard?.once('keydown-ESC', () => this.scene.start('MainMenu'));
	}
}
