import Phaser from 'phaser';
import { installPlaceholders } from '../art/placeholders';

export class BootScene extends Phaser.Scene {
	constructor() {
		super('Boot');
	}

	create(): void {
		installPlaceholders(this);
		this.scene.start('Game');
	}
}
