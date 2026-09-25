import Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { STRINGS } from '../config/strings';
import { bus, GameEvent } from '../core/events';
import { fitUiCamera } from '../core/viewport';
import type { ViewSize } from '../logic/viewport';
import { addText } from '../ui/text';
import type { GameScene } from './GameScene';

/** HUD drawn in logical pixels on top of the GameScene (runs in parallel). */
export class HudScene extends Phaser.Scene {
	private banner!: Phaser.GameObjects.BitmapText;
	private view!: ViewSize;

	constructor() {
		super('Hud');
	}

	create(): void {
		const events = bus(this.game);
		this.banner = addText(this, 0, 0, '', {
			scale: 3,
			color: PALETTE.amber,
			originX: 0.5,
			originY: 0.5,
		});
		this.banner.setVisible(false);
		fitUiCamera(this, (view) => this.layout(view));
		events.onScene(this, GameEvent.WaveStarted, ({ wave }) =>
			this.showBanner(`${STRINGS.wave} ${wave}`),
		);
		events.onScene(this, GameEvent.WaveEnded, () =>
			this.showBanner(STRINGS.waveCleared, PALETTE.green),
		);
		this.syncFromGame();
	}

	/** The HUD may start after the first events were emitted: pull the current state once. */
	private syncFromGame(): void {
		const game = this.scene.get('Game') as GameScene | null;
		if (!game?.waves) return;
		if (game.waves.phase === 'intro') this.showBanner(`${STRINGS.wave} ${game.state.wave}`);
	}

	private layout(view: ViewSize): void {
		this.view = view;
		this.banner.setPosition(Math.round(view.width / 2), Math.round(view.height / 3));
	}

	private showBanner(text: string, color: number = PALETTE.amber): void {
		this.tweens.killTweensOf(this.banner);
		this.banner.setText(text).setTint(color).setAlpha(1).setVisible(true);
		this.banner.setPosition(Math.round(this.view.width / 2), Math.round(this.view.height / 3));
		this.tweens.add({
			targets: this.banner,
			alpha: 0,
			delay: 900,
			duration: 300,
			onComplete: () => this.banner.setVisible(false),
		});
	}
}
