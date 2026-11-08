import type Phaser from 'phaser';
import { WEAPON_TIER_TINT, type WeaponId, type WeaponTier } from '../data/weapons';
import { KEYS } from './manifest';

/**
 * Texture of a weapon at a tier: the tier art when it exists, else the code placeholder tinted
 * by tier (I gray, II green, III blue, IV gold) until the tier art lands (SDD-002).
 */
export function weaponArt(
	textures: Phaser.Textures.TextureManager,
	id: WeaponId,
	tier: WeaponTier,
): { key: string; tint: number | null } {
	const final = KEYS.weaponTier(id, tier);
	if (textures.exists(final)) return { key: final, tint: null };
	return { key: KEYS.weapon(id), tint: WEAPON_TIER_TINT[tier] };
}
