// Builds the static site (SDD-008 RF-06): demo build -> copy to site/public/demo -> astro build.
// Output: site/dist/ (landing in 4 languages + /demo/). Usage: bun scripts/build-site.ts [--no-demo]
// --no-demo reuses an existing dist-demo/ (skips the Vite demo build).
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

if (!existsSync('site/node_modules')) await run(['bun', 'install', '--frozen-lockfile'], 'site');
await run(['bun', 'run', 'build'], 'site');

for (const page of ['index', 'pt-br/index', 'es/index', 'zh-cn/index', 'demo/index']) {
	if (!existsSync(`site/dist/${page}.html`)) throw new Error(`site/dist/${page}.html is missing`);
}
console.log('site: site/dist/ ready');
