// Builds the static site (SDD-008 RF-06): demo build -> site/public/demo, full game build ->
// site/public/play, then astro build. Output: site/dist/ (landing in 4 languages + /demo/ + /play/).
// Usage: bun scripts/build-site.ts [--no-demo] [--no-play]
// --no-demo / --no-play reuse an existing dist-demo/ / dist/ (skip that Vite build).
// /play/ hosts the full game for the developer's own testing (decision 2026-11-08); the Vite
// builds use relative paths, so both games run from any subfolder.
import { existsSync } from 'node:fs';
import { cp, rm } from 'node:fs/promises';

async function run(cmd: string[], cwd?: string): Promise<void> {
	const proc = Bun.spawn(cmd, { cwd, stdout: 'inherit', stderr: 'inherit' });
	if ((await proc.exited) !== 0) throw new Error(`failed: ${cmd.join(' ')}`);
}

const skipDemo = process.argv.includes('--no-demo');
if (!skipDemo) await run(['bun', 'run', 'build:demo']);
if (!existsSync('dist-demo/index.html')) throw new Error('dist-demo/ is missing (run build:demo)');

await rm('site/public/demo', { recursive: true, force: true });
await cp('dist-demo', 'site/public/demo', { recursive: true });
console.log('copied dist-demo/ -> site/public/demo/');

const skipPlay = process.argv.includes('--no-play');
if (!skipPlay) await run(['bun', 'run', 'build']);
if (!existsSync('dist/index.html')) throw new Error('dist/ is missing (run build)');
await rm('site/public/play', { recursive: true, force: true });
await cp('dist', 'site/public/play', { recursive: true });
console.log('copied dist/ -> site/public/play/');

if (!existsSync('site/node_modules')) await run(['bun', 'install', '--frozen-lockfile'], 'site');
await run(['bun', 'run', 'build'], 'site');

for (const page of [
	'index',
	'pt-br/index',
	'es/index',
	'zh-cn/index',
	'demo/index',
	'play/index',
]) {
	if (!existsSync(`site/dist/${page}.html`)) throw new Error(`site/dist/${page}.html is missing`);
}
console.log('site: site/dist/ ready');
