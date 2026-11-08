import { type ReactElement, useState } from 'react';
import type { HeroId } from '../../config/constants';
import { getLang, type I18nKey, t } from '../../i18n';
import { Btn } from './Btn';
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
	const isNew = data.mode === 'new';

	const ask = (c: Confirm): void => setConfirm(c);
	const run = (): void => {
		if (!confirm) return;
		if (confirm.kind === 'delete') actions.remove(confirm.slot);
		else actions.pick(confirm.slot);
		setConfirm(null);
	};

	return (
		<MenuScreen
			title={t(isNew ? 'slots.newTitle' : 'slots.loadTitle')}
			subtitle={t(isNew ? 'slots.newHint' : 'slots.loadHint')}
			onBack={confirm ? () => setConfirm(null) : actions.back}
			footer={<BackBtn onBack={actions.back} label={t('menu.back')} />}
		>
			{confirm ? (
				<div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
					<p className="m-0 max-w-[36em] font-bold">
						{t(
							confirm.kind === 'delete'
								? 'slots.confirmDelete'
								: 'slots.confirmOverwrite',
							{
								n: confirm.slot + 1,
							},
						)}
					</p>
					<div className="flex gap-2">
						<Btn onActivate={run} variant="danger" className="min-w-40">
							{t('slots.confirm')}
						</Btn>
						<Btn
							onActivate={() => setConfirm(null)}
							variant="secondary"
							className="min-w-40"
						>
							{t('slots.cancel')}
						</Btn>
					</div>
				</div>
			) : (
				<div className="flex w-full flex-col gap-3">
					{data.slots.map((slot, i) => (
						<div
							// Fixed list of three slots: the position is the identity.
							// biome-ignore lint/suspicious/noArrayIndexKey: fixed-size slot list
							key={i}
							data-slot={i}
							className={`flex flex-wrap items-center gap-3 border bg-night/50 px-4 py-3 ${
								data.active === i ? 'border-crit' : 'border-snow-dark'
							}`}
						>
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2 font-title font-bold tracking-[0.1em] uppercase">
									{t('slots.slot', { n: i + 1 })}
									{data.active === i && (
										<span className="text-[0.7em] text-crit">
											{t('slots.active')}
										</span>
									)}
									{slot?.inRun && (
										<span className="text-[0.7em] text-xp">
											{t('slots.inRun')}
										</span>
									)}
								</div>
								{slot ? (
									<div className="mt-1 flex flex-col gap-0.5">
										<div>
											{t('slots.info', {
												hero: t(`hero.${slot.hero}` as I18nKey),
												level: slot.level,
												round: slot.bestRound,
											})}
										</div>
										<Hint>
											{t('slots.played', {
												time: playTime(slot.playedSec),
											})}
											{slot.savedAt > 0 &&
												` · ${t('slots.saved', {
													date: new Date(slot.savedAt).toLocaleString(
														getLang(),
														{
															dateStyle: 'short',
															timeStyle: 'short',
														},
													),
												})}`}
										</Hint>
									</div>
								) : (
									<Hint>{t('slots.empty')}</Hint>
								)}
							</div>
							<div className="flex gap-2">
								{isNew ? (
									<Btn
										onActivate={() =>
											slot
												? ask({ kind: 'overwrite', slot: i })
												: actions.pick(i)
										}
										variant="primary"
										className="min-w-36"
									>
										{t('slots.start')}
									</Btn>
								) : (
									<Btn
										onActivate={() => actions.pick(i)}
										disabled={!slot}
										variant="primary"
										className="min-w-36"
									>
										{t('slots.load')}
									</Btn>
								)}
								<Btn
									onActivate={() => ask({ kind: 'delete', slot: i })}
									disabled={!slot}
									variant="danger"
								>
									{t('slots.delete')}
								</Btn>
							</div>
						</div>
					))}
				</div>
			)}
		</MenuScreen>
	);
}
