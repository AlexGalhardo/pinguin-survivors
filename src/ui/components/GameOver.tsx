import type { ReactElement } from 'react';
import { type I18nKey, t } from '../../i18n';
import { formatTime } from '../../logic/format';
import { FocusScope } from '../focus';
import { useInputGrace } from '../input-grace';
import { Btn } from './Btn';
import { Ornament } from './Ornament';
import { Vignette } from './Vignette';

export interface GameOverData {
	/** The boss round ended by timeout instead of the hero dying. */
	bossTimeout: boolean;
	/** The player quit from the pause menu: the title says so instead of "you died". */
	quit?: boolean;
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

/** One labeled number of the run summary: big value over a small caps label (no plural to get wrong). */
export function RunStat(props: { label: I18nKey; value: string; tone?: string }): ReactElement {
	return (
		<div className="flex min-w-[5ch] flex-col items-center">
			<span
				className={`text-cta leading-tight font-black tabular-nums [@media(max-height:500px)]:text-item ${props.tone ?? 'text-text-light'}`}
			>
				{props.value}
			</span>
			<span className="text-secondary font-bold tracking-section text-text-light uppercase">
				{t(props.label)}
			</span>
		</div>
	);
}

/** Kills, time and damage of a run, shared by the run summary and the demo end. */
export function RunStats(props: { kills: number; seconds: number; damage: number }): ReactElement {
	return (
		<div className="flex flex-wrap items-start justify-center gap-x-[4vw] gap-y-1">
			<RunStat label="over.label.kills" value={props.kills.toLocaleString()} />
			<RunStat label="over.label.time" value={formatTime(props.seconds)} />
			<RunStat label="over.label.damage" value={props.damage.toLocaleString()} />
		</div>
	);
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
				className={`m-0 text-center font-title text-display leading-[1.4] font-black tracking-title uppercase [@media(max-height:500px)]:text-title ${data.bossTimeout || data.quit ? 'text-gold-bright' : 'text-blood'}`}
			>
				{t(data.quit ? 'over.quit' : data.bossTimeout ? 'over.bossTimeout' : 'over.title')}
			</h1>
			<Ornament kind="filet" size="full" className="[@media(max-height:500px)]:hidden" />
			<div className="flex flex-col items-center gap-[2vh] [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:items-start [@media(max-height:500px)]:gap-8">
				<div className="flex flex-col items-center gap-[1.5vh] [@media(max-height:500px)]:gap-1">
					<div className="font-title text-title font-bold text-text-light [@media(max-height:500px)]:text-item">
						{t('over.round', { n: data.round })}
					</div>
					<RunStats kills={data.kills} seconds={data.seconds} damage={data.damage} />
				</div>
				<div className="flex flex-col items-center gap-[1.5vh] [@media(max-height:500px)]:gap-1">
					<div className="flex flex-wrap items-start justify-center gap-x-[4vw] gap-y-1">
						<RunStat
							label="over.label.xp"
							value={`+${data.xp.toLocaleString()}`}
							tone="text-xp"
						/>
						<RunStat
							label="over.label.fish"
							value={`+${data.fish.toLocaleString()}`}
							tone="text-fish"
						/>
						<RunStat
							label="over.label.levels"
							value={`+${data.levels}`}
							tone="text-gold-bright"
						/>
						<RunStat
							label="over.label.pearls"
							value={`+${data.pearls.toLocaleString()}`}
							tone="text-ice"
						/>
					</div>
					{data.newBest && (
						<div className="-rotate-[4deg] bg-gold-bright px-4 py-1 font-title text-item font-black text-night">
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
