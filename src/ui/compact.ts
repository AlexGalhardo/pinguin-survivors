import { useSyncExternalStore } from 'react';

function subscribe(query: string): (fn: () => void) => () => void {
	return (fn) => {
		if (typeof window === 'undefined' || !window.matchMedia) return () => {};
		const m = window.matchMedia(query);
		m.addEventListener('change', fn);
		return () => m.removeEventListener('change', fn);
	};
}

/** Live CSS media query (false where `matchMedia` does not exist, e.g. tests). */
export function useMedia(query: string): boolean {
	return useSyncExternalStore(
		subscribe(query),
		() => typeof window !== 'undefined' && !!window.matchMedia?.(query).matches,
		() => false,
	);
}

/** Phone landscape (CSS height <= 500 px): screens trade icon size and decoration for fit. */
export function useCompact(): boolean {
	return useMedia('(max-height: 500px)');
}
