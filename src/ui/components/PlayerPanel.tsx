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

export type Detail = { kind: 'weapon'; slot: number } | { kind: 'gear'; slot: string };

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

/** Tooltip card of the owned item a `Detail` points at, or null when the slot is empty. */
export function detailCard(data: PlayerPanelData, detail: Detail | null): ReactElement | null {
	if (detail?.kind === 'weapon') {
		const w = data.weapons[detail.slot];
		return w ? <WeaponCardView item={w} /> : null;
	}
	if (detail?.kind === 'gear') {
		const item = data.gear.find((g) => g.slot === detail.slot)?.item;
		return item ? <GearCardView item={item} /> : null;
	}
	return null;
}

function Block(props: { title: string; children: ReactNode }): ReactElement {
	return (
		<section className="flex min-w-0 flex-col gap-1">
			<h3 className="m-0 flex items-center gap-2 font-body text-section font-black tracking-section text-gold-bright uppercase">
				<span className="diamond" />
				{props.title}
			</h3>
			{props.children}
		</section>
	);
}

/** The three headline numbers as one line, and the other stats. */
function headlineOf(data: PlayerPanelData): {
	line: string;
	rest: { key: string; value: string }[];
} {
	const head = ['maxHp', 'armor', 'damage']
		.map((k) => data.stats.find((s) => s.key === k))
		.filter((s): s is { key: string; value: string } => Boolean(s));
	return {
		line: head.map((s) => `${t(`gstat.${s.key}` as I18nKey)} ${s.value}`).join(' · '),
		rest: data.stats.filter((s) => !head.includes(s)),
	};
}

/**
 * The player's side of the shop and the pause screen (Style D, no boxes, never scrolls). Shop: one
 * bold line of headline numbers, the other stats in a sentence, the 6 weapon and 5 equipment slots
 * in one row, the action bar of the picked weapon and the support lines. Pause (`wide`): stats on
 * the left, slots in two columns in the middle and, on the right, the card of the focused slot
 * over `footer` (the actions). Focus (keyboard, pad, mouse) on a slot picks the item.
 */
export function PlayerPanel(props: {
	data: PlayerPanelData;
	/** Actions for the picked weapon slot (sell, fuse), in a fixed bar under the weapon tiles. */
	weaponBar?: (slot: number) => ReactNode;
	/** Pause layout. */
	wide?: boolean;
	/** Pause: the actions under the card. */
	footer?: ReactNode;
	/** Called when focus or a click picks an owned item (the shop draws the card itself). */
	onPick?: (d: Detail) => void;
}): ReactElement {
	const { data } = props;
	const scale = useUiScale();
	const compact = useCompact();
	const icon = compact ? 32 : Math.max(28, Math.round((props.wide ? 80 : 60) * scale));
	const [detail, setDetail] = useState<Detail | null>(null);
	// Phone: no slot is picked until the player taps one, then the action bar appears.
	const [pickedWeapon, setPickedWeapon] = useState<number | null>(compact ? null : 0);
	const slots = Array.from({ length: data.maxWeapons }, (_, i) => data.weapons[i]);
	const { line, rest } = headlineOf(data);

	const pick = (d: Detail): void => {
		setDetail(d);
		if (d.kind === 'weapon') setPickedWeapon(d.slot);
		props.onPick?.(d);
	};
	// Focus bubbles from the tiles: the nearest wrapper decides which card to show.
	const track = (e: React.FocusEvent<HTMLElement>): void => {
		const el = (e.target as HTMLElement).closest<HTMLElement>('[data-detail]');
		const v = el?.dataset.detail;
		if (!v) return;
		const [kind, id] = v.split(':');
		if (kind === 'weapon') pick({ kind: 'weapon', slot: Number(id) });
		else if (kind === 'gear') pick({ kind: 'gear', slot: id as string });
	};

	const tile = (
		w: { frames: string[]; rarity: number; label: string; detail: string },
		active: boolean,
		onClick: () => void,
	): ReactElement => (
		<div key={w.detail} data-detail={w.detail} className="flex">
			<Btn
				onActivate={onClick}
				className={`flex flex-col items-center justify-center gap-0 border-0 bg-transparent py-0 pr-0! pl-0! ${active ? 'outline outline-1 outline-crit' : ''}`}
				label={w.label}
			>
				<SlotIcon frames={w.frames} rarity={w.rarity} size={icon} />
				{!compact && (
					<span
						className="text-key leading-tight font-black"
						style={{ color: rarityCss(w.rarity) }}
					>
						{numeral(w.rarity)}
					</span>
				)}
			</Btn>
		</div>
	);
	const empty = (key: string, label?: string): ReactElement => (
		<div
			key={key}
			title={label}
			className="border border-dashed border-snow-dark bg-night/40"
			style={{ width: icon + 8, height: icon + 8 }}
		></div>
	);
	const weaponTiles = slots.map((w, i) =>
		w
			? tile(
					{
						frames: weaponFrames(w.id, w.tier),
						rarity: w.tier,
						label: weaponName(w.id),
						detail: `weapon:${i}`,
					},
					pickedWeapon === i,
					() => pick({ kind: 'weapon', slot: i }),
				)
			: // Fixed slots: the position is the identity.
				empty(`w${i}`),
	);
	const gearTiles = data.gear.map((g) =>
		g.item
			? tile(
					{
						frames: [`item.${g.item.id}`],
						rarity: g.item.rarity,
						label: slotLabel(g.slot),
						detail: `gear:${g.slot}`,
					},
					false,
					() => pick({ kind: 'gear', slot: g.slot }),
				)
			: empty(`g${g.slot}`, slotLabel(g.slot)),
	);

	const picked = pickedWeapon === null ? undefined : data.weapons[pickedWeapon];
	const bar =
		props.weaponBar && !props.wide ? (
			picked && pickedWeapon !== null ? (
				<div className="flex flex-wrap items-center gap-x-3">
					<span
						className="min-w-0 flex-1 truncate text-body font-bold"
						style={{ color: rarityCss(picked.tier) }}
					>
						{weaponName(picked.id)} {numeral(picked.tier)}
					</span>
					{props.weaponBar(pickedWeapon)}
				</div>
			) : (
				<Hint>{t('shop.tapSlot')}</Hint>
			)
		) : null;

	const supportLines = (data.support?.length || data.healPotion) && (
		<div className="flex flex-col">
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
		</div>
	);

	if (!props.wide) {
		return (
			<div onFocusCapture={track} className="flex min-h-0 min-w-0 flex-col gap-1.5">
				<p className="m-0 text-body font-black tracking-wider uppercase">{line}</p>
				{!compact && (
					<p className="m-0 text-secondary leading-snug text-text-light">
						{rest
							.map((s) => `${t(`gstat.${s.key}` as I18nKey)} ${s.value}`)
							.join(' · ')}
					</p>
				)}
				<div
					className={
						compact ? 'flex flex-col gap-1.5' : 'flex flex-wrap items-start gap-1.5'
					}
				>
					<div className="flex gap-1.5">{weaponTiles}</div>
					{!compact && <span className="w-4" />}
					<div className="flex gap-1.5">{gearTiles}</div>
				</div>
				{bar}
				{!compact && supportLines}
			</div>
		);
	}

	return (
		<div
			onFocusCapture={track}
			className={`grid min-h-0 min-w-0 flex-1 gap-[2vw] ${compact ? 'grid-cols-[minmax(0,0.8fr)_auto_minmax(0,1fr)]' : 'grid-cols-[minmax(0,0.95fr)_minmax(0,0.9fr)_minmax(0,1fr)]'}`}
		>
			{/* Right column first in the DOM so the actions get the initial focus. */}
			<div className="order-3 flex min-h-0 min-w-0 flex-col justify-between gap-2">
				<div className="min-h-0 overflow-hidden">
					{detailCard(data, detail) ?? <Hint>{t('shop.pickItem')}</Hint>}
				</div>
				{props.footer}
			</div>
			<div className="order-1 flex min-h-0 min-w-0 flex-col gap-1.5">
				<p className="m-0 text-list font-black uppercase [@media(max-height:500px)]:text-body">
					{line}
				</p>
				{compact ? (
					<p className="m-0 text-secondary leading-snug">
						{rest
							.map((s) => `${t(`gstat.${s.key}` as I18nKey)} ${s.value}`)
							.join(' · ')}
					</p>
				) : (
					<div>
						{rest.map((s) => (
							<StatRow
								key={s.key}
								label={
									<span className="capitalize">
										{t(`gstat.${s.key}` as I18nKey)}
									</span>
								}
								value={s.value}
							/>
						))}
					</div>
				)}
				{data.cards && data.cards.length > 0 && !compact && (
					<Block title={t('pause.cards')}>
						<Hint>
							{data.cards
								.map((c) => `${c.name} ${t('hud.level', { n: c.level })}`)
								.join(' · ')}
						</Hint>
					</Block>
				)}
				{!compact && supportLines && (
					<Block
						title={`${t('panel.support')} ${data.support?.length ?? 0}/${data.supportSlots ?? 0}`}
					>
						{supportLines}
					</Block>
				)}
			</div>
			<div
				className={`order-2 flex min-h-0 min-w-0 justify-center ${compact ? 'flex-col items-center gap-1.5' : 'items-start gap-[1.5vw]'}`}
			>
				<div className={`flex gap-1.5 ${compact ? 'flex-row' : 'flex-col'}`}>
					{gearTiles}
				</div>
				<div className={`flex gap-1.5 ${compact ? 'flex-row' : 'flex-col'}`}>
					{weaponTiles}
				</div>
			</div>
		</div>
	);
}
