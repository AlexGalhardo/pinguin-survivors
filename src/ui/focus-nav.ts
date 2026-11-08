export type FocusDir = 'up' | 'down' | 'left' | 'right';

export interface FocusRect {
	x: number;
	y: number;
	w: number;
	h: number;
}

/**
 * Spatial navigation for lists and grids: the nearest item whose center lies in the pressed
 * direction, with the cross axis weighted double so columns and rows stay aligned.
 * Returns `current` when nothing lies that way (focus never leaves the scope).
 */
export function nextFocus(rects: readonly FocusRect[], current: number, dir: FocusDir): number {
	const from = rects[current];
	if (!from) return rects.length > 0 ? 0 : -1;
	const cx = from.x + from.w / 2;
	const cy = from.y + from.h / 2;
	let best = current;
	let bestScore = Number.POSITIVE_INFINITY;
	rects.forEach((r, i) => {
		if (i === current) return;
		const dx = r.x + r.w / 2 - cx;
		const dy = r.y + r.h / 2 - cy;
		const [along, across] = dir === 'up' || dir === 'down' ? [dy, dx] : [dx, dy];
		const sign = dir === 'up' || dir === 'left' ? -1 : 1;
		const forward = along * sign;
		if (forward <= 0) return;
		const score = forward + Math.abs(across) * 2;
		if (score < bestScore) {
			bestScore = score;
			best = i;
		}
	});
	return best;
}
