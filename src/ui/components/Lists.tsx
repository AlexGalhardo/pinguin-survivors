import { type ReactElement, type ReactNode, useEffect, useRef, useState } from 'react';
import { getLang, type I18nKey, t } from '../../i18n';
import { formatTime } from '../../logic/format';
import { useFocusable } from '../focus';
import { Btn } from './Btn';
import { BackBtn, MenuScreen } from './MenuScreen';
import { Ornament } from './Ornament';
import { Bar, Hint } from './Panel';

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

const SHORT = '(max-height: 500px)';

/** Rows per page: 8 on desktop, 4 on the phone (844x390: 5 rows of 46 px plus pager overflow the panel). */
function usePageSize(): number {
	const [short, setShort] = useState(() => window.matchMedia?.(SHORT).matches ?? false);
	useEffect(() => {
		const onResize = (): void => setShort(window.matchMedia?.(SHORT).matches ?? false);
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, []);
	return short ? 4 : 8;
}

/** Pages a long list: PageUp/PageDown (L1/R1 on the gamepad) jump a page and focus its first row. */
function usePager<T>(rows: readonly T[]): {
	page: number;
	pages: number;
	slice: readonly T[];
	go: (delta: number) => void;
} {
	const size = usePageSize();
	const pages = Math.max(1, Math.ceil(rows.length / size));
	const [raw, setPage] = useState(0);
	const page = Math.min(raw, pages - 1);
	const go = (delta: number): void => setPage(Math.max(0, Math.min(pages - 1, page + delta)));
	const goRef = useRef(go);
	goRef.current = go;
	const first = useRef(true);
	useEffect(() => {
		const onKey = (e: KeyboardEvent): void => {
			if (e.code === 'PageUp') goRef.current(-1);
			else if (e.code === 'PageDown') goRef.current(1);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, []);
	// biome-ignore lint/correctness/useExhaustiveDependencies: refocus when the page changes only
	useEffect(() => {
		if (first.current) {
			first.current = false;
			return;
		}
		const active = document.activeElement;
		if (active instanceof HTMLElement && active.closest('[data-pager]')) return;
		document.querySelector<HTMLElement>('[data-list-row]')?.focus();
	}, [page]);
	return { page, pages, slice: rows.slice(page * size, page * size + size), go };
}

function Pager(props: { page: number; pages: number; go: (d: number) => void }): ReactElement {
	return (
		<div data-pager className="flex items-center justify-center gap-2">
			<Btn
				onActivate={() => props.go(-1)}
				disabled={props.page === 0}
				label={t('list.prev')}
				className="pr-0! pl-0!"
			>
				<span className="text-list leading-none text-gold-bright">‹</span>
			</Btn>
			<span className="text-secondary font-bold tracking-section whitespace-nowrap text-text-light uppercase tabular-nums">
				{t('list.page', { n: props.page + 1, total: props.pages })}
			</span>
			<Btn
				onActivate={() => props.go(1)}
				disabled={props.page >= props.pages - 1}
				label={t('list.next')}
				className="pr-0! pl-0!"
			>
				<span className="text-list leading-none text-gold-bright">›</span>
			</Btn>
		</div>
	);
}

/** Focusable row of a paged list: the focus (or hover) shows its detail. */
function ListRow(props: {
	onFocus: () => void;
	onActivate?: () => void;
	disabled?: boolean;
	className?: string;
	children: ReactNode;
}): ReactElement {
	const f = useFocusable({
		onActivate: props.onActivate ?? (() => {}),
		disabled: props.disabled,
	});
	const focusChanged = useRef(props.onFocus);
	focusChanged.current = props.onFocus;
	useEffect(() => {
		if (f.focused) focusChanged.current();
	}, [f.focused]);
	return (
		<button
			type="button"
			ref={f.ref}
			data-list-row
			disabled={props.disabled}
			onMouseEnter={props.onFocus}
			{...f.props}
			className={`d-focus relative flex min-h-[max(46px,calc(var(--spacing)*13.5))] w-full cursor-pointer appearance-none items-center gap-3 border-0 py-1 pr-[16px] pl-[40px] text-left [font-family:inherit] disabled:cursor-not-allowed ${props.className ?? ''}`}
		>
			{props.children}
		</button>
	);
}

/** List on the left, detail of the focused row on the right (under the list on narrow screens). */
function PagedLayout(props: {
	list: ReactNode;
	detail: ReactNode;
	pager: ReactNode;
}): ReactElement {
	return (
		<div className="flex min-h-0 w-full flex-1 flex-col gap-2 min-[1000px]:flex-row min-[1000px]:gap-6 [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:gap-3">
			<div className="flex min-h-0 flex-1 flex-col gap-1 min-[1000px]:flex-[3] [@media(max-height:500px)]:flex-[3]">
				<div className="flex flex-col">{props.list}</div>
				{props.pager}
			</div>
			<div className="flex flex-col gap-2 min-[1000px]:flex-[2] min-[1000px]:pt-2 [@media(max-height:500px)]:flex-[2]">
				{props.detail}
			</div>
		</div>
	);
}

export function Achievements({
	data,
	actions,
}: {
	data: AchievementsData;
	actions: AchievementsActions;
}): ReactElement {
	const { page, pages, slice, go } = usePager(data.rows);
	const [focusId, setFocusId] = useState('');
	const cur = slice.find((r) => r.id === focusId) ?? slice[0];
	return (
		<MenuScreen
			title={t('ach.title')}
			onBack={actions.back}
			wide
			subtitle={t('ach.hint')}
			footer={
				<>
					<Btn onActivate={actions.extras} variant="primary">
						{t('ach.shop')}
					</Btn>
					<BackBtn onBack={actions.back} label={t('menu.back')} />
				</>
			}
		>
			<div className="text-secondary font-bold text-gold-bright tabular-nums">
				{t('ach.summary', { done: data.done, total: data.total, points: data.points })}
			</div>
			<Bar
				percent={data.total > 0 ? (data.done / data.total) * 100 : 0}
				tone="bg-gold-bright"
			/>
			<PagedLayout
				list={slice.map((r) => (
					<ListRow
						key={r.id}
						onFocus={() => setFocusId(r.id)}
						className={`text-list font-bold tracking-list uppercase ${r.unlocked ? 'text-gold-bright' : 'text-text-light'}`}
					>
						<span className="min-w-0 flex-1 truncate">{r.name}</span>
						<span className="text-secondary tracking-section whitespace-nowrap tabular-nums">
							{r.unlocked ? `◆ ${t('list.done')}` : `${r.progress}%`}
						</span>
					</ListRow>
				))}
				detail={
					cur && (
						<>
							<div className="flex items-center gap-3 [@media(max-height:500px)]:hidden">
								<Ornament kind="diamond" size={32} />
								<div
									className={`font-title text-item leading-tight font-bold ${cur.unlocked ? 'text-gold-bright' : 'text-text-light'}`}
								>
									{cur.name}
								</div>
							</div>
							<Hint>{cur.description}</Hint>
							{!cur.unlocked && <Bar percent={cur.progress} tone="bg-gold-bright" />}
						</>
					)
				}
				pager={<Pager page={page} pages={pages} go={go} />}
			/>
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

const pips = (level: number, max: number): string =>
	max > 8 ? `${level}/${max}` : '●'.repeat(level) + '○'.repeat(max - level);

export function Extras({
	data,
	actions,
}: {
	data: ExtrasData;
	actions: ExtrasActions;
}): ReactElement {
	const { page, pages, slice, go } = usePager(data.rows);
	const [focusId, setFocusId] = useState('');
	const cur = slice.find((r) => r.id === focusId) ?? slice[0];
	const canBuy = (r: ExtrasData['rows'][number]): boolean =>
		r.cost !== null && data.points >= r.cost;
	const price = (r: ExtrasData['rows'][number]): string =>
		r.cost === null ? t('workshop.maxed') : t('extras.price', { n: r.cost });
	return (
		<MenuScreen
			title={t('extras.title')}
			onBack={actions.back}
			wide
			subtitle={t('extras.desc')}
			footer={<BackBtn onBack={actions.back} label={t('menu.back')} />}
		>
			<div className="text-secondary font-bold text-gold-bright tabular-nums">
				{t('extras.points', { n: data.points })}
			</div>
			<PagedLayout
				list={slice.map((r) => (
					<ListRow
						key={r.id}
						onFocus={() => setFocusId(r.id)}
						onActivate={() => canBuy(r) && actions.buy(r.id)}
						className={`text-list font-bold tracking-list uppercase ${canBuy(r) ? 'text-text-light' : 'text-text-dim'}`}
					>
						<span className="min-w-0 flex-1 truncate">
							{t(`extra.${r.id}` as I18nKey)}
						</span>
						<span className="text-secondary tracking-section whitespace-nowrap text-gold-bright">
							{pips(r.level, r.max)}
						</span>
					</ListRow>
				))}
				detail={
					cur && (
						<>
							<div className="font-title text-item leading-tight font-bold text-gold-bright [@media(max-height:500px)]:hidden">
								{t(`extra.${cur.id}` as I18nKey)}
							</div>
							<div className="text-body font-bold text-xp tabular-nums">
								{cur.bonus}
							</div>
							<Btn
								onActivate={() => actions.buy(cur.id)}
								disabled={!canBuy(cur)}
								variant="primary"
							>
								{price(cur)}
							</Btn>
						</>
					)
				}
				pager={<Pager page={page} pages={pages} go={go} />}
			/>
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

type HistoryRow = HistoryData['rows'][number];

const SEAL: Record<string, { glyph: string; tone: string }> = {
	death: { glyph: '☠', tone: 'text-blood' },
	bossTimeout: { glyph: '⌛', tone: 'text-fish' },
	quit: { glyph: '–', tone: 'text-text-dim' },
};

const when = (r: HistoryRow): string =>
	new Date(r.endedAt).toLocaleString(getLang(), { dateStyle: 'short', timeStyle: 'short' });

export function History({
	data,
	actions,
}: {
	data: HistoryData;
	actions: { back: () => void };
}): ReactElement {
	const { page, pages, slice, go } = usePager(data.rows);
	const [focusId, setFocusId] = useState('');
	const cur = slice.find((r) => r.id === focusId) ?? slice[0];
	return (
		<MenuScreen
			title={t('history.title')}
			onBack={actions.back}
			wide
			subtitle={t('history.hint')}
			footer={<BackBtn onBack={actions.back} label={t('menu.back')} />}
		>
			{data.rows.length === 0 ? (
				<div className="py-6 text-center text-text-light">{t('history.empty')}</div>
			) : (
				<div className="flex min-h-0 w-full flex-1 flex-col gap-1">
					<div className="flex flex-col">
						{slice.map((r) => {
							const seal = SEAL[r.outcome] ?? {
								glyph: '◆',
								tone: 'text-gold-bright',
							};
							return (
								<ListRow
									key={r.id}
									onFocus={() => setFocusId(r.id)}
									className={`text-body ${r.outcome === 'quit' ? 'text-text-dim' : 'text-text-light'}`}
								>
									<span className="whitespace-nowrap tabular-nums">
										{when(r)}
									</span>
									<span className="min-w-0 flex-1 truncate font-bold uppercase">
										{t(`hero.${r.hero}` as I18nKey)} ·{' '}
										{t('select.level', { n: r.heroLevel })}
									</span>
									<span className="font-title font-bold whitespace-nowrap tabular-nums">
										{t('hud.round', { n: r.round })}
									</span>
									<span
										title={t(`outcome.${r.outcome}` as I18nKey)}
										className={`max-w-[14em] shrink-0 truncate text-right font-black uppercase ${seal.tone}`}
									>
										{seal.glyph} {t(`outcome.${r.outcome}` as I18nKey)}
									</span>
								</ListRow>
							);
						})}
					</div>
					<Pager page={page} pages={pages} go={go} />
					{cur && (
						<Hint>
							{t('history.row', {
								date: when(cur),
								hero: t(`hero.${cur.hero}` as I18nKey),
								level: cur.heroLevel,
								round: cur.round,
								kills: cur.kills.toLocaleString(getLang()),
								time: formatTime(cur.durationSec),
								fish: cur.fishEarned,
							})}
							{`  (${t(`outcome.${cur.outcome}` as I18nKey)})`}
						</Hint>
					)}
				</div>
			)}
		</MenuScreen>
	);
}
