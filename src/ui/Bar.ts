import Phaser from 'phaser';
import { PALETTE } from '../config/palette';

/** Pixel bar: 1 px dark border, background and a colored fill. Origin at the top-left. */
export class Bar extends Phaser.GameObjects.Container {
	private readonly bg: Phaser.GameObjects.Rectangle;
	private readonly fill: Phaser.GameObjects.Rectangle;
	private readonly shine: Phaser.GameObjects.Rectangle;
	private ratio = 1;

	constructor(
		scene: Phaser.Scene,
		x: number,
		y: number,
		private barW: number,
		private readonly barH: number,
		color: number,
	) {
		super(scene, x, y);
		this.bg = scene.add.rectangle(0, 0, barW, barH, PALETTE.midnight).setOrigin(0, 0);
		this.bg.setStrokeStyle(1, PALETTE.void);
		this.fill = scene.add.rectangle(1, 1, barW - 2, barH - 2, color).setOrigin(0, 0);
		this.shine = scene.add.rectangle(1, 1, barW - 2, 1, PALETTE.white, 0.35).setOrigin(0, 0);
		this.add([this.bg, this.fill, this.shine]);
		scene.add.existing(this);
	}

	setRatio(ratio: number): this {
		this.ratio = Phaser.Math.Clamp(ratio, 0, 1);
		const w = Math.round((this.barW - 2) * this.ratio);
		this.fill.setSize(w, this.barH - 2).setVisible(w > 0);
		this.shine.setSize(w, 1).setVisible(w > 0);
		return this;
	}

	setColor(color: number): this {
		this.fill.setFillStyle(color);
		return this;
	}

	setBarWidth(width: number): this {
		this.barW = width;
		this.bg.setSize(width, this.barH);
		return this.setRatio(this.ratio);
	}
}
