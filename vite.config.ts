import { existsSync, readdirSync, readFileSync } from 'node:fs';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
	version: string;
	buildName?: string;
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
	plugins: [tailwindcss()],
	base: './',
	// A second dev server (the demo E2E) gets its own dependency cache: two servers rewriting
	// node_modules/.vite at once stall each other for a minute on Windows.
	cacheDir: process.env.VITE_CACHE_DIR || 'node_modules/.vite',
	// SOUND_* variables from .env are exposed to the game (import.meta.env.SOUND_MUTED).
	envPrefix: ['VITE_', 'SOUND_'],
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version),
		// Changes on every build: appended to asset URLs so a deploy never mixes cached atlases
		// (GitHub Pages sends max-age=600 for unhashed files) with new code.
		__BUILD_ID__: JSON.stringify(Date.now().toString(36)),
		// Playtest build nickname shown next to the version (package.json "buildName").
		__BUILD_NAME__: JSON.stringify(pkg.buildName ?? ''),
		// Final art atlas (1.0): loaded only when it exists; placeholders cover the rest.
		__HAS_ATLAS__: JSON.stringify(existsSync('public/assets/atlas')),
		__ASSET_FILES__: JSON.stringify(assetFiles()),
	},
	build: {
		target: 'es2022',
		chunkSizeWarningLimit: 2000,
	},
});
