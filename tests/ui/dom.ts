import { Window } from 'happy-dom';

const KEYS = [
	'window',
	'document',
	'navigator',
	'HTMLElement',
	'Element',
	'Node',
	'KeyboardEvent',
	'MouseEvent',
	'Event',
	'MutationObserver',
	'getComputedStyle',
] as const;

/** Scoped happy-dom: installs DOM globals for one test file and removes them afterwards. */
export function installDom(): () => void {
	const win = new Window();
	const g = globalThis as Record<string, unknown>;
	const saved = KEYS.map((k) => [k, g[k]] as const);
	for (const k of KEYS) {
		g[k] = k === 'window' ? win : (win as unknown as Record<string, unknown>)[k];
	}
	g.IS_REACT_ACT_ENVIRONMENT = true;
	return () => {
		win.close();
		for (const [k, v] of saved) {
			if (v === undefined) delete g[k];
			else g[k] = v;
		}
		delete g.IS_REACT_ACT_ENVIRONMENT;
	};
}
