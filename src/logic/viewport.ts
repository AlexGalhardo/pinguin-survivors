import { LOGICAL_H, LOGICAL_W } from '../config/constants';

/** Integer zoom that fits the 480x270 logical view in the window (never below 1). */
export function computeZoom(width: number, height: number): number {
	return Math.max(1, Math.floor(Math.min(width / LOGICAL_W, height / LOGICAL_H)));
}

export interface ViewSize {
	zoom: number;
	/** Visible width/height in logical pixels (>= 480x270 when the window allows it). */
	width: number;
	height: number;
}

export function computeView(width: number, height: number): ViewSize {
	const zoom = computeZoom(width, height);
	return { zoom, width: Math.floor(width / zoom), height: Math.floor(height / zoom) };
}
