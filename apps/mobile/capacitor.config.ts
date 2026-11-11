import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Android shell (SDD-007 RF-04, ADR-012). `www/` is the game's `dist/` plus the `window.platform`
 * bridge, produced by `bun run prepare:web`; it is generated, never edited. Landscape and the
 * immersive fullscreen are set natively (AndroidManifest, MainActivity).
 */
const config: CapacitorConfig = {
	appId: 'xyz.lekzera.penguinsurvivors',
	appName: 'Penguin Survivors',
	webDir: 'www',
	backgroundColor: '#0b0e14',
	android: {
		allowMixedContent: false,
		webContentsDebuggingEnabled: false,
	},
};

export default config;
