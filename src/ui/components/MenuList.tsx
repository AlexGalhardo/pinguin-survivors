import type { ReactElement, ReactNode } from 'react';
import { useFocusable } from '../focus';
import { Ornament } from './Ornament';

export interface MenuListItem {
	id: string;
	label: ReactNode;
	disabled?: boolean;
}

function MenuListItemView(props: {
	item: MenuListItem;
	selected: boolean;
	onSelect: (id: string) => void;
}): ReactElement {
	const { item, selected } = props;
	const f = useFocusable({ onActivate: () => props.onSelect(item.id), disabled: item.disabled });
	return (
		<button
			type="button"
			ref={f.ref}
			disabled={item.disabled}
			aria-current={selected ? 'true' : undefined}
			data-selected={selected}
			{...f.props}
			// Text starts 40 px in: the focus diamond and the selected marker live in that gutter.
			// No Tailwind preflight, so the native button look is reset here.
			className={`d-focus relative flex min-h-[max(46px,calc(var(--spacing)*13.5))] w-full cursor-pointer appearance-none items-center border-0 py-1 pr-[16px] pl-[40px] text-left text-list font-bold tracking-list uppercase [font-family:inherit] data-[focused=true]:font-black disabled:cursor-not-allowed disabled:text-text-dim`}
		>
			{selected && !f.focused && (
				<Ornament kind="diamond" size={10} className="absolute left-0.5" />
			)}
			{item.label}
		</button>
	);
}

/**
 * Vertical list of text options, the Style D replacement for stacks of buttons: all caps, no
 * boxes, focus by a gold diamond and band (`d-focus`), rows of at least 46 px, the whole row is
 * the target. Use it inside a `FocusScope`; disabled rows are skipped by keyboard/gamepad focus.
 */
export function MenuList(props: {
	items: readonly MenuListItem[];
	onSelect: (id: string) => void;
	/** The current value of a choice list: fixed gold marker and gold text. */
	selectedId?: string;
	className?: string;
}): ReactElement {
	return (
		<div className={`flex w-full flex-col ${props.className ?? ''}`}>
			{props.items.map((item) => (
				<MenuListItemView
					key={item.id}
					item={item}
					selected={item.id === props.selectedId}
					onSelect={props.onSelect}
				/>
			))}
		</div>
	);
}
