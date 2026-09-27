import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
	version: string;
};

/** Files under public/assets (relative, e.g. "assets/ui/x.png"): Boot loads only what exists. */
function assetFiles(dir = 'public/assets'): string[] {
	if (!existsSync(dir)) return [];
	return (
		readdirSync(dir, { recursive: true, withFileTypes: true })
			.filter((e) => e.isFile() && !e.name.startsWith('.'))
			// parentPath uses backslashes on Windows; the game expects URL-style paths.
			.map((e) => `${e.parentPath}/${e.name}`.replace(/\\/g, '/').replace(/^public\//, ''))
	);
}

export default defineConfig({
	base: './',
	// SOUND_* variables from .env are exposed to the game (import.meta.env.SOUND_MUTED).
	envPrefix: ['VITE_', 'SOUND_'],
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version),
		// Final art atlas (1.0): loaded only when it exists; placeholders cover the rest.
		__HAS_ATLAS__: JSON.stringify(existsSync('public/assets/atlas')),
		__ASSET_FILES__: JSON.stringify(assetFiles()),
	},
	build: {
		target: 'es2022',
		chunkSizeWarningLimit: 2000,
	},
});
