import { useUiStore } from './store';

/** Overlay root. No screens yet: `none` renders nothing and the overlay stays click-through. */
export function App(): null {
	useUiStore((s) => s.screen);
	return null;
}
