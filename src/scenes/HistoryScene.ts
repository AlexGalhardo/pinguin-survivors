import Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { getSave } from '../core/context';
import { getLang, type I18nKey, t } from '../i18n';
import { formatTime } from '../logic/format';
import { setupScreen, text } from '../ui/screen';

/** Last 20 runs, newest first (P-43). */
export class HistoryScene extends Phaser.Scene {
	constructor() {
		super('History');
	}

	create(): void {
		const save = getSave(this);
		const rows = save.history.length
			? save.history.map((r) => {
					const line = t('history.row', {
						date: new Date(r.endedAt).toLocaleString(getLang(), {
							dateStyle: 'short',
							timeStyle: 'short',
						}),
						hero: t(`hero.${r.hero}` as I18nKey),
						level: r.heroLevel,
						round: r.round,
						kills: r.kills.toLocaleString(getLang()),
						time: formatTime(r.durationSec),
						fish: r.fishEarned,
					});
					const outcome = t(`outcome.${r.outcome}` as I18nKey);
					return this.add
						.text(
							0,
							0,
							`${line}  (${outcome})`,
							text(9, r.outcome === 'quit' ? PALETTE.textDim : PALETTE.textLight),
						)
						.setOrigin(0.5, 0);
				})
			: [
					this.add
						.text(0, 0, t('history.empty'), text(10, PALETTE.textDim))
						.setOrigin(0.5, 0),
				];
		const kb = this.input.keyboard;
		kb?.on('keydown-ESC', () => this.scene.start('MainMenu'));
		kb?.on('keydown-ENTER', () => this.scene.start('MainMenu'));
		setupScreen(this, t('history.title'), (_view, cx) => {
			rows.forEach((row, i) => {
				row.setPosition(cx, 64 + i * 18);
			});
		});
	}
}
