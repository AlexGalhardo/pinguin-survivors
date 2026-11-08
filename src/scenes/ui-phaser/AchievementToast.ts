import type Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import { PALETTE, toCss } from '../config/palette';
import { sfx } from '../core/audio';
import type { AchievementDef } from '../data/achievements';
import { t } from '../i18n';
import { achievementName } from './achievement-text';
import { UI_FONT } from './font';

const WIDTH = 300;
const HEIGHT = 56;
/** Below the round timer and boss bar, still top-centered (P-44). */
const TOP = 62;
const HOLD_MS = 2800;

/**
 * "Achievement unlocked" banner centered at the top of the screen, with the shared badge and
 * sound. Unlocks arriving together are queued and shown one after another.
 */
export class AchievementToast {
	private readonly queue: AchievementDef[] = [];
	private busy = false;
	private readonly box: Phaser.GameObjects.Container;
	private readonly name: Phaser.GameObjects.Text;
	private centerX = 0;

	constructor(private readonly scene: Phaser.Scene) {
		const bg = scene.add
			.rectangle(0, 0, WIDTH, HEIGHT, PALETTE.night, 0.92)
			.setStrokeStyle(1, PALETTE.crit);
		const badge = scene.add.image(-WIDTH / 2 + 20, 0, KEYS.achievementBadge);
		// Integer ratios only (64 px art → 0.5), fractional scaling smears pixel art.
		badge.setScale(32 / Math.max(badge.width, badge.height));
		badge.setX(-WIDTH / 2 + 24);
		const title = scene.add
			.text(-WIDTH / 2 + 44, -20, t('ach.unlocked'), {
				fontFamily: UI_FONT,
				fontSize: '11px',
				fontStyle: 'bold',
				color: toCss(PALETTE.crit),
			})
			.setOrigin(0, 0);
		this.name = scene.add
			.text(-WIDTH / 2 + 44, -6, '', {
				fontFamily: UI_FONT,
				fontSize: '16px',
				fontStyle: 'bold',
				color: toCss(PALETTE.textLight),
			})
			.setOrigin(0, 0);
		const point = scene.add
			.text(WIDTH / 2 - 8, 16, t('ach.point'), {
				fontFamily: UI_FONT,
				fontSize: '11px',
				color: toCss(PALETTE.textDim),
			})
			.setOrigin(1, 0.5);
		this.box = scene.add
			.container(0, -HEIGHT, [bg, badge, title, this.name, point])
			.setVisible(false)
			.setDepth(1000);
	}

	layout(viewWidth: number): void {
		this.centerX = Math.round(viewWidth / 2);
		this.box.setX(this.centerX);
	}

	show(defs: readonly AchievementDef[]): void {
		this.queue.push(...defs);
		if (!this.busy) this.next();
	}

	private next(): void {
		const def = this.queue.shift();
		if (!def) {
			this.busy = false;
			return;
		}
		this.busy = true;
		this.name.setText(achievementName(def));
		this.box.setPosition(this.centerX, -HEIGHT).setVisible(true);
		sfx(this.scene, 'sfx.achievement');
		this.scene.tweens.chain({
			targets: this.box,
			tweens: [
				{ y: TOP + HEIGHT / 2, duration: 260, ease: 'Back.easeOut' },
				{ y: TOP + HEIGHT / 2, duration: HOLD_MS },
				{ y: -HEIGHT, duration: 220, ease: 'Quad.easeIn' },
			],
			onComplete: () => {
				this.box.setVisible(false);
				this.next();
			},
		});
	}
}
