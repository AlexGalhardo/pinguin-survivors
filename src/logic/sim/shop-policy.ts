import { WEAPON_LINE_BY_ID, type WeaponId, type WeaponTier } from '../../data/weapons';
import { addWeapon, type Build, canFuse, fuse } from '../build';
import type { RunState, ShopRoll } from '../run-state';
import { buy, lock, type Offer, offerPrice, reroll, type ShopState, sellValue } from '../shop';
import type { PlayerStats } from '../stats';
import { weaponDps } from './run-sim';

/**
 * "Reasonable player" shop choice shared by the headless sim and the future bot (SDD-013 RF-01):
 * buy the weapon with the best power per Fish, fuse equal pairs, swap out a clearly weaker slot,
 * lock a good offer it cannot afford and reroll while it has Fish to spare. Weapons only for now
 * (items and gear are not in the shop pool yet).
 */
export const SHOP_POLICY = {
	maxRerolls: 3,
	/** Reroll only while Fish exceeds this many times the average price on the shelf. */
	rerollRichness: 2,
	/** A new weapon replaces the weakest slot only if it is this much stronger. */
	replaceFactor: 1.5,
	/** Value bonus per owned weapon sharing a set with the offer. */
	setSynergy: 0.1,
	/** Value multiplier of an offer that fuses with an owned copy. */
	fuseBonus: 2,
};

/** Power of a weapon at a tier for this hero: the sim's own crowd-aware DPS (what a player would see). */
export function weaponValue(id: string, tier: number, stats: PlayerStats): number {
	return weaponDps(stats, { id: id as WeaponId, tier: tier as WeaponTier });
}

function weakestSlot(build: Build, stats: PlayerStats): number {
	let idx = 0;
	let min = Number.POSITIVE_INFINITY;
	build.weapons.forEach((w, i) => {
		const v = weaponValue(w.id, w.tier, stats);
		if (v < min) {
			min = v;
			idx = i;
		}
	});
	return idx;
}

/** Value of owning an offer now; 0 when it has no room (no free slot, no fuse, not clearly better). */
export function offerValue(offer: Offer, build: Build, stats: PlayerStats): number {
	if (offer.kind !== 'weapon') return 0;
	const def = WEAPON_LINE_BY_ID[offer.id as keyof typeof WEAPON_LINE_BY_ID];
	if (!def) return 0;
	let value = weaponValue(offer.id, offer.tier, stats);
	const shared = build.weapons.filter((w) =>
		WEAPON_LINE_BY_ID[w.id].sets.some((s) => (def.sets as readonly string[]).includes(s)),
	).length;
	value *= 1 + SHOP_POLICY.setSynergy * shared;
	const fuses = build.weapons.some(
		(w) => w.id === offer.id && w.tier === offer.tier && w.tier < 4,
	);
	if (fuses) return value * SHOP_POLICY.fuseBonus;
	if (build.weapons.length < 6) return value;
	const weakest = build.weapons[weakestSlot(build, stats)];
	if (!weakest) return 0;
	return value > weaponValue(weakest.id, weakest.tier, stats) * SHOP_POLICY.replaceFactor
		? value
		: 0;
}

/** Fuses equal pairs until none is left. */
export function fuseAll(build: Build): number {
	let fused = 0;
	for (let again = true; again; ) {
		again = false;
		for (let a = 0; a < build.weapons.length && !again; a++)
			for (let b = a + 1; b < build.weapons.length && !again; b++)
				if (canFuse(build, a, b) && fuse(build, a, b)) {
					fused++;
					again = true;
				}
	}
	return fused;
}

export interface ShopPlay {
	/** Net Fish spent (buys and rerolls minus sale refunds). */
	spent: number;
	bought: Offer[];
	rerolls: number;
	/** Fish paid for rerolls (part of `spent`). */
	rerollFish: number;
}

/** Plays the open shop of `run.shop` in place: mutates `run.fish`, `run.shop` and `build`. */
export function playShop(args: {
	run: RunState;
	build: Build;
	stats: PlayerStats;
	roll: ShopRoll;
}): ShopPlay {
	const { run, build, stats, roll } = args;
	const play: ShopPlay = { spent: 0, bought: [], rerolls: 0, rerollFish: 0 };
	let shop = run.shop as ShopState;
	const startFish = run.fish;
	fuseAll(build);

	for (;;) {
		let bestIdx = -1;
		let bestEff = 0;
		shop.offers.forEach((o, i) => {
			if (!o || o.price > run.fish + sellGain(o, build, stats, run.round)) return;
			const eff = offerValue(o, build, stats) / o.price;
			if (eff > bestEff) {
				bestEff = eff;
				bestIdx = i;
			}
		});
		if (bestIdx >= 0) {
			const offer = shop.offers[bestIdx] as Offer;
			if (build.weapons.length >= 6 && !canJoin(offer, build)) {
				const slot = weakestSlot(build, stats);
				const out = build.weapons[slot];
				if (out) {
					run.fish += sellValue(offerPrice('weapon', out.tier, run.round));
					build.weapons.splice(slot, 1);
				}
			}
			const r = buy(shop, run.fish, bestIdx);
			if (!r) break;
			shop = r.state;
			run.fish = r.fish;
			addWeapon(build, offer.id as never, offer.tier as WeaponTier);
			fuseAll(build);
			play.bought.push(offer);
			continue;
		}

		// Nothing to buy: keep one good unaffordable offer for the next shop, then maybe reroll.
		if (!shop.locks.some(Boolean)) {
			let lockIdx = -1;
			let lockVal = 0;
			shop.offers.forEach((o, i) => {
				const v = o ? offerValue(o, build, stats) : 0;
				if (v > lockVal) {
					lockVal = v;
					lockIdx = i;
				}
			});
			if (lockIdx >= 0) shop = lock(shop, lockIdx);
		}
		const open = shop.offers.filter((o): o is Offer => o !== null);
		const avg = open.reduce((a, o) => a + o.price, 0) / Math.max(1, open.length);
		if (play.rerolls >= SHOP_POLICY.maxRerolls || run.fish <= SHOP_POLICY.rerollRichness * avg)
			break;
		const r = reroll(shop, run.fish, roll.rng, run.round, roll.ctx, roll.pool);
		if (!r) break;
		play.rerollFish += run.fish - r.fish;
		shop = r.state;
		run.fish = r.fish;
		play.rerolls++;
	}

	run.shop = shop;
	play.spent = Math.max(0, startFish - run.fish);
	return play;
}

function canJoin(offer: Offer, build: Build): boolean {
	return build.weapons.some((w) => w.id === offer.id && w.tier === offer.tier && w.tier < 4);
}

/** Fish a swap would refund, so a full bar can still afford a clearly better weapon. */
function sellGain(offer: Offer, build: Build, stats: PlayerStats, round: number): number {
	if (build.weapons.length < 6 || canJoin(offer, build)) return 0;
	const out = build.weapons[weakestSlot(build, stats)];
	return out ? sellValue(offerPrice('weapon', out.tier, round)) : 0;
}
