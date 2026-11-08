import type { ReactElement } from 'react';
import type { Rarity } from '../../data/cards';
import { type I18nKey, t } from '../../i18n';
import { FocusScope } from '../focus';
import { AtlasIcon, cardIconFrames } from './AtlasIcon';
import { Btn } from './Btn';

export interface LevelUpCardData {
	/** Card id; `name` and `description` are resolved by the caller (ui/card-text). */
	id: string;
	rarity: Rarity;
	name: string;
	description: string;
}

export interface LevelUpData {
	level: number;
	cards: readonly LevelUpCardData[];
	/** Rerolls left (Workshop `insight`); 0 disables the button. */
	rerollsLeft: number;
}

export interface LevelUpActions {
	pick: (index: number) => void;
	reroll: () => void;
}

const RARITY_STYLE: Record<Rarity, string> = {
	common: 'border-rarity-common text-rarity-common',
	rare: 'border-rarity-rare text-rarity-rare',
	epic: 'border-rarity-epic text-rarity-epic',
	legendary: 'border-rarity-legendary text-rarity-legendary',
};

/** Level-up pick: up to 4 cards, chosen by keyboard, gamepad or touch (SDD-003 RF-05). */
export function LevelUpCards({
	data,
	actions,
}: {
	data: LevelUpData;
	actions: LevelUpActions;
}): ReactElement {
	return (
		<FocusScope className="fixed inset-0 flex flex-col items-center justify-center gap-[3vh] bg-night/90 font-body text-[clamp(0.8rem,1.7vh,1.125rem)] text-text-light">
			<h1 className="font-title text-[2.2em] font-bold text-crit">
				{t('levelup.title', { n: data.level })}
			</h1>
			<div className="grid w-[min(92vw,90rem)] grid-cols-2 gap-[1.5vw] lg:grid-cols-4">
				{data.cards.map((c, i) => (
					<Btn
						key={c.id}
						onActivate={() => actions.pick(i)}
						className={`flex min-h-[22vh] flex-col items-start justify-between gap-2 bg-night/80 p-4 text-left ${RARITY_STYLE[c.rarity]}`}
					>
						<span className="text-[0.8em] uppercase">
							{t(`rarity.${c.rarity}` as I18nKey)}
						</span>
						<AtlasIcon frames={cardIconFrames(c.id)} size={64} />
						<span className="font-title text-[1.3em]">{c.name}</span>
						<span className="font-normal text-text-light">{c.description}</span>
					</Btn>
				))}
			</div>
			<Btn
				onActivate={actions.reroll}
				disabled={data.rerollsLeft <= 0}
				className="border-ice text-ice"
			>
				{t('levelup.reroll', { n: data.rerollsLeft })}
			</Btn>
		</FocusScope>
	);
}
