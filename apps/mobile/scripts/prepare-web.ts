// Builds apps/mobile/www from the game build: copies ../../dist, bundles the platform bridge and
// makes index.html boot the game through it (Preferences must be hydrated before the game runs).
// Usage: bun scripts/prepare-web.ts [--dist ../../dist]   (run `bun run build` in the repo root first)
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');
const distArg = process.argv.indexOf('--dist');
const dist = resolve(root, distArg >= 0 ? (process.argv[distArg + 1] as string) : '../../dist');
const www = join(root, 'www');

if (!existsSync(join(dist, 'index.html')))
	throw new Error(`no game build at ${dist}: run \`bun run build\` in the repo root first`);
rmSync(www, { recursive: true, force: true });
cpSync(dist, www, { recursive: true });

const built = await Bun.build({
	entrypoints: [join(root, 'bridge/platform-bridge.ts')],
	outdir: www,
	target: 'browser',
	format: 'esm',
	minify: true,
});
if (!built.success) throw new Error(`bridge build failed: ${built.logs.join('\n')}`);

// The game's entry module becomes data for the bridge, which imports it after hydrating storage.
const htmlPath = join(www, 'index.html');
const html = readFileSync(htmlPath, 'utf8');
const entry = /<script type="module"[^>]*\ssrc="([^"]+)"[^>]*><\/script>/.exec(html);
if (!entry) throw new Error('index.html has no module entry script');
const src = (entry[1] as string).replace(/^\.?\//, './');
const patched = html.replace(
	entry[0],
	`<script type="module" src="./platform-bridge.js" data-game-entry="${src}"></script>`,
);
writeFileSync(htmlPath, patched);
console.log(`www ready: entry ${src} behind platform-bridge.js`);
