import type { Rarity } from '../data/rarity';
import type { AffixView, PlayerPanelView, WeaponStatsView } from '../logic/item-view';
import type { OfferDescription } from '../logic/shop-describe';
import type { StatKey } from '../logic/stats';
import { createStore } from './store';

export type {
	AffixView,
	GearItemView,
	GearSlotView,
	HealPotionView,
	PlayerPanelView,
	SupportSlotView,
	WeaponSlotView,
	WeaponStatsView,
} from '../logic/item-view';
export type { OfferDescription, OfferOutcome, StatChange } from '../logic/shop-describe';

/*
 * CONTRACT for the shop screens (ADR-017, SDD-003 RF-10 and RF-11). All plain data, republished by
 * the game after every change; the UI only reads it and sends `commands` back.
 *
 * Per offer (`ShopOfferView`):
 * - `rarity` 1 to 5 (I white, II blue, III green, IV purple, V orange; IV and V ask for a `material`), colored with
 *   `rarityColor(rarity)` from `config/palette` and named with `t('rarity.<n>')`.
 * - `affixes`: the random stat bonuses already rolled (I has none, II one, III two), as
 *   `{ stat, value }`; label with `gstat.<stat>` and `formatStat(stat, value, true)`.
 * - `weapon` (weapons): damage, seconds between hits, range and dps at that rarity.
 * - `baseStats` (equipment): the catalog stats before the affixes.
 * - `description`: what buying does, from `describeOffer`: `outcome.type` is `newWeapon` (slot,
 *   `fusableWith` = slot of an identical copy you could fuse with next), `fuse` (slot,
 *   fromRarity to toRarity, `newAffixes` extra affixes the result rolls), `barFull`, `equip`
 *   (worn at once in `slot`), `replace` (worn at once; the item `worn` of that slot, rarity `wornRarity`, is sold for `sellFish`) or `potion`; plus `statChanges`
 *   (`{ stat, before, after }`, only stats that change).
 *
 * Player panel (`ShopView.player`, same shape for the pause screen via `PlayerPanelView`): current
 * hero `stats`, `weapons` (slot, id, rarity I to V, affixes, stats, sets, sell value), the five
 * `gear` slots (item with rarity, affixes and base stats, or null) and no bag: equipment is worn at once and the old item is sold.
 *
 * Support items and the healing potion (SDD-014): offers of `kind` `support` and `healPotion`
 * (rarity I, `description.outcome` `support` or `healPotion` with level before/after), and
 * `PlayerPanelView.support` (owned items with level) and `PlayerPanelView.healPotion` (level,
 * charges, rarity, heal share; null until bought).
 *
 * HUD: `HudSnapshot.healPotion` (charges, level, rarity) beside `HudWeapon.rarity` per weapon slot (1 to 5), for the slot border color.
 */

/**
 * End-of-round shop as the React `Shop` shows it (SDD-003 RF-01..RF-04). Plain data: the game
 * publishes a fresh view after every change and the UI sends commands back (`commands.ts`).
 * Weapons are addressed by slot index and offers by shop slot index (0..3).
 */
export interface ShopOfferView {
	/** Shop slot 0..3, the argument of `buy` and `lock`. */
	index: number;
	kind: 'weapon' | 'item' | 'gear' | 'potion' | 'support' | 'healPotion';
	/** Weapon line id (translate with `weapon.<id>.name`). */
	id: string;
	/** Same number as `rarity` (kept for older screens). */
	tier: number;
	/** Rarity I to III on the shelf. */
	rarity: Rarity;
	/** Random affixes already rolled for this offer. */
	affixes: AffixView[];
	/** Weapon numbers at this rarity (weapons only). */
	weapon?: WeaponStatsView;
	/** Catalog stats of an equipment item, before the affixes. */
	baseStats: Partial<Record<StatKey, number>>;
	/** What buying does, in structured form (`describeOffer`). */
	description: OfferDescription;
	price: number;
	/** Sets of the weapon (empty for gear), for the set-bonus hint. */
	sets: string[];
	locked: boolean;
	/** Rarity IV asks for one Elite Mark and V for one Boss Core besides the Fish (ADR-021). */
	material?: 'elite' | 'boss';
	/** Enough Fish, the material and (weapons) a free slot, an upgrade or an identical weapon to merge into. */
	affordable: boolean;
}

export interface ShopWeaponView {
	/** Index into the run's weapon slots, the argument of `sell` and `fuse`. */
	slot: number;
	id: string;
	tier: 1 | 2 | 3 | 4 | 5;
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
	/** Extra waves of the next round, shown from Danger 2 on (`elite` or `horde`). */
	nextWaves: ('elite' | 'horde')[];
	fish: number;
	/** `null` slots were bought and stay empty until the next reroll. */
	offers: (ShopOfferView | null)[];
	rerollPrice: number;
	canReroll: boolean;
	/** Elite Marks and Boss Cores of the run (ADR-021). */
	materials: { elite: number; boss: number };
	/** Fixed "+1 potion" button after the first potion was bought; null before that or at the cap. */
	extraPotion: { price: number; level: number; max: number; affordable: boolean } | null;
	/** Weapon slots in the build (max 6). */
	weapons: ShopWeaponView[];
	maxWeapons: number;
	fusions: ShopFusionView[];
	/** Worn gear ids per slot (helmet, armor, legs, ring, amulet); null = empty. */
	gear: (string | null)[];
	/** Stats, weapons and equipment of the hero with rarity and affixes (the player panel). */
	player: PlayerPanelView;
}

export const shopStore = createStore<{ shop: ShopView | null }>({ shop: null });

/** `null` closes the shop (next round started or run ended). */
export function publishShop(view: ShopView | null): void {
	shopStore.set({ shop: view });
}
