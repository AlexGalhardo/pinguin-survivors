// Projects a top-down ground texture onto the 64×32 iso diamond used by the chunks
// (screenX = x − y, screenY = (x + y) / 2), one texture period per tile. The texture is sampled
// mirrored (period 2) so every edge is continuous whatever PixelLab drew; variants made from
// similar textures then only differ inside the tile. Nearest sampling keeps the pixel look.
// Usage: bun scripts/pack-iso-tile.ts <texture.png> <out.png> [--iso cx,cy,hw,hh,shrink]
//   --iso: the source is itself an (imperfect) iso tile from /create-tiles-pro; the texture is
//   read inside its diamond (center cx,cy, half sizes hw,hh, scaled by shrink to stay inside).

import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import sharp from 'sharp';

const W = 64;
const H = 32;
const [src, out] = process.argv.slice(2);
const isoArg = process.argv.indexOf('--iso');
const iso = isoArg > 0 ? (process.argv[isoArg + 1] ?? '').split(',').map(Number) : null;
if (!src || !out) {
	console.error('usage: bun scripts/pack-iso-tile.ts <texture.png> <out.png>');
	process.exit(1);
}
const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const tw = info.width;
const th = info.height;
/** Mirrored wrap: 0..1 maps to the texture, 1..2 back again, so opposite edges always meet. */
const mirror = (t: number): number => {
	const m = ((t % 2) + 2) % 2;
	return m > 1 ? 2 - m : m;
};
const px = Buffer.alloc(W * H * 4);
for (let y = 0; y < H; y++) {
	for (let x = 0; x < W; x++) {
		const sx = x + 0.5 - W / 2;
		const sy = y + 0.5 - H / 2;
		// Outside the diamond stays transparent (the neighbour tiles cover it).
		if (Math.abs(sx) / (W / 2) + Math.abs(sy) / (H / 2) > 1) continue;
		const wx = (sx / (W / 2) + sy / (H / 2)) / 2 + 0.5;
		const wy = (sy / (H / 2) - sx / (W / 2)) / 2 + 0.5;
		let u: number;
		let v: number;
		if (iso) {
			const [cx = 32, cy = 16, hw = 32, hh = 16, k = 0.85] = iso;
			const mx = mirror(wx);
			const my = mirror(wy);
			u = Math.round(cx + (mx - my) * hw * k);
			v = Math.round(cy + (mx + my - 1) * hh * k);
			u = Math.max(0, Math.min(tw - 1, u));
			v = Math.max(0, Math.min(th - 1, v));
		} else {
			u = Math.min(tw - 1, Math.floor(mirror(wx) * tw));
			v = Math.min(th - 1, Math.floor(mirror(wy) * th));
		}
		const i = (v * tw + u) * 4;
		const o = (y * W + x) * 4;
		px[o] = data[i] ?? 0;
		px[o + 1] = data[i + 1] ?? 0;
		px[o + 2] = data[i + 2] ?? 0;
		px[o + 3] = 255;
	}
}
mkdirSync(dirname(out), { recursive: true });
await sharp(px, { raw: { width: W, height: H, channels: 4 } })
	.png()
	.toFile(out);
console.log(`${src} → ${out}`);
