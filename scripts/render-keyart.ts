/**
 * Renders the code-drawn logo and menu key art to PNG (art-src/keyart/) for review and for
 * store pages. Usage: bun scripts/render-keyart.ts [previewScale] (e.g. 4 also writes <name>@4x.png)
 */
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';
import {
	drawKeyArt,
	drawLogo,
	KEYART_H,
	KEYART_W,
	LOGO_H,
	LOGO_W,
} from '../src/art/placeholders/keyart';
import { PixelCanvas } from '../src/art/placeholders/pixel-canvas';

const OUT = 'art-src/keyart';
const scale = Number(process.argv[2] ?? 0);
mkdirSync(OUT, { recursive: true });

async function save(name: string, w: number, h: number, draw: (c: PixelCanvas) => void) {
	const c = new PixelCanvas(w, h);
	draw(c);
	const raw = { raw: { width: w, height: h, channels: 4 as const } };
	await sharp(Buffer.from(c.data), raw).png().toFile(`${OUT}/${name}.png`);
	if (scale > 1) {
		await sharp(Buffer.from(c.data), raw)
			.resize(w * scale, h * scale, { kernel: 'nearest' })
			.png()
			.toFile(`${OUT}/${name}@${scale}x.png`);
	}
	console.log(`${OUT}/${name}.png (${w}x${h})`);
}

await save('logo', LOGO_W, LOGO_H, drawLogo);
await save('keyart', KEYART_W, KEYART_H, drawKeyArt);
