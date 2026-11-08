import type { CSSProperties, ReactElement, ReactNode } from 'react';

/** Thin gold line that closes a header (the "filet" of the dark-fantasy panel style). */
export function Filet(props: { className?: string }): ReactElement {
	return (
		<div
			aria-hidden="true"
			className={`h-px w-full bg-gradient-to-r from-transparent via-crit/70 to-transparent ${props.className ?? ''}`}
		/>
	);
}

/**
 * Dark framed panel: square border plus an inner hairline (double border), used by every menu
 * screen. Scrolls inside itself, never the page.
 */
export function Panel(props: {
	children: ReactNode;
	title?: ReactNode;
	className?: string;
}): ReactElement {
	return (
		<section
			className={`relative flex min-h-0 flex-col border border-snow bg-night/90 shadow-[inset_0_0_0_3px_var(--color-night),inset_0_0_0_4px_var(--color-snow-dark)] ${props.className ?? ''}`}
		>
			{props.title !== undefined && (
				<header className="px-4 pt-3">
					<h2 className="font-title text-[1.05em] font-bold tracking-wider text-text-dim uppercase">
						{props.title}
					</h2>
					<Filet className="mt-1" />
				</header>
			)}
			<div
				data-panel-scroll="true"
				className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4"
			>
				{props.children}
			</div>
		</section>
	);
}

/** Label on the left, value on the right, aligned on a dotted leader. */
export function StatRow(props: {
	label: ReactNode;
	value: ReactNode;
	/** Value color (a token class such as `text-xp`); neutral by default. */
	accent?: string;
}): ReactElement {
	return (
		<div className="flex items-baseline gap-2">
			<span className="text-text-dim">{props.label}</span>
			<span
				aria-hidden="true"
				className="min-w-4 flex-1 border-b border-dotted border-snow-dark"
			/>
			<span className={`font-bold tabular-nums ${props.accent ?? 'text-text-light'}`}>
				{props.value}
			</span>
		</div>
	);
}

/**
 * Item card / tooltip: the name in the rarity color (a CSS color passed by prop, so the one
 * `rarityColor` source can feed it), optional type line, bonus lines and a footer.
 */
export function ItemCard(props: {
	name: ReactNode;
	/** CSS color of the rarity; the border and the name use it. */
	color?: string;
	kind?: ReactNode;
	lines?: readonly ReactNode[];
	footer?: ReactNode;
	className?: string;
}): ReactElement {
	const style: CSSProperties | undefined = props.color ? { borderColor: props.color } : undefined;
	return (
		<div
			className={`flex flex-col gap-1 border-2 border-snow-dark bg-night/80 p-3 ${props.className ?? ''}`}
			style={style}
		>
			<div
				className="font-title text-[1.1em] font-bold"
				style={props.color ? { color: props.color } : undefined}
			>
				{props.name}
			</div>
			{props.kind && <div className="text-[0.8em] text-text-dim uppercase">{props.kind}</div>}
			{props.lines && props.lines.length > 0 && (
				<ul className="m-0 list-none space-y-0.5 p-0 text-[0.9em]">
					{props.lines.map((line, i) => (
						// Static text lines, never reordered.
						// biome-ignore lint/suspicious/noArrayIndexKey: fixed list of lines
						<li key={i}>{line}</li>
					))}
				</ul>
			)}
			{props.footer}
		</div>
	);
}

/** Small dim explanation under an option. */
export function Hint(props: { children: ReactNode }): ReactElement {
	return <p className="m-0 text-[0.8em] leading-snug text-text-dim">{props.children}</p>;
}

/** Progress bar (0..100) in a token color class. */
export function Bar(props: { percent: number; tone?: string }): ReactElement {
	return (
		<div className="h-1.5 w-full overflow-hidden border border-snow-dark bg-night">
			<div
				className={`h-full ${props.tone ?? 'bg-xp'}`}
				style={{ width: `${Math.max(0, Math.min(100, props.percent))}%` }}
			/>
		</div>
	);
}
