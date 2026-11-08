import { useSyncExternalStore } from 'react';

const QUERY = '(max-height: 500px)';

function subscribe(fn: () => void): () => void {
	if (typeof window === 'undefined' || !window.matchMedia) return () => {};
	const m = window.matchMedia(QUERY);
	m.addEventListener('change', fn);
	return () => m.removeEventListener('change', fn);
}

/** Phone landscape (CSS height <= 500 px): screens trade icon size and decoration for fit. */
export function useCompact(): boolean {
	return useSyncExternalStore(
		subscribe,
		() => typeof window !== 'undefined' && !!window.matchMedia?.(QUERY).matches,
		() => false,
	);
}
