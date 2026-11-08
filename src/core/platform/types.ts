/** Effects budget: `low` trims decals, dynamic lights and bloom (SDD-007 RF-05). */
export type PlatformTier = 'low' | 'mid' | 'high';
export type PlatformKind = 'web' | 'electron' | 'capacitor';

/**
 * The single door to everything outside the game bundle (SDD-007, ADR-012). The game never
 * imports the Electron, Steam or Capacitor packages: the native shells inject a
 * `window.platform` and `detectPlatform` wraps it.
 */
export interface Platform {
	kind: PlatformKind;
	tier: PlatformTier;
	/** Demo build (VITE_DEMO). */
	isDemo: boolean;
	/** `demo-build` only in the demo bundle; `scripts/build-demo.ts` greps for it (SDD-006 A1). */
	buildTag: 'demo-build' | 'full-build';
	/** The save is synced by the store (Steam Cloud) on its own. */
	cloud: boolean;
	save: {
		/** Raw JSON stored under `key`, or null when absent or unreadable. */
		load(key: string): string | null;
		/** False when the write failed (storage full or blocked). */
		save(key: string, raw: string): boolean;
		/** Hands the player a `.json` file (download on web, save dialog on desktop). */
		exportFile(filename: string, raw: string): void;
		importFile(file: File): Promise<string>;
	};
	achievements: { unlock(id: string): void };
	leaderboards: { submit(board: string, score: number): void };
	fullscreen: { toggle(): void };
	openUrl(url: string): void;
	quit(): void;
}

/**
 * What a native shell injects. Everything is synchronous (the shell hydrates async stores such as
 * Capacitor Preferences before the game boots) and optional: a missing member falls back to web.
 */
export interface PinguinBridge {
	kind: Exclude<PlatformKind, 'web'>;
	tier?: PlatformTier;
	isDemo?: boolean;
	cloud?: boolean;
	storage?: { get(key: string): string | null; set(key: string, raw: string): boolean };
	exportFile?(filename: string, raw: string): void;
	achievements?: { unlock(id: string): void };
	leaderboards?: { submit(board: string, score: number): void };
	fullscreen?: { toggle(): void };
	openUrl?(url: string): void;
	quit?(): void;
}

declare global {
	interface Window {
		platform?: PinguinBridge;
	}
}
