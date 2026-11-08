import type { CSSProperties, ReactElement, ReactNode } from 'react';

/** Thin gold line that closes a header (the "filet" of the dark-fantasy panel style). */
export function Filet(props: { className?: string }): ReactElement {
	return (
		<div
			aria-hidden="true"
			className={`h-px w-full bg-gradient-to-r from-transparent via-gold-aged to-transparent ${props.className ?? ''}`}
		/>
	);
}

/** Separator with a small diamond in the middle. */
export function Divider(props: { className?: string }): ReactElement {
	return (
		<div
			aria-hidden="true"
			className={`flex w-full items-center gap-2 ${props.className ?? ''}`}
		>
			<span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold-aged" />
			<span className="diamond" />
			<span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold-aged" />
		</div>
	);
}

/** Screen title: wide-spaced capitals between two gold ornaments. */
export function Heading(props: { children: ReactNode; className?: string }): ReactElement {
	return (
		<div className={`flex w-full items-center gap-3 ${props.className ?? ''}`}>
			<span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold-aged" />
			<span className="diamond" />
			<h1 className="m-0 font-title text-[1.9em] leading-tight font-black [@media(max-height:500px)]:text-[1.15em] tracking-[0.18em] text-text-light uppercase [text-shadow:0_2px_8px_var(--color-shadow)]">
				{props.children}
			</h1>
			<span className="diamond" />
			<span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold-aged" />
		</div>
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
	/** Game screens (shop, pause) never scroll: the body clips instead and the layout must fit. */
	fit?: boolean;
}): ReactElement {
	return (
		<section
			className={`ornate relative flex min-h-0 flex-col border border-snow-dark shadow-[inset_0_0_0_3px_var(--color-night),inset_0_0_0_4px_var(--color-snow-dark),0_4px_24px_var(--color-shadow)] ${props.className ?? ''}`}
		>
			{props.title !== undefined && (
				<header className="px-4 pt-3 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:pt-1">
					<h2 className="m-0 flex items-center gap-2 font-title text-[1.05em] font-bold tracking-[0.14em] text-gold-bright uppercase">
						<span className="diamond" />
						{props.title}
					</h2>
					<Filet className="mt-1" />
				</header>
			)}
			<div
				data-panel-scroll={props.fit ? undefined : 'true'}
				className={`flex min-h-0 flex-1 flex-col gap-2 ${props.fit ? 'p-3 [@media(max-height:500px)]:p-1.5' : 'p-4 [@media(max-height:500px)]:p-2'} ${props.fit ? 'overflow-hidden' : 'no-scrollbar overflow-y-auto'}`}
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
			className={`flex flex-col border-2 border-snow-dark bg-night/80 ${props.className ?? ''}`}
			style={style}
		>
			<div
				className="flex flex-col gap-0.5 px-3 pt-2 pb-1.5"
				style={
					props.color
						? {
								backgroundImage: `linear-gradient(90deg, color-mix(in srgb, ${props.color} 38%, transparent), transparent 85%)`,
							}
						: undefined
				}
			>
				<div
					className="font-title text-[1.1em] font-bold tracking-[0.06em] uppercase"
					style={props.color ? { color: props.color } : undefined}
				>
					{props.name}
				</div>
				{props.kind && (
					<div className="text-[0.8em] tracking-wider text-text-dim uppercase">
						{props.kind}
					</div>
				)}
			</div>
			<div className="flex flex-col gap-1 px-3 pt-1.5 pb-2">
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
