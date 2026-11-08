import type { BiomeId, HeroId } from '../config/constants';
import { MUSIC_KEYS } from '../core/music';
import { SFX, SFX_VARIANTS } from '../data/sfx';
import type { Dir } from '../logic/projection';

/**
 * Asset key contract (docs/visual.md). Code placeholders and final PixelLab art share
 * these keys, so swapping art never touches scenes or systems.
 */
/** Frames of each `fx.super.<hero>` loop that exists (only Jack's so far). */
export const SUPER_FX_FRAMES = 13;

export const KEYS = {
	/** Top-down ground tile, 64×64. */
	tile: (biome: string, variant: number) => `tile.${biome}.${variant}`,
	/** Arena wall tile: 0 = straight edge (wall on top), 1 = outer corner (top-left). */
	border: (biome: string, n: 0 | 1) => `border.${biome}.${n}`,
	deco: (biome: string, variant: number) => `deco.${biome}.${variant}`,
	/** Single-frame facing texture (placeholder stage; animations replace it in phase 3). */
	heroFacing: (hero: HeroId, tier: number, dir: Dir) => `hero.${hero}.t${tier}.${dir}`,
	shadow: 'fx.shadow',
	enemy: (id: string) => `enemy.${id}`,
	aura: (tier: 'purple' | 'orange') => `fx.aura.${tier}`,
	projectile: (id: string) => `proj.${id}`,
	slash: 'fx.slash',
	/** Red mark where an enemy will appear inside the camera view (0.5 s telegraph). */
	spawnMark: 'fx.spawnMark',
	blood: 'fx.blood',
	/** Ground splats: 4 variants each, red (`blood`) and green (`goo`, gore setting). */
	splat: (kind: 'blood' | 'goo', n: number) => `fx.splat.${kind}.${n}`,
	gib: (n: number) => `fx.gib.${n}`,
	droplet: 'fx.droplet',
	/** Signature/secondary weapon held by the hero, drawn pointing right, pivot at the grip (P-56). */
	weapon: (id: string) => `weapon.${id}`,
	/** Tiered weapon texture (SDD-002); placeholder tinted by tier until the art lands. */
	weaponTier: (id: string, tier: number) => `weapon.${id}.t${tier}`,
	muzzle: 'fx.muzzle',
	pickup: (kind: 'xp' | 'fish' | 'meat') => `pickup.${kind}`,
	/** Health pack healing `percent`% of max HP (25/50/75). */
	healPack: (percent: number) => `pickup.heal.${percent}`,
	/** Super power effect loop (PixelLab object animation, `SUPER_FX_FRAMES` frames): `fx.super.<hero>.<nn>`. */
	superFx: (hero: string, n: number) => `fx.super.${hero}.${String(n).padStart(2, '0')}`,
	/** Equipment icon (ground and pause menu): `item.<slot>.<name>`. */
	gear: (id: string) => `item.${id}`,
	/** Glow under dropped gear, tinted by rarity. */
	gearGlow: 'fx.gearGlow',
	ring: 'fx.ring',
	zone: 'fx.zone',
	drone: 'fx.drone',
	barrier: 'fx.barrier',
	/** Shared achievement badge (PixelLab; placeholder until public/assets/ui/ui.achievement.png). */
	achievementBadge: 'ui.achievement',
	/**
	 * 32×32 UI icons (PixelLab, atlas group `ui`): card ids (`icon.maxHp`, `icon.weapon.knives`,
	 * `icon.perk.bloodlust`) and potions (`icon.potion.heal`). No code placeholder: check
	 * `textures.exists` before using one.
	 */
	icon: (id: string) => `icon.${id}`,
	sfxAchievement: 'sfx.achievement',
	/** Approved PixelLab concept (south view), used as portrait in menus. */
	portrait: (hero: HeroId) => `portrait.${hero}`,
	/** Main menu key art (PixelLab, 688×384). */
	keyart: (hero: HeroId) => `keyart.${hero}`,
} as const;

export const BIOMES = {
	antarctica: { id: 'antarctica', tileVariants: 4, decoVariants: 4, decoDensity: 0.03 },
	forest: { id: 'forest', tileVariants: 4, decoVariants: 3, decoDensity: 0.05 },
	city: { id: 'city', tileVariants: 4, decoVariants: 3, decoDensity: 0.045 },
	// Legacy biomes (endless mode): research station and ruined city keep their PixelLab atlas.
	station: { id: 'station', tileVariants: 4, decoVariants: 3, decoDensity: 0.035 },
	ruins: { id: 'ruins', tileVariants: 4, decoVariants: 3, decoDensity: 0.045 },
} as const satisfies Record<BiomeId, { id: BiomeId; [k: string]: unknown }>;

/** Final files loaded in Boot when present; placeholders cover every missing key. */
export const FILES = {
	images: {
		'ui.achievement': 'assets/ui/ui.achievement.png',
		'portrait.jack': 'assets/heroes/portrait.jack.png',
		'portrait.bob': 'assets/heroes/portrait.bob.png',
		'portrait.lucia': 'assets/heroes/portrait.lucia.png',
		'keyart.jack': 'assets/menu/keyart.jack.png',
		'keyart.bob': 'assets/menu/keyart.bob.png',
	},
	audio: Object.fromEntries([
		...Object.keys(SFX).map((k) => [k, `assets/audio/sfx/${k}.mp3`]),
		...Object.entries(SFX_VARIANTS).flatMap(([k, count]) =>
			Array.from({ length: (count ?? 1) - 1 }, (_, i) => [
				`${k}.${i + 2}`,
				`assets/audio/sfx/${k}.${i + 2}.mp3`,
			]),
		),
		...MUSIC_KEYS.map((k) => [k, `assets/audio/music/${k}.mp3`]),
	]) as Record<string, string>,
} as const;
