import {
	createContext,
	type HTMLAttributes,
	type ReactElement,
	type ReactNode,
	type RefCallback,
	useCallback,
	useContext,
	useEffect,
	useId,
	useRef,
	useState,
} from 'react';
import { type FocusDir, nextFocus } from './focus-nav';
import { uiSound } from './ui-sound';

/**
 * Keyboard, gamepad and touch focus for the overlay. The gamepad bridge (core/gamepad) already
 * turns pad buttons into window key events, so arrows/Enter/Esc cover both; touch and mouse
 * go through the click handler. Only the innermost mounted scope reacts (modal stacking).
 */
interface Entry {
	el: HTMLElement;
	activate: () => void;
	disabled: boolean;
}

interface Scope {
	register: (entry: Entry) => () => void;
}

const ScopeContext = createContext<Scope | null>(null);
const scopeStack: string[] = [];

const ARROWS: Record<string, FocusDir> = {
	ArrowUp: 'up',
	ArrowDown: 'down',
	ArrowLeft: 'left',
	ArrowRight: 'right',
};

const rectOf = (el: HTMLElement): { x: number; y: number; w: number; h: number } => {
	const r = el.getBoundingClientRect();
	return { x: r.x, y: r.y, w: r.width, h: r.height };
};

export function FocusScope(props: {
	onBack?: () => void;
	children: ReactNode;
	className?: string;
}): ReactElement {
	const id = useId();
	const entries = useRef<Entry[]>([]);
	const onBack = useRef(props.onBack);
	onBack.current = props.onBack;

	const [scope] = useState<Scope>(() => ({
		register: (entry) => {
			entries.current.push(entry);
			return () => {
				entries.current = entries.current.filter((e) => e !== entry);
			};
		},
	}));

	useEffect(() => {
		scopeStack.push(id);
		const focusable = (): Entry[] => entries.current.filter((e) => !e.disabled);
		if (!focusable().some((e) => e.el === document.activeElement)) focusable()[0]?.el.focus();

		const onKey = (ev: KeyboardEvent): void => {
			if (scopeStack[scopeStack.length - 1] !== id) return;
			const list = focusable();
			const dir = ARROWS[ev.code];
			if (dir) {
				ev.preventDefault();
				const cur = list.findIndex((e) => e.el === document.activeElement);
				const next = nextFocus(
					list.map((e) => rectOf(e.el)),
					cur,
					dir,
				);
				list[next]?.el.focus();
			} else if (ev.code === 'Enter' || ev.code === 'Space') {
				const cur = list.find((e) => e.el === document.activeElement);
				if (cur) {
					ev.preventDefault();
					cur.activate();
				}
			} else if (ev.code === 'Escape' && onBack.current) {
				ev.preventDefault();
				uiSound('sfx.uiBack');
				onBack.current();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => {
			window.removeEventListener('keydown', onKey);
			const i = scopeStack.lastIndexOf(id);
			if (i >= 0) scopeStack.splice(i, 1);
		};
	}, [id]);

	return (
		<ScopeContext.Provider value={scope}>
			<div className={`pointer-events-auto ${props.className ?? ''}`}>{props.children}</div>
		</ScopeContext.Provider>
	);
}

export interface Focusable {
	ref: RefCallback<HTMLElement>;
	focused: boolean;
	/** Spread on the element: tab order, click/touch activation, hover focus, focus tracking. */
	props: HTMLAttributes<HTMLElement> & { 'data-focused': boolean; 'aria-disabled': boolean };
}

export function useFocusable(opts: { onActivate: () => void; disabled?: boolean }): Focusable {
	const scope = useContext(ScopeContext);
	const [focused, setFocused] = useState(false);
	const activate = useRef(opts.onActivate);
	activate.current = opts.onActivate;
	const disabled = opts.disabled ?? false;
	const disabledRef = useRef(disabled);
	disabledRef.current = disabled;

	// Registered from the ref callback so children are known before the scope's mount effect
	// picks the initial focus; React 19 runs the returned cleanup on unmount.
	const ref = useCallback<RefCallback<HTMLElement>>(
		(el) => {
			if (!scope || !el) return;
			return scope.register({
				el,
				activate: () => {
					uiSound('sfx.uiConfirm');
					activate.current();
				},
				get disabled() {
					return disabledRef.current;
				},
			});
		},
		[scope],
	);
	return {
		ref,
		focused,
		props: {
			tabIndex: disabled ? -1 : 0,
			onClick: () => {
				if (!disabledRef.current) {
					uiSound('sfx.uiConfirm');
					activate.current();
				}
			},
			onMouseEnter: (e) => {
				if (disabledRef.current) return;
				if (document.activeElement !== e.currentTarget) uiSound('sfx.uiHover');
				e.currentTarget.focus();
			},
			onFocus: () => setFocused(true),
			onBlur: () => setFocused(false),
			'data-focused': focused,
			'aria-disabled': disabled,
		},
	};
}
