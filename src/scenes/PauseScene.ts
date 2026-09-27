import Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { trackZoom } from '../core/viewport';
import { t } from '../i18n';
import { MenuList } from '../ui/MenuList';
import { text } from '../ui/screen';
import type { GameScene } from './GameScene';

/** ESC during a run: resume, settings or quit (keeps XP and fish, P-26). */
export class PauseScene extends Phaser.Scene {
	private confirming = false;
	private hint!: Phaser.GameObjects.Text;

	constructor() {
		super('Pause');
	}

	create(): void {
		this.confirming = false;
		const dim = this.add.rectangle(0, 0, 10, 10, PALETTE.night, 0.7).setOrigin(0, 0);
		const title = this.add
			.text(0, 0, t('pause.title'), text(24, PALETTE.crit))
			.setOrigin(0.5, 0);
		const resume = () => {
			this.scene.stop();
			this.scene.resume('Game');
		};
		const menu = new MenuList(
			this,
			[
				{ label: () => t('pause.resume'), onSelect: resume },
				{
					label: () => t('menu.settings'),
					onSelect: () => {
						this.scene.sleep();
						this.scene.launch('Settings', { from: 'Pause' });
					},
				},
				{
					label: () => (this.confirming ? t('pause.yes') : t('pause.quit')),
					onSelect: () => {
						if (!this.confirming) {
							this.confirming = true;
							return;
						}
						this.scene.stop();
						const game = this.scene.get('Game') as GameScene;
						this.scene.resume('Game');
						game.quitRun();
					},
				},
			],
			{ x: 0, y: 0, fontSize: 16, onBack: resume },
		);
		const hint = this.add.text(0, 0, '', text(9, PALETTE.textDim)).setOrigin(0.5, 0);
		this.hint = hint;
		const cam = this.cameras.main;
		trackZoom(this, cam, (view) => {
			cam.centerOn(view.width / 2, view.height / 2);
			dim.setSize(view.width, view.height);
			const cx = Math.round(view.width / 2);
			const cy = Math.round(view.height / 2);
			title.setPosition(cx, cy - 80);
			menu.layout(cx, cy - 30);
			hint.setPosition(cx, cy + 50);
		});
	}

	override update(): void {
		// Scene event listeners survive stop/launch, so the hint is refreshed here instead.
		this.hint.setText(this.confirming ? t('pause.confirm') : '');
	}
}
