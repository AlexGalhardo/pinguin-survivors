import { type ReactElement, useEffect } from 'react';
import type { Rarity } from '../../data/cards';
import { type I18nKey, t } from '../../i18n';
import { useCompact, useUiScale } from '../compact';
import { FocusScope, useFocusable } from '../focus';
import { AtlasIcon, cardIconFrames } from './AtlasIcon';
import { Btn } from './Btn';
import { Ornament } from './Ornament';
import { Vignette } from './Vignette';

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

/** Rarity stripe and word color per card rarity (tokens of the palette). */
const RARITY: Record<Rarity, { stripe: string; text: string }> = {
	common: { stripe: 'bg-rarity-common', text: 'text-rarity-common' },
	rare: { stripe: 'bg-rarity-rare', text: 'text-rarity-rare' },
	epic: { stripe: 'bg-rarity-epic', text: 'text-rarity-epic' },
	legendary: { stripe: 'bg-rarity-legendary', text: 'text-rarity-legendary' },
};

const HOTKEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4'] as const;

function Card(props: {
	card: LevelUpCardData;
	index: number;
	icon: number;
	compact: boolean;
	onPick: () => void;
}): ReactElement {
	const { card } = props;
	const f = useFocusable({ onActivate: props.onPick });
	const r = RARITY[card.rarity];
	return (
		<button
			type="button"
			ref={f.ref}
			{...f.props}
			// No Tailwind preflight, so the native button look is reset here.
			className={`relative flex ${props.compact ? 'w-[180px]' : 'w-[min(22vw,calc(380*100vh/1080))]'} cursor-pointer appearance-none flex-col items-start gap-2 overflow-hidden border-0 bg-linear-to-b from-panel-top to-panel-bottom p-0 text-left shadow-inset [font-family:inherit] data-[focused=true]:shadow-focus data-[focused=true]:outline-2 data-[focused=true]:outline-crit`}
		>
			<span className={`block h-1.5 w-full ${r.stripe}`} />
			<span className="flex w-full flex-col gap-2 px-3 pb-3">
				<span className={`text-key font-black tracking-wider uppercase ${r.text}`}>
					<span>{props.index + 1}</span>
					{' · '}
					<span>{t(`rarity.${card.rarity}` as I18nKey)}</span>
				</span>
				<span
					className={`flex gap-2 ${props.compact ? 'flex-row items-center' : 'flex-col'}`}
				>
					<AtlasIcon frames={cardIconFrames(card.id)} size={props.icon} />
					<span className="font-title text-item leading-tight font-bold text-text-light">
						{card.name}
					</span>
				</span>
				<span className="text-body leading-snug font-normal text-text-light">
					{card.description}
				</span>
				<span
					className={`self-center text-key font-black text-crit ${f.focused ? '' : 'invisible'}`}
				>
					◆ {t('levelup.enter')} ◆
				</span>
			</span>
		</button>
	);
}

/**
 * Level-up pick (SDD-003 RF-05, Style D): up to 4 cards in a centered row, chosen by 1-4, the
 * arrows plus Enter, a click or a tap; R rerolls. No rotation: the focus is the crit outline.
 */
export function LevelUpCards({
	data,
	actions,
}: {
	data: LevelUpData;
	actions: LevelUpActions;
}): ReactElement {
	const scale = useUiScale();
	const compact = useCompact();
	const icon = compact ? 64 : Math.max(48, Math.round(128 * scale));
	const { cards, rerollsLeft } = data;
	const { pick, reroll } = actions;

	useEffect(() => {
		const onKey = (e: KeyboardEvent): void => {
			const i = HOTKEYS.indexOf(e.code as (typeof HOTKEYS)[number]);
			if (i >= 0 && i < cards.length) pick(i);
			else if (e.code === 'KeyR' && rerollsLeft > 0) reroll();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [cards.length, rerollsLeft, pick, reroll]);

	return (
		<FocusScope className="fixed inset-0 flex flex-col items-center justify-center gap-[3vh] bg-night/90 font-body text-body text-text-light [@media(max-height:500px)]:gap-1">
			<div className="flex flex-col items-center gap-1">
				<h1 className="m-0 font-title text-display leading-[1.4] font-black tracking-title text-crit uppercase [@media(max-height:500px)]:text-title">
					{t('levelup.title', { n: data.level })}
				</h1>
				<Ornament kind="filet" size={compact ? 'compact' : 'full'} />
			</div>
			<div className="grid grid-flow-col justify-center gap-[1.2vw]">
				{cards.map((c, i) => (
					<Card
						key={c.id}
						card={c}
						index={i}
						icon={icon}
						compact={compact}
						onPick={() => pick(i)}
					/>
				))}
			</div>
			<div className="flex items-center gap-4">
				<Btn onActivate={reroll} disabled={rerollsLeft <= 0} variant="secondary">
					{t('levelup.reroll', { n: rerollsLeft })}
				</Btn>
				<span
					className={`text-secondary ${rerollsLeft > 0 ? 'text-text-light' : 'text-text-dim'}`}
				>
					{t('levelup.keys', { n: cards.length })}
				</span>
			</div>
			<Vignette />
		</FocusScope>
	);
}
