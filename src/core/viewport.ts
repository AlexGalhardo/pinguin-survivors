import type Phaser from 'phaser';
import { computeView, type ViewSize } from '../logic/viewport';

/** Current integer zoom and visible logical size for the game canvas. */
export function getView(scene: Phaser.Scene): ViewSize {
	return computeView(scene.scale.width, scene.scale.height);
}

/**
 * Applies the integer zoom to a UI camera so that logical (0,0) is the top-left corner
 * and (view.width, view.height) the bottom-right. Calls `onResize` now and on every resize.
 */
export function fitUiCamera(scene: Phaser.Scene, onResize?: (view: ViewSize) => void): void {
	const apply = () => {
		const view = getView(scene);
		const cam = scene.cameras.main;
		cam.setSize(scene.scale.width, scene.scale.height);
		cam.setZoom(view.zoom);
		cam.centerOn(scene.scale.width / view.zoom / 2, scene.scale.height / view.zoom / 2);
		onResize?.(view);
	};
	apply();
	scene.scale.on('resize', apply);
	scene.events.once('shutdown', () => scene.scale.off('resize', apply));
}
