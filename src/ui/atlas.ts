import { createStore } from './store';

/** Where a sprite lives inside a Phaser atlas PNG (read from the atlas JSON, `ui` and `core`). */
export interface AtlasFrame {
	url: string;
	x: number;
	y: number;
	w: number;
	h: number;
	/** Size of the whole atlas image. */
	atlasW: number;
	atlasH: number;
}

interface HashAtlas {
	frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }>;
	meta: { image: string; size: { w: number; h: number } };
}

/** Atlases the DOM can draw from; the game loads the same PNGs in Phaser for the world. */
export const UI_ATLASES = ['ui', 'core'] as const;

const frames = new Map<string, AtlasFrame>();
/** Bumped after every registration so mounted icons re-render. */
export const atlasStore = createStore<{ rev: number }>({ rev: 0 });

/** Registers every frame of a Phaser hash atlas; `baseUrl` is the folder of its PNG. */
export function registerAtlas(json: HashAtlas, baseUrl: string): void {
	const url = `${baseUrl}${json.meta.image}`;
	for (const [name, f] of Object.entries(json.frames))
		frames.set(name, {
			url,
			x: f.frame.x,
			y: f.frame.y,
			w: f.frame.w,
			h: f.frame.h,
			atlasW: json.meta.size.w,
			atlasH: json.meta.size.h,
		});
	atlasStore.set({ rev: atlasStore.get().rev + 1 });
}

export function atlasFrame(name: string): AtlasFrame | undefined {
	return frames.get(name);
}

/** First existing frame among `names` (e.g. the tier art, then the base weapon art). */
export function firstFrame(...names: string[]): AtlasFrame | undefined {
	for (const n of names) {
		const f = frames.get(n);
		if (f) return f;
	}
	return undefined;
}

/** Test hook. */
export function clearAtlases(): void {
	frames.clear();
	atlasStore.set({ rev: atlasStore.get().rev + 1 });
}

/** Fetches the UI atlases once at start-up; icons fall back to text until they arrive. */
export async function loadUiAtlases(
	base = `${import.meta.env?.BASE_URL ?? './'}assets/atlas/`,
): Promise<void> {
	await Promise.all(
		UI_ATLASES.map(async (name) => {
			try {
				const res = await fetch(`${base}${name}.json`);
				if (res.ok) registerAtlas((await res.json()) as HashAtlas, base);
			} catch {
				// Offline or missing file: the text fallback stays.
			}
		}),
	);
}
