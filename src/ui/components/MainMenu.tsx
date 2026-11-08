import type { ReactElement } from 'react';
import { t } from '../../i18n';
import { FocusScope } from '../focus';
import { Btn } from './Btn';
import { MenuBackground } from './MenuBackground';

export interface MainMenuData {
	pearls: number;
	points: number;
	/** Next round of the saved run, or null when there is nothing to continue. */
	continueRound: number | null;
	/** Desktop and mobile shells: shows "Quit" (the web build has nothing to close). */
	canQuit: boolean;
}

export interface MainMenuActions {
	continueRun: () => void;
	play: () => void;
	heroes: () => void;
	workshop: () => void;
	achievements: () => void;
	history: () => void;
	settings: () => void;
	quit: () => void;
}

export function MainMenu({
	data,
	actions,
}: {
	data: MainMenuData;
	actions: MainMenuActions;
}): ReactElement {
	const items: { id: string; label: string; run: () => void }[] = [
		...(data.continueRound === null
			? []
			: [
					{
						id: 'continue',
						label: t('menu.continue', { n: data.continueRound }),
						run: actions.continueRun,
					},
				]),
		{ id: 'play', label: t('menu.play'), run: actions.play },
		{ id: 'hero', label: t('menu.hero'), run: actions.heroes },
		{ id: 'workshop', label: t('menu.workshop'), run: actions.workshop },
		{ id: 'achievements', label: t('menu.achievements'), run: actions.achievements },
		{ id: 'history', label: t('menu.history'), run: actions.history },
		{ id: 'settings', label: t('menu.settings'), run: actions.settings },
		...(data.canQuit ? [{ id: 'quit', label: t('menu.quit'), run: actions.quit }] : []),
	];
	return (
		<FocusScope className="fixed inset-0 flex items-center bg-night pl-[8vw] font-body text-[clamp(0.9rem,2vh,1.25rem)] text-text-light">
			<MenuBackground />
			<div className="relative flex w-[min(24rem,80vw)] flex-col gap-2 rounded border border-snow-dark bg-night/80 p-4 [@media(max-height:500px)]:w-[min(32rem,70vw)] [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:p-2">
				<h1 className="text-center font-title text-[2.2em] leading-none font-bold [@media(max-height:500px)]:text-[1.4em]">
					{t('game.title')}
				</h1>
				<div className="flex flex-col gap-2 [@media(max-height:500px)]:grid [@media(max-height:500px)]:grid-cols-2 [@media(max-height:500px)]:gap-1">
					{items.map((i) => (
						<Btn key={i.id} onActivate={i.run} className="border-snow text-left">
							{i.label}
						</Btn>
					))}
				</div>
				<div className="text-center text-[0.8em] text-fish">
					{t('menu.wallet', { pearls: data.pearls, points: data.points })}
				</div>
			</div>
		</FocusScope>
	);
}
