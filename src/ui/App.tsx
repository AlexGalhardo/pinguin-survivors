import type { ReactElement } from 'react';
import { Hud } from './components/Hud';
import { ToastHost } from './components/Toast';
import { useUiStore } from './store';
import { buildLabel } from './version-label';

const VERSION = buildLabel(__APP_VERSION__, import.meta.env.DEV, __BUILD_NAME__);

/** Overlay root. No screens yet (`none`); the HUD (only when the game publishes it) and toasts. */
export function App(): ReactElement {
	useUiStore((s) => s.screen);
	return (
		<>
			<Hud version={VERSION} />
			<ToastHost />
		</>
	);
}
