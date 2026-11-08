import type { ReactElement } from 'react';
import { t } from '../../i18n';
import { formatTime } from '../../logic/format';
import { FocusScope } from '../focus';
import { Btn } from './Btn';

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

/** Run summary shown on death or boss timeout. */
export function GameOver({
	data,
	actions,
}: {
	data: GameOverData;
	actions: GameOverActions;
}): ReactElement {
	return (
		<FocusScope
			onBack={actions.menu}
			className="fixed inset-0 flex flex-col items-center justify-center gap-[2.5vh] bg-night/90 font-body text-[clamp(0.8rem,1.7vh,1.125rem)] text-text-light"
		>
			<h1 className="font-title text-[2.6em] font-bold text-blood">
				{t(data.bossTimeout ? 'over.bossTimeout' : 'over.title')}
			</h1>
			<div className="text-[1.4em] font-bold">{t('over.round', { n: data.round })}</div>
			{data.newBest && <div className="font-bold text-crit">{t('over.newBest')}</div>}
			<div className="text-text-dim">
				{t('over.stats', {
					kills: data.kills,
					time: formatTime(data.seconds),
					damage: data.damage.toLocaleString(),
				})}
			</div>
			<div className="text-fish">
				{t('over.rewards', { xp: data.xp, fish: data.fish, levels: data.levels })}
			</div>
			<div className="text-ice">{t('over.pearls', { n: data.pearls })}</div>
			<div className="mt-2 flex gap-3">
				<Btn onActivate={actions.playAgain} className="border-xp text-xp">
					{t('over.playAgain')}
				</Btn>
				<Btn onActivate={actions.menu} className="border-snow">
					{t('over.mainMenu')}
				</Btn>
			</div>
		</FocusScope>
	);
}
