import { expect, test } from 'bun:test';
import { SUSPEND_EVENT, watchSuspend } from '../src/core/suspend';

function fakeTarget() {
	const fns = new Map<string, Set<() => void>>();
	return {
		hidden: false,
		addEventListener: (t: string, f: () => void) =>
			void (fns.get(t) ?? fns.set(t, new Set()).get(t))?.add(f),
		removeEventListener: (t: string, f: () => void) => void fns.get(t)?.delete(f),
		fire: (t: string) => {
			for (const f of fns.get(t) ?? []) f();
		},
		count: () => [...fns.values()].reduce((n, s) => n + s.size, 0),
	};
}

test('blur, hidden tab and the shell event all suspend; visible does not; stop removes them', () => {
	const win = fakeTarget();
	const doc = fakeTarget();
	let n = 0;
	const stop = watchSuspend(() => n++, win, doc);
	win.fire('blur');
	win.fire(SUSPEND_EVENT);
	doc.hidden = true;
	doc.fire('visibilitychange');
	expect(n).toBe(3);
	doc.hidden = false;
	doc.fire('visibilitychange');
	expect(n).toBe(3);
	stop();
	expect(win.count() + doc.count()).toBe(0);
});
