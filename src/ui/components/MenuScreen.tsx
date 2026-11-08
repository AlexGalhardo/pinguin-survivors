import type { ReactElement, ReactNode } from 'react';
import { FocusScope } from '../focus';
import { Btn } from './Btn';
import { MenuBackground } from './MenuBackground';

/** Shared frame of the menu screens: title, scrollable body, Esc/B goes back. */
export function MenuScreen(props: {
	title: string;
	onBack: () => void;
	children: ReactNode;
	/** Narrow single column (settings, lists) or wide (hero select, hero screen). */
	wide?: boolean;
}): ReactElement {
	return (
		<FocusScope
			onBack={props.onBack}
			className="fixed inset-0 flex flex-col items-center gap-[2vh] overflow-hidden bg-night px-[3vw] py-[3vh] font-body text-[clamp(0.8rem,1.7vh,1.125rem)] text-text-light"
		>
			<MenuBackground />
			<h1 className="relative font-title text-[2em] font-bold">{props.title}</h1>
			<div
				className={`relative flex min-h-0 w-full flex-1 flex-col items-center gap-2 overflow-y-auto ${props.wide ? 'max-w-[90rem]' : 'max-w-[44rem]'}`}
			>
				{props.children}
			</div>
		</FocusScope>
	);
}

/** Row with decrement/increment buttons around the label (touch and left/right navigation). */
export function AdjustRow(props: {
	label: string;
	onPrev: () => void;
	onNext: () => void;
	disabled?: boolean;
}): ReactElement {
	return (
		<div className="flex w-full items-center gap-2">
			<Btn
				onActivate={props.onPrev}
				disabled={props.disabled}
				className="border-snow"
				label="-"
			>
				◀
			</Btn>
			<div className="flex-1 text-center">{props.label}</div>
			<Btn
				onActivate={props.onNext}
				disabled={props.disabled}
				className="border-snow"
				label="+"
			>
				▶
			</Btn>
		</div>
	);
}
