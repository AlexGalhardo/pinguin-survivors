import { type ReactElement, type ReactNode, useState } from 'react';
import { type I18nKey, t } from '../../i18n';
import { formatStat } from '../../logic/format';
import type { PlayerPanelView } from '../../logic/item-view';
import { useCompact, useUiScale } from '../compact';
import { Btn } from './Btn';
import { weaponName } from './Hud';
import {
	GearCardView,
	type GearItem,
	numeral,
	rarityCss,
	SlotIcon,
	WeaponCardView,
	type WeaponItem,
	weaponFrames,
} from './ItemViews';
import { Hint, StatRow } from './Panel';

export interface PlayerPanelData {
	/** Main stats already formatted (`gstat.<key>` is the label). */
	stats: readonly { key: string; value: string }[];
	/** Weapon slots in order (at most 6). */
	weapons: readonly WeaponItem[];
	maxWeapons: number;
	/** Worn equipment per slot; `item` null = empty. */
	gear: readonly { slot: string; item: GearItem | null }[];
	/** Passive cards and hero actives (pause only). */
	cards?: readonly { name: string; level: number }[];
	/** Support items owned (own 4 slots) and the healing potion (SDD-014). */
	support?: PlayerPanelView['support'];
	supportSlots?: number;
	healPotion?: PlayerPanelView['healPotion'];
}

type Detail = { kind: 'weapon'; slot: number } | { kind: 'gear'; slot: string };

/** Contract view of the player (`PlayerPanelView`) to what the panel draws. */
export function panelFromView(
	view: PlayerPanelView,
	extra: { maxWeapons: number; cards?: PlayerPanelData['cards'] },
): PlayerPanelData {
	return {
		stats: view.stats.map((s) => ({ key: s.key, value: formatStat(s.key, s.value) })),
		weapons: view.weapons.map((w) => ({ id: w.id, tier: w.rarity, affixes: w.affixes })),
		maxWeapons: extra.maxWeapons,
		gear: view.gear.map((g) => ({
			slot: g.slot,
			item: g.item ? { id: g.item.id, rarity: g.item.rarity, affixes: g.item.affixes } : null,
		})),
		cards: extra.cards,
		support: view.support,
		supportSlots: view.supportSlots,
		healPotion: view.healPotion,
	};
}

const slotLabel = (slot: string): string => t(`gslot.${slot}` as I18nKey);

function Block(props: { title: string; children: ReactNode; aside?: ReactNode }): ReactElement {
	return (
		<section className="flex min-w-0 flex-col gap-1">
			<h3 className="m-0 flex items-center gap-2 font-title text-[0.9em] font-bold tracking-[0.14em] text-gold-bright uppercase">
				<span className="diamond" />
				<span className="flex-1">{props.title}</span>
				{props.aside}
			</h3>
			{props.children}
		</section>
	);
}

/**
 * The player's side of the shop and the pause screen, built to never scroll: three headline
 * numbers, the stats in columns, the weapon and equipment slots as icon tiles
 * and, in the space that is left, the card of the focused item. Focus (keyboard, pad, mouse) on a
 * tile picks the item; `weaponBar` is the fixed bar of actions for the picked weapon.
 */
export function PlayerPanel(props: {
	data: PlayerPanelData;
	/** Actions for the picked weapon slot (sell, fuse), in a fixed bar under the weapon tiles. */
	weaponBar?: (slot: number) => ReactNode;
	/** Pause layout: one more column for the focused item card. */
	wide?: boolean;
}): ReactElement {
	const { data } = props;
	const scale = useUiScale();
	// Phone landscape: only the three headline numbers, no stat list and no card in the shop.
	const compact = useCompact();
	// Icon box of the tiles follows the screen height; the atlas icons snap to whole-number scales.
	const icon = Math.max(24, Math.round((props.wide ? 76 : 44) * scale));
	const [detail, setDetail] = useState<Detail | null>(null);
	const [pickedWeapon, setPickedWeapon] = useState(0);
	const slots = Array.from({ length: data.maxWeapons }, (_, i) => data.weapons[i]);

	const headline = ['maxHp', 'armor', 'damage']
		.map((k) => data.stats.find((s) => s.key === k))
		.filter((s): s is { key: string; value: string } => Boolean(s));
	const rest = data.stats.filter((s) => !headline.includes(s));

	let card: ReactElement | null = null;
	if (detail?.kind === 'weapon' && data.weapons[detail.slot])
		card = <WeaponCardView item={data.weapons[detail.slot] as WeaponItem} />;
	else if (detail?.kind === 'gear') {
		const item = data.gear.find((g) => g.slot === detail.slot)?.item;
		if (item) card = <GearCardView item={item} />;
	}

	// Focus bubbles from the tiles: the nearest wrapper decides which card to show.
	const track = (e: React.FocusEvent<HTMLElement>): void => {
		const el = (e.target as HTMLElement).closest<HTMLElement>('[data-detail]');
		const v = el?.dataset.detail;
		if (!v) return;
		const [kind, id] = v.split(':');
		if (kind === 'weapon') {
			setDetail({ kind: 'weapon', slot: Number(id) });
			setPickedWeapon(Number(id));
		} else if (kind === 'gear') setDetail({ kind: 'gear', slot: id as string });
	};

	const stats = (
		<Block title={t('pause.stats')}>
			{headline.length > 0 && !(compact && !props.wide) && (
				<div className="grid grid-cols-3 gap-1.5 text-center">
					{headline.map((s) => (
						<div key={s.key} className="border border-snow-dark bg-night/60 px-1 py-1">
							<div className="font-title text-[1.5em] leading-tight font-black tabular-nums">
								{s.value}
							</div>
							<div className="mt-0.5 text-[0.7em] tracking-wider text-text-dim uppercase">
								{t(`gstat.${s.key}` as I18nKey)}
							</div>
						</div>
					))}
				</div>
			)}
			{!compact && (
				<div className="grid grid-cols-2 gap-x-4 gap-y-0">
					{rest.map((s) => (
						<StatRow
							key={s.key}
							label={
								<span className="capitalize">{t(`gstat.${s.key}` as I18nKey)}</span>
							}
							value={s.value}
						/>
					))}
				</div>
			)}
			{!compact && data.cards && data.cards.length > 0 && (
				<Hint>
					{data.cards
						.map((c) => `${c.name} ${t('hud.level', { n: c.level })}`)
						.join(' · ')}
				</Hint>
			)}
		</Block>
	);

	const tiles = (
		<div className="flex min-w-0 flex-col gap-2 [@media(max-height:500px)]:gap-0.5">
			<Block title={`${t('shop.weapons')} ${data.weapons.length}/${data.maxWeapons}`}>
				<div className="grid grid-cols-6 gap-1.5">
					{slots.map((w, i) => (
						// Fixed slots: the position is the identity.
						// biome-ignore lint/suspicious/noArrayIndexKey: fixed-size slot list
						<div key={i} data-detail={w ? `weapon:${i}` : undefined} className="flex">
							{w ? (
								<Btn
									onActivate={() => setPickedWeapon(i)}
									className={`flex w-full flex-col items-center justify-center gap-0 border-0 bg-transparent p-0 ${
										pickedWeapon === i ? 'outline outline-1 outline-crit' : ''
									}`}
									label={weaponName(w.id)}
								>
									<SlotIcon
										frames={weaponFrames(w.id, w.tier)}
										rarity={w.tier}
										size={icon}
									/>
									<span
										className="text-[0.7em] leading-none font-bold"
										style={{ color: rarityCss(w.tier) }}
									>
										{numeral(w.tier)}
									</span>
								</Btn>
							) : (
								<div className="flex min-h-11 w-full items-center justify-center border border-dashed border-snow-dark bg-night/40" />
							)}
						</div>
					))}
				</div>
				{props.weaponBar && data.weapons[pickedWeapon] && (
					<div className="flex items-center gap-2">
						<span
							className="min-w-0 flex-1 truncate font-bold"
							style={{ color: rarityCss(data.weapons[pickedWeapon]?.tier ?? 1) }}
						>
							{weaponName(data.weapons[pickedWeapon]?.id ?? '')}
						</span>
						{props.weaponBar(pickedWeapon)}
					</div>
				)}
			</Block>
			<Block title={t('shop.equipment')}>
				<div className="grid grid-cols-5 gap-1.5">
					{data.gear.map((g) => (
						<div
							key={g.slot}
							data-detail={g.item ? `gear:${g.slot}` : undefined}
							className="flex"
						>
							{g.item ? (
								<Btn
									onActivate={() => setDetail({ kind: 'gear', slot: g.slot })}
									className="flex w-full flex-col items-center justify-center gap-0 border-0 bg-transparent p-0"
									label={slotLabel(g.slot)}
								>
									<SlotIcon
										frames={[`item.${g.item.id}`]}
										rarity={g.item.rarity}
										size={icon}
									/>
									<span
										className="text-[0.7em] leading-none font-bold"
										style={{ color: rarityCss(g.item.rarity) }}
									>
										{numeral(g.item.rarity)}
									</span>
								</Btn>
							) : (
								<div className="flex min-h-11 w-full items-center justify-center border border-dashed border-snow-dark bg-night/40 px-0.5 text-center text-[0.65em] text-text-dim">
									{slotLabel(g.slot)}
								</div>
							)}
						</div>
					))}
				</div>
			</Block>
			{(data.support?.length || data.healPotion) && (
				<Block
					title={`${t('panel.support')} ${data.support?.length ?? 0}/${data.supportSlots ?? 0}`}
				>
					{data.support?.map((s) => (
						<StatRow
							key={s.id}
							label={t(`support.${s.id}.name` as I18nKey)}
							value={t('support.level', { n: s.level, max: s.max })}
						/>
					))}
					{data.healPotion && (
						<StatRow
							label={t('hpotion.name')}
							accent=""
							value={
								<span style={{ color: rarityCss(data.healPotion.rarity) }}>
									{t('panel.healPotion', {
										charges: data.healPotion.charges,
										level: data.healPotion.level,
										pct: Math.round(data.healPotion.healShare * 100),
										rarity: numeral(data.healPotion.rarity),
									})}
								</span>
							}
						/>
					)}
				</Block>
			)}
		</div>
	);

	const cardZone = (
		<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
			{card ?? <Hint>{t('shop.pickItem')}</Hint>}
		</div>
	);

	return (
		<div
			onFocusCapture={track}
			className={`grid min-h-0 min-w-0 flex-1 gap-3 ${props.wide ? 'grid-cols-[minmax(0,0.8fr)_minmax(0,1.3fr)_minmax(0,1fr)] items-start text-[1.15em] [@media(max-height:500px)]:text-[1em]' : 'grid-cols-1 grid-rows-[auto_auto_minmax(0,1fr)]'}`}
		>
			{compact && !props.wide ? null : (
				<div className="flex min-h-0 min-w-0 flex-col gap-2">{stats}</div>
			)}
			{tiles}
			{props.wide ? (
				cardZone
			) : compact ? null : (
				<div className="flex min-h-0 flex-col">{cardZone}</div>
			)}
		</div>
	);
}
