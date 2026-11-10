import { type ReactElement, useEffect, useSyncExternalStore } from 'react';
import { dismissToast, MAX_VISIBLE_TOASTS, type ToastItem, toastStore } from '../toast';
import { Ornament } from './Ornament';

function ToastView({ toast }: { toast: ToastItem }): ReactElement {
	useEffect(() => {
		const timer = setTimeout(() => dismissToast(toast.id), toast.ms);
		return () => clearTimeout(timer);
	}, [toast.id, toast.ms]);
	return (
		<div className="flex min-h-14 items-center gap-3 bg-night px-4 text-body font-bold text-text-light shadow-1">
			<Ornament kind="diamond" size={10} />
			{toast.message}
		</div>
	);
}

/** Stacked top-center notifications; announced by screen readers (aria-live). */
export function ToastHost(): ReactElement {
	const queue = useSyncExternalStore(toastStore.subscribe, () => toastStore.get().queue);
	return (
		<div
			aria-live="polite"
			role="status"
			className="pointer-events-none fixed top-[6vh] left-1/2 flex -translate-x-1/2 flex-col gap-2"
		>
			{queue.slice(0, MAX_VISIBLE_TOASTS).map((toast) => (
				<ToastView key={toast.id} toast={toast} />
			))}
		</div>
	);
}
