import type { ReactElement } from 'react';
import { type I18nKey, t } from '../../i18n';
import { Btn } from './Btn';
import { AdjustRow, BackBtn, MenuScreen } from './MenuScreen';
import { Filet, Hint } from './Panel';

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
	gameSpeed: number;
	/** Opt-in local run data (never sent anywhere). */
	telemetry: boolean;
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
	| 'flashes'
	| 'speed'
	| 'telemetry';

export interface SettingsActions {
	/** Steps one row (cycle, toggle or +/-10% volume); the game persists it. */
	adjust: (row: SettingsRow, dir: -1 | 1) => void;
	controls: () => void;
	exportSave: () => void;
	/** Saves the local run-end events as JSONL. */
	exportTelemetry: () => void;
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
		case 'speed':
			return t('settings.speed', { v: `${d.gameSpeed}x` });
		case 'telemetry':
			return t('settings.telemetry', { v: onOff(d.telemetry) });
	}
}

const GROUPS: readonly { title: I18nKey; rows: readonly SettingsRow[] }[] = [
	{
		title: 'settings.group.video',
		rows: ['language', 'resolution', 'fullscreen', 'bloom', 'shake'],
	},
	{ title: 'settings.group.audio', rows: ['master', 'music', 'sfx'] },
	{
		title: 'settings.group.game',
		rows: ['speed', 'gore', 'numbers', 'numberSize', 'flashes'],
	},
	{ title: 'settings.group.data', rows: ['telemetry'] },
];

export function Settings({
	data,
	actions,
}: {
	data: SettingsData;
	actions: SettingsActions;
}): ReactElement {
	return (
		<MenuScreen
			title={t('settings.title')}
			onBack={actions.back}
			wide
			subtitle={t('settings.subtitle')}
			footer={<BackBtn onBack={actions.back} label={t('menu.back')} />}
		>
			<div className="grid grid-cols-1 gap-x-8 gap-y-3 min-[1100px]:grid-cols-2">
				{GROUPS.map((g) => (
					<div key={g.title} className="flex flex-col gap-2">
						<h3 className="m-0 font-title text-[0.95em] font-bold tracking-wider text-crit uppercase">
							{t(g.title)}
						</h3>
						<Filet />
						{g.rows.map((row) => (
							<AdjustRow
								key={row}
								label={rowLabel(row, data)}
								hint={t(`settings.hint.${row}` as I18nKey)}
								onPrev={() => actions.adjust(row, -1)}
								onNext={() => actions.adjust(row, 1)}
							/>
						))}
						{g.title === 'settings.group.data' && (
							<>
								<div className="flex gap-2">
									<Btn
										onActivate={actions.exportSave}
										className="flex-1 border-snow"
									>
										{t('settings.export')}
									</Btn>
									<Btn
										onActivate={actions.importSave}
										className="flex-1 border-snow"
									>
										{t('settings.import')}
									</Btn>
								</div>
								<Btn onActivate={actions.exportTelemetry} className="border-snow">
									{t('settings.exportTelemetry')}
								</Btn>
								<Btn onActivate={actions.controls} variant="primary">
									{t('settings.controls')}
								</Btn>
								<Hint>{t('settings.hint.data')}</Hint>
							</>
						)}
					</div>
				))}
			</div>
		</MenuScreen>
	);
}
