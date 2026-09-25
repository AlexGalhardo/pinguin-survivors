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
