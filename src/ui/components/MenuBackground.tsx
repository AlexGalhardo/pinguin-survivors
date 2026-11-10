import { type ReactElement, useEffect, useRef, useState } from 'react';
import { assetUrl } from '../../core/asset-url';

const ARTS = ['jack', 'bob'] as const;
const ART_BASE = `${import.meta.env?.BASE_URL ?? './'}assets/menu/`;

/**
 * Key art behind the menus: one of the key arts at the smallest integer scale that covers the
 * screen (square pixels), darkened for legibility. Picked at random each time a menu opens.
 */
export function MenuBackground(): ReactElement {
	const [art] = useState(() => ARTS[Math.floor(Math.random() * ARTS.length)] as string);
	const url = assetUrl(`${ART_BASE}keyart.${art}.png`);
	const box = useRef<HTMLDivElement>(null);
	const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
	const [view, setView] = useState({ w: 0, h: 0 });

	useEffect(() => {
		const measure = (): void => {
			const el = box.current;
			if (el) setView({ w: el.clientWidth, h: el.clientHeight });
		};
		measure();
		window.addEventListener('resize', measure);
		return () => window.removeEventListener('resize', measure);
	}, []);

	const scale =
		natural && view.w > 0
			? Math.max(1, Math.ceil(Math.max(view.w / natural.w, view.h / natural.h)))
			: 0;

	return (
		<div
			ref={box}
			aria-hidden="true"
			className="pointer-events-none absolute inset-0 overflow-hidden"
		>
			<img
				src={url}
				alt=""
				onLoad={(e) =>
					setNatural({
						w: e.currentTarget.naturalWidth,
						h: e.currentTarget.naturalHeight,
					})
				}
				width={natural && scale > 0 ? natural.w * scale : undefined}
				height={natural && scale > 0 ? natural.h * scale : undefined}
				className={`absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 [image-rendering:pixelated] ${scale > 0 ? '' : 'invisible'}`}
			/>
			<div className="absolute inset-0 bg-night/30" />
			<div className="absolute inset-y-0 left-0 w-[55%] bg-gradient-to-r from-night/90 via-night/70 to-transparent" />
		</div>
	);
}
