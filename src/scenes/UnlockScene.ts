import Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import type { HeroId } from '../config/constants';
import { PALETTE } from '../config/palette';
import { sfx } from '../core/audio';
import { type I18nKey, t } from '../i18n';
import { setupScreen, text } from '../ui/screen';

export interface UnlockData {
	heroes: HeroId[];
	/** Scene shown after the last hero (the run summary). */
	next: { key: string; data?: object };
}

/** Dedicated "new penguin unlocked" screen, shown after the run that unlocked it (PLAN 3.3). */
export class UnlockScene extends Phaser.Scene {
	constructor() {
		super('Unlock');
	}

	create(data: UnlockData): void {
		const [hero, ...rest] = data.heroes;
		if (!hero) {
			this.scene.start(data.next.key, data.next.data);
			return;
		}
		sfx(this, 'sfx.achievement');
		const key = this.textures.exists(KEYS.portrait(hero))
			? KEYS.portrait(hero)
			: KEYS.heroFacing(hero, 1, 's');
		const portrait = this.add.image(0, 0, key).setScale(2);
		const glow = this.add.circle(0, 0, 90, PALETTE[hero], 0.18);
		const name = this.add
			.text(0, 0, t(`unlock.${hero}` as I18nKey), text(24, PALETTE.crit))
			.setOrigin(0.5, 0);
		const role = this.add
			.text(0, 0, t(`role.${hero}` as I18nKey), text(12, PALETTE.textLight))
			.setOrigin(0.5, 0);
		const blurb = this.add
			.text(0, 0, t(`unlock.${hero}.blurb` as I18nKey), text(10, PALETTE.textDim, 360))
			.setOrigin(0.5, 0);
		const hint = this.add
			.text(0, 0, t('unlock.continue'), text(9, PALETTE.textDim))
			.setOrigin(0.5, 0);
		this.tweens.add({
			targets: glow,
			scale: { from: 0.9, to: 1.1 },
			alpha: { from: 0.12, to: 0.28 },
			duration: 900,
			yoyo: true,
			repeat: -1,
		});
		portrait.setAlpha(0);
		this.tweens.add({ targets: portrait, alpha: 1, duration: 500 });
		setupScreen(this, t('unlock.title'), (view, cx) => {
			const cy = Math.round(view.height * 0.38);
			glow.setPosition(cx, cy);
			portrait.setPosition(cx, cy);
			name.setPosition(cx, cy + 100);
			role.setPosition(cx, cy + 132);
			blurb.setPosition(cx, cy + 154);
			hint.setPosition(cx, view.height - 48);
		});
		const next = () => this.scene.restart({ heroes: rest, next: data.next });
		// Short delay so the key that ended the run does not skip the screen.
		this.time.delayedCall(600, () => {
			this.input.keyboard?.once('keydown-ENTER', next);
			this.input.keyboard?.once('keydown-SPACE', next);
			this.input.once('pointerdown', next);
		});
	}
}
