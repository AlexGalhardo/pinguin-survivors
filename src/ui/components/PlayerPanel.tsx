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
	gearName,
	numeral,
	rarityCss,
	SlotIcon,
	StatLine,
	WeaponCardView,
	type WeaponItem,
	weaponFrames,
} from './ItemViews';
import { Ornament } from './Ornament';
import { Hint, ItemCard, StatRow } from './Panel';

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

export type Detail =
	| { kind: 'weapon'; slot: number }
	| { kind: 'gear'; slot: string }
	| { kind: 'support'; id: string }
	| { kind: 'potion' };

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

/** Column title over the pause slots. */
const SLOT_HEAD =
	'text-secondary font-black tracking-section whitespace-nowrap text-gold-bright uppercase';

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
	if (detail?.kind === 'support') {
		const s = data.support?.find((x) => x.id === detail.id);
		return s ? (
			<ItemCard
				name={t(`support.${s.id}.name` as I18nKey)}
				kind={`${t('shop.kind.support')} · ${t('support.level', { n: s.level, max: s.max })}`}
				lines={[<Hint key="d">{t(`support.${s.id}.desc` as I18nKey)}</Hint>]}
			/>
		) : null;
	}
	if (detail?.kind === 'potion' && data.healPotion) {
		return (
			<ItemCard
				name={t('hpotion.name')}
				color={rarityCss(data.healPotion.rarity)}
				kind={`${t('shop.kind.healPotion')} · ${numeral(data.healPotion.rarity)}`}
				lines={[<Hint key="d">{t('hpotion.desc')}</Hint>]}
			/>
		);
	}
	return null;
}

export function Block(props: { title: string; children: ReactNode }): ReactElement {
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
	head: { key: string; value: string }[];
	line: string;
	rest: { key: string; value: string }[];
} {
	const head = ['maxHp', 'armor', 'damage']
		.map((k) => data.stats.find((s) => s.key === k))
		.filter((s): s is { key: string; value: string } => Boolean(s));
	return {
		head,
		line: head.map((s) => `${t(`gstat.${s.key}` as I18nKey)} ${s.value}`).join(' · '),
		rest: data.stats.filter((s) => !head.includes(s)),
	};
}

/** Section title of the shop columns ("YOUR EQUIPMENT", "DETAILS"): gold small caps over a thinning filet. */
export function SectionTitle(props: { children: ReactNode }): ReactElement {
	return (
		<div className="flex flex-col gap-1">
			<h2 className="m-0 font-body text-item font-black tracking-section text-gold-bright uppercase">
				{props.children}
			</h2>
			<Ornament kind="filet" size="compact" />
		</div>
	);
}

/** Hero stats as a compact four-column strip (3 rows): the headline three first and bold, then the rest. */
export function HeroStats({
	data,
	icons = true,
}: {
	data: PlayerPanelData;
	/** Off on short screens: the 32 px icons would make the three rows taller than the text. */
	icons?: boolean;
}): ReactElement {
	const head = ['maxHp', 'armor', 'damage'];
	const sorted = [...data.stats].sort((a, b) => {
		const ia = head.indexOf(a.key);
		const ib = head.indexOf(b.key);
		return (ia < 0 ? head.length : ia) - (ib < 0 ? head.length : ib);
	});
	return (
		<div className="grid grid-cols-4 gap-x-4">
			{sorted.map((s) => (
				<StatLine
					key={s.key}
					stat={s.key}
					value={s.value}
					strong={head.includes(s.key)}
					icon={icons}
				/>
			))}
		</div>
	);
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
	const icon = compact ? 32 : Math.max(28, Math.round((props.wide ? 68 : 60) * scale));
	const [detail, setDetail] = useState<Detail | null>(null);
	// Phone: no slot is picked until the player taps one, then the action bar appears.
	const [pickedWeapon, setPickedWeapon] = useState<number | null>(compact ? null : 0);
	const slots = Array.from({ length: data.maxWeapons }, (_, i) => data.weapons[i]);
	const { head, line, rest } = headlineOf(data);

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
		else if (kind === 'support') pick({ kind: 'support', id: id as string });
		else if (kind === 'potion') pick({ kind: 'potion' });
	};

	const tile = (
		w: { frames: string[]; rarity: number; label: string; detail: string },
		active: boolean,
		onClick: () => void,
	): ReactElement => (
		<div key={w.detail} data-detail={w.detail} className="flex">
			<Btn
				onActivate={onClick}
				className={`flex flex-col items-center justify-center gap-0 border-0! bg-transparent py-0 pr-0! pl-0! ${active ? 'outline outline-1 outline-crit' : ''}`}
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
		<div key={key} title={label} className="flex flex-col items-center">
			<div
				className="border border-dashed border-snow bg-night/40"
				style={{ width: icon + 8, height: icon + 8 }}
			/>
			{/* Same footprint as a filled tile (icon plus its numeral line), so the two columns align. */}
			{!compact && <span className="text-key leading-tight">&nbsp;</span>}
		</div>
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

	if (!props.wide && !compact) {
		const rowIcon = Math.max(22, Math.round(24 * scale));
		const row = (o: {
			detail: string;
			frames: string[];
			rarity: number;
			label: string;
			name: string;
			active: boolean;
			onClick: () => void;
			actions?: ReactNode;
		}): ReactElement => (
			<div key={o.detail} data-detail={o.detail} className="flex min-w-0 items-center">
				<Btn
					onActivate={o.onClick}
					label={o.label}
					className={`min-h-[34px]! min-w-0 flex-1 justify-start! gap-2 py-0! text-left normal-case! tracking-normal! ${o.active ? 'bg-gold-bright/10' : ''}`}
				>
					<SlotIcon frames={o.frames} rarity={o.rarity} size={rowIcon} />
					<span
						className="min-w-0 flex-1 leading-tight"
						style={{ color: rarityCss(o.rarity) }}
					>
						{o.name}
					</span>
					<span className="font-black" style={{ color: rarityCss(o.rarity) }}>
						{numeral(o.rarity)}
					</span>
				</Btn>
				{o.actions}
			</div>
		);
		const owned = data.weapons.length;
		return (
			<div onFocusCapture={track} className="flex min-h-0 min-w-0 flex-col gap-1">
				<SectionTitle>{t('shop.yourGear')}</SectionTitle>
				<Block title={`${t('shop.weapons')} ${owned}/${data.maxWeapons}`}>
					{data.weapons.map((w, i) =>
						row({
							detail: `weapon:${i}`,
							frames: weaponFrames(w.id, w.tier),
							rarity: w.tier,
							label: weaponName(w.id),
							name: weaponName(w.id),
							active: pickedWeapon === i,
							onClick: () => pick({ kind: 'weapon', slot: i }),
							actions:
								pickedWeapon === i && props.weaponBar ? (
									<div className="flex shrink-0 items-center">
										{props.weaponBar(i)}
									</div>
								) : undefined,
						}),
					)}
					{owned < data.maxWeapons && (
						<span className="text-secondary text-text-dim">
							{t('shop.empty')} ×{data.maxWeapons - owned}
						</span>
					)}
				</Block>
				<Block title={t('shop.equipment')}>
					{data.gear.map((g) =>
						g.item
							? row({
									detail: `gear:${g.slot}`,
									frames: [`item.${g.item.id}`],
									rarity: g.item.rarity,
									label: slotLabel(g.slot),
									name: gearName(g.item.id),
									active: false,
									onClick: () => pick({ kind: 'gear', slot: g.slot }),
								})
							: null,
					)}
					{/* One line for every free slot: a line per empty slot pushed the support rows off short screens. */}
					{data.gear.some((g) => !g.item) && (
						<span className="text-secondary text-text-dim">
							{t('shop.empty')}:{' '}
							{data.gear
								.filter((g) => !g.item)
								.map((g) => slotLabel(g.slot))
								.join(' · ')}
						</span>
					)}
				</Block>
				{supportLines && (
					<Block
						title={`${t('panel.support')} ${data.support?.length ?? 0}/${data.supportSlots ?? 0}`}
					>
						{data.support?.map((s) => (
							<div key={s.id} data-detail={`support:${s.id}`} className="flex">
								<Btn
									onActivate={() => pick({ kind: 'support', id: s.id })}
									className="min-h-[34px]! w-full justify-between! py-0! normal-case! tracking-normal!"
								>
									<span>{t(`support.${s.id}.name` as I18nKey)}</span>
									<span className="tabular-nums">
										{t('support.level', { n: s.level, max: s.max })}
									</span>
								</Btn>
							</div>
						))}
						{data.healPotion && (
							<div data-detail="potion:heal" className="flex">
								<Btn
									onActivate={() => pick({ kind: 'potion' })}
									className="min-h-[34px]! w-full justify-between! py-0! normal-case! tracking-normal!"
								>
									<span>{t('hpotion.name')}</span>
									<span className="tabular-nums">
										{data.healPotion.charges}/{data.healPotion.level}
									</span>
								</Btn>
							</div>
						)}
					</Block>
				)}
			</div>
		);
	}

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
				{compact ? (
					<p className="m-0 text-body font-black uppercase">{line}</p>
				) : (
					<div className="grid grid-cols-3 gap-2 border-b border-line pb-2">
						{head.map((s) => (
							<div key={s.key} className="flex flex-col items-center">
								<span className="text-title leading-tight font-black text-gold-bright tabular-nums">
									{s.value}
								</span>
								<span className="text-secondary font-bold tracking-section whitespace-nowrap uppercase">
									{t(`gstat.${s.key}` as I18nKey)}
								</span>
							</div>
						))}
					</div>
				)}
				{compact ? (
					<p className="m-0 text-secondary leading-snug">
						{rest
							.map((s) => `${t(`gstat.${s.key}` as I18nKey)} ${s.value}`)
							.join(' · ')}
					</p>
				) : (
					<div className="flex flex-col gap-1">
						{rest.map((s) => (
							<StatLine key={s.key} stat={s.key} value={s.value} />
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
			{compact ? (
				<div className="order-2 flex min-h-0 min-w-0 flex-col items-center justify-center gap-1.5">
					<div className="flex gap-1.5">{gearTiles}</div>
					<div className="flex gap-1.5">{weaponTiles}</div>
				</div>
			) : (
				// One column-flow grid for both lists: a row is as tall as its tallest cell, so slots line up.
				<div
					className="order-2 grid min-h-0 min-w-0 grid-flow-col content-start items-start justify-center justify-items-center gap-x-[1.5vw] gap-y-1.5"
					style={{ gridTemplateRows: `repeat(${data.maxWeapons + 1}, auto)` }}
				>
					<span className={SLOT_HEAD}>{t('shop.equipment')}</span>
					{gearTiles}
					{/* Fills the rest of the first column, so the weapons start at the top of the second. */}
					{data.maxWeapons > data.gear.length && (
						<span style={{ gridRow: `span ${data.maxWeapons - data.gear.length}` }} />
					)}
					<span className={SLOT_HEAD}>
						{t('shop.weapons')} {data.weapons.length}/{data.maxWeapons}
					</span>
					{weaponTiles}
				</div>
			)}
		</div>
	);
}
