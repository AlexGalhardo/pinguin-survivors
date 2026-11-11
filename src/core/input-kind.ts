/** What the player touched last: the key hints on screen follow it (Steam Deck shows pad buttons). */
export type InputKind = 'keyboard' | 'gamepad';

let current: InputKind = 'keyboard';
const listeners = new Set<() => void>();

export function inputKind(): InputKind {
	return current;
}

export function noteInput(kind: InputKind): void {
	if (kind === current) return;
	current = kind;
	for (const fn of listeners) fn();
}

export function subscribeInputKind(fn: () => void): () => void {
	listeners.add(fn);
	return () => listeners.delete(fn);
}

/** Real key presses switch the hints back; the pad bridge sends untrusted events, which do not count. */
export function installInputKind(target: Pick<Window, 'addEventListener'> = window): void {
	target.addEventListener('keydown', (e) => {
		if ((e as KeyboardEvent).isTrusted) noteInput('keyboard');
	});
}
