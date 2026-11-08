import { type ReactElement, useSyncExternalStore } from 'react';
import { type I18nKey, t } from '../../i18n';
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
		// Potion offers are not drawn by `Shop` yet: they show as an empty slot.
		offers: v.offers.map((o) =>
			o && o.kind !== 'potion'
				? { kind: o.kind, id: o.id, tier: o.tier, price: o.price, sets: o.sets }
				: null,
		),
		locks: v.offers.map((o) => o?.locked ?? false),
		rerollPrice: v.rerollPrice,
		weapons: v.weapons.map((w) => ({ id: w.id, tier: w.tier, sellValue: w.sellValue })),
		gear: v.gear,
	};
}

/** Shows the shop while the game is in its `shop` phase (the view is non-null). */
export function ShopHost(): ReactElement | null {
	const view = useSyncExternalStore(shopStore.subscribe, () => shopStore.get().shop);
	if (!view) return null;
	return (
		<>
			<Shop data={toShopData(view)} actions={ACTIONS} />
			{view.nextWaves.length > 0 && (
				<div className="pointer-events-none fixed top-[1.5vh] left-1/2 -translate-x-1/2 rounded bg-blood px-4 py-1 font-body font-bold text-text-light">
					{view.nextWaves.map((k) => t(`shop.nextWave.${k}` as I18nKey)).join(' · ')}
				</div>
			)}
		</>
	);
}
