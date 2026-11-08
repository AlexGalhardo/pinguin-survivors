import type { ReactElement } from 'react';
import { ToastHost } from './components/Toast';
import { useUiStore } from './store';

/** Overlay root. No screens yet (`none`); the toast host is the only visible piece. */
export function App(): ReactElement {
	useUiStore((s) => s.screen);
	return <ToastHost />;
}
