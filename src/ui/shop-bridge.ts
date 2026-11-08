import { createStore } from './store';

/**
 * End-of-round shop as the React `Shop` shows it (SDD-003 RF-01..RF-04). Plain data: the game
 * publishes a fresh view after every change and the UI sends commands back (`commands.ts`).
 * Weapons are addressed by slot index and offers by shop slot index (0..3).
 */
export interface ShopOfferView {
	/** Shop slot 0..3, the argument of `buy` and `lock`. */
	index: number;
	kind: 'weapon' | 'item' | 'gear';
	/** Weapon line id (translate with `weapon.<id>.name`). */
	id: string;
	/** Tier I..IV (gear: rarity 1..3). */
	tier: number;
	price: number;
	/** Sets of the weapon (empty for gear), for the set-bonus hint. */
	sets: string[];
	locked: boolean;
	/** Enough Fish and (weapons) a free slot or an identical weapon to merge into. */
	affordable: boolean;
}

export interface ShopWeaponView {
	/** Index into the run's weapon slots, the argument of `sell` and `fuse`. */
	slot: number;
	id: string;
	tier: 1 | 2 | 3 | 4;
	sellValue: number;
}

/** Two owned weapons that can merge into the next tier (SDD-002 RF-04): confirm with `fuse(a, b)`. */
export interface ShopFusionView {
	a: number;
	b: number;
	id: string;
	/** Tier of the result. */
	toTier: 2 | 3 | 4;
}

export interface ShopView {
	/** Round just cleared. */
	round: number;
	fish: number;
	/** `null` slots were bought and stay empty until the next reroll. */
	offers: (ShopOfferView | null)[];
	rerollPrice: number;
	canReroll: boolean;
	/** Weapon slots in the build (max 6). */
	weapons: ShopWeaponView[];
	maxWeapons: number;
	fusions: ShopFusionView[];
	/** Worn gear ids per slot (helmet, armor, legs, ring, amulet); null = empty. */
	gear: (string | null)[];
}

export const shopStore = createStore<{ shop: ShopView | null }>({ shop: null });

/** `null` closes the shop (next round started or run ended). */
export function publishShop(view: ShopView | null): void {
	shopStore.set({ shop: view });
}
