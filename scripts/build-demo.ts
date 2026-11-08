// Demo build (SDD-006): same code, VITE_DEMO=1, output in dist-demo/. Then checks the bundle:
// the demo must carry the `demo-build` tag (SDD-006 A1). The full build must not (see below).
// Usage: bun scripts/build-demo.ts [--check-full]  (--check-full also builds dist/ and checks it)
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

async function build(outDir: string, demo: boolean): Promise<void> {
	const proc = Bun.spawn(
		['bunx', '--bun', 'vite', 'build', '--outDir', outDir, '--emptyOutDir'],
		{
			env: { ...process.env, VITE_DEMO: demo ? '1' : '0' },
			stdout: 'inherit',
			stderr: 'inherit',
		},
	);
	if ((await proc.exited) !== 0) throw new Error(`vite build failed (${outDir})`);
}

function bundleHas(outDir: string, text: string): boolean {
	const walk = (dir: string): string[] =>
		readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
			e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
		);
	return walk(outDir)
		.filter((f) => f.endsWith('.js'))
		.some((f) => readFileSync(f, 'utf8').includes(text));
}

await build('dist-demo', true);
if (!bundleHas('dist-demo', 'demo-build')) throw new Error('dist-demo has no demo-build tag');
console.log('dist-demo: demo-build tag present');
if (process.argv.includes('--check-full')) {
	await build('dist-full-check', false);
	if (bundleHas('dist-full-check', 'demo-build'))
		throw new Error('full build carries demo-build');
	console.log('full build: no demo-build tag');
}
