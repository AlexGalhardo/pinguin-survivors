import type { ReactElement } from 'react';
import { type I18nKey, t } from '../../i18n';
import { Btn } from './Btn';
import { MenuScreen } from './MenuScreen';

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

export function Controls({
	data,
	actions,
}: {
	data: ControlsData;
	actions: ControlsActions;
}): ReactElement {
	return (
		<MenuScreen
			title={t('controls.title')}
			onBack={() => {
				if (!data.waiting) actions.back();
			}}
		>
			{data.rows.map((r) => (
				<Btn
					key={r.action}
					onActivate={() => actions.rebind(r.action)}
					className="w-full border-snow text-left font-normal"
				>
					{t('controls.row', {
						action: t(`action.${r.action}` as I18nKey),
						key: data.waiting === r.action ? t('controls.press') : r.keyLabel,
					})}
				</Btn>
			))}
			<Btn onActivate={actions.reset} className="w-full border-ice text-ice">
				{t('controls.reset')}
			</Btn>
			<Btn
				onActivate={actions.back}
				disabled={data.waiting !== null}
				className="w-full border-snow"
			>
				{t('menu.back')}
			</Btn>
			<p className="text-center text-[0.8em] text-text-dim">{t('controls.hint')}</p>
			<p className="text-center text-[0.8em] text-text-dim">{t('controls.pad')}</p>
		</MenuScreen>
	);
}
