import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { useFocusable } from '../focus';

const VARIANT = {
	primary: 'border-crit bg-crit/15 text-crit enabled:hover:bg-crit/25',
	secondary: 'border-snow text-text-light',
	danger: 'border-blood bg-blood/10 text-blood enabled:hover:bg-blood/20',
} as const;

/** Focusable button: >= 44 px target, visible focus ring, native `disabled` when it cannot act. */
export function Btn(props: {
	onActivate: () => void;
	disabled?: boolean;
	className?: string;
	label?: string;
	/** CSS color of an item's rarity (`rarityCss`): border, text and fill follow it (docs/design-system.md). */
	tint?: string;
	/** Look: `primary` (gold, the main action), `secondary` (neutral) or `danger`; none keeps the caller's classes. */
	variant?: 'primary' | 'secondary' | 'danger';
	/** Exposed as `data-href` (e.g. the wishlist target) for tests and tooling. */
	href?: string;
	children: ReactNode;
}): ReactElement {
	const f = useFocusable({ onActivate: props.onActivate, disabled: props.disabled });
	return (
		<button
			type="button"
			ref={f.ref}
			disabled={props.disabled}
			aria-label={props.label}
			data-href={props.href}
			style={props.tint ? ({ '--rc': props.tint } as CSSProperties) : undefined}
			{...f.props}
			// No Tailwind preflight (keeps the game canvas untouched), so reset the native button look here.
			className={`${props.tint ? 'rarity-btn' : ''} ${props.variant ? VARIANT[props.variant] : ''} min-h-11 min-w-11 cursor-pointer appearance-none rounded border bg-night/80 px-3 py-1 font-bold [font-family:inherit] outline-offset-2 transition-colors enabled:hover:bg-snow-dark/60 data-[focused=true]:outline-2 data-[focused=true]:outline-crit disabled:cursor-not-allowed disabled:opacity-40 ${props.className ?? ''}`}
		>
			{props.children}
		</button>
	);
}
