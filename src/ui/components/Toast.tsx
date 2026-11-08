import { type ReactElement, useEffect, useSyncExternalStore } from 'react';
import { dismissToast, MAX_VISIBLE_TOASTS, type ToastItem, toastStore } from '../toast';

function ToastView({ toast }: { toast: ToastItem }): ReactElement {
	useEffect(() => {
		const timer = setTimeout(() => dismissToast(toast.id), toast.ms);
		return () => clearTimeout(timer);
	}, [toast.id, toast.ms]);
	return (
		<div className="rounded border border-ice bg-night/90 px-4 py-2 text-[clamp(0.875rem,1.4vh,1.125rem)] text-text-light shadow-lg">
			{toast.message}
		</div>
	);
}

/** Stacked top-right notifications; announced by screen readers (aria-live). */
export function ToastHost(): ReactElement {
	const queue = useSyncExternalStore(toastStore.subscribe, () => toastStore.get().queue);
	return (
		<div
			aria-live="polite"
			role="status"
			className="pointer-events-none fixed top-[6vh] right-4 flex flex-col gap-2"
		>
			{queue.slice(0, MAX_VISIBLE_TOASTS).map((toast) => (
				<ToastView key={toast.id} toast={toast} />
			))}
		</div>
	);
}
