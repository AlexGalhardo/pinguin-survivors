import type { ReactElement } from 'react';
import { type I18nKey, t } from '../../i18n';
import { Btn } from './Btn';
import { AdjustRow, MenuScreen } from './MenuScreen';

export interface SettingsData {
	lang: string;
	resolution: string;
	fullscreen: boolean;
	/** Volumes 0..1. */
	master: number;
	music: number;
	sfx: number;
	gore: string;
	screenShake: boolean;
	bloom: boolean;
	damageNumbers: boolean;
	numberSize: string;
	reducedFlashes: boolean;
}

export type SettingsRow =
	| 'language'
	| 'resolution'
	| 'fullscreen'
	| 'master'
	| 'music'
	| 'sfx'
	| 'gore'
	| 'shake'
	| 'bloom'
	| 'numbers'
	| 'numberSize'
	| 'flashes';

export interface SettingsActions {
	/** Steps one row (cycle, toggle or +/-10% volume); the game persists it. */
	adjust: (row: SettingsRow, dir: -1 | 1) => void;
	controls: () => void;
	exportSave: () => void;
	importSave: () => void;
	back: () => void;
}

const pct = (v: number): string => `${Math.round(v * 100)}%`;

function rowLabel(row: SettingsRow, d: SettingsData): string {
	const onOff = (v: boolean): string => t(v ? 'on' : 'off');
	switch (row) {
		case 'language':
			return t('settings.language', { v: t(`lang.${d.lang}` as I18nKey) });
		case 'resolution':
			return t('settings.resolution', { v: t(`res.${d.resolution}` as I18nKey) });
		case 'fullscreen':
			return t('settings.fullscreen', { v: onOff(d.fullscreen) });
		case 'master':
			return t('settings.master', { v: pct(d.master) });
		case 'music':
			return t('settings.music', { v: pct(d.music) });
		case 'sfx':
			return t('settings.sfx', { v: pct(d.sfx) });
		case 'gore':
			return t('settings.gore', { v: t(`gore.${d.gore}` as I18nKey) });
		case 'shake':
			return t('settings.shake', { v: onOff(d.screenShake) });
		case 'bloom':
			return t('settings.bloom', { v: onOff(d.bloom) });
		case 'numbers':
			return t('settings.numbers', { v: onOff(d.damageNumbers) });
		case 'numberSize':
			return t('settings.numberSize', { v: t(`size.${d.numberSize}` as I18nKey) });
		case 'flashes':
			return t('settings.reducedFlashes', { v: onOff(d.reducedFlashes) });
	}
}

const ROWS: readonly SettingsRow[] = [
	'language',
	'resolution',
	'fullscreen',
	'master',
	'music',
	'sfx',
	'gore',
	'shake',
	'bloom',
	'numbers',
	'numberSize',
	'flashes',
];

export function Settings({
	data,
	actions,
}: {
	data: SettingsData;
	actions: SettingsActions;
}): ReactElement {
	return (
		<MenuScreen title={t('settings.title')} onBack={actions.back}>
			{ROWS.map((row) => (
				<AdjustRow
					key={row}
					label={rowLabel(row, data)}
					onPrev={() => actions.adjust(row, -1)}
					onNext={() => actions.adjust(row, 1)}
				/>
			))}
			<Btn onActivate={actions.controls} className="w-full border-ice text-ice">
				{t('settings.controls')}
			</Btn>
			<div className="flex w-full gap-2">
				<Btn onActivate={actions.exportSave} className="flex-1 border-snow">
					{t('settings.export')}
				</Btn>
				<Btn onActivate={actions.importSave} className="flex-1 border-snow">
					{t('settings.import')}
				</Btn>
			</div>
			<Btn onActivate={actions.back} className="w-full border-snow">
				{t('menu.back')}
			</Btn>
		</MenuScreen>
	);
}
