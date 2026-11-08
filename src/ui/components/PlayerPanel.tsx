import { type ReactElement, type ReactNode, useState } from 'react';
import { type I18nKey, t } from '../../i18n';
import { formatStat } from '../../logic/format';
import type { PlayerPanelView } from '../../logic/item-view';
import { Btn } from './Btn';
import { weaponName } from './Hud';
import {
	GearCardView,
	type GearItem,
	gearName,
	numeral,
	rarityCss,
	SlotIcon,
	WeaponCardView,
	type WeaponItem,
	weaponFrames,
} from './ItemViews';
import { Filet, Hint, StatRow } from './Panel';

export interface PlayerPanelData {
	/** Main stats already formatted (`gstat.<key>` is the label). */
	stats: readonly { key: string; value: string }[];
	/** Weapon slots in order (at most 6). */
	weapons: readonly WeaponItem[];
	maxWeapons: number;
	/** Worn equipment per slot; `item` null = empty. */
	gear: readonly { slot: string; item: GearItem | null }[];
	/** Equipment in the bag (pause only). */
	bag?: readonly { key: string; item: GearItem }[];
	/** Passive cards and hero actives (pause only). */
	cards?: readonly { name: string; level: number }[];
}

type Detail =
	| { kind: 'weapon'; slot: number }
	| { kind: 'gear'; slot: string }
	| { kind: 'bag'; key: string };

/** Contract view of the player (`PlayerPanelView`) to what the panel draws. */
export function panelFromView(
	view: PlayerPanelView,
	extra: { maxWeapons: number; cards?: PlayerPanelData['cards']; withBag?: boolean },
): PlayerPanelData {
	return {
		stats: view.stats.map((s) => ({ key: s.key, value: formatStat(s.key, s.value) })),
		weapons: view.weapons.map((w) => ({ id: w.id, tier: w.rarity, affixes: w.affixes })),
		maxWeapons: extra.maxWeapons,
		gear: view.gear.map((g) => ({
			slot: g.slot,
			item: g.item ? { id: g.item.id, rarity: g.item.rarity, affixes: g.item.affixes } : null,
		})),
		...(extra.withBag && {
			bag: view.bag.map((b, i) => ({
				key: `${b.id}#${i}`,
				item: { id: b.id, rarity: b.rarity, affixes: b.affixes },
			})),
		}),
		cards: extra.cards,
	};
}

const slotLabel = (slot: string): string => t(`gslot.${slot}` as I18nKey);

function Block(props: { title: string; children: ReactNode }): ReactElement {
	return (
		<section className="flex min-w-0 flex-col gap-1.5">
			<h3 className="m-0 font-title text-[0.95em] font-bold tracking-wider text-crit uppercase">
				{props.title}
			</h3>
			<Filet />
			{props.children}
		</section>
	);
}

/**
 * The player's side of the shop and the whole pause screen: current stats, the 6 weapon slots
 * and the equipment, each with its rarity color. Focusing (keyboard, pad, mouse) an item opens its
 * card with the base numbers and affixes.
 */
export function PlayerPanel(props: {
	data: PlayerPanelData;
	/** Buttons under a weapon slot (sell, fuse). */
	weaponExtra?: (slot: number) => ReactNode;
	/** Activating a worn item (take it off). */
	onGear?: (slot: string) => void;
	/** Activating a bag item (wear it). */
	onBag?: (key: string, id: string) => void;
	/** Pause layout: stats and cards beside the items from 1100 px on. */
	wide?: boolean;
}): ReactElement {
	const { data } = props;
	const [detail, setDetail] = useState<Detail | null>(null);
	const slots = Array.from({ length: data.maxWeapons }, (_, i) => data.weapons[i]);

	let card: ReactElement | null = null;
	if (detail?.kind === 'weapon' && data.weapons[detail.slot])
		card = <WeaponCardView item={data.weapons[detail.slot] as WeaponItem} />;
	else if (detail?.kind === 'gear') {
		const item = data.gear.find((g) => g.slot === detail.slot)?.item;
		if (item) card = <GearCardView item={item} />;
	} else if (detail?.kind === 'bag') {
		const item = data.bag?.find((b) => b.key === detail.key)?.item;
		if (item) card = <GearCardView item={item} />;
	}

	const stats = (
		<Block title={t('pause.stats')}>
			<div className="grid grid-cols-1 gap-x-6 gap-y-0.5 min-[1500px]:grid-cols-2">
				{data.stats.map((s) => (
					<StatRow
						key={s.key}
						label={<span className="capitalize">{t(`gstat.${s.key}` as I18nKey)}</span>}
						value={s.value}
					/>
				))}
			</div>
			{data.cards && data.cards.length > 0 && (
				<>
					<h4 className="m-0 mt-1 text-[0.85em] font-bold tracking-wider text-text-dim uppercase">
						{t('pause.cards')}
					</h4>
					<ul className="m-0 list-none space-y-0.5 p-0 text-[0.9em]">
						{data.cards.map((c) => (
							<li key={c.name}>
								{c.name} · {t('hud.level', { n: c.level })}
							</li>
						))}
					</ul>
				</>
			)}
		</Block>
	);

	const items = (
		<div className="flex min-w-0 flex-col gap-3">
			<Block title={`${t('shop.weapons')} ${data.weapons.length}/${data.maxWeapons}`}>
				<div className="grid grid-cols-1 gap-2 min-[560px]:grid-cols-2">
					{slots.map((w, i) => (
						// Fixed slots: the position is the identity.
						// biome-ignore lint/suspicious/noArrayIndexKey: fixed-size slot list
						<div key={i} data-detail={`weapon:${i}`} className="flex flex-col gap-1">
							{w ? (
								<Btn
									onActivate={() => setDetail({ kind: 'weapon', slot: i })}
									className="flex items-center gap-2 border-2 text-left font-normal"
									label={weaponName(w.id)}
								>
									<SlotIcon
										frames={weaponFrames(w.id, w.tier)}
										rarity={w.tier}
										size={40}
									/>
									<span
										className="min-w-0 flex-1 truncate font-bold"
										style={{ color: rarityCss(w.tier) }}
									>
										{weaponName(w.id)} · {numeral(w.tier)}
									</span>
								</Btn>
							) : (
								<div className="flex min-h-11 items-center justify-center border border-snow-dark bg-night/50 text-text-dim">
									{t('shop.empty')}
								</div>
							)}
							{w && props.weaponExtra?.(i)}
						</div>
					))}
				</div>
			</Block>
			<Block title={t('shop.equipment')}>
				<div className="grid grid-cols-1 gap-2 min-[560px]:grid-cols-2">
					{data.gear.map((g) =>
						g.item ? (
							<div key={g.slot} data-detail={`gear:${g.slot}`}>
								<Btn
									onActivate={() => props.onGear?.(g.slot)}
									className="flex w-full items-center gap-2 border-2 text-left font-normal"
								>
									<SlotIcon
										frames={[`item.${g.item.id}`]}
										rarity={g.item.rarity}
										size={32}
									/>
									<span
										className="min-w-0 flex-1 truncate font-bold"
										style={{ color: rarityCss(g.item.rarity) }}
									>
										{gearName(g.item.id)} · {numeral(g.item.rarity)}
									</span>
								</Btn>
							</div>
						) : (
							<div
								key={g.slot}
								className="flex min-h-11 items-center justify-center border border-dashed border-snow-dark bg-night/50 text-text-dim"
							>
								{slotLabel(g.slot)}
							</div>
						),
					)}
				</div>
			</Block>
			{data.bag && (
				<Block title={t('pause.bag')}>
					{data.bag.length === 0 ? (
						<Hint>{t('pause.bagEmpty')}</Hint>
					) : (
						<div className="grid grid-cols-1 gap-2 min-[560px]:grid-cols-2">
							{data.bag.map((b) => (
								<div key={b.key} data-detail={`bag:${b.key}`}>
									<Btn
										onActivate={() => props.onBag?.(b.key, b.item.id)}
										className="flex w-full items-center gap-2 border-2 text-left font-normal"
									>
										<SlotIcon
											frames={[`item.${b.item.id}`]}
											rarity={b.item.rarity}
											size={32}
										/>
										<span
											className="min-w-0 flex-1 truncate font-bold"
											style={{ color: rarityCss(b.item.rarity) }}
										>
											{gearName(b.item.id)} · {numeral(b.item.rarity)}
										</span>
									</Btn>
								</div>
							))}
						</div>
					)}
				</Block>
			)}
		</div>
	);

	// Focus bubbles from the buttons: the nearest slot decides which card to show.
	const track = (e: React.FocusEvent<HTMLElement>): void => {
		const el = (e.target as HTMLElement).closest<HTMLElement>('[data-detail]');
		const v = el?.dataset.detail;
		if (!v) return;
		const [kind, id] = v.split(':');
		if (kind === 'weapon') setDetail({ kind: 'weapon', slot: Number(id) });
		else if (kind === 'gear') setDetail({ kind: 'gear', slot: id as string });
		else if (kind === 'bag') setDetail({ kind: 'bag', key: id as string });
	};

	return (
		<div
			onFocusCapture={track}
			className={`grid min-w-0 gap-4 ${props.wide ? 'min-[1100px]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]' : ''}`}
		>
			<div className="flex min-w-0 flex-col gap-3">
				{stats}
				{card && <div className="flex flex-col gap-1">{card}</div>}
			</div>
			{items}
		</div>
	);
}
