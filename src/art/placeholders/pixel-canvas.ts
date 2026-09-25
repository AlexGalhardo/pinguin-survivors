/**
 * Tiny RGBA pixel buffer used to draw placeholder art by code.
 * Pure TypeScript (no DOM, no Phaser) so the generators can be unit tested;
 * BootScene copies the buffer into a Phaser CanvasTexture.
 */
export class PixelCanvas {
	readonly data: Uint8ClampedArray;

	constructor(
		readonly width: number,
		readonly height: number,
	) {
		this.data = new Uint8ClampedArray(width * height * 4);
	}

	/** Sets one pixel (ignored when out of bounds). */
	px(x: number, y: number, color: number, alpha = 255): void {
		const ix = Math.floor(x);
		const iy = Math.floor(y);
		if (ix < 0 || iy < 0 || ix >= this.width || iy >= this.height) return;
		const i = (iy * this.width + ix) * 4;
		this.data[i] = (color >> 16) & 0xff;
		this.data[i + 1] = (color >> 8) & 0xff;
		this.data[i + 2] = color & 0xff;
		this.data[i + 3] = alpha;
	}

	alphaAt(x: number, y: number): number {
		if (x < 0 || y < 0 || x >= this.width || y >= this.height) return 0;
		return this.data[(y * this.width + x) * 4 + 3] ?? 0;
	}

	rect(x: number, y: number, w: number, h: number, color: number, alpha = 255): void {
		for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, color, alpha);
	}

	strokeRect(x: number, y: number, w: number, h: number, color: number): void {
		for (let i = 0; i < w; i++) {
			this.px(x + i, y, color);
			this.px(x + i, y + h - 1, color);
		}
		for (let j = 0; j < h; j++) {
			this.px(x, y + j, color);
			this.px(x + w - 1, y + j, color);
		}
	}

	/** Filled ellipse centered on (cx, cy); use .5 centers for even sizes. */
	ellipse(cx: number, cy: number, rx: number, ry: number, color: number, alpha = 255): void {
		for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
			for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
				const dx = (x + 0.5 - cx) / rx;
				const dy = (y + 0.5 - cy) / ry;
				if (dx * dx + dy * dy <= 1) this.px(x, y, color, alpha);
			}
		}
	}

	circle(cx: number, cy: number, r: number, color: number, alpha = 255): void {
		this.ellipse(cx, cy, r, r, color, alpha);
	}

	/** Ring between radius r - thickness and r. */
	ring(cx: number, cy: number, r: number, thickness: number, color: number, alpha = 255): void {
		const inner = Math.max(0, r - thickness);
		for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
			for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
				const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
				if (d <= r && d >= inner) this.px(x, y, color, alpha);
			}
		}
	}

	/** Bresenham line. */
	line(x0: number, y0: number, x1: number, y1: number, color: number): void {
		let x = Math.round(x0);
		let y = Math.round(y0);
		const tx = Math.round(x1);
		const ty = Math.round(y1);
		const dx = Math.abs(tx - x);
		const dy = -Math.abs(ty - y);
		const sx = x < tx ? 1 : -1;
		const sy = y < ty ? 1 : -1;
		let err = dx + dy;
		for (;;) {
			this.px(x, y, color);
			if (x === tx && y === ty) break;
			const e2 = 2 * err;
			if (e2 >= dy) {
				err += dy;
				x += sx;
			}
			if (e2 <= dx) {
				err += dx;
				y += sy;
			}
		}
	}

	/** Draws a pattern of rows where each char maps to a color (space/'.' = transparent). */
	pattern(x: number, y: number, rows: readonly string[], colors: Record<string, number>): void {
		rows.forEach((row, j) => {
			for (let i = 0; i < row.length; i++) {
				const c = colors[row[i] ?? ''];
				if (c !== undefined) this.px(x + i, y + j, c);
			}
		});
	}

	/** Adds a 1 px outline (4-neighborhood) around every opaque pixel. */
	outline(color: number): void {
		const marks: number[] = [];
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				if (this.alphaAt(x, y) > 0) continue;
				if (
					this.alphaAt(x - 1, y) > 0 ||
					this.alphaAt(x + 1, y) > 0 ||
					this.alphaAt(x, y - 1) > 0 ||
					this.alphaAt(x, y + 1) > 0
				) {
					marks.push(x, y);
				}
			}
		}
		for (let i = 0; i < marks.length; i += 2) this.px(marks[i] ?? 0, marks[i + 1] ?? 0, color);
	}

	/** Count of pixels with alpha > 0 (used by tests). */
	opaqueCount(): number {
		let n = 0;
		for (let i = 3; i < this.data.length; i += 4) if ((this.data[i] ?? 0) > 0) n++;
		return n;
	}
}
