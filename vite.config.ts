import { existsSync, readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
	version: string;
};

export default defineConfig({
	base: './',
	// SOUND_* variables from .env are exposed to the game (import.meta.env.SOUND_MUTED).
	envPrefix: ['VITE_', 'SOUND_'],
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version),
		// Final art atlas (1.0): loaded only when it exists; placeholders cover the rest.
		__HAS_ATLAS__: JSON.stringify(existsSync('public/assets/atlas.json')),
	},
	build: {
		target: 'es2022',
		chunkSizeWarningLimit: 2000,
	},
});
