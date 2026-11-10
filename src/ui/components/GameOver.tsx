import type { ReactElement } from 'react';
import { t } from '../../i18n';
import { formatTime } from '../../logic/format';
import { FocusScope } from '../focus';
import { useInputGrace } from '../input-grace';
import { Btn } from './Btn';
import { Ornament } from './Ornament';
import { Vignette } from './Vignette';

export interface GameOverData {
	/** The boss round ended by timeout instead of the hero dying. */
	bossTimeout: boolean;
	round: number;
	kills: number;
	seconds: number;
	damage: number;
	xp: number;
	fish: number;
	pearls: number;
	levels: number;
	newBest: boolean;
}

export interface GameOverActions {
	playAgain: () => void;
	menu: () => void;
}

/** Run summary shown on death or boss timeout: centered text over the vignette, no box. Inputs wait for the grace window. */
export function GameOver({
	data,
	actions,
}: {
	data: GameOverData;
	actions: GameOverActions;
}): ReactElement {
	const guard = useInputGrace();
	return (
		<FocusScope
			onBack={guard(actions.menu)}
			className="fixed inset-0 flex flex-col items-center justify-center gap-[2vh] bg-night/90 font-body text-body text-text-light [@media(max-height:500px)]:gap-1"
		>
			<h1
				className={`m-0 text-center font-title text-display leading-[1.4] font-black tracking-title uppercase [@media(max-height:500px)]:text-title ${data.bossTimeout ? 'text-gold-bright' : 'text-blood'}`}
			>
				{t(data.bossTimeout ? 'over.bossTimeout' : 'over.title')}
			</h1>
			<Ornament kind="filet" size="full" className="[@media(max-height:500px)]:hidden" />
			<div className="flex flex-col items-center gap-[2vh] [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:items-start [@media(max-height:500px)]:gap-8">
				<div className="flex flex-col items-center gap-[1.5vh] [@media(max-height:500px)]:gap-1">
					<div className="font-title text-title font-bold text-text-light [@media(max-height:500px)]:text-item">
						{t('over.round', { n: data.round })}
					</div>
					<div className="text-item text-text-light [@media(max-height:500px)]:text-body">
						{t('over.stats', {
							kills: data.kills,
							time: formatTime(data.seconds),
							damage: data.damage.toLocaleString(),
						})}
					</div>
				</div>
				<div className="flex flex-col items-center gap-[1.5vh] [@media(max-height:500px)]:gap-1">
					<div className="flex flex-wrap items-center justify-center gap-x-6 text-cta font-black [@media(max-height:500px)]:text-body">
						<span className="text-fish">
							{t('over.rewards', {
								xp: data.xp,
								fish: data.fish,
								levels: data.levels,
							})}
						</span>
						<span className="text-ice">{t('over.pearls', { n: data.pearls })}</span>
					</div>
					{data.newBest && (
						<div className="-rotate-[4deg] bg-gold-bright px-4 py-1 font-title text-item font-black text-night shadow-1">
							{t('over.newBest')}
						</div>
					)}
					<div className="mt-2 flex flex-wrap items-center justify-center gap-4">
						<Btn onActivate={guard(actions.playAgain)} variant="primary">
							{t('over.playAgain')}
						</Btn>
						<Btn onActivate={guard(actions.menu)} variant="secondary">
							{t('over.mainMenu')}
						</Btn>
					</div>
				</div>
			</div>
			<Vignette />
		</FocusScope>
	);
}
