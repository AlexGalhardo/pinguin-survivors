import type { HeroId } from '../config/constants';
import { STARTING_WEAPON_UNLOCKS, STARTING_WEAPONS } from '../data/unlocks';
import { WEAPON_LINE_BY_ID, type WeaponId } from '../data/weapons';
import type { SaveData } from './save';

/** Starting weapons a hero can pick: its own three plus the ones bought with Pearls. */
export function availableStartingWeapons(save: SaveData, hero: HeroId): WeaponId[] {
	return [...STARTING_WEAPONS[hero], ...save.unlocks.startingWeapons[hero]];
}

/** Pearl unlocks still for sale to `hero`: not owned, and not another hero's exclusive. */
export function unlockableWeapons(
	save: SaveData,
	hero: HeroId,
): { weapon: WeaponId; cost: number }[] {
	const owned = availableStartingWeapons(save, hero);
	return STARTING_WEAPON_UNLOCKS.filter((u) => {
		const only = (WEAPON_LINE_BY_ID[u.weapon] as { hero?: HeroId }).hero;
		return !owned.includes(u.weapon) && (only === undefined || only === hero);
	});
}

/** Buys a starting weapon for `hero` with Pearls; false (and no change) if it is not for sale or too dear. */
export function buyStartingWeapon(save: SaveData, hero: HeroId, weapon: WeaponId): boolean {
	const offer = unlockableWeapons(save, hero).find((u) => u.weapon === weapon);
	if (!offer || save.pearls < offer.cost) return false;
	save.pearls -= offer.cost;
	save.unlocks.startingWeapons[hero].push(weapon);
	return true;
}
