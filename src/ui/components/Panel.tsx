import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { Ornament } from './Ornament';

/** Plain 1 px line that closes a header. */
export function Filet(props: { className?: string }): ReactElement {
	return <div aria-hidden="true" className={`d-filet ${props.className ?? ''}`} />;
}

/** Separator with a small diamond in the middle, flat 1 px lines. */
export function Divider(props: { className?: string }): ReactElement {
	return (
		<div
			aria-hidden="true"
			className={`flex w-full items-center gap-2 ${props.className ?? ''}`}
		>
			<span className="h-px flex-1 bg-line" />
			<Ornament kind="diamond" size={10} />
			<span className="h-px flex-1 bg-line" />
		</div>
	);
}

/** Screen title: Cinzel capitals in gold over the filet ornament (compact filet on phones). */
export function Heading(props: { children: ReactNode; className?: string }): ReactElement {
	return (
		<div className={`flex w-full flex-col items-center gap-1 ${props.className ?? ''}`}>
			<h1 className="m-0 text-center font-title text-title leading-tight font-bold tracking-title text-gold-bright uppercase ">
				{props.children}
			</h1>
			<Ornament kind="filet" size="full" className="[@media(max-height:500px)]:hidden" />
			<Ornament
				kind="filet"
				size="compact"
				className="hidden [@media(max-height:500px)]:block"
			/>
		</div>
	);
}

/**
 * Flat surface of a menu screen (ADR-027): solid `night`, 1 px `line` border, no shadow and no
 * radius, padding 12 px. Scrolls inside itself, never the page.
 */
export function Panel(props: {
	children: ReactNode;
	title?: ReactNode;
	className?: string;
	/** Game screens (shop, pause) never scroll: the body clips instead and the layout must fit. */
	fit?: boolean;
}): ReactElement {
	return (
		<section
			className={`relative flex min-h-0 flex-col border border-line bg-night ${props.className ?? ''}`}
		>
			{props.title !== undefined && (
				<header className="d-pad pb-0">
					<h2 className="m-0 flex items-center gap-2 font-body text-section font-black tracking-section text-gold-bright uppercase">
						<Ornament kind="diamond" size={10} />
						{props.title}
					</h2>
					<Filet className="mt-1" />
				</header>
			)}
			<div
				data-panel-scroll={props.fit ? undefined : 'true'}
				className={`d-pad flex min-h-0 flex-1 flex-col gap-2 ${props.fit ? 'overflow-hidden' : 'no-scrollbar overflow-y-auto'}`}
			>
				{props.children}
			</div>
		</section>
	);
}

/** Label on the left, value on the right; rows of 36-40 px, no leader. */
export function StatRow(props: {
	label: ReactNode;
	value: ReactNode;
	/** Value color (a token class such as `text-xp`); neutral by default. */
	accent?: string;
}): ReactElement {
	return (
		<div className="flex min-h-9 items-baseline justify-between gap-3 text-body">
			<span className="text-text-light">{props.label}</span>
			<span className={`font-bold tabular-nums ${props.accent ?? 'text-text-light'}`}>
				{props.value}
			</span>
		</div>
	);
}

/**
 * Item card / tooltip: flat, 1 px border in the rarity color and header tinted in it (a CSS
 * color passed by prop, so the one `rarityColor` source can feed it), name, optional type line,
 * bonus lines and a footer. No shadow, no chamfer. `className` lands on the outer wrapper (size, position).
 */
export function ItemCard(props: {
	name: ReactNode;
	/** CSS color of the rarity; the border, the header tint and the name use it. */
	color?: string;
	kind?: ReactNode;
	lines?: readonly ReactNode[];
	footer?: ReactNode;
	className?: string;
}): ReactElement {
	const style = { borderColor: props.color ?? 'var(--color-line)' } as CSSProperties;
	return (
		<div className={props.className ?? ''}>
			<div className="flex h-full flex-col border bg-night" style={style}>
				<div
					className="flex flex-col gap-1 px-3.5 py-3"
					style={
						props.color
							? {
									backgroundColor: `color-mix(in srgb, ${props.color} 20%, transparent)`,
								}
							: undefined
					}
				>
					<div
						className="font-title text-item leading-tight font-bold tracking-[0.03em]"
						style={props.color ? { color: props.color } : undefined}
					>
						{props.name}
					</div>
					{props.kind && (
						<div className="text-secondary font-bold tracking-wider text-text-light uppercase">
							{props.kind}
						</div>
					)}
				</div>
				<div className="flex flex-col gap-1.5 px-3.5 py-3">
					{props.lines && props.lines.length > 0 && (
						<ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-body">
							{props.lines.map((line, i) => (
								// Static text lines, never reordered.
								// biome-ignore lint/suspicious/noArrayIndexKey: fixed list of lines
								<li key={i}>{line}</li>
							))}
						</ul>
					)}
					{props.footer}
				</div>
			</div>
		</div>
	);
}

/** Short explanation under an option: secondary text, light for contrast. */
export function Hint(props: { children: ReactNode }): ReactElement {
	return <p className="m-0 text-secondary leading-snug text-text-light">{props.children}</p>;
}

/** Progress bar (0..100) in a token color class, on a `panel-bottom` track. */
export function Bar(props: { percent: number; tone?: string }): ReactElement {
	return (
		<div className="h-1.5 w-full overflow-hidden bg-panel-bottom">
			<div
				className={`h-full ${props.tone ?? 'bg-xp'}`}
				style={{ width: `${Math.max(0, Math.min(100, props.percent))}%` }}
			/>
		</div>
	);
}
