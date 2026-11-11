/** World rectangle the camera shows. */
export interface ViewRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

/** Where to draw the pointer: screen position as a share of the view (0..1) and its heading in radians (0 = right). */
export interface EdgeArrow {
	x: number;
	y: number;
	angle: number;
}

/**
 * Pointer to something outside the camera (the boss in a large arena): null while the target is
 * on screen, otherwise a point on the view edge, `inset` (share of the view) away from it, on the
 * line from the view center to the target.
 */
export function offscreenArrow(
	target: { x: number; y: number },
	view: ViewRect,
	inset = 0.06,
): EdgeArrow | null {
	const inside =
		target.x >= view.x &&
		target.x <= view.x + view.width &&
		target.y >= view.y &&
		target.y <= view.y + view.height;
	if (inside || view.width <= 0 || view.height <= 0) return null;
	// Direction in view units, so a wide screen does not skew the edge the ray leaves through.
	const dx = (target.x - (view.x + view.width / 2)) / view.width;
	const dy = (target.y - (view.y + view.height / 2)) / view.height;
	const reach = (0.5 - inset) / Math.max(Math.abs(dx), Math.abs(dy));
	return {
		x: 0.5 + dx * reach,
		y: 0.5 + dy * reach,
		angle: Math.atan2(dy * view.height, dx * view.width),
	};
}
