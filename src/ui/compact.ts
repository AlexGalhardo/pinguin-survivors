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

function subscribeResize(fn: () => void): () => void {
	if (typeof window === 'undefined') return () => {};
	window.addEventListener('resize', fn);
	return () => window.removeEventListener('resize', fn);
}

/**
 * Screen height over the 1080 px reference (1 at 1080p, 0.67 at 720p, 2 at 4K). Screens that must
 * never scroll size their icons with it; their text already follows the height through `vh`.
 */
export function useUiScale(): number {
	return useSyncExternalStore(
		subscribeResize,
		() => (typeof window === 'undefined' ? 1 : window.innerHeight / 1080),
		() => 1,
	);
}
