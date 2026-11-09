import { type ReactElement, useEffect, useState } from 'react';
import type { HeroId } from '../../config/constants';
import { assetUrl } from '../../core/asset-url';

interface Sheet {
	url: string;
	atlasW: number;
	atlasH: number;
	frames: { x: number; y: number }[];
}

const FRAME = 80;
const FPS = 6;
const IDLE_FRAMES = 4;
const base = (): string => import.meta.env?.BASE_URL ?? './';
const sheets = new Map<HeroId, Promise<Sheet | null>>();

/** Idle animation (south view) of a hero atlas, read once from its JSON. */
function loadSheet(hero: HeroId): Promise<Sheet | null> {
	let p = sheets.get(hero);
	if (!p) {
		p = (async () => {
			if (typeof fetch !== 'function') return null;
			try {
				const dir = `${base()}assets/heroes/`;
				const res = await fetch(assetUrl(`${dir}hero.${hero}.json`));
				if (!res.ok) return null;
				const json = (await res.json()) as {
					frames: Record<string, { frame: { x: number; y: number } }>;
					meta: { image: string; size: { w: number; h: number } };
				};
				const frames = Array.from(
					{ length: IDLE_FRAMES },
					(_, i) => json.frames[`idle.s.0${i}`]?.frame,
				);
				if (frames.some((f) => !f)) return null;
				return {
					url: assetUrl(`${dir}${json.meta.image}`),
					atlasW: json.meta.size.w,
					atlasH: json.meta.size.h,
					frames: frames as { x: number; y: number }[],
				};
			} catch {
				return null;
			}
		})();
		sheets.set(hero, p);
	}
	return p;
}

/**
 * A hero drawn large and crisp: the idle loop of its atlas (the portrait PNG while it loads).
 * `locked` turns it into a dark silhouette with a padlock.
 */
export function HeroSprite(props: {
	hero: HeroId;
	/** Whole-number scale of the 80 px frame (2 = 160 px). */
	scale: number;
	locked?: boolean;
	title?: string;
}): ReactElement {
	const [sheet, setSheet] = useState<Sheet | null>(null);
	const [tick, setTick] = useState(0);
	useEffect(() => {
		let alive = true;
		void loadSheet(props.hero).then((s) => alive && setSheet(s));
		return () => {
			alive = false;
		};
	}, [props.hero]);
	useEffect(() => {
		if (!sheet || props.locked) return;
		const id = setInterval(() => setTick((n) => n + 1), 1000 / FPS);
		return () => clearInterval(id);
	}, [sheet, props.locked]);

	const px = FRAME * props.scale;
	const f = sheet?.frames[tick % IDLE_FRAMES];
	return (
		<span
			role="img"
			aria-label={props.title}
			className="relative inline-block shrink-0"
			style={{ width: px, height: px }}
		>
			<span
				className="absolute inset-0 [image-rendering:pixelated]"
				style={{
					filter: props.locked ? 'brightness(0) opacity(0.75)' : undefined,
					backgroundRepeat: 'no-repeat',
					...(sheet && f
						? {
								backgroundImage: `url(${sheet.url})`,
								backgroundSize: `${sheet.atlasW * props.scale}px ${sheet.atlasH * props.scale}px`,
								backgroundPosition: `${-f.x * props.scale}px ${-f.y * props.scale}px`,
							}
						: {
								backgroundImage: `url(${assetUrl(`${base()}assets/heroes/portrait.${props.hero}.png`)})`,
								backgroundSize: '100% 100%',
							}),
				}}
			/>
			{props.locked && (
				<svg
					viewBox="0 0 24 24"
					aria-hidden="true"
					className="absolute top-1/2 left-1/2 size-1/3 -translate-x-1/2 -translate-y-1/2 fill-text-dim"
				>
					<path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3H9Z" />
				</svg>
			)}
		</span>
	);
}
