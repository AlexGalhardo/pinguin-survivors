import { type ReactElement, useState } from 'react';
import { type I18nKey, t } from '../../i18n';
import { useCompact } from '../compact';
import { Btn } from './Btn';
import { MenuList } from './MenuList';
import { BackBtn, MenuScreen } from './MenuScreen';
import { Hint } from './Panel';

export interface ControlsData {
	rows: readonly { action: string; keyLabel: string }[];
	/** Action waiting for the next key press, if any. */
	waiting: string | null;
}

export interface ControlsActions {
	/** Starts waiting for a key for this action; the game captures the key and rebinds. */
	rebind: (action: string) => void;
	reset: () => void;
	back: () => void;
}

/** Rows per page on the phone (the list never scrolls). */
const COMPACT_PAGE = 4;

export function Controls({
	data,
	actions,
}: {
	data: ControlsData;
	actions: ControlsActions;
}): ReactElement {
	const compact = useCompact();
	const [page, setPage] = useState(0);
	const pages = compact ? Math.ceil(data.rows.length / COMPACT_PAGE) : 1;
	const current = Math.min(page, pages - 1);
	const rows = compact
		? data.rows.slice(current * COMPACT_PAGE, (current + 1) * COMPACT_PAGE)
		: data.rows;
	return (
		<MenuScreen
			title={t('controls.title')}
			onBack={() => {
				if (!data.waiting) actions.back();
			}}
			subtitle={t('controls.hint')}
			footer={
				<>
					<Btn onActivate={actions.reset} variant="primary">
						{t('controls.reset')}
					</Btn>
					<BackBtn
						onBack={actions.back}
						disabled={data.waiting !== null}
						label={t('menu.back')}
					/>
				</>
			}
		>
			<MenuList
				className="mx-auto max-w-[40rem]"
				selectedId={data.waiting ?? undefined}
				onSelect={actions.rebind}
				items={rows.map((r) => ({
					id: r.action,
					label: t('controls.row', {
						action: t(`action.${r.action}` as I18nKey),
						key: data.waiting === r.action ? t('controls.press') : r.keyLabel,
					}),
				}))}
			/>
			<div className="mt-auto flex items-center gap-2">
				<div className="flex-1">
					<Hint>{t('controls.pad')}</Hint>
				</div>
				{pages > 1 && (
					<>
						<Btn
							onActivate={() => setPage((current + pages - 1) % pages)}
							className="pr-0! pl-0!"
						>
							<span className="font-title text-[32px] leading-none text-gold-bright">
								‹
							</span>
						</Btn>
						<span className="text-secondary font-bold tabular-nums">
							{current + 1}/{pages}
						</span>
						<Btn
							onActivate={() => setPage((current + 1) % pages)}
							className="pr-0! pl-0!"
						>
							<span className="font-title text-[32px] leading-none text-gold-bright">
								›
							</span>
						</Btn>
					</>
				)}
			</div>
		</MenuScreen>
	);
}
