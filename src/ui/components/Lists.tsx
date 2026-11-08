import { type ReactElement, useEffect, useRef } from 'react';
import { getLang, type I18nKey, t } from '../../i18n';
import { formatTime } from '../../logic/format';
import { Btn } from './Btn';
import { MenuScreen } from './MenuScreen';

export interface AchievementsData {
	done: number;
	total: number;
	points: number;
	/** Already sorted for display; names and descriptions come from `ui/achievement-text`. */
	rows: readonly {
		id: string;
		name: string;
		description: string;
		unlocked: boolean;
		/** 0..100, shown while locked. */
		progress: number;
	}[];
}

export interface AchievementsActions {
	extras: () => void;
	back: () => void;
}

/** Page/arrow scrolling for long lists; the list itself has no focusable rows. */
function useListKeys(): React.RefObject<HTMLDivElement | null> {
	const ref = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const onKey = (e: KeyboardEvent): void => {
			const el = ref.current;
			if (!el) return;
			const step = { ArrowUp: -40, ArrowDown: 40, PageUp: -320, PageDown: 320 }[e.code];
			if (step !== undefined) el.scrollBy({ top: step });
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, []);
	return ref;
}

export function Achievements({
	data,
	actions,
}: {
	data: AchievementsData;
	actions: AchievementsActions;
}): ReactElement {
	const list = useListKeys();
	return (
		<MenuScreen title={t('ach.title')} onBack={actions.back}>
			<div className="font-bold text-fish">
				{t('ach.summary', { done: data.done, total: data.total, points: data.points })}
			</div>
			<div ref={list} className="min-h-0 w-full flex-1 space-y-1 overflow-y-auto">
				{data.rows.map((r) => (
					<div key={r.id} className={r.unlocked ? '' : 'opacity-70'}>
						<div className={`font-bold ${r.unlocked ? 'text-crit' : ''}`}>{r.name}</div>
						<div className="text-[0.85em] text-text-dim">
							{r.description}
							{!r.unlocked && `  ·  ${r.progress}%`}
						</div>
					</div>
				))}
			</div>
			<Btn onActivate={actions.extras} className="w-full border-fish text-fish">
				{t('ach.shop')}
			</Btn>
			<Btn onActivate={actions.back} className="w-full border-snow">
				{t('menu.back')}
			</Btn>
		</MenuScreen>
	);
}

export interface ExtrasData {
	points: number;
	/** `cost` is null at max level; `bonus` already formatted. */
	rows: readonly {
		id: string;
		level: number;
		max: number;
		bonus: string;
		cost: number | null;
	}[];
}

export interface ExtrasActions {
	buy: (id: string) => void;
	back: () => void;
}

export function Extras({
	data,
	actions,
}: {
	data: ExtrasData;
	actions: ExtrasActions;
}): ReactElement {
	return (
		<MenuScreen title={t('extras.title')} onBack={actions.back}>
			<div className="text-center font-bold text-fish">
				{t('extras.points', { n: data.points })}
			</div>
			{data.rows.map((r) => (
				<Btn
					key={r.id}
					onActivate={() => actions.buy(r.id)}
					disabled={r.cost === null || data.points < r.cost}
					className="w-full border-snow text-left font-normal"
				>
					{t('extras.row', {
						name: t(`extra.${r.id}` as I18nKey),
						level: r.level,
						max: r.max,
						bonus: r.bonus,
						price:
							r.cost === null
								? t('workshop.maxed')
								: t('extras.price', { n: r.cost }),
					})}
				</Btn>
			))}
			<Btn onActivate={actions.back} className="w-full border-snow">
				{t('menu.back')}
			</Btn>
		</MenuScreen>
	);
}

export interface HistoryData {
	rows: readonly {
		id: string;
		endedAt: number;
		hero: string;
		heroLevel: number;
		round: number;
		kills: number;
		durationSec: number;
		fishEarned: number;
		outcome: string;
	}[];
}

export function History({
	data,
	actions,
}: {
	data: HistoryData;
	actions: { back: () => void };
}): ReactElement {
	const list = useListKeys();
	return (
		<MenuScreen title={t('history.title')} onBack={actions.back} wide>
			<div ref={list} className="min-h-0 w-full flex-1 space-y-1 overflow-y-auto text-center">
				{data.rows.length === 0 && (
					<div className="text-text-dim">{t('history.empty')}</div>
				)}
				{data.rows.map((r) => (
					<div key={r.id} className={r.outcome === 'quit' ? 'text-text-dim' : ''}>
						{t('history.row', {
							date: new Date(r.endedAt).toLocaleString(getLang(), {
								dateStyle: 'short',
								timeStyle: 'short',
							}),
							hero: t(`hero.${r.hero}` as I18nKey),
							level: r.heroLevel,
							round: r.round,
							kills: r.kills.toLocaleString(getLang()),
							time: formatTime(r.durationSec),
							fish: r.fishEarned,
						})}
						{`  (${t(`outcome.${r.outcome}` as I18nKey)})`}
					</div>
				))}
			</div>
			<Btn onActivate={actions.back} className="w-full max-w-[44rem] border-snow">
				{t('menu.back')}
			</Btn>
		</MenuScreen>
	);
}
