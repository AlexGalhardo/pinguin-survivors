import { BUILD_TAG, isDemoBuild } from '../../data/demo';
import type { Platform, PlatformTier } from './types';

/** Effects tier from the device: weak CPU or little memory → low (SDD-007 RF-05). */
export function detectTier(cores: number | undefined, memoryGb: number | undefined): PlatformTier {
	if ((cores !== undefined && cores <= 4) || (memoryGb !== undefined && memoryGb <= 3))
		return 'low';
	if ((cores !== undefined && cores <= 6) || (memoryGb !== undefined && memoryGb <= 6))
		return 'mid';
	return 'high';
}

export interface WebDeps {
	storage?: Pick<Storage, 'getItem' | 'setItem'>;
	download?: (filename: string, raw: string) => void;
	openUrl?: (url: string) => void;
	tier?: PlatformTier;
	isDemo?: boolean;
}

function downloadJson(filename: string, raw: string): void {
	const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

function toggleFullscreen(): void {
	if (document.fullscreenElement) void document.exitFullscreen();
	else void document.documentElement.requestFullscreen?.();
}

/** Browser platform: localStorage plus download/upload of `.json`; store features are no-ops. */
export function createWebPlatform(deps: WebDeps = {}): Platform {
	// localStorage can throw on access (blocked site data), so it is resolved on use.
	const store = () => deps.storage ?? localStorage;
	const nav =
		typeof navigator === 'undefined'
			? undefined
			: (navigator as Navigator & { deviceMemory?: number });
	return {
		kind: 'web',
		tier: deps.tier ?? detectTier(nav?.hardwareConcurrency, nav?.deviceMemory),
		isDemo: deps.isDemo ?? isDemoBuild(),
		buildTag: BUILD_TAG,
		cloud: false,
		save: {
			load(key) {
				try {
					return store().getItem(key);
				} catch {
					return null;
				}
			},
			save(key, raw) {
				try {
					store().setItem(key, raw);
					return true;
				} catch {
					return false;
				}
			},
			exportFile: deps.download ?? downloadJson,
			importFile: (file) => file.text(),
		},
		achievements: { unlock() {} },
		leaderboards: { submit() {} },
		fullscreen: { toggle: toggleFullscreen },
		openUrl: deps.openUrl ?? ((url) => void window.open(url, '_blank', 'noopener')),
		quit() {
			window.close();
		},
	};
}
