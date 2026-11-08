import { createCapacitorPlatform } from './capacitor';
import { createElectronPlatform } from './electron';
import type { Platform } from './types';
import { createWebPlatform } from './web';

export type { PinguinBridge, Platform, PlatformKind, PlatformTier } from './types';

/** Picks the implementation from the bridge a native shell injected; plain browser otherwise. */
export function detectPlatform(): Platform {
	const bridge = typeof window === 'undefined' ? undefined : window.platform;
	if (bridge?.kind === 'electron') return createElectronPlatform(bridge);
	if (bridge?.kind === 'capacitor') return createCapacitorPlatform(bridge);
	return createWebPlatform();
}

let current: Platform | undefined;

export function platform(): Platform {
	current ??= detectPlatform();
	return current;
}

/** Test hook: swaps (or with `undefined` resets) the detected platform. */
export function setPlatform(p: Platform | undefined): void {
	current = p;
}
