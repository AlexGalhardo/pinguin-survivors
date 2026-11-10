import { useRef } from 'react';

/** Window after a screen opens during which its inputs are ignored (a mashed key from combat must not confirm it). */
export const inputGrace = { ms: 500 };

/** Wraps handlers so they do nothing until `inputGrace.ms` passed since the screen mounted. */
export function useInputGrace(): <A extends unknown[]>(fn: (...a: A) => void) => (...a: A) => void {
	const openedAt = useRef(performance.now());
	return (fn) =>
		(...a) => {
			if (performance.now() - openedAt.current >= inputGrace.ms) fn(...a);
		};
}
