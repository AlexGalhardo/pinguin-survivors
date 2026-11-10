import { afterAll, afterEach, describe, expect, test } from 'bun:test';

const uninstall = (await import('./dom')).installDom();
const { cleanup, render } = await import('@testing-library/react');
const { Ornament } = await import('../../src/ui/components/Ornament');
const { Vignette } = await import('../../src/ui/components/Vignette');

afterAll(uninstall);
afterEach(cleanup);

const svgOf = (c: HTMLElement): Element => c.querySelector('svg') as Element;

describe('Ornament', () => {
	test('diamond defaults to 10 px and honors size; always decorative', () => {
		const a = render(<Ornament kind="diamond" />);
		expect(svgOf(a.container).getAttribute('width')).toBe('10');
		expect(svgOf(a.container).getAttribute('aria-hidden')).toBe('true');
		cleanup();
		const b = render(<Ornament kind="diamond" size={14} />);
		expect(svgOf(b.container).getAttribute('height')).toBe('14');
	});

	test('filet has the design-system widths and one centered diamond', () => {
		for (const [size, w] of [
			['full', '620'],
			['short', '520'],
			['compact', '320'],
		] as const) {
			const { container } = render(<Ornament kind="filet" size={size} />);
			expect(svgOf(container).getAttribute('width')).toBe(w);
			expect(svgOf(container).getAttribute('data-size')).toBe(size);
			expect(container.querySelectorAll('rect[transform]').length).toBe(1);
			expect(container.querySelectorAll('rect').length).toBe(5);
			cleanup();
		}
	});

	test('corner rotates per position', () => {
		const { container } = render(<Ornament kind="corner" pos="br" />);
		const el = svgOf(container) as unknown as HTMLElement;
		expect(el.getAttribute('data-pos')).toBe('br');
		expect(el.style.transform).toBe('rotate(180deg)');
	});
});

describe('Vignette', () => {
	test('is a non-interactive decorative layer', () => {
		const { container } = render(<Vignette />);
		const el = container.querySelector('[data-vignette]') as HTMLElement;
		expect(el.className).toContain('d-vignette');
		expect(el.getAttribute('aria-hidden')).toBe('true');
	});
});
