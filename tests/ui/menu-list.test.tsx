import { afterAll, afterEach, beforeAll, describe, expect, test } from 'bun:test';

const uninstall = (await import('./dom')).installDom();
const { act, cleanup, fireEvent, render } = await import('@testing-library/react');
const { FocusScope } = await import('../../src/ui/focus');
const { MenuList } = await import('../../src/ui/components/MenuList');

afterAll(uninstall);
afterEach(cleanup);
beforeAll(() => {
	// happy-dom has no layout: stack the rows so spatial navigation has geometry.
	window.HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
		const i = Array.from(this.parentElement?.children ?? []).indexOf(this);
		const y = i * 50;
		return {
			x: 0,
			y,
			width: 200,
			height: 46,
			top: y,
			left: 0,
			right: 200,
			bottom: y + 46,
		} as DOMRect;
	};
});

const key = (code: string): void => {
	act(() => {
		window.dispatchEvent(
			new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }),
		);
	});
};

const ITEMS = [
	{ id: 'a', label: 'Alpha' },
	{ id: 'b', label: 'Beta', disabled: true },
	{ id: 'c', label: 'Gamma' },
];

function setup(selectedId?: string): { picks: string[]; get: (n: string) => HTMLElement } {
	const picks: string[] = [];
	const view = render(
		<FocusScope>
			<MenuList items={ITEMS} selectedId={selectedId} onSelect={(id) => picks.push(id)} />
		</FocusScope>,
	);
	return { picks, get: (n) => view.getByText(n) as HTMLElement };
}

describe('MenuList', () => {
	test('first row starts focused, arrows skip the disabled row, Enter selects', () => {
		const { picks, get } = setup();
		expect(get('Alpha').getAttribute('data-focused')).toBe('true');
		key('ArrowDown');
		expect(get('Gamma').getAttribute('data-focused')).toBe('true');
		expect(get('Beta').getAttribute('data-focused')).toBe('false');
		key('Enter');
		expect(picks).toEqual(['c']);
	});

	test('click activates; a disabled row neither activates nor takes focus', () => {
		const { picks, get } = setup();
		fireEvent.click(get('Gamma'));
		fireEvent.click(get('Beta'));
		fireEvent.mouseEnter(get('Beta'));
		expect(picks).toEqual(['c']);
		expect(get('Beta').getAttribute('aria-disabled')).toBe('true');
		expect(get('Beta').getAttribute('data-focused')).toBe('false');
	});

	test('hover moves focus to the row', () => {
		const { get } = setup();
		fireEvent.mouseEnter(get('Gamma'));
		expect(get('Gamma').getAttribute('data-focused')).toBe('true');
	});

	test('selected row is marked and shows the fixed diamond until it is focused', () => {
		const { get } = setup('c');
		const row = get('Gamma');
		expect(row.getAttribute('aria-current')).toBe('true');
		expect(row.querySelector('[data-ornament="diamond"]')).not.toBeNull();
		fireEvent.mouseEnter(row);
		expect(row.querySelector('[data-ornament="diamond"]')).toBeNull();
		expect(get('Alpha').getAttribute('aria-current')).toBeNull();
	});

	test('rows keep a 44 px minimum target', () => {
		const { get } = setup();
		expect(get('Alpha').className).toContain('min-h-[max(46px');
	});
});
