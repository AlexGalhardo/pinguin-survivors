import type { PinguinBridge } from '../../../src/core/platform/types';

/**
 * Runs before the game boots (see scripts/prepare-web.ts): hydrates the Capacitor Preferences into
 * memory, exposes `window.platform` (the synchronous bridge the game's `detectPlatform` wraps) and
 * only then loads the game entry. Capacitor plugins are reached through `window.Capacitor`, so no
 * `@capacitor/*` import ends up in the game bundle.
 */
interface PreferencesPlugin {
	keys(): Promise<{ keys: string[] }>;
	get(o: { key: string }): Promise<{ value: string | null }>;
	set(o: { key: string; value: string }): Promise<void>;
}
interface AppPlugin {
	exitApp(): Promise<void>;
	addListener(event: 'backButton', fn: () => void): Promise<unknown>;
}
const plugins = (
	window as unknown as {
		Capacitor?: { Plugins?: { Preferences?: PreferencesPlugin; App?: AppPlugin } };
	}
).Capacitor?.Plugins;

const cache = new Map<string, string>();
const prefs = plugins?.Preferences;
if (prefs) {
	const { keys } = await prefs.keys();
	await Promise.all(
		keys.map(async (key) => {
			const { value } = await prefs.get({ key });
			if (value !== null) cache.set(key, value);
		}),
	);
}

const bridge: PinguinBridge = {
	kind: 'capacitor',
	// A mid-range phone is the budget (SDD-007 RF-05): the game trims decals, lights and bloom.
	tier: 'low',
	storage: {
		get: (key) => cache.get(key) ?? null,
		set: (key, raw) => {
			cache.set(key, raw);
			void prefs?.set({ key, value: raw });
			return true;
		},
	},
	quit: () => void plugins?.App?.exitApp(),
};
(window as unknown as { platform: PinguinBridge }).platform = bridge;

// The hardware back button behaves like Escape (pause / back in menus).
void plugins?.App?.addListener('backButton', () => {
	window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape' }));
});

const entry = document.querySelector<HTMLScriptElement>('script[data-game-entry]')?.dataset
	.gameEntry;
if (!entry) throw new Error('platform-bridge: missing data-game-entry');
await import(/* @vite-ignore */ entry);
