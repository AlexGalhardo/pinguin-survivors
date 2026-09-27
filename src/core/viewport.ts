import type Phaser from 'phaser';
import { computeView, type ViewSize } from '../logic/viewport';

export function getView(scene: Phaser.Scene): ViewSize {
	return computeView(scene.scale.width, scene.scale.height);
}

/** Keeps a camera on the integer zoom for the current window, now and on every resize. */
export function trackZoom(
	scene: Phaser.Scene,
	camera: Phaser.Cameras.Scene2D.Camera,
	onResize?: (view: ViewSize) => void,
): void {
	const apply = () => {
		const view = getView(scene);
		camera.setSize(scene.scale.width, scene.scale.height);
		camera.setZoom(view.zoom);
		onResize?.(view);
	};
	apply();
	scene.scale.on('resize', apply);
	scene.events.once('shutdown', () => scene.scale.off('resize', apply));
}
