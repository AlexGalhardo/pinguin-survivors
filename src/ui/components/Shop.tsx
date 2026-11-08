import { type ReactElement, useState } from 'react';
import { GEAR_BY_ID } from '../../data/equipment';
import { LEGACY_GEAR_RARITY, WEAPON_FUSE_MAX } from '../../data/rarity';
import type { SupportId } from '../../data/support';
import type { WeaponId } from '../../data/weapons';
import { MAX_WEAPON_SLOTS } from '../../data/weapons';
import { type I18nKey, t } from '../../i18n';
import { formatStat } from '../../logic/format';
import type { PlayerPanelView } from '../../logic/item-view';
import type { OfferDescription } from '../../logic/shop-describe';
import { resolveWeapon } from '../../logic/weapons';
import { useCompact, useUiScale } from '../compact';
import { FocusScope } from '../focus';
import { merchantLine } from '../merchant';
import { AtlasIcon } from './AtlasIcon';
import { Btn } from './Btn';
import { weaponName } from './Hud';
import {
	type AffixView,
	affixText,
	clampRarity,
	GearCardView,
	type GearItem,
	gearBaseLines,
	numeral,
	rarityCss,
	SlotIcon,
	statLabel,
	WeaponCardView,
	weaponFrames,
} from './ItemViews';
import { MerchantSprite } from './MerchantSprite';
import { Heading, Hint, ItemCard, Panel } from './Panel';
import { PlayerPanel, type PlayerPanelData, panelFromView } from './PlayerPanel';

/** What the shop screen shows; the game publishes it (offers, wallet and the 6 weapon slots). */
export interface ShopOfferData {
	kind: 'weapon' | 'item' | 'gear' | 'potion' | 'support' | 'healPotion';
	id: string;
	/** Weapon/item rarity I..IV, or gear rarity 1..3 (the shop never sells IV or V). */
	tier: number;
	price: number;
	sets: readonly string[];
	/** Rarity I to III (same number as `tier`), random affixes, weapon numbers and gear base stats. */
	rarity?: number;
	affixes?: readonly AffixView[];
	weapon?: { damage: number; cooldown: number; range: number };
	baseStats?: Partial<Record<string, number>>;
	/** What buying it does (`describeOffer`); drawn as the explanation card. */
	description?: OfferDescription;
}

export interface ShopData {
	round: number;
	fish: number;
	/** `null` = already bought slot. */
	offers: readonly (ShopOfferData | null)[];
	locks: readonly boolean[];
	rerollPrice: number;
	weapons: readonly {
		id: string;
		tier: number;
		sellValue: number;
		affixes?: readonly AffixView[];
	}[];
	/** Worn gear ids per slot (helmet, armor, legs, ring, amulet); null = empty. */
	gear: readonly (string | null)[];
	/** The player panel of the contract (stats, weapons and gear with rarity and affixes). */
	player?: PlayerPanelView;
	/** Extra waves of the next round (Danger 2+). */
	nextWaves?: readonly ('elite' | 'horde')[];
}

export interface ShopActions {
	buy: (index: number) => void;
	reroll: () => void;
	/** Opens the skill tree of the run's hero. */
	tree: () => void;
	lock: (index: number) => void;
	sell: (slot: number) => void;
	fuse: (a: number, b: number) => void;
	next: () => void;
}

const GEAR_SLOTS = ['helmet', 'armor', 'legs', 'ring', 'amulet'] as const;

const label = (key: string): string => (t(key as I18nKey) as string | undefined) ?? key;

export function offerName(o: Pick<ShopOfferData, 'kind' | 'id'>): string {
	if (o.kind === 'weapon') return weaponName(o.id);
	if (o.kind === 'gear') return label(`gear.${o.id}`);
	if (o.kind === 'potion') return label(`potion.${o.id}`);
	if (o.kind === 'support') return label(`support.${o.id}.name`);
	if (o.kind === 'healPotion') return label('hpotion.name');
	return label(`item.${o.id}.name`);
}

/** Atlas frames for an offer: weapon tier art, `item.<id>` for gear, a potion icon when drawn. */
const offerFrames = (o: Pick<ShopOfferData, 'kind' | 'id' | 'tier'>): string[] =>
	o.kind === 'weapon'
		? weaponFrames(o.id, o.tier)
		: o.kind === 'gear'
			? [`item.${o.id}`]
			: o.kind === 'potion'
				? [`icon.potion.${o.id}`]
				: o.kind === 'healPotion'
					? ['icon.potion.heal']
					: o.kind === 'support'
						? [SUPPORT_ICON[o.id as SupportId] ?? `item.${o.id}`]
						: [`item.${o.id}`];

/** Support items reuse existing equipment art. */
const SUPPORT_ICON: Record<SupportId, string> = {
	magnetic: 'item.amulet.magnet',
	swift: 'item.legs.hermes',
	lucky: 'item.amulet.clover',
};

/** Neutral tint for potions and support (no rarity); weapons and gear use the rarity palette. */
const offerColor = (o: ShopOfferData): string | undefined =>
	o.kind === 'potion' || o.kind === 'support' || o.kind === 'healPotion'
		? undefined
		: rarityCss(o.tier);

/** Index of another slot holding the same weapon at the same rarity (below the fusion cap), or -1. */
export function fusePartner(weapons: ShopData['weapons'], slot: number): number {
	const w = weapons[slot];
	if (!w || w.tier >= WEAPON_FUSE_MAX) return -1;
	return weapons.findIndex((o, i) => i !== slot && o.id === w.id && o.tier === w.tier);
}

/** Number of a support item as shown: whole units, luck as a share. */
const supportText = (id: string, value: number): string =>
	id === 'lucky' ? `${Math.round(value * 100)}%` : String(value);

/** The sentence that says what buying an offer does. */
function outcomeText(d: OfferDescription): string {
	const o = d.outcome;
	switch (o.type) {
		case 'newWeapon':
			return o.fusableWith === null
				? t('shop.outcome.newWeapon', { slot: o.slot + 1 })
				: t('shop.outcome.newWeaponFuse', {
						slot: o.slot + 1,
						with: o.fusableWith + 1,
						from: numeral(d.rarity),
						to: numeral(d.rarity + 1),
					});
		case 'fuse':
			return t('shop.outcome.fuse', {
				slot: o.slot + 1,
				from: numeral(o.fromRarity),
				to: numeral(o.toRarity),
				n: d.newAffixes,
			});
		case 'barFull':
			return t('shop.outcome.barFull');
		case 'equip':
			return t('shop.outcome.equip', { slot: t(`shop.slot.${o.slot}` as I18nKey) });
		case 'replace':
			return t('shop.outcome.replace', {
				name: label(`gear.${o.worn}`),
				rarity: numeral(o.wornRarity),
				n: o.sellFish,
			});
		case 'potion':
			return t('shop.outcome.potion');
		case 'support': {
			const stat = t(`support.${o.id}.stat` as I18nKey, { v: supportText(o.id, o.value) });
			return o.from === 0
				? t('shop.outcome.supportNew', { stat })
				: t('shop.outcome.supportUp', { from: o.from, to: o.to, stat });
		}
		case 'healPotion':
			return t('shop.outcome.healPotion', {
				from: o.from,
				to: o.to,
				pct: Math.round(o.healShare * 100),
			});
	}
}

/** Explanation of the focused offer: the card (and the worn item beside it for equipment), what buying does, stats before and after. */
function OfferExplain({
	offer,
	worn,
	dense,
	sentenceOnly,
}: {
	offer: ShopOfferData;
	/** Phone landscape: just the sentence of what buying does. */
	sentenceOnly?: boolean;
	/** Short screens: drop the small labels above the two cards. */
	dense: boolean;
	/** The item now worn in the slot this offer would take (equipment only). */
	worn: GearItem | null;
}): ReactElement {
	const d = offer.description;
	const rarity = offer.rarity ?? offer.tier;
	const affixes = offer.affixes ?? offer.description?.affixes ?? [];
	return (
		<div
			className={`flex min-h-0 flex-1 flex-col overflow-hidden ${dense ? 'gap-0.5' : 'gap-1.5'}`}
		>
			{!sentenceOnly && offer.kind === 'gear' && (
				<div className={`grid min-h-0 gap-2 ${worn ? 'grid-cols-2' : 'grid-cols-1'}`}>
					{worn && (
						<div className="flex min-w-0 flex-col gap-0.5">
							{!dense && <Hint>{t('shop.equipped')}</Hint>}
							<GearCardView item={worn} />
						</div>
					)}
					<div className="flex min-w-0 flex-col gap-0.5">
						{!dense && <Hint>{t('shop.offerLabel')}</Hint>}
						<GearCardView item={{ id: offer.id, rarity, affixes }} />
					</div>
				</div>
			)}
			{!sentenceOnly && offer.kind === 'weapon' && (
				<WeaponCardView item={{ id: offer.id, tier: rarity, affixes }} />
			)}
			{!sentenceOnly && offer.kind !== 'gear' && offer.kind !== 'weapon' && (
				<div className="font-bold" style={{ color: offerColor(offer) }}>
					{offerName(offer)}
				</div>
			)}
			{d ? (
				<>
					<p className={`m-0 font-bold ${sentenceOnly ? 'truncate' : ''}`}>
						{outcomeText(d)}
					</p>
					<div className="grid grid-cols-2 gap-x-4" hidden={false}>
						{(sentenceOnly ? [] : d.statChanges).map((c) => {
							const up = c.after > c.before;
							return (
								<div key={c.stat} className={up ? 'text-xp' : 'text-blood'}>
									{t('shop.statChange', {
										label: statLabel(c.stat),
										before: formatStat(c.stat, c.before),
										after: formatStat(c.stat, c.after),
									})}
								</div>
							);
						})}
					</div>
				</>
			) : (
				<Hint>{t(`shop.kind.${offer.kind}` as I18nKey)}</Hint>
			)}
		</div>
	);
}

/** Compact offer: icon, rarity-colored name, a one-line summary and the buy and lock buttons. */
function OfferCard(props: {
	offer: ShopOfferData | null;
	index: number;
	locked: boolean;
	fish: number;
	actions: ShopActions;
	icon: number;
}): ReactElement {
	const { offer, index, actions } = props;
	if (!offer) {
		return (
			<div
				data-offer={index}
				className="flex min-h-16 items-center justify-center border border-snow-dark bg-night/50 text-text-dim"
			>
				{t('shop.sold')}
			</div>
		);
	}
	const affordable = props.fish >= offer.price && offer.description?.outcome.type !== 'barFull';
	const rarity = offer.rarity ?? offer.tier;
	const affixes = offer.affixes ?? offer.description?.affixes ?? [];
	let summary = '';
	if (offer.kind === 'weapon') {
		const w =
			offer.weapon ?? resolveWeapon({ id: offer.id as WeaponId, tier: clampRarity(rarity) });
		summary = `${t('weapon.stat.damage')} ${w.damage} · ${(1 / w.cooldown).toFixed(1)}/s`;
	} else if (offer.kind === 'gear') {
		summary = (
			offer.baseStats
				? Object.entries(offer.baseStats).map(
						([k, v]) => `${formatStat(k, v as number, true)} ${statLabel(k)}`,
					)
				: gearBaseLines(offer.id)
		).join(' · ');
	}
	const sets = offer.sets.map((s) => label(`shop.set.${s}`)).join(' / ');
	return (
		<div data-offer={index} className="min-w-0">
			<ItemCard
				name={
					<span className="flex items-center gap-2">
						{offer.kind === 'potion' || offer.kind === 'healPotion' ? (
							<AtlasIcon frames={offerFrames(offer)} size={props.icon} />
						) : (
							<SlotIcon
								frames={offerFrames(offer)}
								rarity={offer.tier}
								size={props.icon}
							/>
						)}
						<span className="min-w-0 flex-1 truncate">{offerName(offer)}</span>
					</span>
				}
				color={offerColor(offer)}
				kind={`${t(`shop.kind.${offer.kind}` as I18nKey)}${
					offer.kind === 'weapon' || offer.kind === 'item' || offer.kind === 'gear'
						? ` · ${numeral(offer.tier)}`
						: ''
				}${sets ? ` · ${sets}` : ''}`}
				lines={[
					summary ? (
						<span key="s" className="block truncate">
							{summary}
						</span>
					) : null,
					affixes.length > 0 ? (
						<span key="a" className="block truncate text-xp">
							{affixes.map((a) => `✦ ${affixText(a)}`).join('  ')}
						</span>
					) : offer.kind === 'support' || offer.kind === 'healPotion' ? (
						<Hint key="n">
							{offer.kind === 'support'
								? t(`support.${offer.id}.desc` as I18nKey)
								: t('hpotion.desc')}
						</Hint>
					) : (
						<Hint key="n">{t('shop.noAffixes')}</Hint>
					),
				].filter(Boolean)}
				footer={
					<div className="mt-1 flex gap-1.5">
						<Btn
							onActivate={() => actions.buy(index)}
							disabled={!affordable}
							tint={offerColor(offer)}
							className={`flex-1 ${offerColor(offer) ? '' : 'border-fish text-fish'}`}
						>
							{t('shop.buy', { n: offer.price })}
						</Btn>
						<Btn
							onActivate={() => actions.lock(index)}
							tint={offerColor(offer)}
							className={
								offerColor(offer)
									? ''
									: props.locked
										? 'border-crit text-crit'
										: 'border-snow text-text-dim'
							}
						>
							{t(props.locked ? 'shop.unlock' : 'shop.lock')}
						</Btn>
					</div>
				}
			/>
		</div>
	);
}

/**
 * End-of-round shop, vendor style, built to never scroll: the merchant and the offers on the left
 * with the explanation of the focused offer below, the player on the right. Text follows the
 * screen height (`vh`), icons follow `useUiScale`.
 */
export function Shop({
	data,
	actions: game,
}: {
	data: ShopData;
	actions: ShopActions;
}): ReactElement {
	const [speech, setSpeech] = useState(() => merchantLine('open'));
	const firstOffer = data.offers.findIndex((o) => o !== null);
	const [picked, setPicked] = useState(0);
	const scale = useUiScale();
	// Phone landscape: two offers per page (◀ ▶), no merchant sprite and only the sentence of the explanation.
	const compact = useCompact();
	const [offerPage, setOfferPage] = useState(0);
	const OFFERS_PER_PAGE = compact ? 2 : data.offers.length;
	const offerPages = Math.max(1, Math.ceil(data.offers.length / OFFERS_PER_PAGE));
	const shownPage = Math.min(offerPage, offerPages - 1);
	const icon = Math.max(32, Math.round(48 * scale));
	const shown = data.offers[picked] ?? data.offers[firstOffer] ?? null;
	// The merchant comments on what the player just did; purely cosmetic.
	const actions: ShopActions = {
		...game,
		buy: (i) => {
			const offer = data.offers[i];
			const left = data.fish - (offer?.price ?? 0);
			const cheapest = Math.min(
				data.rerollPrice,
				...data.offers.flatMap((o, j) => (o && j !== i ? [o.price] : [])),
			);
			setSpeech(merchantLine(left < cheapest ? 'noFish' : 'buy'));
			game.buy(i);
		},
		reroll: () => {
			setSpeech(merchantLine('reroll'));
			game.reroll();
		},
		fuse: (a, b) => {
			setSpeech(merchantLine('fuse'));
			game.fuse(a, b);
		},
		next: () => {
			setSpeech(merchantLine('leave'));
			game.next();
		},
	};

	const wornFor = (o: ShopOfferData): GearItem | null => {
		const slot = o.kind === 'gear' ? GEAR_BY_ID[o.id]?.slot : undefined;
		const item = slot ? data.player?.gear.find((g) => g.slot === slot)?.item : null;
		return item ? { id: item.id, rarity: item.rarity, affixes: item.affixes } : null;
	};
	const player: PlayerPanelData = data.player
		? panelFromView(data.player, { maxWeapons: MAX_WEAPON_SLOTS })
		: {
				stats: [],
				weapons: data.weapons,
				maxWeapons: MAX_WEAPON_SLOTS,
				gear: GEAR_SLOTS.map((slot, i) => {
					const id = data.gear[i] ?? null;
					const def = id ? GEAR_BY_ID[id] : undefined;
					return {
						slot,
						item: id
							? { id, rarity: def ? LEGACY_GEAR_RARITY[def.rarity] : 1, affixes: [] }
							: null,
					};
				}),
			};

	return (
		<FocusScope className="fixed inset-0 flex flex-col gap-[1vh] overflow-hidden bg-night px-[2vw] py-[1.5vh] [@media(max-height:400px)]:gap-0 [@media(max-height:400px)]:py-0.5 font-body text-[clamp(0.55rem,1.55vh,2.4rem)] text-text-light">
			<header className="flex flex-wrap items-center justify-between gap-2">
				<Heading className="min-w-[16rem] flex-1">
					{t('shop.title', { n: data.round })}
				</Heading>
				{data.nextWaves && data.nextWaves.length > 0 && (
					<div className="border border-blood bg-blood/20 px-3 py-0.5 font-bold text-blood">
						{data.nextWaves.map((k) => t(`shop.nextWave.${k}` as I18nKey)).join(' · ')}
					</div>
				)}
				<div className="flex items-center gap-1 font-bold text-fish">
					<AtlasIcon
						frames={['icon.currency.fish']}
						size={Math.max(24, Math.round(28 * scale))}
					/>
					{t('shop.fish', { n: data.fish })}
				</div>
			</header>

			<main className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-3">
				<Panel
					fit
					title={
						<span className="flex items-center gap-2">
							<span className="flex-1">{t('shop.merchant')}</span>
							{offerPages > 1 && (
								<span className="flex items-center gap-1 font-normal tracking-normal">
									<Btn
										onActivate={() =>
											setOfferPage((shownPage - 1 + offerPages) % offerPages)
										}
										className="min-h-8 border-snow px-2 py-0"
										label="-"
									>
										◀
									</Btn>
									<span className="tabular-nums">
										{shownPage + 1}/{offerPages}
									</span>
									<Btn
										onActivate={() =>
											setOfferPage((shownPage + 1) % offerPages)
										}
										className="min-h-8 border-snow px-2 py-0"
										label="+"
									>
										▶
									</Btn>
								</span>
							)}
						</span>
					}
					className="min-h-0"
				>
					<div className="flex items-center gap-3">
						{/* Pixel art only scales by whole numbers: below ~970 px of height it would not fit, so only the speech stays. */}
						{scale >= 0.9 && !compact && (
							<MerchantSprite
								scale={scale >= 1.5 ? 2 : 1}
								title={t('shop.merchant')}
							/>
						)}
						<div
							role="status"
							aria-live="polite"
							className="min-w-0 flex-1 border border-snow-dark bg-night/80 px-3 py-1 italic"
						>
							{speech}
						</div>
					</div>
					<div
						className="grid grid-cols-2 gap-2"
						onFocusCapture={(e) => {
							const el = (e.target as HTMLElement).closest<HTMLElement>(
								'[data-offer]',
							);
							if (el) setPicked(Number(el.dataset.offer));
						}}
					>
						{data.offers.map((o, i) =>
							i >= shownPage * OFFERS_PER_PAGE &&
							i < (shownPage + 1) * OFFERS_PER_PAGE ? (
								<OfferCard
									key={o ? `${o.id}-${i}` : `sold-${i}`}
									offer={o}
									index={i}
									locked={data.locks[i] ?? false}
									fish={data.fish}
									actions={actions}
									icon={icon}
								/>
							) : null,
						)}
					</div>
					{shown && (
						<OfferExplain
							offer={shown}
							worn={wornFor(shown)}
							dense={scale < 0.9}
							sentenceOnly={compact}
						/>
					)}
				</Panel>

				<Panel fit title={t('shop.you')} className="min-h-0">
					<PlayerPanel
						data={player}
						weaponBar={(slot) => {
							const w = data.weapons[slot];
							if (!w) return null;
							const partner = fusePartner(data.weapons, slot);
							return (
								<>
									<Btn
										onActivate={() => actions.sell(slot)}
										tint={rarityCss(w.tier)}
										className="text-[0.9em]"
									>
										{t('shop.sell', { n: w.sellValue })}
									</Btn>
									{partner >= 0 && (
										<Btn
											onActivate={() => actions.fuse(slot, partner)}
											tint={rarityCss(w.tier)}
											className="text-[0.9em]"
										>
											{t('shop.fuse')}
										</Btn>
									)}
								</>
							);
						}}
					/>
				</Panel>
			</main>

			<footer className="flex flex-wrap items-center justify-between gap-2">
				<Btn
					onActivate={actions.reroll}
					disabled={data.fish < data.rerollPrice}
					variant="secondary"
				>
					{t('shop.reroll', { n: data.rerollPrice })}
				</Btn>
				<Btn onActivate={actions.tree} variant="secondary">
					{t('menu.workshop')}
				</Btn>
				<Btn onActivate={actions.next} variant="primary" className="min-w-52 text-[1.15em]">
					{t('shop.next')}
				</Btn>
			</footer>
		</FocusScope>
	);
}
