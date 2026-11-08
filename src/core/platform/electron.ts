import { createBridgePlatform } from './bridge';
import type { PinguinBridge, Platform } from './types';

/**
 * Steam/Windows shell (apps/desktop, T5.4). The game only talks to the `window.platform`
 * that its preload exposes; Steamworks and Electron live in `apps/desktop`, never in `src`.
 */
export function createElectronPlatform(bridge: PinguinBridge): Platform {
	return createBridgePlatform({ ...bridge, kind: 'electron' });
}
