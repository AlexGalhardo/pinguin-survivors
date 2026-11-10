import { type ReactElement, useEffect, useRef, useState } from 'react';
import type { HeroId } from '../../config/constants';
import { getLang, type I18nKey, t } from '../../i18n';
import { useCompact, useUiScale } from '../compact';
import { Btn } from './Btn';
import { HeroSprite } from './HeroSprite';
import { BackBtn, MenuScreen } from './MenuScreen';
import { Hint } from './Panel';

/** One used save slot as the list shows it (`SlotSummary`); `null` = empty slot. */
export interface SaveSlotRow {
	hero: HeroId;
	level: number;
	bestRound: number;
	playedSec: number;
	savedAt: number;
	inRun: boolean;
}

export interface SaveSlotsData {
	/** `load` picks an existing slot, `new` picks where the new game goes. */
	mode: 'load' | 'new';
	slots: readonly (SaveSlotRow | null)[];
	/** Slot the game is currently playing, or null when none is loaded. */
	active: number | null;
}

export interface SaveSlotsActions {
	pick: (slot: number) => void;
	remove: (slot: number) => void;
	back: () => void;
}

/** Play time as `3h 05m` (a run list reads better in hours than in minutes). */
const playTime = (sec: number): string =>
	`${Math.floor(sec / 3600)}h ${String(Math.floor((sec % 3600) / 60)).padStart(2, '0')}m`;

type Confirm = { kind: 'delete' | 'overwrite'; slot: number };

/** The three save slots (Hades 2 style): load, start a new game (asks before overwriting) or delete. */
export function SaveSlots({
	data,
	actions,
}: {
	data: SaveSlotsData;
	actions: SaveSlotsActions;
}): ReactElement {
	const [confirm, setConfirm] = useState<Confirm | null>(null);
	const [shown, setShown] = useState(data.active ?? 0);
	const compact = useCompact();
	const uiScale = useUiScale();
	const portrait = compact ? 1.2 : Math.max(1, Math.round(3 * uiScale));
	const isNew = data.mode === 'new';
	const cancelRef = useRef<HTMLDivElement>(null);

	// The button that asked is gone once the question shows: focus starts on CANCEL (the safe one).
	useEffect(() => {
		if (confirm) cancelRef.current?.querySelector('button')?.focus();
	}, [confirm]);

	const run = (): void => {
		if (!confirm) return;
		if (confirm.kind === 'delete') actions.remove(confirm.slot);
		else actions.pick(confirm.slot);
		setConfirm(null);
	};
	const step = (d: number): void => setShown((shown + d + data.slots.length) % data.slots.length);
	const indexes = compact ? [shown] : data.slots.map((_, i) => i);

	const column = (i: number): ReactElement => {
		const slot = data.slots[i] ?? null;
		const asking = confirm?.slot === i ? confirm : null;
		return (
			<div
				key={i}
				data-slot={i}
				className="flex min-w-0 flex-1 flex-col items-center gap-1 border border-line px-3 py-2 text-center focus-within:border-crit focus-within:bg-gold-bright/5"
			>
				<div className="flex items-center gap-2 text-section font-black tracking-section text-gold-bright uppercase">
					{t('slots.slot', { n: i + 1 })}
					{data.active === i && (
						<span className="text-secondary text-crit">{t('slots.active')}</span>
					)}
				</div>
				{slot ? (
					<HeroSprite hero={slot.hero} scale={portrait} />
				) : (
					<span
						aria-hidden="true"
						className="flex items-center justify-center rounded-full border border-line font-title text-display text-text-dim"
						style={{ width: 80 * portrait, height: 80 * portrait }}
					>
						+
					</span>
				)}
				{slot ? (
					<>
						<div className="text-body font-bold">
							{t('slots.info', {
								hero: t(`hero.${slot.hero}` as I18nKey),
								level: slot.level,
								round: slot.bestRound,
							})}
						</div>
						<Hint>
							{t('slots.played', { time: playTime(slot.playedSec) })}
							{slot.savedAt > 0 &&
								` · ${t('slots.saved', {
									date: new Date(slot.savedAt).toLocaleString(getLang(), {
										dateStyle: 'short',
										timeStyle: 'short',
									}),
								})}`}
						</Hint>
						{slot.inRun && (
							<span className="text-secondary font-bold text-fish uppercase">
								{t('slots.inRun')}
							</span>
						)}
					</>
				) : (
					<Hint>{t('slots.empty')}</Hint>
				)}
				{asking ? (
					<div className="flex flex-col items-center gap-1">
						<p className="m-0 text-body font-bold">
							{t(
								asking.kind === 'delete'
									? 'slots.confirmDelete'
									: 'slots.confirmOverwrite',
								{ n: i + 1 },
							)}
						</p>
						<div className="flex flex-wrap justify-center gap-1">
							<Btn onActivate={run} variant="danger">
								{t('slots.confirm')}
							</Btn>
							<div ref={cancelRef}>
								<Btn onActivate={() => setConfirm(null)} variant="secondary">
									{t('slots.cancel')}
								</Btn>
							</div>
						</div>
					</div>
				) : (
					<div className="flex flex-col items-center">
						{isNew ? (
							<Btn
								onActivate={() =>
									slot
										? setConfirm({ kind: 'overwrite', slot: i })
										: actions.pick(i)
								}
								variant="primary"
							>
								{t('slots.start')}
							</Btn>
						) : (
							<Btn
								onActivate={() => actions.pick(i)}
								disabled={!slot}
								variant="primary"
							>
								{t('slots.load')}
							</Btn>
						)}
						{slot && (
							<Btn
								onActivate={() => setConfirm({ kind: 'delete', slot: i })}
								variant="danger"
							>
								{t('slots.delete')}
							</Btn>
						)}
					</div>
				)}
			</div>
		);
	};

	return (
		<MenuScreen
			wide
			title={t(isNew ? 'slots.newTitle' : 'slots.loadTitle')}
			subtitle={t(isNew ? 'slots.newHint' : 'slots.loadHint')}
			onBack={confirm ? () => setConfirm(null) : actions.back}
			footer={<BackBtn onBack={actions.back} label={t('menu.back')} />}
		>
			<div className="flex w-full flex-1 items-start justify-center gap-2 pt-[3vh]">
				{compact && (
					<Btn onActivate={() => step(-1)} label="-" className="pr-0! pl-0!">
						<span className="font-title text-[32px] leading-none text-gold-bright">
							‹
						</span>
					</Btn>
				)}
				{indexes.map(column)}
				{compact && (
					<Btn onActivate={() => step(1)} label="+" className="pr-0! pl-0!">
						<span className="font-title text-[32px] leading-none text-gold-bright">
							›
						</span>
					</Btn>
				)}
			</div>
		</MenuScreen>
	);
}
