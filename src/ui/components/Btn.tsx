import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { useFocusable } from '../focus';

const VARIANT = {
	primary: 'd-cta',
	secondary: '',
	danger: 'd-danger',
} as const;

/** Focusable text button of the Style D: >= 44 px target, gold diamond and band on focus (`d-focus`), native `disabled` when it cannot act. */
export function Btn(props: {
	onActivate: () => void;
	disabled?: boolean;
	className?: string;
	label?: string;
	/** CSS color of an item's rarity (`rarityCss`): border, text and fill follow it (docs/design-system.md). */
	tint?: string;
	/** Look: `primary` (gold band, the main action), `secondary` (plain text) or `danger` (blood red); none keeps the caller's classes. */
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
			className={`d-focus relative ${props.tint ? 'border' : 'border-0 disabled:border'} inline-flex min-h-[44px] min-w-[44px] cursor-pointer appearance-none items-center justify-center gap-2 py-1 pr-[16px] pl-[32px] text-body font-bold tracking-list uppercase [font-family:inherit] disabled:cursor-not-allowed disabled:border-dashed disabled:border-snow disabled:bg-transparent disabled:text-text-dim ${props.tint ? 'rarity-btn bg-night/80' : ''} ${props.variant ? VARIANT[props.variant] : ''} ${props.className ?? ''}`}
		>
			{props.children}
		</button>
	);
}
