const claimed = new WeakSet<object>();

/**
 * Marks a key event as consumed. Returns false if another listener already claimed it.
 * Needed because several menus listen to the same keydown: an Enter that opens a confirmation
 * menu would otherwise also be seen by that menu and select its first option right away.
 */
export function claimKeyEvent(event: object): boolean {
	if (claimed.has(event)) return false;
	claimed.add(event);
	return true;
}
