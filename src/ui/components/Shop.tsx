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
import { Heading, Hint } from './Panel';
import {
	type Detail,
	detailCard,
	HeroStats,
	PlayerPanel,
	type PlayerPanelData,
	panelFromView,
	SectionTitle,
} from './PlayerPanel';

/** What the shop screen shows; the game publishes it (offers, wallet and the 6 weapon slots). */
export interface ShopOfferData {
	kind: 'weapon' | 'item' | 'gear' | 'potion' | 'support' | 'healPotion';
	id: string;
	/** Rarity I to V (ADR-021). */
	tier: number;
	price: number;
	/** IV asks for one Elite Mark and V for one Boss Core besides the Fish. */
	material?: 'elite' | 'boss';
	sets: readonly string[];
	/** Rarity I to V (same number as `tier`), random affixes, weapon numbers and gear base stats. */
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
	/** Extra waves of the next round (none with the current difficulties). */
	nextWaves?: readonly ('elite' | 'horde')[];
	/** Elite Marks and Boss Cores of the run (ADR-021). */
	materials?: { elite: number; boss: number };
	/** False until the hero has a tree point to spend (SDD-022); absent = the button shows. */
	treeUnlocked?: boolean;
	/** Fixed "+1 potion" button once the first potion was bought; null/absent hides it. */
	extraPotion?: { price: number; level: number; max: number; affordable: boolean } | null;
}

export interface ShopActions {
	buy: (index: number) => void;
	reroll: () => void;
	/** The fixed "+1 potion" button. */
	buyPotion: () => void;
	/** Opens the skill tree of the run's hero. */
	tree: () => void;
	lock: (index: number) => void;
	sell: (slot: number) => void;
	fuse: (a: number, b: number) => void;
	next: () => void;
}

const GEAR_SLOTS = ['helmet', 'armor', 'legs', 'ring', 'amulet'] as const;
const NO_MATERIALS = { elite: 0, boss: 0 } as const;

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
		case 'upgradeWeapon':
			return t('shop.outcome.upgradeWeapon', {
				slot: o.slot + 1,
				from: numeral(o.fromRarity),
				to: numeral(d.rarity),
				n: o.sellFish,
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

/** What buying the focused offer does, and the stats before and after (text only: the cards live on the right). */
function OfferOutcome({
	offer,
	sentenceOnly,
}: {
	offer: ShopOfferData;
	/** Phone landscape: just the sentence. */
	sentenceOnly?: boolean;
}): ReactElement {
	const d = offer.description;
	if (!d) return <Hint>{t(`shop.kind.${offer.kind}` as I18nKey)}</Hint>;
	return (
		<div className="flex min-w-0 flex-col gap-1">
			<p className="m-0 text-body font-bold text-crit">{outcomeText(d)}</p>
			{!sentenceOnly && (
				<div className="grid grid-cols-2 gap-x-3 text-secondary">
					{d.statChanges.map((c) => (
						<div
							key={c.stat}
							className={c.after > c.before ? 'text-xp' : 'text-gold-bright'}
						>
							{t('shop.statChange', {
								label: statLabel(c.stat),
								before: formatStat(c.stat, c.before),
								after: formatStat(c.stat, c.after),
							})}
						</div>
					))}
				</div>
			)}
		</div>
	);
}

/** Tooltip zone of the focused offer: the card for sale and, for equipment, the worn one beside it. Sized by its content. */
function OfferTooltips({
	offer,
	worn,
	labels,
}: {
	offer: ShopOfferData;
	worn: GearItem | null;
	labels: boolean;
}): ReactElement {
	const rarity = offer.rarity ?? offer.tier;
	const affixes = offer.affixes ?? offer.description?.affixes ?? [];
	if (offer.kind === 'weapon')
		return <WeaponCardView item={{ id: offer.id, tier: rarity, affixes }} />;
	if (offer.kind === 'gear')
		return (
			// The role of each card rides on its type line: a label row per card did not fit under two cards.
			<div className="flex flex-col gap-2">
				<GearCardView
					item={{ id: offer.id, rarity, affixes }}
					tag={labels ? t('shop.offerLabel') : undefined}
				/>
				{worn && <GearCardView item={worn} tag={labels ? t('shop.equipped') : undefined} />}
			</div>
		);
	return (
		<div className="flex flex-col gap-1">
			<div className="text-item font-bold" style={{ color: offerColor(offer) }}>
				{offerName(offer)}
			</div>
			<Hint>{t(`shop.kind.${offer.kind}` as I18nKey)}</Hint>
		</div>
	);
}

/** Phone: narrower buy and lock buttons, so the offer name keeps room beside them. */
const TIGHT = 'pr-[8px]! pl-[20px]! tracking-normal!';

/** One offer as a row of the list: icon, rarity-colored name and a line of numbers, then the buy and lock actions. */
function OfferRow(props: {
	offer: ShopOfferData | null;
	index: number;
	picked: boolean;
	locked: boolean;
	fish: number;
	materials: { elite: number; boss: number };
	actions: ShopActions;
	icon: number;
	compact: boolean;
}): ReactElement {
	const { offer, index, actions } = props;
	if (!offer) {
		return (
			<div
				data-offer={index}
				className="flex min-h-11 items-center justify-center text-secondary font-bold tracking-section text-text-dim"
			>
				{t('shop.sold')}
			</div>
		);
	}
	const missing = !!offer.material && props.materials[offer.material] <= 0;
	const affordable =
		props.fish >= offer.price && !missing && offer.description?.outcome.type !== 'barFull';
	const rarity = offer.rarity ?? offer.tier;
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
	} else if (offer.kind === 'support' || offer.kind === 'healPotion') {
		summary =
			offer.kind === 'support' ? t(`support.${offer.id}.desc` as I18nKey) : t('hpotion.desc');
	}
	const sets = offer.sets.map((s) => label(`shop.set.${s}`)).join(' / ');
	const outcome = offer.description?.outcome;
	// An upgrade reads only "Upgrade to level N": the row is narrow and the action matters most.
	const upgrade = outcome?.type === 'support' && outcome.from > 0;
	const kind =
		outcome?.type === 'support' && outcome.from > 0
			? t('shop.supportLevel', { to: outcome.to })
			: `${t(`shop.kind.${offer.kind}` as I18nKey)}${
					offer.kind === 'weapon' || offer.kind === 'item' || offer.kind === 'gear'
						? ` ${numeral(offer.tier)}`
						: ''
				}${outcome?.type === 'support' ? ` · ${t('shop.supportNew')}` : ''}${
					sets ? ` · ${sets}` : ''
				}`;
	return (
		<div
			data-offer={index}
			data-picked={props.picked}
			className={`flex min-h-[max(52px,7vh)] min-w-0 items-center gap-2 border-b border-line py-0.5 pl-1 last:border-b-0 data-[picked=true]:bg-gold-bright/10 ${props.compact ? '' : 'max-h-[max(14vh,7.5rem)] flex-1'}`}
		>
			{offer.kind === 'potion' || offer.kind === 'healPotion' ? (
				<AtlasIcon frames={offerFrames(offer)} size={props.icon} />
			) : (
				<SlotIcon frames={offerFrames(offer)} rarity={offer.tier} size={props.icon} />
			)}
			<div className="flex min-w-0 flex-1 flex-col">
				<span
					className={`text-body leading-tight font-bold ${props.compact ? 'truncate' : ''}`}
					style={{ color: offerColor(offer) }}
				>
					{offerName(offer)}
				</span>
				{!props.compact && upgrade && (
					<span className="text-secondary leading-tight font-bold text-gold-bright">
						{kind}
					</span>
				)}
				{!props.compact && !upgrade && (
					<span className="text-secondary leading-tight text-text-light">
						{kind}
						{summary ? ` · ${summary}` : ''}
						{offer.material && (
							<span className={missing ? 'text-blood' : 'text-gold-bright'}>
								{' · '}
								{t('shop.needsMaterial', {
									m: t(`shop.material.${offer.material}`),
								})}
							</span>
						)}
					</span>
				)}
			</div>
			<Btn
				onActivate={() => actions.buy(index)}
				disabled={!affordable}
				variant="secondary"
				className={`text-fish ${props.compact ? TIGHT : ''}`}
			>
				{t('shop.buy', { n: offer.price })}
			</Btn>
			<Btn
				onActivate={() => actions.lock(index)}
				variant="secondary"
				className={`${props.locked ? 'text-gold-bright' : 'text-text-light'} ${props.compact ? TIGHT : ''}`}
			>
				{t(props.locked ? 'shop.unlock' : 'shop.lock')}
			</Btn>
		</div>
	);
}

type Target = { kind: 'offer' } | { kind: 'owned'; detail: Detail };

/**
 * End-of-round shop, vendor style, built to never scroll (1920x1080, 2560x1080, 1280x720 and the
 * 844x390 phone): merchant and offers on the left with what buying does, on the right the tooltip
 * of the focused item (sized by its content) over the player. Text follows the screen height,
 * icons follow `useUiScale`.
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
	const [target, setTarget] = useState<Target>({ kind: 'offer' });
	const scale = useUiScale();
	// Phone landscape: four rows of one line, no merchant sprite and no tooltips, only the sentence.
	const compact = useCompact();
	const [offerPage, setOfferPage] = useState(0);
	const OFFERS_PER_PAGE = compact ? 4 : data.offers.length;
	const offerPages = Math.max(1, Math.ceil(data.offers.length / OFFERS_PER_PAGE));
	const shownPage = Math.min(offerPage, offerPages - 1);
	const icon = compact ? 32 : Math.max(32, Math.round(60 * scale));
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
	const ownedCard = target.kind === 'owned' ? detailCard(player, target.detail) : null;
	const labels = scale >= 0.9;

	return (
		<FocusScope className="fixed inset-0 flex flex-col gap-[1vh] overflow-hidden bg-night px-[2vw] py-[1.5vh] font-body text-body text-text-light [@media(max-height:500px)]:gap-0 [@media(max-height:500px)]:py-0.5">
			<header className="flex items-center justify-between gap-4">
				<Heading className="flex-1">{t('shop.title', { n: data.round })}</Heading>
				<div className="flex flex-wrap items-center justify-end gap-x-4 font-bold">
					{data.nextWaves && data.nextWaves.length > 0 && (
						<span className="text-secondary font-bold text-blood">
							{data.nextWaves
								.map((k) => t(`shop.nextWave.${k}` as I18nKey))
								.join(' · ')}
						</span>
					)}
					<span className="flex items-center gap-1 text-fish">
						<AtlasIcon
							frames={['icon.currency.fish']}
							size={Math.max(24, Math.round(28 * scale))}
						/>
						{t('shop.fish', { n: data.fish })}
					</span>
					{/* Marks and Cores show once the run has one (SDD-022 RF-01). */}
					{data.materials && data.materials.elite + data.materials.boss > 0 && (
						<span
							className="flex items-center gap-1 text-gold-bright tabular-nums"
							title={t('shop.materials', data.materials)}
						>
							<AtlasIcon frames={['icon.currency.mark']} size={32} />
							{data.materials.elite}
							<AtlasIcon frames={['icon.currency.core']} size={32} className="ml-2" />
							{data.materials.boss}
						</span>
					)}
				</div>
			</header>

			<main className="grid min-h-0 flex-1 grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-[2vw] [@media(max-height:500px)]:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
				<section
					aria-label={t('shop.merchant')}
					className="flex min-h-0 min-w-0 flex-col gap-2"
				>
					<div className="flex items-center gap-3">
						{/* Pixel art only scales by whole numbers: below ~970 px of height it would not fit, so only the speech stays. */}
						{scale >= 0.9 && !compact && (
							<MerchantSprite
								scale={scale >= 1.4 ? 3 : 2}
								title={t('shop.merchant')}
							/>
						)}
						<div
							role="status"
							aria-live="polite"
							// Phone: one line, or four offers and the action bar do not fit 360 px of height.
							className={`min-w-0 flex-1 font-title text-item leading-snug italic ${compact ? 'truncate' : ''}`}
						>
							{speech}
						</div>
					</div>
					{offerPages > 1 && (
						<div className="flex items-center justify-end gap-1 font-bold">
							<Btn
								onActivate={() =>
									setOfferPage((shownPage - 1 + offerPages) % offerPages)
								}
								variant="secondary"
								label="-"
							>
								◀
							</Btn>
							<span className="tabular-nums">
								{shownPage + 1}/{offerPages}
							</span>
							<Btn
								onActivate={() => setOfferPage((shownPage + 1) % offerPages)}
								variant="secondary"
								label="+"
							>
								▶
							</Btn>
						</div>
					)}
					<div
						// Desktop: the rows share the column height (capped), so the list is not a clump at the top.
						className={`flex flex-col gap-1 ${compact ? '' : 'min-h-0 flex-1'}`}
						onFocusCapture={(e) => {
							const el = (e.target as HTMLElement).closest<HTMLElement>(
								'[data-offer]',
							);
							if (el) {
								setPicked(Number(el.dataset.offer));
								setTarget({ kind: 'offer' });
							}
						}}
					>
						{data.offers.map((o, i) =>
							i >= shownPage * OFFERS_PER_PAGE &&
							i < (shownPage + 1) * OFFERS_PER_PAGE ? (
								<OfferRow
									key={o ? `${o.id}-${i}` : `sold-${i}`}
									offer={o}
									index={i}
									picked={picked === i && target.kind === 'offer'}
									locked={data.locks[i] ?? false}
									fish={data.fish}
									materials={data.materials ?? NO_MATERIALS}
									actions={actions}
									icon={icon}
									compact={compact}
								/>
							) : null,
						)}
					</div>
				</section>

				<section
					aria-label={t('shop.you')}
					className={
						compact
							? 'flex min-h-0 min-w-0 flex-col gap-[1.5vh]'
							: 'grid min-h-0 min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_auto] gap-x-[1.5vw] gap-y-1'
					}
				>
					{compact && shown && <OfferOutcome offer={shown} sentenceOnly />}
					<div className={compact ? 'contents' : 'min-h-0 min-w-0'}>
						<PlayerPanel
							data={player}
							onPick={(detail) => setTarget({ kind: 'owned', detail })}
							weaponBar={(slot) => {
								const w = data.weapons[slot];
								if (!w) return null;
								const partner = fusePartner(data.weapons, slot);
								return (
									<>
										<Btn
											onActivate={() => actions.sell(slot)}
											variant="secondary"
										>
											{t('shop.sell', { n: w.sellValue })}
										</Btn>
										{partner >= 0 && (
											<Btn
												onActivate={() => actions.fuse(slot, partner)}
												variant="secondary"
												className="text-crit"
											>
												{t('shop.fuse')}
											</Btn>
										)}
									</>
								);
							}}
						/>
					</div>
					{!compact && (
						<section
							aria-label={t('shop.details')}
							className="flex min-h-0 min-w-0 flex-col gap-2 overflow-hidden"
						>
							<SectionTitle>{t('shop.details')}</SectionTitle>
							{target.kind === 'owned' ? (
								(ownedCard ?? <Hint>{t('shop.pickItem')}</Hint>)
							) : shown ? (
								<>
									<OfferTooltips
										offer={shown}
										// Below ~970 px of height two cards do not fit: the sentence and the before/after list carry the comparison.
										worn={labels ? wornFor(shown) : null}
										labels={labels}
									/>
									<OfferOutcome offer={shown} />
								</>
							) : null}
						</section>
					)}
					{!compact && (
						// Full-width strip under both columns: the stats can never push into the action footer.
						<div className="col-span-2 border-t border-line pt-1">
							<HeroStats data={player} icons={labels} />
						</div>
					)}
				</section>
			</main>

			<footer className="flex flex-wrap items-center justify-between gap-2 [@media(max-height:500px)]:flex-nowrap [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:[&>button]:min-w-0 [@media(max-height:500px)]:[&>button]:pr-[8px] [@media(max-height:500px)]:[&>button]:pl-[20px] [@media(max-height:500px)]:[&>button]:whitespace-nowrap">
				<Btn
					onActivate={actions.reroll}
					disabled={data.fish < data.rerollPrice}
					variant="secondary"
				>
					{t('shop.reroll', { n: data.rerollPrice })}
				</Btn>
				{data.extraPotion && (
					<Btn
						onActivate={actions.buyPotion}
						disabled={!data.extraPotion.affordable}
						variant="secondary"
					>
						{t('shop.extraPotion', {
							level: data.extraPotion.level,
							max: data.extraPotion.max,
							n: data.extraPotion.price,
						})}
					</Btn>
				)}
				{data.treeUnlocked !== false && (
					<Btn onActivate={actions.tree} variant="secondary">
						{t('menu.workshop')}
					</Btn>
				)}
				<Btn onActivate={actions.next} variant="primary" className="min-w-52">
					{t('shop.next')}
				</Btn>
			</footer>
		</FocusScope>
	);
}
