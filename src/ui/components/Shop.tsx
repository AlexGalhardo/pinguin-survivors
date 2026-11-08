import { type ReactElement, useState } from 'react';
import { toCss } from '../../config/palette';
import { WEAPON_TIER_TINT, type WeaponTier } from '../../data/weapons';
import { type I18nKey, t } from '../../i18n';
import { toRoman } from '../../logic/achievements';
import { useCompact } from '../compact';
import { FocusScope } from '../focus';
import { merchantLine } from '../merchant';
import { AtlasIcon, weaponFrames } from './AtlasIcon';
import { Btn } from './Btn';
import { weaponName } from './Hud';

/** What the shop screen shows; the game publishes it (offers, wallet and the 6 weapon slots). */
export interface ShopOfferData {
	kind: 'weapon' | 'item' | 'gear' | 'potion';
	id: string;
	/** Weapon/item tier 1..4, or gear rarity 1..3. */
	tier: number;
	price: number;
	sets: readonly string[];
}

export interface ShopData {
	round: number;
	fish: number;
	/** `null` = already bought slot. */
	offers: readonly (ShopOfferData | null)[];
	locks: readonly boolean[];
	rerollPrice: number;
	weapons: readonly { id: string; tier: WeaponTier; sellValue: number }[];
	/** Worn gear ids per slot (helmet, armor, legs, ring, amulet); null = empty. */
	gear: readonly (string | null)[];
}

export interface ShopActions {
	buy: (index: number) => void;
	reroll: () => void;
	lock: (index: number) => void;
	sell: (slot: number) => void;
	fuse: (a: number, b: number) => void;
	next: () => void;
}

const MAX_WEAPONS = 6;
const GEAR_SLOTS = ['helmet', 'armor', 'legs', 'ring', 'amulet'] as const;
const GEAR_RARITY_TINT = ['text-rarity-common', 'text-rarity-rare', 'text-rarity-legendary'];

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

const tierColor = (kind: ShopOfferData['kind'], tier: number): string =>
	kind === 'gear' || kind === 'potion'
		? ''
		: toCss(WEAPON_TIER_TINT[Math.min(4, Math.max(1, tier)) as WeaponTier]);

function Offer(props: {
	offer: ShopOfferData | null;
	locked: boolean;
	fish: number;
	actions: ShopActions;
	index: number;
}): ReactElement {
	const { offer, index, actions } = props;
	const compact = useCompact();
	if (!offer) {
		return (
			<div className="flex min-h-[clamp(3.5rem,7vh,6rem)] items-center justify-center rounded border border-snow-dark bg-night/50 text-text-dim">
				{t('shop.sold')}
			</div>
		);
	}
	const offerBox = compact ? 48 : offer.kind === 'weapon' ? 128 : 48;
	const tint = tierColor(offer.kind, offer.tier);
	const affordable = props.fish >= offer.price;
	return (
		<div
			className="flex min-h-[clamp(3.5rem,7vh,6rem)] items-stretch gap-2 rounded border-2 bg-night/80 p-2"
			style={{ borderColor: tint || undefined }}
		>
			<span
				className="flex shrink-0 items-center justify-center self-center"
				style={{ width: offerBox, height: offerBox }}
			>
				<AtlasIcon frames={offerFrames(offer)} size={offerBox} title={offerName(offer)} />
			</span>
			<div className="flex min-w-0 flex-1 flex-col justify-center">
				<div
					className={`truncate font-title text-[1.15em] font-bold ${offer.kind === 'gear' ? (GEAR_RARITY_TINT[offer.tier - 1] ?? '') : ''}`}
					style={tint ? { color: tint } : undefined}
				>
					{offerName(offer)}
				</div>
				<div className="text-[0.85em] text-text-dim">
					{t(`shop.kind.${offer.kind}` as I18nKey)}
					{(offer.kind === 'weapon' || offer.kind === 'item') &&
						` · ${toRoman(offer.tier)}`}
					{offer.sets.length > 0 &&
						` · ${offer.sets.map((s) => label(`shop.set.${s}`)).join(' / ')}`}
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Btn
					onActivate={() => actions.buy(index)}
					disabled={!affordable}
					className="border-fish text-fish"
				>
					{t('shop.buy', { n: offer.price })}
				</Btn>
				<Btn
					onActivate={() => actions.lock(index)}
					className={props.locked ? 'border-crit text-crit' : 'border-snow text-text-dim'}
				>
					{t(props.locked ? 'shop.unlock' : 'shop.lock')}
				</Btn>
			</div>
		</div>
	);
}

function WeaponCard(props: {
	weapon?: ShopData['weapons'][number];
	partner: number;
	slot: number;
	actions: ShopActions;
}): ReactElement {
	const { weapon, slot, partner, actions } = props;
	const compact = useCompact();
	if (!weapon) {
		return (
			<div className="flex min-h-[clamp(3.5rem,7vh,6rem)] items-center justify-center rounded border border-snow-dark bg-night/50 text-text-dim">
				{t('shop.empty')}
			</div>
		);
	}
	const weaponBox = compact ? 48 : 128;
	const tint = toCss(WEAPON_TIER_TINT[weapon.tier]);
	return (
		<div
			className="flex min-h-[clamp(3.5rem,7vh,6rem)] flex-col justify-between gap-1 rounded border-2 bg-night/80 p-2"
			style={{ borderColor: tint }}
		>
			<div className="flex items-center gap-2 truncate font-bold" style={{ color: tint }}>
				<span
					className="flex shrink-0 items-center justify-center"
					style={{ width: weaponBox, height: weaponBox }}
				>
					<AtlasIcon frames={weaponFrames(weapon.id, weapon.tier)} size={weaponBox} />
				</span>
				{weaponName(weapon.id)} · {toRoman(weapon.tier)}
			</div>
			<div className="flex gap-1">
				<Btn
					onActivate={() => actions.sell(slot)}
					className="flex-1 border-snow text-[0.85em] text-text-dim"
				>
					{t('shop.sell', { n: weapon.sellValue })}
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
		</div>
	);
}

/** Index of another slot holding the same weapon at the same tier (< IV), or -1. */
export function fusePartner(weapons: ShopData['weapons'], slot: number): number {
	const w = weapons[slot];
	if (!w || w.tier >= 4) return -1;
	return weapons.findIndex((o, i) => i !== slot && o.id === w.id && o.tier === w.tier);
}

/** End-of-round shop (ARPG style): inventory and gear on the left, merchant and offers on the right. */
export function Shop({
	data,
	actions: game,
}: {
	data: ShopData;
	actions: ShopActions;
}): ReactElement {
	const [speech, setSpeech] = useState(() => merchantLine('open'));
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
	const slots = Array.from({ length: MAX_WEAPONS }, (_, i) => data.weapons[i]);
	return (
		<FocusScope className="fixed inset-0 flex flex-col bg-night/95 font-body text-[clamp(0.8rem,1.7vh,1.125rem)] text-text-light">
			<header className="flex items-center justify-between border-b border-snow-dark px-[2vw] py-[1.2vh]">
				<h1 className="font-title text-[1.8em] font-bold">
					{t('shop.title', { n: data.round })}
				</h1>
				<div className="flex items-center gap-1 font-bold text-fish">
					<AtlasIcon frames={['icon.currency.fish']} size={32} />
					{t('shop.fish', { n: data.fish })}
				</div>
			</header>

			<main className="grid min-h-0 flex-1 grid-cols-2 gap-[2vw] px-[2vw] py-[2vh] [@media(max-height:500px)]:py-1">
				<section className="flex min-h-0 flex-col gap-[1.5vh] overflow-y-auto">
					<h2 className="font-title text-[1.2em] text-text-dim">{t('shop.weapons')}</h2>
					<div className="grid grid-cols-2 gap-2">
						{slots.map((w, i) => (
							<WeaponCard
								key={w ? `${w.id}-${i}` : `empty-${i}`}
								weapon={w}
								slot={i}
								partner={fusePartner(data.weapons, i)}
								actions={actions}
							/>
						))}
					</div>
					<h2 className="font-title text-[1.2em] text-text-dim">{t('shop.equipment')}</h2>
					<div className="grid grid-cols-5 gap-2">
						{GEAR_SLOTS.map((slot, i) => {
							const id = data.gear[i];
							return (
								<div
									key={slot}
									className={`flex min-h-16 items-center justify-center rounded border px-1 text-center text-[0.85em] ${
										id
											? 'border-ice bg-night/80'
											: 'border-snow-dark bg-night/50 text-text-dim'
									}`}
								>
									{id ? (
										<>
											<AtlasIcon frames={[`item.${id}`]} size={48} />
											{label(`gear.${id}`)}
										</>
									) : (
										t('shop.empty')
									)}
								</div>
							);
						})}
					</div>
				</section>

				<section className="flex min-h-0 flex-col gap-[1.5vh] overflow-y-auto">
					<div className="flex items-center gap-3 rounded border border-snow-dark bg-night/60 p-3 [@media(max-height:500px)]:hidden">
						<div className="flex size-14 items-center justify-center rounded-full border-2 border-ice font-title text-[1.6em]">
							?
						</div>
						<div className="flex min-w-0 flex-1 flex-col gap-1">
							<div className="font-title text-[1.3em] font-bold">
								{t('shop.merchant')}
							</div>
							<div
								role="status"
								aria-live="polite"
								className="rounded border border-ice/50 bg-night/80 px-3 py-1 text-[0.95em] italic"
							>
								{speech}
							</div>
						</div>
					</div>
					<h2 className="font-title text-[1.2em] text-text-dim">{t('shop.offers')}</h2>
					<div className="flex flex-col gap-2">
						{data.offers.map((o, i) => (
							<Offer
								key={o ? o.id : `sold-${i}`}
								offer={o}
								index={i}
								locked={data.locks[i] ?? false}
								fish={data.fish}
								actions={actions}
							/>
						))}
					</div>
					<Btn
						onActivate={actions.reroll}
						disabled={data.fish < data.rerollPrice}
						className="self-start border-ice text-ice"
					>
						{t('shop.reroll', { n: data.rerollPrice })}
					</Btn>
				</section>
			</main>

			<footer className="flex justify-end border-t border-snow-dark px-[2vw] py-[1.2vh]">
				<Btn
					onActivate={actions.next}
					className="border-xp bg-xp/20 px-8 py-2 text-[1.2em] text-xp"
				>
					{t('shop.next')}
				</Btn>
			</footer>
		</FocusScope>
	);
}
