// Desktop build (SDD-007 RF-03): game build -> apps/desktop/app/game, bundle main/preload,
// electron-builder (Windows x64, unpacked, unsigned). Usage: bun scripts/build-desktop.ts [--demo]
// Output: apps/desktop/dist/<full|demo>/win-unpacked/*.exe
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';

const demo = process.argv.includes('--demo');
const flavor = demo ? 'demo' : 'full';
const desktop = 'apps/desktop';

async function run(
	cmd: string[],
	opts: { cwd?: string; env?: Record<string, string> } = {},
): Promise<void> {
	const proc = Bun.spawn(cmd, {
		cwd: opts.cwd,
		env: { ...process.env, ...opts.env },
		stdout: 'inherit',
		stderr: 'inherit',
	});
	if ((await proc.exited) !== 0) throw new Error(`failed: ${cmd.join(' ')}`);
}

await rm(`${desktop}/app`, { recursive: true, force: true });

// The game build (relative base, so app://game/ serves it); VITE_DEMO decides demo vs full.
await run(['bunx', '--bun', 'vite', 'build', '--outDir', `${desktop}/app/game`, '--emptyOutDir'], {
	env: { VITE_DEMO: demo ? '1' : '0' },
});

if (!existsSync(`${desktop}/node_modules`))
	await run(['bun', 'install', '--frozen-lockfile'], { cwd: desktop });

// Node side: electron and steamworks.js stay external (the latter is a native module).
for (const [entry, format] of [
	['main.ts', 'cjs'],
	['preload.ts', 'cjs'],
] as const) {
	await run([
		'bun',
		'build',
		`${desktop}/${entry}`,
		'--target',
		'node',
		'--format',
		format,
		'--external',
		'electron',
		'--external',
		'steamworks.js',
		'--outfile',
		`${desktop}/app/${entry.replace('.ts', '.js')}`,
	]);
}

const productName = demo ? 'Pinguin Survivors Demo' : 'Pinguin Survivors';
await run(
	[
		'bunx',
		'electron-builder',
		'--win',
		'dir',
		'--x64',
		'--config',
		'electron-builder.yml',
		`--config.directories.output=dist/${flavor}`,
		`--config.productName=${productName}`,
	],
	{ cwd: desktop, env: { CSC_IDENTITY_AUTO_DISCOVERY: 'false' } },
);

const exe = `${desktop}/dist/${flavor}/win-unpacked/${productName}.exe`;
if (!existsSync(exe)) throw new Error(`${exe} was not produced`);
console.log(`desktop (${flavor}): ${exe}`);
