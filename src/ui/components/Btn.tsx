import type { ReactElement, ReactNode } from 'react';
import { useFocusable } from '../focus';

/** Focusable button: >= 44 px target, visible focus ring, native `disabled` when it cannot act. */
export function Btn(props: {
	onActivate: () => void;
	disabled?: boolean;
	className?: string;
	label?: string;
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
			{...f.props}
			// No Tailwind preflight (keeps the game canvas untouched), so reset the native button look here.
			className={`min-h-11 min-w-11 cursor-pointer appearance-none rounded border bg-night/80 px-3 py-1 font-bold [font-family:inherit] outline-offset-2 transition-colors enabled:hover:bg-snow-dark/60 data-[focused=true]:outline-2 data-[focused=true]:outline-crit disabled:cursor-not-allowed disabled:opacity-40 ${props.className ?? ''}`}
		>
			{props.children}
		</button>
	);
}
