import { createBridgePlatform } from './bridge';
import type { PinguinBridge, Platform } from './types';

/**
 * Android shell (apps/mobile, T5.5). Capacitor plugins stay in `apps/mobile`; the shell hydrates
 * Preferences and exposes the result through `window.platform`.
 */
export function createCapacitorPlatform(bridge: PinguinBridge): Platform {
	return createBridgePlatform({ ...bridge, kind: 'capacitor' });
}
