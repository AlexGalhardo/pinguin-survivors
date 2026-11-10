import { describe, expect, test } from 'bun:test';

const css = await Bun.file(new URL('../../src/ui/theme.css', import.meta.url)).text();

describe('theme.css (Style D tokens)', () => {
	test('declares the type scale with a phone floor, the 4 px spacing and the flat line token', () => {
		for (const t of [
			'display',
			'title',
			'item',
			'cta',
			'section',
			'list',
			'body',
			'secondary',
			'key',
		]) {
			expect(css).toMatch(new RegExp(`--text-${t}: max[(][0-9]+px, calc[(]`));
		}
		expect(css).toContain('--spacing: calc(4 / 1080 * 100vh)');
		expect(css).toContain('--color-line:');
		for (const s of ['title', 'list', 'section']) expect(css).toContain(`--tracking-${s}:`);
	});

	test('titles use Cinzel and fall back to Noto Sans SC for CJK', () => {
		expect(css).toContain('--font-title: "Cinzel", "Noto Sans SC", serif;');
	});

	test('defines the d-* utilities', () => {
		for (const c of ['vignette', 'glow', 'filet', 'focus', 'pad', 'cta', 'danger']) {
			expect(css).toContain(`.d-${c}`);
		}
	});

	test('is flat: no shadow tokens, no box-shadow, no chamfer or worn frames', () => {
		expect(css).not.toMatch(/--shadow-/);
		expect(css).not.toContain('box-shadow');
		expect(css).not.toMatch(/d-chamfer|d-worn|\.ornate/);
	});

	test('derives every color from palette tokens, no hex literal', () => {
		expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
	});
});
