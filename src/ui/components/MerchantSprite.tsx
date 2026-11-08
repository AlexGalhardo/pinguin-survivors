import { type ReactElement, useEffect, useState } from 'react';

interface Sheet {
	url: string;
	atlasW: number;
	atlasH: number;
	frames: { x: number; y: number }[];
}

/** Side of the `npc.merchant` frames in px. */
const FRAME = 96;
const FPS = 4;
const IDLE_FRAMES = 4;
const base = (): string => import.meta.env?.BASE_URL ?? './';
let sheet: Promise<Sheet | null> | null = null;

/** Idle loop (south view) of the shop merchant, read once from `assets/enemies/npc.merchant.json`. */
function loadSheet(): Promise<Sheet | null> {
	sheet ??= (async () => {
		if (typeof fetch !== 'function') return null;
		try {
			const dir = `${base()}assets/enemies/`;
			const res = await fetch(`${dir}npc.merchant.json`);
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
				url: `${dir}${json.meta.image}`,
				atlasW: json.meta.size.w,
				atlasH: json.meta.size.h,
				frames: frames as { x: number; y: number }[],
			};
		} catch {
			return null;
		}
	})();
	return sheet;
}

/** The merchant NPC of the shop, drawn crisp at a whole-number `scale` of its 96 px frame (renders nothing until loaded). */
export function MerchantSprite(props: { scale: number; title?: string }): ReactElement {
	const [s, setS] = useState<Sheet | null>(null);
	const [tick, setTick] = useState(0);
	useEffect(() => {
		let alive = true;
		void loadSheet().then((v) => alive && setS(v));
		return () => {
			alive = false;
		};
	}, []);
	useEffect(() => {
		if (!s) return;
		const id = setInterval(() => setTick((n) => n + 1), 1000 / FPS);
		return () => clearInterval(id);
	}, [s]);
	const px = FRAME * props.scale;
	const f = s?.frames[tick % IDLE_FRAMES];
	return (
		<span
			role="img"
			aria-label={props.title}
			data-merchant-sprite="true"
			className="inline-block shrink-0 [image-rendering:pixelated]"
			style={{
				width: px,
				height: px,
				backgroundRepeat: 'no-repeat',
				...(s &&
					f && {
						backgroundImage: `url(${s.url})`,
						backgroundSize: `${s.atlasW * props.scale}px ${s.atlasH * props.scale}px`,
						backgroundPosition: `${-f.x * props.scale}px ${-f.y * props.scale}px`,
					}),
			}}
		/>
	);
}
