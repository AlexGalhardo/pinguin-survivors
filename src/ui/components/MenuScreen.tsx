import type { ReactElement, ReactNode } from 'react';
import { FocusScope } from '../focus';
import { Btn } from './Btn';
import { Heading, Hint, Panel } from './Panel';
import { Vignette } from './Vignette';

/** Shared frame of the menu screens (Style D): Cinzel title over the filet, a soft central glow,
 * a surface that scrolls inside itself (never the page), an optional footer with the actions and
 * a static vignette on top. Esc/B goes back. Plain dark backdrop (no main menu art). */
export function MenuScreen(props: {
	title: string;
	onBack: () => void;
	children: ReactNode;
	/** Narrow single column (settings, lists) or wide (hero select, hero screen). */
	wide?: boolean;
	/** One line under the title saying what the screen is for. */
	subtitle?: ReactNode;
	/** Pinned under the panel: the screen's actions (Back, Play...). */
	footer?: ReactNode;
}): ReactElement {
	const width = props.wide ? 'max-w-[90rem]' : 'max-w-[56rem]';
	return (
		<FocusScope
			onBack={props.onBack}
			className="fixed inset-0 flex flex-col items-center gap-[1.6vh] overflow-hidden bg-night px-[3vw] py-[2.5vh] font-body text-[clamp(0.8rem,1.7vh,1.125rem)] text-text-light [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:py-1"
		>
			<div aria-hidden="true" className="d-glow absolute inset-0" />
			<header className={`relative flex w-full flex-col items-center gap-1 ${width}`}>
				<Heading>{props.title}</Heading>
				{props.subtitle && (
					<div className="[@media(max-height:500px)]:hidden">
						<Hint>{props.subtitle}</Hint>
					</div>
				)}
			</header>
			<Panel className={`relative w-full flex-1 ${width}`}>{props.children}</Panel>
			{props.footer && (
				<footer className={`relative flex w-full flex-wrap justify-center gap-2 ${width}`}>
					{props.footer}
				</footer>
			)}
			<Vignette />
		</FocusScope>
	);
}

/** Back button for a screen footer. */
export function BackBtn(props: {
	onBack: () => void;
	label: string;
	disabled?: boolean;
}): ReactElement {
	return (
		<Btn
			onActivate={props.onBack}
			disabled={props.disabled}
			variant="secondary"
			className="min-w-40"
		>
			{props.label}
		</Btn>
	);
}

/** Row with ‹ › around the label (touch and left/right navigation); 48 px arrow targets. */
export function AdjustRow(props: {
	label: ReactNode;
	onPrev: () => void;
	onNext: () => void;
	disabled?: boolean;
	/** What the option does, in one line under the row. */
	hint?: ReactNode;
}): ReactElement {
	return (
		<div className="flex w-full flex-col gap-0.5">
			<div className="flex w-full items-center gap-2">
				<Btn
					onActivate={props.onPrev}
					disabled={props.disabled}
					className="min-h-[48px] min-w-[48px] pr-0! pl-0!"
					label="-"
				>
					<span className="font-title text-[32px] leading-none text-gold-bright">‹</span>
				</Btn>
				<div className="flex-1 text-center text-list font-bold tracking-list uppercase">
					{props.label}
				</div>
				<Btn
					onActivate={props.onNext}
					disabled={props.disabled}
					className="min-h-[48px] min-w-[48px] pr-0! pl-0!"
					label="+"
				>
					<span className="font-title text-[32px] leading-none text-gold-bright">›</span>
				</Btn>
			</div>
			{props.hint && (
				<div className="text-center">
					<Hint>{props.hint}</Hint>
				</div>
			)}
		</div>
	);
}
