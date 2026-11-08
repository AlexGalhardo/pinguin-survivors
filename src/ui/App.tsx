import type { ReactElement } from 'react';
import { Hud } from './components/Hud';
import { MenuHost } from './components/MenuHost';
import { RunHost } from './components/RunHost';
import { ShopHost } from './components/ShopHost';
import { ToastHost } from './components/Toast';
import { TouchControls } from './components/TouchControls';
import { useUiStore } from './store';
import { buildLabel } from './version-label';

const VERSION = buildLabel(__APP_VERSION__, import.meta.env.DEV, __BUILD_NAME__);

/** Overlay root. No screens yet (`none`); the HUD and the shop (only while the game publishes them) and toasts. */
export function App(): ReactElement {
	useUiStore((s) => s.screen);
	return (
		<>
			<MenuHost />
			<Hud version={VERSION} />
			<ShopHost />
			<RunHost />
			<TouchControls />
			<ToastHost />
		</>
	);
}
