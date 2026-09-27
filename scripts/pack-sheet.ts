// Contact sheet of PNGs (review and user approval): nearest-neighbor upscale, dark background,
// label under each cell.
// Usage: bun scripts/pack-sheet.ts <out.png> [--scale 3] [--cols 6] <file.png|dir> ...
//   A directory adds every PNG inside it (sorted); labels are the file paths relative to it.

import { readdirSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import sharp from 'sharp';

const args = process.argv.slice(2);
function opt(name: string, fallback: number): number {
	const i = args.indexOf(`--${name}`);
	if (i < 0) return fallback;
	const v = Number(args[i + 1]);
	args.splice(i, 2);
	return v;
}
const scale = opt('scale', 3);
const cols = opt('cols', 6);
const [out, ...inputs] = args;
if (!out || inputs.length === 0) {
	console.error('usage: bun scripts/pack-sheet.ts <out.png> [--scale 3] [--cols 6] <files|dirs>');
	process.exit(1);
}

const items: { file: string; label: string }[] = [];
for (const input of inputs) {
	if (statSync(input).isDirectory()) {
		for (const f of readdirSync(input).sort())
			if (f.endsWith('.png'))
				items.push({ file: join(input, f), label: f.replace(/\.png$/, '') });
	} else {
		// Seed-named files (11.png) are labeled with their folder (the asset key).
		const name = basename(input, '.png');
		items.push({ file: input, label: /^\d+$/.test(name) ? basename(dirname(input)) : name });
	}
}

const metas = await Promise.all(items.map((i) => sharp(i.file).metadata()));
const cellW = Math.max(...metas.map((m) => (m.width ?? 0) * scale)) + 16;
const cellH = Math.max(...metas.map((m) => (m.height ?? 0) * scale)) + 30;
const rows = Math.ceil(items.length / cols);
const width = cellW * Math.min(cols, items.length);
const height = cellH * rows;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const labels = items
	.map((it, i) => {
		const x = (i % cols) * cellW + cellW / 2;
		const y = Math.floor(i / cols) * cellH + cellH - 8;
		return `<text x="${x}" y="${y}" font-family="sans-serif" font-size="12" fill="#d8dee8" text-anchor="middle">${esc(it.label)}</text>`;
	})
	.join('');
const layers = await Promise.all(
	items.map(async (it, i) => {
		const m = metas[i];
		const w = (m?.width ?? 1) * scale;
		const h = (m?.height ?? 1) * scale;
		return {
			input: await sharp(it.file).resize(w, h, { kernel: 'nearest' }).png().toBuffer(),
			left: Math.round((i % cols) * cellW + (cellW - w) / 2),
			top: Math.round(Math.floor(i / cols) * cellH + (cellH - 22 - h) / 2),
		};
	}),
);
await sharp({ create: { width, height, channels: 4, background: '#1a1d26' } })
	.composite([
		...layers,
		{
			input: Buffer.from(`<svg width="${width}" height="${height}">${labels}</svg>`),
			left: 0,
			top: 0,
		},
	])
	.png()
	.toFile(out);
console.log(`${items.length} images → ${out} (${width}x${height})`);
