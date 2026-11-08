import { contextBridge, ipcRenderer } from 'electron';
import type { PinguinBridge } from '../../src/core/platform/types';

/**
 * Exposes `window.platform` to the game (type-only import: no game code runs here). The game's
 * `detectPlatform` wraps it, so every member is a thin message to the main process.
 */
const info = ipcRenderer.sendSync('platform:info') as { cloud: boolean };

const bridge: PinguinBridge = {
	kind: 'electron',
	tier: 'high',
	cloud: info.cloud,
	storage: {
		get: (key) => ipcRenderer.sendSync('platform:storage:get', key) as string | null,
		set: (key, raw) => ipcRenderer.sendSync('platform:storage:set', key, raw) as boolean,
	},
	exportFile: (filename, raw) => ipcRenderer.send('platform:export', filename, raw),
	achievements: { unlock: (id) => ipcRenderer.send('platform:achievement', id) },
	leaderboards: {
		submit: (board, score) => ipcRenderer.send('platform:leaderboard', board, score),
	},
	fullscreen: { toggle: () => ipcRenderer.send('platform:fullscreen') },
	openUrl: (url) => ipcRenderer.send('platform:openUrl', url),
	quit: () => ipcRenderer.send('platform:quit'),
};

contextBridge.exposeInMainWorld('platform', bridge);

// Window blur (alt-tab, Steam overlay): the game listens for this event and pauses.
ipcRenderer.on('platform:suspend', () => window.dispatchEvent(new Event('pinguin:suspend')));
