import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { ReactElement } from 'react';

const uninstall = (await import('./dom')).installDom();
const { act, cleanup, fireEvent, render } = await import('@testing-library/react');
const { FocusScope, useFocusable } = await import('../../src/ui/focus');
const { ToastHost } = await import('../../src/ui/components/Toast');
const { showToast, toastStore } = await import('../../src/ui/toast');

afterAll(uninstall);
beforeAll(() => {
	// happy-dom has no layout: give each button a row so spatial navigation has geometry.
	window.HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
		const y = Number(this.dataset.row ?? 0) * 50;
		return {
			x: 0,
			y,
			width: 40,
			height: 40,
			top: y,
			left: 0,
			right: 40,
			bottom: y + 40,
		} as DOMRect;
	};
});

function Item(props: {
	name: string;
	row: number;
	log: string[];
	disabled?: boolean;
}): ReactElement {
	const f = useFocusable({
		onActivate: () => props.log.push(props.name),
		disabled: props.disabled,
	});
	return (
		<button type="button" ref={f.ref} data-row={props.row} {...f.props}>
			{props.name}
		</button>
	);
}

const key = (code: string): void => {
	act(() => {
		window.dispatchEvent(
			new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }),
		);
	});
};

describe('FocusScope', () => {
	test('arrows move focus, Enter activates, Esc goes back, disabled is skipped', () => {
		const log: string[] = [];
		let backs = 0;
		const { getByText } = render(
			<FocusScope onBack={() => backs++}>
				<Item name="a" row={0} log={log} />
				<Item name="b" row={1} log={log} disabled />
				<Item name="c" row={2} log={log} />
			</FocusScope>,
		);
		expect(document.activeElement).toBe(getByText('a'));
		key('ArrowDown');
		expect(document.activeElement).toBe(getByText('c'));
		key('Enter');
		key('ArrowUp');
		key('Enter');
		key('Escape');
		expect(log).toEqual(['c', 'a']);
		expect(backs).toBe(1);
		fireEvent.click(getByText('c'));
		expect(log).toEqual(['c', 'a', 'c']);
		cleanup();
	});

	test('only the innermost scope reacts', () => {
		const outer: string[] = [];
		const inner: string[] = [];
		render(
			<>
				<FocusScope>
					<Item name="o" row={0} log={outer} />
				</FocusScope>
				<FocusScope>
					<Item name="i" row={1} log={inner} />
				</FocusScope>
			</>,
		);
		key('Enter');
		expect(outer).toEqual([]);
		expect(inner).toEqual(['i']);
		cleanup();
	});
});

describe('Toast', () => {
	test('shows messages in an aria-live region and auto-dismisses', async () => {
		const { getByRole, queryByText } = render(<ToastHost />);
		act(() => {
			showToast('hello', 20);
		});
		expect(getByRole('status').getAttribute('aria-live')).toBe('polite');
		expect(queryByText('hello')).not.toBeNull();
		await act(async () => {
			await new Promise((r) => setTimeout(r, 60));
		});
		expect(queryByText('hello')).toBeNull();
		expect(toastStore.get().queue).toEqual([]);
		cleanup();
	});
});
