import type { PinguinBridge, Platform } from './types';
import { createWebPlatform, type WebDeps } from './web';

/** Wraps a native shell bridge; whatever it does not provide falls back to the web behavior. */
export function createBridgePlatform(bridge: PinguinBridge, web: WebDeps = {}): Platform {
	const base = createWebPlatform({
		...web,
		...(bridge.tier && { tier: bridge.tier }),
		...(bridge.isDemo !== undefined && { isDemo: bridge.isDemo }),
	});
	const { storage } = bridge;
	return {
		...base,
		kind: bridge.kind,
		cloud: bridge.cloud ?? false,
		save: {
			...base.save,
			...(storage && {
				load: (key: string) => storage.get(key),
				save: (key: string, raw: string) => storage.set(key, raw),
			}),
			...(bridge.exportFile && { exportFile: bridge.exportFile.bind(bridge) }),
		},
		achievements: bridge.achievements ?? base.achievements,
		leaderboards: bridge.leaderboards ?? base.leaderboards,
		fullscreen: bridge.fullscreen ?? base.fullscreen,
		openUrl: bridge.openUrl ? bridge.openUrl.bind(bridge) : base.openUrl,
		quit: bridge.quit ? bridge.quit.bind(bridge) : base.quit,
	};
}
