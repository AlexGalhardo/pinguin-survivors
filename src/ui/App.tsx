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
/** The FPS counter is a development aid: dev builds and `?debug=1`. */
const SHOW_FPS = import.meta.env.DEV || /[?&]debug=1/.test(window.location.search);

/** Overlay root. No screens yet (`none`); the HUD and the shop (only while the game publishes them) and toasts. */
export function App(): ReactElement {
	useUiStore((s) => s.screen);
	return (
		<>
			<MenuHost />
			<Hud version={VERSION} showFps={SHOW_FPS} />
			<ShopHost />
			<RunHost />
			<TouchControls />
			<ToastHost />
		</>
	);
}
