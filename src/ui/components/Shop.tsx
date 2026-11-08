import { type ReactElement, type ReactNode, useState } from 'react';
import { GEAR_BY_ID } from '../../data/equipment';
import { LEGACY_GEAR_RARITY, WEAPON_FUSE_MAX } from '../../data/rarity';
import type { WeaponId } from '../../data/weapons';
import { MAX_WEAPON_SLOTS } from '../../data/weapons';
import { type I18nKey, t } from '../../i18n';
import { formatStat } from '../../logic/format';
import type { PlayerPanelView } from '../../logic/item-view';
import type { OfferDescription } from '../../logic/shop-describe';
import { resolveWeapon } from '../../logic/weapons';
import { useMedia } from '../compact';
import { FocusScope } from '../focus';
import { merchantLine } from '../merchant';
import { AtlasIcon } from './AtlasIcon';
import { Btn } from './Btn';
import { weaponName } from './Hud';
import {
	AffixLines,
	type AffixView,
	clampRarity,
	gearBaseLines,
	numeral,
	rarityCss,
	SlotIcon,
	statLabel,
	weaponFrames,
} from './ItemViews';
import { MerchantSprite } from './MerchantSprite';
import { Filet, Hint, ItemCard, Panel, StatRow } from './Panel';
import { PlayerPanel, type PlayerPanelData, panelFromView } from './PlayerPanel';

/** What the shop screen shows; the game publishes it (offers, wallet and the 6 weapon slots). */
export interface ShopOfferData {
	kind: 'weapon' | 'item' | 'gear' | 'potion';
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
				: [`item.${o.id}`];

/** Neutral tint for potions (no rarity); weapons and gear use the rarity palette. */
const offerColor = (o: ShopOfferData): string | undefined =>
	o.kind === 'potion' ? undefined : rarityCss(o.tier);

/** Index of another slot holding the same weapon at the same rarity (below the fusion cap), or -1. */
export function fusePartner(weapons: ShopData['weapons'], slot: number): number {
	const w = weapons[slot];
	if (!w || w.tier >= WEAPON_FUSE_MAX) return -1;
	return weapons.findIndex((o, i) => i !== slot && o.id === w.id && o.tier === w.tier);
}

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
		case 'bag':
			return t('shop.outcome.bag', { slot: t(`shop.slot.${o.slot}` as I18nKey) });
		case 'potion':
			return t('shop.outcome.potion');
	}
}

/** Explanation card of the focused offer: the sentence and the stats before and after. */
function OfferExplain({ offer }: { offer: ShopOfferData }): ReactElement {
	const d = offer.description;
	return (
		<div className="flex flex-col gap-1 border border-snow-dark bg-night/60 p-3">
			<div className="font-bold" style={{ color: offerColor(offer) }}>
				{offerName(offer)}
			</div>
			{d ? (
				<>
					<p className="m-0">{outcomeText(d)}</p>
					{d.statChanges.map((c) => {
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
				</>
			) : (
				<Hint>{t(`shop.kind.${offer.kind}` as I18nKey)}</Hint>
			)}
		</div>
	);
}

function OfferCard(props: {
	offer: ShopOfferData | null;
	index: number;
	locked: boolean;
	fish: number;
	actions: ShopActions;
}): ReactElement {
	const { offer, index, actions } = props;
	if (!offer) {
		return (
			<div
				data-offer={index}
				className="flex min-h-24 items-center justify-center border border-snow-dark bg-night/50 text-text-dim"
			>
				{t('shop.sold')}
			</div>
		);
	}
	const affordable = props.fish >= offer.price && offer.description?.outcome.type !== 'barFull';
	const rarity = offer.rarity ?? offer.tier;
	const affixes = offer.affixes ?? offer.description?.affixes;
	let lines: ReactNode[] = [];
	if (offer.kind === 'weapon') {
		const w =
			offer.weapon ?? resolveWeapon({ id: offer.id as WeaponId, tier: clampRarity(rarity) });
		lines = [
			<StatRow key="d" label={t('weapon.stat.damage')} value={w.damage} />,
			<StatRow key="r" label={t('weapon.stat.rate')} value={(1 / w.cooldown).toFixed(1)} />,
			<AffixLines key="a" affixes={affixes} />,
		];
	} else if (offer.kind === 'gear') {
		lines = [
			...(offer.baseStats
				? Object.entries(offer.baseStats).map(
						([k, v]) => `${formatStat(k, v as number, true)} ${statLabel(k)}`,
					)
				: gearBaseLines(offer.id)
			).map((l) => <span key={l}>{l}</span>),
			<AffixLines key="a" affixes={affixes} />,
		];
	}
	const sets = offer.sets.map((s) => label(`shop.set.${s}`)).join(' / ');
	return (
		<div data-offer={index}>
			<ItemCard
				name={
					<span className="flex items-center gap-2">
						{offer.kind === 'potion' ? (
							<AtlasIcon frames={offerFrames(offer)} size={40} />
						) : (
							<SlotIcon frames={offerFrames(offer)} rarity={offer.tier} size={40} />
						)}
						<span className="min-w-0 flex-1">{offerName(offer)}</span>
					</span>
				}
				color={offerColor(offer)}
				kind={`${t(`shop.kind.${offer.kind}` as I18nKey)}${
					offer.kind === 'weapon' || offer.kind === 'item' || offer.kind === 'gear'
						? ` · ${numeral(offer.tier)}`
						: ''
				}${sets ? ` · ${sets}` : ''}`}
				lines={lines}
				footer={
					<div className="mt-1 flex gap-2">
						<Btn
							onActivate={() => actions.buy(index)}
							disabled={!affordable}
							className="flex-1 border-fish text-fish"
						>
							{t('shop.buy', { n: offer.price })}
						</Btn>
						<Btn
							onActivate={() => actions.lock(index)}
							className={
								props.locked ? 'border-crit text-crit' : 'border-snow text-text-dim'
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

/** End-of-round shop, vendor style: the merchant and the offers as item cards on the left, the player on the right. */
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
	// Whole-number sprite scale (pixel art): 3x on tall screens, 2x otherwise.
	const tall = useMedia('(min-height: 1200px)');
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
		<FocusScope className="fixed inset-0 flex flex-col gap-[1.2vh] bg-night px-[2vw] py-[1.5vh] font-body text-[clamp(0.8rem,1.7vh,1.125rem)] text-text-light">
			<header className="flex flex-wrap items-center justify-between gap-2">
				<h1 className="m-0 font-title text-[1.8em] font-bold tracking-wide uppercase">
					{t('shop.title', { n: data.round })}
				</h1>
				{data.nextWaves && data.nextWaves.length > 0 && (
					<div className="border border-blood bg-blood/20 px-3 py-1 font-bold text-blood">
						{data.nextWaves.map((k) => t(`shop.nextWave.${k}` as I18nKey)).join(' · ')}
					</div>
				)}
				<div className="flex items-center gap-1 font-bold text-fish">
					<AtlasIcon frames={['icon.currency.fish']} size={32} />
					{t('shop.fish', { n: data.fish })}
				</div>
			</header>
			<Filet />

			<main className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto min-[1100px]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] min-[1100px]:overflow-hidden">
				<Panel title={t('shop.merchant')} className="min-h-0">
					<div className="flex items-center gap-3 [@media(max-height:500px)]:hidden">
						<MerchantSprite scale={tall ? 3 : 2} title={t('shop.merchant')} />
						<div
							role="status"
							aria-live="polite"
							className="min-w-0 flex-1 border border-snow-dark bg-night/80 px-3 py-1 text-[0.95em] italic"
						>
							{speech}
						</div>
					</div>
					<div
						className="grid grid-cols-1 gap-2 min-[1280px]:grid-cols-2"
						onFocusCapture={(e) => {
							const el = (e.target as HTMLElement).closest<HTMLElement>(
								'[data-offer]',
							);
							if (el) setPicked(Number(el.dataset.offer));
						}}
					>
						{data.offers.map((o, i) => (
							<OfferCard
								key={o ? `${o.id}-${i}` : `sold-${i}`}
								offer={o}
								index={i}
								locked={data.locks[i] ?? false}
								fish={data.fish}
								actions={actions}
							/>
						))}
					</div>
					{shown && <OfferExplain offer={shown} />}
				</Panel>

				<Panel title={t('shop.you')} className="min-h-0">
					<PlayerPanel
						data={player}
						weaponExtra={(slot) => {
							const w = data.weapons[slot];
							if (!w) return null;
							const partner = fusePartner(data.weapons, slot);
							return (
								<div className="flex gap-1">
									<Btn
										onActivate={() => actions.sell(slot)}
										className="flex-1 border-snow text-[0.85em] text-text-dim"
									>
										{t('shop.sell', { n: w.sellValue })}
									</Btn>
									{partner >= 0 && (
										<Btn
											onActivate={() => actions.fuse(slot, partner)}
											className="flex-1 border-crit text-[0.85em] text-crit"
										>
											{t('shop.fuse')}
										</Btn>
									)}
								</div>
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
				<Btn onActivate={actions.next} variant="primary" className="min-w-52 text-[1.15em]">
					{t('shop.next')}
				</Btn>
			</footer>
		</FocusScope>
	);
}
