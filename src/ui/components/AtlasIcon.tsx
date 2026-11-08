import { type ReactElement, type ReactNode, useSyncExternalStore } from 'react';
import { type AtlasFrame, atlasFrame, atlasStore, firstFrame } from '../atlas';

/**
 * A sprite of the UI/core atlas drawn with CSS (`background-position` over the atlas PNG), at the
 * largest integer scale that fits `size` px, with hard pixels. Renders `fallback` when none of the
 * frames exists (atlas still loading, or no art for this item yet).
 */
export function AtlasIcon(props: {
	/** Frame names in priority order (e.g. tier art, then base art). */
	frames: readonly string[];
	/** Target box in CSS px; the scale is a whole number, so the icon may be a little smaller. */
	size?: number;
	fallback?: ReactNode;
	title?: string;
	className?: string;
}): ReactNode {
	useSyncExternalStore(atlasStore.subscribe, () => atlasStore.get().rev);
	const frame = firstFrame(...props.frames);
	if (!frame) return props.fallback ?? null;
	return <FrameIcon frame={frame} {...props} />;
}

function FrameIcon(props: {
	frame: AtlasFrame;
	size?: number;
	title?: string;
	className?: string;
}): ReactElement {
	const f = props.frame;
	const box = props.size ?? 32;
	const scale = Math.max(1, Math.floor(box / Math.max(f.w, f.h)));
	return (
		<span
			role="img"
			aria-label={props.title}
			title={props.title}
			data-atlas-frame="true"
			className={`inline-block shrink-0 [image-rendering:pixelated] ${props.className ?? ''}`}
			style={{
				width: f.w * scale,
				height: f.h * scale,
				backgroundImage: `url(${f.url})`,
				backgroundRepeat: 'no-repeat',
				backgroundSize: `${f.atlasW * scale}px ${f.atlasH * scale}px`,
				backgroundPosition: `${-f.x * scale}px ${-f.y * scale}px`,
			}}
		/>
	);
}

/** Frame names of the icon of a level-up card: stat `icon.<id>`, perk `icon.perk.<id>`, active `icon.weapon.<id>`. */
export function cardIconFrames(cardId: string): string[] {
	if (cardId.startsWith('perk.')) return [`icon.${cardId}`];
	if (cardId.startsWith('active.')) return [`icon.weapon.${cardId.slice(7)}`];
	return [`icon.${cardId}`];
}

export const weaponFrames = (id: string, tier: number): string[] => [
	`weapon.${id}.t${tier}`,
	`weapon.${id}`,
];

export const hasFrame = (name: string): boolean => atlasFrame(name) !== undefined;
