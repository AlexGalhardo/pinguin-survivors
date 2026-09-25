import Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { fitUiCamera } from '../core/viewport';
import { debugStats } from '../debug/debug-stats';
import { addText } from '../ui/text';

/** Overlay (?debug=1): FPS, enemies, projectiles and physics bodies. Runs on top of every scene. */
export class DebugScene extends Phaser.Scene {
	private label!: Phaser.GameObjects.BitmapText;
	private elapsed = 0;

	constructor() {
		super('Debug');
	}

	create(): void {
		this.label = addText(this, 0, 0, '', { color: PALETTE.green });
		fitUiCamera(this, (view) => this.label.setPosition(view.width - 4, view.height - 4));
		this.label.setOrigin(1, 1).setRightAlign();
	}

	override update(_time: number, delta: number): void {
		this.elapsed += delta;
		if (this.elapsed < 250) return;
		this.elapsed = 0;
		this.scene.bringToTop();
		const fps = Math.round(this.game.loop.actualFps);
		this.label.setText(
			[
				`FPS ${fps}`,
				`ENEMIES ${debugStats.enemies}`,
				`PROJ ${debugStats.projectiles}+${debugStats.enemyProjectiles}`,
				`BODIES ${debugStats.bodies}`,
			].join('\n'),
		);
		this.label.setTint(fps >= 55 ? PALETTE.green : fps >= 40 ? PALETTE.amber : PALETTE.red);
	}
}
