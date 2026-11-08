// Seamless check (SDD-012 A2): each tile repeated 3x3 at x2, laid side by side with its label.
// Usage: bun scripts/qa-tile.ts <out.png> <tile.png> ...
import sharp, { type OverlayOptions } from 'sharp';

const [out, ...files] = process.argv.slice(2);
if (!out || files.length === 0) {
	console.error('usage: bun scripts/qa-tile.ts <out.png> <tile.png> ...');
	process.exit(1);
}
const Z = 2;
const layers: OverlayOptions[] = [];
let size = 64;
for (const [i, f] of files.entries()) {
	const meta = await sharp(f).metadata();
	size = meta.width ?? 64;
	const tile = await sharp(f)
		.resize(size * Z, size * Z, { kernel: 'nearest' })
		.png()
		.toBuffer();
	const cell = size * Z * 3 + 16;
	for (let y = 0; y < 3; y++)
		for (let x = 0; x < 3; x++)
			layers.push({ input: tile, left: i * cell + x * size * Z, top: y * size * Z });
}
const cell = size * Z * 3 + 16;
await sharp({
	create: {
		width: cell * files.length,
		height: size * Z * 3,
		channels: 4,
		background: '#0b0e14',
	},
})
	.composite(layers)
	.png()
	.toFile(out);
console.log(`${out}: ${files.length} tiles, 3x3 each`);
