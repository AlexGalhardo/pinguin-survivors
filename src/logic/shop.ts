import { ITEMS, type ItemDef, SHOP } from '../data/items';
import { RARITIES, RARITY, type Rarity, rarityRank } from '../data/rarity';
import { itemPrice } from './economy';
import { rollRarity } from './rarity';
import type { Rng } from './rng';
import type { RunState } from './run-state';

export interface ShopOffer {
	itemId: string;
	price: number;
	sold: boolean;
}

/** Items of a rarity, falling back to the closest lower rarity that has any. */
function poolFor(rarity: Rarity, exclude: ReadonlySet<string>, wave: number): ItemDef[] {
	for (let r = rarityRank(rarity); r >= 0; r--) {
		const pool = ITEMS.filter((i) => i.rarity === RARITIES[r] && !exclude.has(i.id));
		if (pool.length > 0) return pool;
	}
	// Everything at or below the rolled rarity is taken: go up, but never to a locked Legendary.
	return ITEMS.filter(
		(i) => !exclude.has(i.id) && (i.rarity !== 'legendary' || wave >= RARITY.legendaryFromWave),
	);
}

/** Rolls the shop: `slots` distinct items, rarity by wave + Luck, priced for the wave. */
export function generateShop(
	rng: Rng,
	wave: number,
	luck: number,
	slots = SHOP.slots,
): ShopOffer[] {
	const used = new Set<string>();
	const offers: ShopOffer[] = [];
	for (let i = 0; i < slots; i++) {
		const pool = poolFor(rollRarity(rng, wave, luck), used, wave);
		if (pool.length === 0) break;
		const item = rng.pick(pool);
		used.add(item.id);
		offers.push({ itemId: item.id, price: itemPrice(item.basePrice, wave), sold: false });
	}
	return offers;
}

/** Buys an offer: spends the gold and adds the item. Returns false if not possible. */
export function buyOffer(state: RunState, offer: ShopOffer): boolean {
	if (offer.sold || state.gold < offer.price) return false;
	state.gold -= offer.price;
	state.items.push(offer.itemId);
	offer.sold = true;
	return true;
}
