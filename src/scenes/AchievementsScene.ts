import Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import { PALETTE } from '../config/palette';
import { getSave } from '../core/context';
import { ACHIEVEMENTS } from '../data/achievements';
import { t } from '../i18n';
import { achievementProgress, availablePoints } from '../logic/achievements';
import { achievementDescription, achievementName } from '../ui/achievement-text';
import { setupScreen, text } from '../ui/screen';

const ROW_H = 26;

/** Global achievement list with progress, points and the (future) extras shop (P-41/P-42). */
export class AchievementsScene extends Phaser.Scene {
	private scroll = 0;

	constructor() {
		super('Achievements');
	}

	create(): void {
		const save = getSave(this);
		this.scroll = 0;
		const done = Object.keys(save.achievements.unlocked).length;
		const summary = this.add
			.text(
				0,
				0,
				t('ach.summary', {
					done,
					total: ACHIEVEMENTS.length,
					points: availablePoints(save.achievements),
				}),
				text(10, PALETTE.fish),
			)
			.setOrigin(0.5, 0);
		const shop = this.add.text(0, 0, t('ach.shop'), text(10, PALETTE.fish)).setOrigin(0.5, 0);
		// Unlocked first (newest first), then the closest ones to completion.
		const sorted = [...ACHIEVEMENTS].sort((a, b) => {
			const ua = save.achievements.unlocked[a.id] ?? 0;
			const ub = save.achievements.unlocked[b.id] ?? 0;
			if (ua || ub) return ub - ua;
			return achievementProgress(b, save.progress) - achievementProgress(a, save.progress);
		});
		const rows = sorted.map((def) => {
			const unlocked = save.achievements.unlocked[def.id] !== undefined;
			const badge = this.add.image(0, 0, KEYS.achievementBadge);
			badge.setScale(16 / Math.max(badge.width, badge.height));
			if (!unlocked) badge.setTint(0x333a48);
			const progress = Math.round(achievementProgress(def, save.progress) * 100);
			const name = this.add
				.text(
					14,
					-10,
					achievementName(def),
					text(10, unlocked ? PALETTE.crit : PALETTE.textLight),
				)
				.setOrigin(0, 0);
			const desc = this.add
				.text(
					14,
					1,
					`${achievementDescription(def)}${unlocked ? '' : `  ·  ${progress}%`}`,
					text(8, PALETTE.textDim),
				)
				.setOrigin(0, 0);
			return this.add.container(0, 0, [badge, name, desc]);
		});
		let listTop = 0;
		let listH = 0;
		let left = 0;
		const place = () => {
			rows.forEach((r, i) => {
				const y = listTop + 10 + i * ROW_H - this.scroll;
				// Rows outside the list area are hidden (simpler than a mask for plain text rows).
				r.setPosition(left, y).setVisible(y >= listTop && y <= listTop + listH - ROW_H / 2);
			});
		};
		const maxScroll = () => Math.max(0, rows.length * ROW_H - listH + 10);
		const scrollBy = (d: number) => {
			this.scroll = Math.min(maxScroll(), Math.max(0, this.scroll + d));
			place();
		};
		const kb = this.input.keyboard;
		kb?.on('keydown-UP', () => scrollBy(-ROW_H));
		kb?.on('keydown-W', () => scrollBy(-ROW_H));
		kb?.on('keydown-DOWN', () => scrollBy(ROW_H));
		kb?.on('keydown-S', () => scrollBy(ROW_H));
		kb?.on('keydown-PAGE_DOWN', () => scrollBy(ROW_H * 8));
		kb?.on('keydown-PAGE_UP', () => scrollBy(-ROW_H * 8));
		kb?.on('keydown-ESC', () => this.scene.start('MainMenu'));
		kb?.on('keydown-ENTER', () => this.scene.start('Extras'));
		shop.setInteractive({ useHandCursor: true }).on('pointerdown', () =>
			this.scene.start('Extras'),
		);
		this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) =>
			scrollBy(dy > 0 ? ROW_H * 2 : -ROW_H * 2),
		);
		setupScreen(this, t('ach.title'), (view, cx) => {
			summary.setPosition(cx, 52);
			listTop = 72;
			listH = view.height - listTop - 44;
			left = Math.round(cx - 200);
			shop.setPosition(cx, view.height - 34);
			place();
		});
	}
}
