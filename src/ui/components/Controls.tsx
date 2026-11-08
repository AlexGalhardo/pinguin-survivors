import type { ReactElement } from 'react';
import { type I18nKey, t } from '../../i18n';
import { Btn } from './Btn';
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
			<div className="grid grid-cols-1 gap-2 min-[1000px]:grid-cols-2">
				{data.rows.map((r) => (
					<Btn
						key={r.action}
						onActivate={() => actions.rebind(r.action)}
						className={`w-full text-left font-normal ${data.waiting === r.action ? 'border-crit text-crit' : 'border-snow'}`}
					>
						{t('controls.row', {
							action: t(`action.${r.action}` as I18nKey),
							key: data.waiting === r.action ? t('controls.press') : r.keyLabel,
						})}
					</Btn>
				))}
			</div>
			<Hint>{t('controls.pad')}</Hint>
		</MenuScreen>
	);
}
