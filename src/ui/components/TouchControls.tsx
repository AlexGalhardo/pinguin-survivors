import {
	type CSSProperties,
	type PointerEvent,
	type ReactElement,
	useRef,
	useState,
	useSyncExternalStore,
} from 'react';
import { platform } from '../../core/platform';
import {
	fireTouchAction,
	stickVector,
	touchControlsEnabled,
	touchMove,
} from '../../core/touch-bridge';
import { t } from '../../i18n';
import { hudStore } from '../hud-bridge';
import { useOverlayOpen } from '../overlay';

/** Stick travel in px; the thumb never leaves this circle. */
const RADIUS = 52;

/** Safe-area padding keeps the controls clear of the notch and the gesture bar (landscape phones). */
const SAFE_LEFT = 'max(1.25rem, env(safe-area-inset-left))';
const SAFE_RIGHT = 'max(1.25rem, env(safe-area-inset-right))';
const SAFE_BOTTOM = 'max(1.25rem, env(safe-area-inset-bottom))';

function Stick(): ReactElement {
	const origin = useRef<{ id: number; x: number; y: number } | null>(null);
	const [thumb, setThumb] = useState({ x: 0, y: 0 });
	const set = (x: number, y: number) => {
		touchMove.x = x;
		touchMove.y = y;
		setThumb({ x: x * RADIUS, y: y * RADIUS });
	};
	const down = (e: PointerEvent<HTMLDivElement>) => {
		if (origin.current) return;
		e.currentTarget.setPointerCapture(e.pointerId);
		const r = e.currentTarget.getBoundingClientRect();
		origin.current = { id: e.pointerId, x: r.left + r.width / 2, y: r.top + r.height / 2 };
		move(e);
	};
	const move = (e: PointerEvent<HTMLDivElement>) => {
		const o = origin.current;
		if (!o || o.id !== e.pointerId) return;
		const v = stickVector(e.clientX - o.x, e.clientY - o.y, RADIUS);
		set(v.x, v.y);
	};
	const up = (e: PointerEvent<HTMLDivElement>) => {
		if (origin.current?.id !== e.pointerId) return;
		origin.current = null;
		set(0, 0);
	};
	return (
		<div
			role="application"
			aria-label={t('touch.stick')}
			data-touch="stick"
			className="pointer-events-auto absolute size-36 touch-none select-none rounded-full border-2 border-snow/60 bg-night/40"
			style={{ left: SAFE_LEFT, bottom: SAFE_BOTTOM }}
			onPointerDown={down}
			onPointerMove={move}
			onPointerUp={up}
			onPointerCancel={up}
		>
			<div
				className="absolute left-1/2 top-1/2 size-14 rounded-full border-2 border-snow bg-snow/50"
				style={{
					transform: `translate(calc(-50% + ${thumb.x}px), calc(-50% + ${thumb.y}px))`,
				}}
			/>
		</div>
	);
}

function ActionButton(props: {
	action: 'super' | 'speed' | 'pause';
	label: string;
	glyph: string;
	className: string;
	disabled?: boolean;
	style?: CSSProperties;
}): ReactElement {
	return (
		<button
			type="button"
			aria-label={props.label}
			data-touch={props.action}
			disabled={props.disabled}
			style={props.style}
			className={`pointer-events-auto touch-none select-none rounded-full border-2 border-snow/70 bg-night/60 font-bold [font-family:inherit] disabled:opacity-40 ${props.className}`}
			onPointerDown={(e) => {
				e.preventDefault();
				fireTouchAction(props.action);
			}}
		>
			{props.glyph}
		</button>
	);
}

/** Joystick plus superpower, speed and pause buttons while a run is on (Android shell or `?touch=1`). */
export function TouchControls(): ReactElement | null {
	const hud = useSyncExternalStore(hudStore.subscribe, () => hudStore.get().hud);
	const covered = useOverlayOpen();
	if (!hud || covered || !touchControlsEnabled(platform().kind, window.location.search))
		return null;
	const ready = hud.superpower !== null && hud.superpower.charge >= hud.superpower.cost;
	return (
		<div className="pointer-events-none absolute inset-0">
			<Stick />
			<div
				className="absolute flex items-end gap-3"
				style={{ right: SAFE_RIGHT, bottom: SAFE_BOTTOM }}
			>
				<ActionButton
					action="speed"
					label={t('touch.speed')}
					glyph={hud.speed > 1 ? `${hud.speed}x` : '1x'}
					className="size-12 text-sm"
				/>
				<ActionButton
					action="super"
					label={t('touch.super')}
					glyph="★"
					className={`size-20 text-3xl ${ready ? 'bg-crit/70' : ''}`}
					disabled={hud.superpower === null}
				/>
			</div>
			<ActionButton
				action="pause"
				label={t('touch.pause')}
				glyph="II"
				className="absolute size-11 text-sm"
				style={{ right: SAFE_RIGHT, top: 'max(0.75rem, env(safe-area-inset-top))' }}
			/>
		</div>
	);
}
