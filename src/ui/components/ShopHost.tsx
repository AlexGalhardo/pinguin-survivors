import { type ReactElement, useSyncExternalStore } from 'react';
import { commands } from '../commands';
import { type ShopView, shopStore } from '../shop-bridge';
import { useUiStore } from '../store';
import { Shop, type ShopActions, type ShopData } from './Shop';

const ACTIONS: ShopActions = {
	buy: commands.buy,
	reroll: commands.reroll,
	buyPotion: commands.buyHealPotion,
	tree: commands.openTree,
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
						...(o.material && { material: o.material }),
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
		materials: v.materials,
		extraPotion: v.extraPotion,
	};
}

/** Shows the shop while the game is in its `shop` phase (the view is non-null). */
export function ShopHost(): ReactElement | null {
	const view = useSyncExternalStore(shopStore.subscribe, () => shopStore.get().shop);
	// A menu opened from the shop (the skill tree) replaces it until Back.
	const screen = useUiStore((s) => s.screen);
	if (!view || screen !== 'none') return null;
	return <Shop data={toShopData(view)} actions={ACTIONS} />;
}
