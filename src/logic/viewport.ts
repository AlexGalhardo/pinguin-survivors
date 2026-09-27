import { LOGICAL_H } from '../config/constants';

export interface ViewSize {
	zoom: number;
	/** Visible logical size (variable width: ultrawide shows more world). */
	width: number;
	height: number;
}

export function computeZoom(_width: number, height: number): number {
	return Math.max(1, Math.floor(height / LOGICAL_H));
}

export function computeView(width: number, height: number): ViewSize {
	const zoom = computeZoom(width, height);
	return { zoom, width: width / zoom, height: height / zoom };
}
