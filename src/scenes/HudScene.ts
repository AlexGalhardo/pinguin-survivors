import Phaser from 'phaser';
import { PALETTE, toCss } from '../config/palette';
import { getParams } from '../core/context';
import { GameEvents } from '../core/events';
import { trackZoom } from '../core/viewport';
import type { AchievementDef } from '../data/achievements';
import { t } from '../i18n';
import { AchievementToast } from '../ui/AchievementToast';
import { UI_FONT } from '../ui/font';
import { addVersionFooter } from '../ui/version-footer';
import type { GameScene } from './GameScene';

export class HudScene extends Phaser.Scene {
	private debugText?: Phaser.GameObjects.Text;
	private speedText!: Phaser.GameObjects.Text;

	constructor() {
		super('Hud');
	}

	create(): void {
		const cam = this.cameras.main;
		this.speedText = this.add
			.text(0, 4, '', { fontFamily: UI_FONT, fontSize: '16px', color: toCss(PALETTE.crit) })
			.setOrigin(1, 0);
		const footer = addVersionFooter(this);
		const toast = new AchievementToast(this);
		const onUnlock = (defs: AchievementDef[]) => toast.show(defs);
		this.game.events.on(GameEvents.AchievementsUnlocked, onUnlock);
		this.events.once('shutdown', () =>
			this.game.events.off(GameEvents.AchievementsUnlocked, onUnlock),
		);
		trackZoom(this, cam, (view) => {
			cam.centerOn(view.width / 2, view.height / 2);
			footer.layout(view);
			toast.layout(view.width);
			this.speedText.setX(view.width - 8);
		});
		if (getParams(this).debug) {
			this.debugText = this.add.text(6, 4, '', {
				fontFamily: UI_FONT,
				fontSize: '12px',
				color: toCss(PALETTE.textLight),
			});
		}
	}

	override update(): void {
		const game = this.scene.get('Game') as GameScene;
		if (!game.hero) return;
		this.speedText.setText(game.speed > 1 ? t('hud.speed', { n: game.speed }) : '');
		if (!this.debugText) return;
		this.debugText.setText(
			t('debug.stats', {
				fps: Math.round(this.game.loop.actualFps),
				chunks: game.chunks.count,
				x: Math.round(game.hero.x),
				y: Math.round(game.hero.y),
			}),
		);
	}
}
