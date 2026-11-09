import { SHOP } from '../data/economy';
import { HEAL_POTION, POTION_PRICES, type PotionType } from '../data/potions';
import type { Rarity } from '../data/rarity';
import { SUPPORT_PRICE } from '../data/support';
import { type Affix, rollAffixes } from './affixes';
import type { Rng } from './rng';

export type OfferKind = 'weapon' | 'item' | 'gear' | 'potion' | 'support' | 'healPotion';

/** Minimal shape the shop needs from the weapon/item/gear catalogs (keeps it decoupled from them). */
export interface ShopCandidate {
	kind: OfferKind;
	id: string;
	/** Weapon/item tier 1..4, or gear rarity 1..3 (common, rare, legendary). */
	tier: number;
	sets: readonly string[];
	/** Exclusive to one hero: never offered to the others. */
	hero?: string;
}

/** Elite Marks and Boss Cores of the run (ADR-021): one per Elite and per Boss killed. */
export interface Materials {
	elite: number;
	boss: number;
}

export type Material = keyof Materials;

export const emptyMaterials = (): Materials => ({ elite: 0, boss: 0 });

export interface Offer {
	kind: OfferKind;
	id: string;
	/** Rarity I–V on the shelf (ADR-021). */
	tier: number;
	price: number;
	/** One of this material is paid besides the Fish (rarity IV: Elite Mark, V: Boss Core). */
	material?: Material;
	/** Random affixes already rolled, so the shop can show exactly what is bought. */
	affixes?: Affix[];
}

export interface ShopState {
	/** `null` = bought slot, refilled on the next roll. */
	offers: (Offer | null)[];
	locks: boolean[];
	/** Rerolls already used in this shop. */
	rerolls: number;
}

export interface ShopContext {
	hero: string;
	/** Sets already present in the build (+setBias weight). */
	buildSets: readonly string[];
	luck: number;
}

export function rerollPrice(round: number, rerolls: number): number {
	const step = SHOP.rerollStep + Math.floor(round / SHOP.rerollStepEvery);
	return SHOP.rerollBase + round + step * rerolls;
}

/** Price in Fish; run potions have a flat price by type (pass the potion id). */
export function offerPrice(kind: OfferKind, tier: number, round: number, id?: string): number {
	if (kind === 'potion') {
		const price = POTION_PRICES[id as PotionType];
		if (price === undefined) throw new Error(`shop: unknown potion ${id}`);
		return price;
	}
	if (kind === 'support' || kind === 'healPotion')
		return (
			(kind === 'support' ? SUPPORT_PRICE : HEAL_POTION.price) + SHOP.pricePerRound * round
		);
	const table = kind === 'gear' ? SHOP.gearPrices : SHOP.weaponPrices;
	const base = table[tier - 1];
	if (base === undefined) throw new Error(`shop: invalid ${kind} tier ${tier}`);
	const ratio = kind === 'item' ? SHOP.itemRatio : 1;
	return Math.round(base * ratio + SHOP.pricePerRound * round);
}

export function sellValue(paid: number): number {
	return Math.floor(paid * SHOP.sellRatio);
}

/** Fish for the equipment that makes room for a new one (or a rejected drop): half its shelf price at its rarity. */
export function gearSellValue(rarity: number, round: number): number {
	return sellValue(offerPrice('gear', rarity, round));
}

function weight(c: ShopCandidate, round: number, ctx: ShopContext): number {
	const { base, perRound } = SHOP.tierWeights;
	let w = Math.max(1, (base[c.tier - 1] ?? 1) + (perRound[c.tier - 1] ?? 0) * round);
	if (c.kind !== 'gear' && c.tier > 1) w *= 1 + Math.max(0, ctx.luck) * SHOP.luckPerPoint;
	if (c.sets.some((s) => ctx.buildSets.includes(s))) w *= 1 + SHOP.setBias;
	return w;
}

/** True when the run holds the material the offer asks for (or it asks for none). */
export const hasMaterial = (offer: Offer, materials: Materials): boolean =>
	!offer.material || materials[offer.material] > 0;

/**
 * Rolls the shop: locked slots keep their previous offer, the rest are drawn without repeating an id
 * (weighted by tier, luck and build sets). A slot the pool cannot fill stays empty (`null`): the
 * evolution pool only holds what improves the build, so it shrinks late in the run (ADR-021).
 */
export function rollOffers(
	rng: Rng,
	round: number,
	ctx: ShopContext,
	pool: readonly ShopCandidate[],
	locks: readonly boolean[],
	prev: readonly (Offer | null)[] = [],
): (Offer | null)[] {
	const offers: (Offer | null)[] = Array.from({ length: SHOP.offers }, (_, i) =>
		locks[i] ? (prev[i] ?? null) : null,
	);
	const used = new Set(offers.flatMap((o) => (o ? [o.id] : [])));
	const open = pool.filter((c) => (!c.hero || c.hero === ctx.hero) && c.tier <= SHOP.maxRarity);
	for (let i = 0; i < offers.length; i++) {
		if (offers[i]) continue;
		let avail = open.filter((c) => !used.has(c.id));
		if (avail.length === 0) continue;
		// Mixed pools pick the kind first so a big weapon catalog cannot crowd out gear and potions.
		const kinds = [...new Set(avail.map((c) => c.kind))];
		if (kinds.length > 1) {
			const kind = kinds[rng.weightedIndex(kinds.map((k) => SHOP.kindShare[k]))] as OfferKind;
			avail = avail.filter((c) => c.kind === kind);
		}
		const c = avail[
			rng.weightedIndex(avail.map((a) => weight(a, round, ctx)))
		] as ShopCandidate;
		used.add(c.id);
		const rarity = c.tier as Rarity;
		const material =
			c.kind === 'weapon' || c.kind === 'gear' ? SHOP.materialCost[c.tier] : undefined;
		const affixes =
			c.kind === 'weapon' || c.kind === 'gear' ? rollAffixes(rng, rarity, c.kind, round) : [];
		offers[i] = {
			kind: c.kind,
			id: c.id,
			tier: c.tier,
			price: offerPrice(c.kind, c.tier, round, c.id),
			...(affixes.length > 0 && { affixes }),
			...(material && { material }),
		};
	}
	return offers;
}

/** Toggles the lock of a filled slot (free). */
export function lock(state: ShopState, index: number): ShopState {
	if (!state.offers[index]) return state;
	const locks = [...state.locks];
	locks[index] = !locks[index];
	return { ...state, locks };
}

/**
 * Buys a slot; `null` if empty, unaffordable or missing its material (which is then spent from
 * `materials`, in place). The slot is cleared and unlocked.
 */
export function buy(
	state: ShopState,
	fish: number,
	index: number,
	materials: Materials = emptyMaterials(),
): { state: ShopState; fish: number; offer: Offer } | null {
	const offer = state.offers[index];
	if (!offer || fish < offer.price || !hasMaterial(offer, materials)) return null;
	if (offer.material) materials[offer.material]--;
	const offers = [...state.offers];
	offers[index] = null;
	const locks = [...state.locks];
	locks[index] = false;
	return { state: { ...state, offers, locks }, fish: fish - offer.price, offer };
}

/** Pays the reroll and redraws the unlocked slots; `null` if unaffordable. */
export function reroll(
	state: ShopState,
	fish: number,
	rng: Rng,
	round: number,
	ctx: ShopContext,
	pool: readonly ShopCandidate[],
): { state: ShopState; fish: number } | null {
	const price = rerollPrice(round, state.rerolls);
	if (fish < price) return null;
	const offers = rollOffers(rng, round, ctx, pool, state.locks, state.offers);
	return { state: { ...state, offers, rerolls: state.rerolls + 1 }, fish: fish - price };
}
