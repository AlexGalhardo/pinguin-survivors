import type { HeroId } from '../config/constants';
import type { Difficulty } from '../data/difficulty';
import { ECONOMY, PEARLS, SHOP } from '../data/economy';
import { GEAR, GEAR_BY_ID } from '../data/equipment';
import type { HeroDef } from '../data/heroes';
import { POTION_TYPES, type PotionType } from '../data/potions';
import { LEGACY_GEAR_RARITY, RARITIES, type Rarity } from '../data/rarity';
import { SUPPORT_IDS } from '../data/support';
import { MAX_WEAPON_SLOTS, WEAPON_LINES, type WeaponId, type WeaponTier } from '../data/weapons';
import { addWeapon, type Build, upgradeSlot } from './build';
import { type CardOffer, drawCards } from './cards';
import { emptyGear, itemRoll, pickUpGear, type RunGear } from './equipment';
import {
	buyHealPotion,
	canBuyHealPotion,
	emptyHealPotion,
	emptyHealPotionCharges,
	type HealPotionState,
} from './heal-potion';
import { roundEndFish } from './progression';
import type { Rng } from './rng';
import { cycle, isBossRound, roundDuration } from './round';
import type { RunCounters, SaveData } from './save';
import {
	buy,
	emptyMaterials,
	gearSellValue,
	type Materials,
	type Offer,
	offerPrice,
	rollOffers,
	type ShopCandidate,
	type ShopContext,
	type ShopState,
	sellValue,
} from './shop';
import type { PlayerStats } from './stats';
import { buySupport, canBuySupport, isSupportId, type SupportLevels } from './support';

export type RunPhase = 'round' | 'cards' | 'shop';

/** Everything about the current run; serializable for the save snapshot (P-43). */
export interface RunState {
	hero: HeroId;
	tier: 1 | 2 | 3;
	/** Difficulty 0–2 of the run (ADR-025), chosen before the run. */
	difficulty: Difficulty;
	seed: number;
	round: number;
	/** Seconds left in the current round. */
	timeLeft: number;
	hp: number;
	maxHp: number;
	kills: number;
	xp: number;
	fish: number;
	/** Kills toward the superpower (P-39); persists between rounds. */
	superCharge: number;
	elapsed: number;
	damageDealt: number;
	/** Equipment found this run (bag + worn); missing in older snapshots. */
	gear?: RunGear;
	/** Lifetime counters gathered this run; added to the save when the run ends. */
	counters: RunCounters;
	phase: RunPhase;
	/** Level-ups waiting for a card pick; resolved before the shop opens. */
	pendingLevelUps: number;
	/** Open shop (phase `shop`), otherwise null. */
	shop: ShopState | null;
	/** Offers locked in the previous shop, by slot; they come back in the next one. */
	lockedOffers: (Offer | null)[];
	/** Pearls earned by finished rounds, paid out at `finishRun`. */
	pearlsEarned: number;
	/** Level-up card rerolls left this run (from the Workshop `insight` upgrade). */
	cardRerollsLeft: number;
	/** Potions bought in the shop this run, waiting for the "round start" gambit. */
	shopPotions: Partial<Record<PotionType, number>>;
	/** Support item levels bought this run (SDD-014). */
	support: SupportLevels;
	/** The healing potion: level = potions carried, refilled by kills. */
	healPotion: HealPotionState;
	/** Elite Marks and Boss Cores (ADR-021): pay for rarity IV and V in the shop. */
	materials: Materials;
}

export function createRunState(
	hero: HeroDef,
	opts: {
		seed: number;
		round?: number;
		tier?: 1 | 2 | 3;
		difficulty?: Difficulty;
		cardRerolls?: number;
	},
): RunState {
	const round = opts.round ?? 1;
	return {
		hero: hero.id,
		tier: opts.tier ?? 1,
		difficulty: opts.difficulty ?? 1,
		seed: opts.seed,
		round,
		timeLeft: roundDuration(round),
		hp: hero.hp,
		maxHp: hero.hp,
		kills: 0,
		xp: 0,
		fish: ECONOMY.fish.start,
		superCharge: 0,
		elapsed: 0,
		damageDealt: 0,
		counters: {},
		phase: 'round',
		pendingLevelUps: 0,
		shop: null,
		lockedOffers: [],
		pearlsEarned: 0,
		shopPotions: {},
		support: {},
		healPotion: emptyHealPotion(),
		materials: emptyMaterials(),
		cardRerollsLeft: opts.cardRerolls ?? 0,
	};
}

export function startRound(state: RunState, round: number): void {
	state.round = round;
	state.timeLeft = roundDuration(round);
	emptyHealPotionCharges(state.healPotion);
}

/** Applies damage to the hero; returns true when the hero died. */
export function damageHero(state: RunState, amount: number): boolean {
	state.hp = Math.max(0, state.hp - amount);
	return state.hp <= 0;
}

export function healHero(state: RunState, amount: number): void {
	state.hp = Math.min(state.maxHp, state.hp + amount);
}

/** Increments one run counter (achievement progress). */
export function countRun(state: RunState, key: keyof RunCounters & string, by = 1): void {
	const c = state.counters as Record<string, number | boolean | undefined>;
	c[key] = ((c[key] as number | undefined) ?? 0) + by;
}

/** Fish for finishing round N: `(2 + floor(N/2)) × (1 + harvesting)`, plus the boss bonus. */
export function roundClearFish(round: number, harvesting: number): number {
	const base = Math.floor(roundEndFish(round) * (1 + harvesting));
	const boss = isBossRound(round) ? ECONOMY.fish.bossPerCycle * (1 + cycle(round)) : 0;
	return base + boss;
}

export function roundClearPearls(round: number): number {
	const base = PEARLS.roundBase + Math.floor(round / PEARLS.roundEvery);
	return base + (isBossRound(round) ? PEARLS.boss : 0);
}

/** Shop candidates for a hero: one entry per rarity I–V, same id (ADR-021). */
export function weaponCandidates(hero: HeroId): ShopCandidate[] {
	return WEAPON_LINES.filter((w) => !w.hero || w.hero === hero).flatMap((w) =>
		RARITIES.filter((tier) => tier <= SHOP.maxRarity).map(
			(tier): ShopCandidate => ({
				kind: 'weapon',
				id: w.id,
				tier,
				sets: w.sets,
				...(w.hero && { hero: w.hero }),
			}),
		),
	);
}

/**
 * Equipment for sale: each catalog item from its catalog rarity (common I, rare II, legendary III)
 * up to V, so a strong base is never sold as a weak rarity. Prices follow `gearPrices`.
 */
export function gearCandidates(): ShopCandidate[] {
	return GEAR.flatMap((g) =>
		RARITIES.filter((r) => r >= LEGACY_GEAR_RARITY[g.rarity] && r <= SHOP.maxRarity).map(
			(tier): ShopCandidate => ({ kind: 'gear', id: g.id, tier, sets: [] }),
		),
	);
}

/** Speed potions only, sold from `SHOP.potionsFromRound` on (RF-09); empty before that. */
export function potionCandidates(round: number): ShopCandidate[] {
	if (round < SHOP.potionsFromRound) return [];
	return POTION_TYPES.filter((id) => (SHOP.potions as readonly string[]).includes(id)).map(
		(id) => ({ kind: 'potion', id, tier: 1, sets: [] }),
	);
}

/** Support items and the healing potion that can still be bought or leveled (rarity I, tier 1). */
export function supportCandidates(run: Pick<RunState, 'support' | 'healPotion'>): ShopCandidate[] {
	const support = SUPPORT_IDS.filter((id) => canBuySupport(run.support, id)).map(
		(id): ShopCandidate => ({ kind: 'support', id, tier: 1, sets: [] }),
	);
	// After the first purchase the potion leaves the shelf for the fixed "+1 potion" button (ADR-021).
	const potion: ShopCandidate[] =
		run.healPotion.level === 0
			? [{ kind: 'healPotion', id: 'healPotion', tier: 1, sets: [] }]
			: [];
	return [...support, ...potion];
}

/**
 * Keeps only what improves the build (ADR-021): a weapon not owned while a slot is free, an owned
 * weapon above its best copy, gear for an empty slot or above the rarity worn in that slot.
 */
export function isUpgrade(c: ShopCandidate, build: Build, gear: RunGear): boolean {
	if (c.kind === 'weapon') {
		const owned = build.weapons.filter((w) => w.id === c.id);
		if (owned.length === 0) return build.weapons.length < MAX_WEAPON_SLOTS;
		return c.tier > Math.max(...owned.map((w) => w.tier));
	}
	if (c.kind === 'gear') {
		const def = GEAR_BY_ID[c.id];
		if (!def) return false;
		const worn = gear.equipped[def.slot];
		return !worn || c.tier > itemRoll(gear, worn).rarity;
	}
	return true;
}

/**
 * Everything the shop of `round` can offer a hero (weapons, gear, support, potions). With the
 * build, only the evolution pool: what the hero does not have yet or better than what is owned.
 */
export function shopPool(
	hero: HeroId,
	round: number,
	run?: Pick<RunState, 'support' | 'healPotion' | 'gear'>,
	build?: Build,
): ShopCandidate[] {
	const all = [
		...weaponCandidates(hero),
		...gearCandidates(),
		...potionCandidates(round),
		...(run ? supportCandidates(run) : []),
	];
	if (!build) return all;
	const gear = run?.gear ?? emptyGear();
	return all.filter((c) => isUpgrade(c, build, gear));
}

/**
 * Buys the offer in slot `index` and applies it to the run: weapons go to a free slot (no free
 * slot → refused, nothing debited; fuse or sell first), gear worn at once (the old item of that slot is sold), potions to `run.shopPotions`, support items and the healing potion level up. Returns the offer, or null when refused.
 */
export function purchase(
	run: RunState,
	index: number,
	ctx: { build: Build; stats: PlayerStats },
): Offer | null {
	const shop = run.shop;
	const offer = shop?.offers[index];
	if (!shop || !offer) return null;
	const upgrade = offer.kind === 'weapon' ? upgradeSlot(ctx.build, offer.id, offer.tier) : -1;
	if (offer.kind === 'weapon' && upgrade < 0 && ctx.build.weapons.length >= MAX_WEAPON_SLOTS)
		return null;
	if (offer.kind === 'support' && !canBuySupport(run.support, offer.id as never)) return null;
	if (offer.kind === 'healPotion' && !canBuyHealPotion(run.healPotion)) return null;
	const bought = buy(shop, run.fish, index, run.materials);
	if (!bought) return null;
	run.shop = bought.state;
	run.fish = bought.fish;
	if (offer.kind === 'weapon' && upgrade >= 0) {
		// An upgrade replaces the weakest copy in its slot; the old copy is sold (ADR-021).
		const old = ctx.build.weapons[upgrade] as { tier: number };
		run.fish += sellValue(offerPrice('weapon', old.tier, run.round));
		const tier = offer.tier as WeaponTier;
		ctx.build.weapons[upgrade] = offer.affixes?.length
			? { id: offer.id as WeaponId, tier, affixes: [...offer.affixes] }
			: { id: offer.id as WeaponId, tier };
	} else if (offer.kind === 'weapon')
		addWeapon(ctx.build, offer.id as WeaponId, offer.tier as WeaponTier, offer.affixes);
	else if (offer.kind === 'gear') {
		run.gear = run.gear ?? emptyGear();
		// The worn item of that slot is sold for Fish (no bag, SDD-014 RF-30).
		const { sold } = pickUpGear(run.gear, ctx.stats, offer.id, {
			rarity: offer.tier as Rarity,
			affixes: offer.affixes ?? [],
		});
		if (sold) run.fish += gearSellValue(sold.rarity, run.round);
	} else if (offer.kind === 'support' && isSupportId(offer.id)) {
		buySupport(run.support, offer.id, ctx.stats);
	} else if (offer.kind === 'healPotion') {
		buyHealPotion(run.healPotion);
	} else if (offer.kind === 'potion') {
		const id = offer.id as PotionType;
		run.shopPotions[id] = (run.shopPotions[id] ?? 0) + 1;
	}
	return offer;
}

/** Price of the fixed "+1 potion" button, or null when it is not offered (not bought yet, or at 10). */
export function extraHealPotionPrice(run: Pick<RunState, 'healPotion' | 'round'>): number | null {
	if (run.healPotion.level === 0 || !canBuyHealPotion(run.healPotion)) return null;
	return offerPrice('healPotion', 1, run.round);
}

/** The fixed "+1 potion" button (ADR-021): one more potion carried; false when refused. */
export function buyExtraHealPotion(run: RunState): boolean {
	const price = extraHealPotionPrice(run);
	if (price === null || run.fish < price) return false;
	run.fish -= price;
	return buyHealPotion(run.healPotion);
}

export interface ShopRoll {
	rng: Rng;
	pool: readonly ShopCandidate[];
	ctx: ShopContext;
}

export function queueLevelUps(state: RunState, count: number): void {
	state.pendingLevelUps += count;
}

function openShop(state: RunState, roll: ShopRoll): void {
	const locks = Array.from({ length: SHOP.offers }, (_, i) => state.lockedOffers[i] != null);
	const offers = rollOffers(
		roll.rng,
		state.round,
		roll.ctx,
		roll.pool,
		locks,
		state.lockedOffers,
	);
	state.shop = {
		offers,
		locks: locks.map((l, i) => l && offers[i] === state.lockedOffers[i]),
		rerolls: 0,
	};
	state.phase = 'shop';
}

/** Round cleared: pays Fish and Pearls, then goes to pending cards or straight to the shop. */
export function endRound(state: RunState, roll: ShopRoll, harvesting = 0): void {
	state.fish += roundClearFish(state.round, harvesting);
	state.pearlsEarned += roundClearPearls(state.round);
	if (state.pendingLevelUps > 0) state.phase = 'cards';
	else openShop(state, roll);
}

/** One card pick done; when the queue empties the shop opens. */
export function resolveLevelUp(state: RunState, roll: ShopRoll): void {
	if (state.pendingLevelUps <= 0) return;
	state.pendingLevelUps--;
	if (state.pendingLevelUps === 0 && state.phase === 'cards') openShop(state, roll);
}

/** "Next round": keeps the locked offers and starts round N+1 (caller autosaves). */
export function leaveShop(state: RunState): void {
	if (!state.shop) return;
	const { offers, locks } = state.shop;
	state.lockedOffers = offers.map((o, i) => (locks[i] ? o : null));
	state.shop = null;
	state.phase = 'round';
	startRound(state, state.round + 1);
}

/** Closes the run: Pearls from rounds plus `floor(fish / 10)` go to the save; returns the gain. */
export function finishRun(state: RunState, save: SaveData): number {
	const gain = state.pearlsEarned + Math.floor(state.fish / SHOP.fishToPearls);
	save.pearls += gain;
	state.pearlsEarned = 0;
	state.fish = 0;
	return gain;
}

/** Spends one card reroll and draws a fresh set of level-up cards; null when none is left. */
export function rerollCards(
	state: RunState,
	rng: Rng,
	ctx: { luck: number; build: Build },
): CardOffer[] | null {
	if (state.cardRerollsLeft <= 0) return null;
	state.cardRerollsLeft--;
	return drawCards(rng, { hero: state.hero, round: state.round, ...ctx });
}
