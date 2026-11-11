// Desktop build (SDD-007 RF-03): game build -> apps/desktop/app/game, bundle main/preload,
// electron-builder (Windows x64, unpacked, unsigned). Usage: bun scripts/build-desktop.ts [--demo]
// Output: apps/desktop/dist/<full|demo>/win-unpacked/*.exe
import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

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

/** Windows icon from the Jack portrait: PNG-encoded ICO entries, pixel art scaled with nearest neighbor. */
async function buildIcon(): Promise<void> {
	const sizes = [16, 32, 48, 64, 128, 256];
	const pngs = await Promise.all(
		sizes.map((size) =>
			sharp('public/assets/heroes/portrait.jack.png')
				.resize(size, size, { kernel: 'nearest' })
				.png()
				.toBuffer(),
		),
	);
	const header = Buffer.alloc(6 + sizes.length * 16);
	header.writeUInt16LE(1, 2); // type: icon
	header.writeUInt16LE(sizes.length, 4);
	let offset = header.length;
	sizes.forEach((size, i) => {
		const entry = 6 + i * 16;
		header.writeUInt8(size === 256 ? 0 : size, entry); // width (0 = 256)
		header.writeUInt8(size === 256 ? 0 : size, entry + 1);
		header.writeUInt16LE(1, entry + 4); // color planes
		header.writeUInt16LE(32, entry + 6); // bits per pixel
		header.writeUInt32LE(pngs[i]?.length ?? 0, entry + 8);
		header.writeUInt32LE(offset, entry + 12);
		offset += pngs[i]?.length ?? 0;
	});
	await mkdir(`${desktop}/build`, { recursive: true });
	await writeFile(`${desktop}/build/icon.ico`, Buffer.concat([header, ...pngs]));
}

await rm(`${desktop}/app`, { recursive: true, force: true });
await buildIcon();

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

const productName = demo ? 'Penguin Survivors Demo' : 'Penguin Survivors';
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
