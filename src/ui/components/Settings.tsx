import { type ReactElement, type ReactNode, useState } from 'react';
import { type I18nKey, t } from '../../i18n';
import { useCompact } from '../compact';
import { Btn } from './Btn';
import { AdjustRow, BackBtn, MenuScreen } from './MenuScreen';
import { Hint } from './Panel';

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

/** Entries per page on the phone (the list never scrolls). */
const COMPACT_PAGE = 4;

interface Entry {
	id: string;
	node: ReactNode;
	/** What the single hint line under the list says while this entry is focused. */
	hint: I18nKey;
}

/** Settings in tabs (one per group) with a single hint line for the focused option. */
export function Settings({
	data,
	actions,
}: {
	data: SettingsData;
	actions: SettingsActions;
}): ReactElement {
	const [tab, setTab] = useState(0);
	const [page, setPage] = useState(0);
	const [hint, setHint] = useState<I18nKey | null>(null);
	const compact = useCompact();
	const group = GROUPS[tab] ?? GROUPS[0];
	const isData = group?.title === 'settings.group.data';

	const action = (id: string, label: I18nKey, run: () => void, primary?: boolean): Entry => ({
		id,
		hint: 'settings.hint.data',
		node: (
			<Btn
				onActivate={run}
				variant={primary ? 'primary' : 'secondary'}
				className="w-full justify-start"
			>
				{t(label)}
			</Btn>
		),
	});
	const entries: Entry[] = [
		...(group?.rows ?? []).map(
			(row): Entry => ({
				id: row,
				hint: `settings.hint.${row}` as I18nKey,
				node: (
					<AdjustRow
						label={rowLabel(row, data)}
						onPrev={() => actions.adjust(row, -1)}
						onNext={() => actions.adjust(row, 1)}
					/>
				),
			}),
		),
		...(isData
			? [
					action('export', 'settings.export', actions.exportSave),
					action('import', 'settings.import', actions.importSave),
					action('telemetry', 'settings.exportTelemetry', actions.exportTelemetry),
					action('controls', 'settings.controls', actions.controls, true),
				]
			: []),
	];
	const pages = compact ? Math.ceil(entries.length / COMPACT_PAGE) : 1;
	const current = Math.min(page, pages - 1);
	const shown = compact
		? entries.slice(current * COMPACT_PAGE, (current + 1) * COMPACT_PAGE)
		: entries;
	const pickTab = (n: number): void => {
		setTab(n);
		setPage(0);
		setHint(null);
	};

	return (
		<MenuScreen
			title={t('settings.title')}
			onBack={actions.back}
			wide
			footer={<BackBtn onBack={actions.back} label={t('menu.back')} />}
		>
			<div className="flex flex-wrap justify-center gap-x-8">
				{GROUPS.map((g, n) => (
					<Btn key={g.title} onActivate={() => pickTab(n)} className="pr-2!">
						<span
							className={`font-title text-item font-bold tracking-wide ${n === tab ? 'text-gold-bright' : ''}`}
						>
							{t(g.title)}
						</span>
					</Btn>
				))}
			</div>
			<div className="mx-auto flex w-full max-w-[56rem] flex-col gap-1">
				{shown.map((e) => (
					<fieldset
						className="m-0 min-w-0 border-0 p-0"
						key={e.id}
						onFocusCapture={() => setHint(e.hint)}
						onMouseEnter={() => setHint(e.hint)}
					>
						{e.node}
					</fieldset>
				))}
			</div>
			<div className="mx-auto mt-auto flex w-full max-w-[56rem] items-center gap-2">
				<div className="min-h-[2lh] flex-1">
					<Hint>{t(hint ?? shown[0]?.hint ?? 'settings.subtitle')}</Hint>
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
