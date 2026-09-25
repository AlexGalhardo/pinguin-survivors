import Phaser from 'phaser';

/**
 * First scene. For now it only shows an empty screen; in Phase 1.1 it will set the
 * integer zoom and generate the placeholder textures and bitmap font.
 */
export class BootScene extends Phaser.Scene {
	constructor() {
		super('Boot');
	}

	create(): void {
		this.game.events.emit('boot-ready');
	}
}
