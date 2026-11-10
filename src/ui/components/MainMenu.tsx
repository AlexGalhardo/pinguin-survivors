import { type ReactElement, useState } from 'react';
import { t } from '../../i18n';
import { useCompact } from '../compact';
import { FocusScope } from '../focus';
import { Btn } from './Btn';
import { MenuBackground } from './MenuBackground';
import { MenuList } from './MenuList';
import { Ornament } from './Ornament';
import { Vignette } from './Vignette';

export interface MainMenuData {
	pearls: number;
	points: number;
	/** Next round of the saved run, or null when there is nothing to continue. */
	continueRound: number | null;
	/** A save slot is loaded: the hero, workshop, history and play entries need one. */
	hasSlot: boolean;
	/** At least one slot has a game: shows "Load game". */
	hasSaves: boolean;
	/** Desktop and mobile shells: shows "Quit" (the web build has nothing to close). */
	canQuit: boolean;
}

export interface MainMenuActions {
	continueRun: () => void;
	play: () => void;
	newGame: () => void;
	load: () => void;
	heroes: () => void;
	workshop: () => void;
	achievements: () => void;
	history: () => void;
	settings: () => void;
	quit: () => void;
}

type Item = { id: string; label: string; run: () => void };

/** Phone landscape shows this many entries per page (the list never scrolls). */
const COMPACT_PAGE = 5;

export function MainMenu({
	data,
	actions,
}: {
	data: MainMenuData;
	actions: MainMenuActions;
}): ReactElement {
	const game: Item[] = [
		...(data.continueRound === null
			? []
			: [
					{
						id: 'continue',
						label: t('menu.continue', { n: data.continueRound }),
						run: actions.continueRun,
					},
				]),
		...(data.hasSlot ? [{ id: 'play', label: t('menu.play'), run: actions.play }] : []),
		{ id: 'newGame', label: t('menu.newGame'), run: actions.newGame },
		...(data.hasSaves ? [{ id: 'load', label: t('menu.load'), run: actions.load }] : []),
	];
	const progression: Item[] = data.hasSlot
		? [
				{ id: 'hero', label: t('menu.hero'), run: actions.heroes },
				{ id: 'workshop', label: t('menu.workshop'), run: actions.workshop },
				{ id: 'achievements', label: t('menu.achievements'), run: actions.achievements },
				{ id: 'history', label: t('menu.history'), run: actions.history },
			]
		: [];
	const system: Item[] = [
		{ id: 'settings', label: t('menu.settings'), run: actions.settings },
		...(data.canQuit ? [{ id: 'quit', label: t('menu.quit'), run: actions.quit }] : []),
	];
	const compact = useCompact();
	const [page, setPage] = useState(0);
	const all = [game, progression, system];
	const count = all.reduce((n, g) => n + g.length, 0);
	const pages = compact ? Math.ceil(count / COMPACT_PAGE) : 1;
	const current = Math.min(page, pages - 1);
	// Compact: cut the flat list into pages, then regroup what falls on this one.
	const lo = current * COMPACT_PAGE;
	let seen = 0;
	const groups = all
		.map((g) => {
			const from = seen;
			seen += g.length;
			return compact ? g.filter((_, i) => from + i >= lo && from + i < lo + COMPACT_PAGE) : g;
		})
		.filter((g) => g.length > 0);
	const run = (id: string): void =>
		all
			.flat()
			.find((i) => i.id === id)
			?.run();
	const step = (d: number): void => setPage((current + d + pages) % pages);

	return (
		<FocusScope className="fixed inset-0 flex items-center overflow-hidden bg-night pl-[7vw] font-body text-body text-text-light">
			<MenuBackground />
			<div className="relative flex w-[min(34rem,80vw)] flex-col gap-3 [@media(max-height:500px)]:gap-1">
				<div className="flex flex-col gap-1">
					<h1 className="m-0 font-title text-display leading-[0.95] font-black tracking-[0.04em] text-gold-bright uppercase [text-shadow:0_2px_12px_var(--color-shadow)] [@media(max-height:500px)]:text-title">
						{t('game.title')}
					</h1>
					<Ornament
						kind="filet"
						size="short"
						className="[@media(max-height:500px)]:hidden"
					/>
					<p className="m-0 text-body text-text-light [@media(max-height:500px)]:hidden">
						{t('menu.tagline')}
					</p>
				</div>
				<div className="flex flex-col gap-3 [@media(max-height:500px)]:gap-1">
					{groups.map((g) => (
						<MenuList
							key={g[0]?.id}
							items={g.map((i) => ({ id: i.id, label: i.label }))}
							onSelect={run}
						/>
					))}
				</div>
				{pages > 1 && (
					<div className="flex items-center gap-2">
						<Btn onActivate={() => step(-1)} label="-" className="pr-0! pl-0!">
							<span className="font-title text-[32px] leading-none text-gold-bright">
								‹
							</span>
						</Btn>
						<span className="text-secondary font-bold tabular-nums text-text-light">
							{current + 1}/{pages}
						</span>
						<Btn onActivate={() => step(1)} label="+" className="pr-0! pl-0!">
							<span className="font-title text-[32px] leading-none text-gold-bright">
								›
							</span>
						</Btn>
					</div>
				)}
				<div className="text-body font-bold text-fish">
					{t('menu.wallet', { pearls: data.pearls, points: data.points })}
				</div>
			</div>
			<Vignette />
		</FocusScope>
	);
}
