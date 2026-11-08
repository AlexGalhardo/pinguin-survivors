import { type ReactElement, useSyncExternalStore } from 'react';
import { commands } from '../commands';
import { type ShopView, shopStore } from '../shop-bridge';
import { Shop, type ShopActions, type ShopData } from './Shop';

const ACTIONS: ShopActions = {
	buy: commands.buy,
	reroll: commands.reroll,
	lock: commands.lock,
	sell: commands.sell,
	fuse: commands.fuse,
	next: commands.closeShop,
};

/** Maps the game's `ShopView` to the props of the `Shop` screen. */
export function toShopData(v: ShopView): ShopData {
	return {
		round: v.round,
		fish: v.fish,
		offers: v.offers.map((o) =>
			o
				? {
						kind: o.kind,
						id: o.id,
						tier: o.tier,
						price: o.price,
						sets: o.sets,
						rarity: o.rarity,
						affixes: o.affixes,
						weapon: o.weapon,
						baseStats: o.baseStats,
						description: o.description,
					}
				: null,
		),
		locks: v.offers.map((o) => o?.locked ?? false),
		rerollPrice: v.rerollPrice,
		weapons: v.weapons.map((w) => ({ id: w.id, tier: w.tier, sellValue: w.sellValue })),
		gear: v.gear,
		player: v.player,
		nextWaves: v.nextWaves,
	};
}

/** Shows the shop while the game is in its `shop` phase (the view is non-null). */
export function ShopHost(): ReactElement | null {
	const view = useSyncExternalStore(shopStore.subscribe, () => shopStore.get().shop);
	if (!view) return null;
	return <Shop data={toShopData(view)} actions={ACTIONS} />;
}
