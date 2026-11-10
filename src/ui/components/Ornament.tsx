import type { ReactElement } from 'react';

/** Filet sizes of the design system (section 6): total width, end length, middle length, diamond. */
const FILET = {
	full: { w: 620, end: 130, mid: 170, d: 10 },
	short: { w: 520, end: 110, mid: 140, d: 10 },
	compact: { w: 320, end: 60, mid: 90, d: 8 },
} as const;

export type FiletSize = keyof typeof FILET;
export type CornerPos = 'tl' | 'tr' | 'bl' | 'br';

const CORNER_ROTATE: Record<CornerPos, number> = { tl: 0, tr: 90, br: 180, bl: 270 };

/**
 * Inline SVG ornaments of the Style D (docs/design-system.md section 6): `diamond` (gold
 * square at 45 deg), `corner` (gold L of 18 px, dialogs only) and `filet` (title rule that
 * thins out around a center diamond). Decorative: always `aria-hidden`.
 */
export function Ornament(
	props:
		| { kind: 'diamond'; size?: number; className?: string }
		| { kind: 'corner'; pos?: CornerPos; className?: string }
		| { kind: 'filet'; size?: FiletSize; className?: string },
): ReactElement {
	const cls = props.className ?? '';
	if (props.kind === 'diamond') {
		const s = props.size ?? 10;
		return (
			<svg
				aria-hidden="true"
				data-ornament="diamond"
				width={s}
				height={s}
				viewBox="0 0 10 10"
				className={`shrink-0 ${cls}`}
			>
				<rect
					x="1.5"
					y="1.5"
					width="7"
					height="7"
					transform="rotate(45 5 5)"
					className="fill-gold-bright"
				/>
			</svg>
		);
	}
	if (props.kind === 'corner') {
		return (
			<svg
				aria-hidden="true"
				data-ornament="corner"
				data-pos={props.pos ?? 'tl'}
				width="18"
				height="18"
				viewBox="0 0 18 18"
				className={`shrink-0 ${cls}`}
				style={{ transform: `rotate(${CORNER_ROTATE[props.pos ?? 'tl']}deg)` }}
			>
				<path d="M1 18V1H18" fill="none" strokeWidth="2" className="stroke-gold-aged" />
			</svg>
		);
	}
	const f = FILET[props.size ?? 'full'];
	const x0 = (f.w - (2 * (f.end + f.mid) + f.d)) / 2;
	const cx = f.w / 2;
	return (
		<svg
			aria-hidden="true"
			data-ornament="filet"
			data-size={props.size ?? 'full'}
			width={f.w}
			height="16"
			viewBox={`0 0 ${f.w} 16`}
			className={`max-w-full shrink-0 ${cls}`}
		>
			<rect x={x0} y="7.5" width={f.end} height="1" className="fill-gold-aged/20" />
			<rect x={x0 + f.end} y="7" width={f.mid} height="2" className="fill-gold-aged" />
			<rect
				x={cx - f.d / 2}
				y={8 - f.d / 2}
				width={f.d}
				height={f.d}
				transform={`rotate(45 ${cx} 8)`}
				className="fill-gold-bright"
			/>
			<rect x={cx + f.d / 2} y="7" width={f.mid} height="2" className="fill-gold-aged" />
			<rect
				x={cx + f.d / 2 + f.mid}
				y="7.5"
				width={f.end}
				height="1"
				className="fill-gold-aged/20"
			/>
		</svg>
	);
}
