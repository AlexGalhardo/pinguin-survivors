import { describe, expect, it } from 'bun:test';
import { TEX, type TextureKey } from '../src/art/manifest';
import { CELL_W, FONT_CHARS, renderFontAtlas, textWidth } from '../src/art/placeholders/font-5x7';
import { PixelCanvas } from '../src/art/placeholders/pixel-canvas';
import { PLACEHOLDERS, renderPlaceholder } from '../src/art/placeholders/textures';

describe('placeholder textures', () => {
	it('has a generator for every manifest texture key', () => {
		for (const key of Object.values(TEX)) expect(PLACEHOLDERS[key]).toBeDefined();
	});

	it('every generator draws visible pixels', () => {
		for (const key of Object.keys(PLACEHOLDERS) as TextureKey[]) {
			expect(renderPlaceholder(key).opaqueCount()).toBeGreaterThan(0);
		}
	});
});

describe('PixelCanvas', () => {
	it('ignores out-of-bounds pixels and outlines shapes', () => {
		const c = new PixelCanvas(5, 5);
		c.px(-1, 0, 0xffffff);
		c.px(9, 9, 0xffffff);
		expect(c.opaqueCount()).toBe(0);
		c.px(2, 2, 0xffffff);
		c.outline(0);
		expect(c.opaqueCount()).toBe(5);
	});
});

describe('pixel font', () => {
	it('contains letters (both cases), digits and punctuation without duplicates', () => {
		for (const ch of 'AZaz09.,!?:-+/%') expect(FONT_CHARS).toContain(ch);
		expect(new Set(FONT_CHARS).size).toBe(FONT_CHARS.length);
	});

	it('renders an atlas and measures text', () => {
		expect(renderFontAtlas(0xffffff, 0).opaqueCount()).toBeGreaterThan(500);
		expect(textWidth('WAVE 1')).toBe(6 * CELL_W);
	});
});

describe('animated sheets (beta)', () => {
	it('renders idle (2) and walk (4) frames for every class', async () => {
		const { SHEETS, renderSheet } = await import('../src/art/placeholders/sheets');
		for (const c of ['warrior', 'ranger', 'mage']) {
			expect(SHEETS[`player.${c}.idle`]?.frames).toBe(2);
			expect(SHEETS[`player.${c}.walk`]?.frames).toBe(4);
			const sheet = renderSheet(`player.${c}.walk`);
			expect(sheet.width).toBe(128);
			expect(sheet.opaqueCount()).toBeGreaterThan(400);
		}
	});

	it('shade keeps the palette (only ramp colors are written)', () => {
		const c = new PixelCanvas(8, 8);
		c.rect(2, 2, 4, 4, 0x8b9bb4);
		c.shade({ [0x8b9bb4]: [0x5a6988, 0xc0cbdc] });
		expect(c.colorAt(3, 2)).toBe(0xc0cbdc);
		expect(c.colorAt(3, 5)).toBe(0x5a6988);
		expect(c.colorAt(3, 3)).toBe(0x8b9bb4);
	});
});
