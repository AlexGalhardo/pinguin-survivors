import type { HeroId } from '../config/constants';
import type { Dir } from '../logic/iso';

/**
 * Asset key contract (docs/art-and-assets.md). Code placeholders and final PixelLab art share
 * these keys, so swapping art never touches scenes or systems.
 */
export const KEYS = {
	tile: (biome: string, variant: number) => `tile.${biome}.${variant}`,
	deco: (biome: string, variant: number) => `deco.${biome}.${variant}`,
	/** Single-frame facing texture (placeholder stage; animations replace it in phase 3). */
	heroFacing: (hero: HeroId, tier: number, dir: Dir) => `hero.${hero}.t${tier}.${dir}`,
	shadow: 'fx.shadow',
	enemy: (id: string) => `enemy.${id}`,
	aura: (tier: 'purple' | 'orange') => `fx.aura.${tier}`,
	projectile: (id: string) => `proj.${id}`,
	slash: 'fx.slash',
	blood: 'fx.blood',
	/** Shared achievement badge (PixelLab; placeholder until public/assets/ui/ui.achievement.png). */
	achievementBadge: 'ui.achievement',
	sfxAchievement: 'sfx.achievement',
} as const;

export const BIOMES = {
	antarctica: { id: 'antarctica', tileVariants: 4, decoVariants: 3, decoDensity: 0.03 },
} as const;
export type BiomeId = keyof typeof BIOMES;

/** Final files loaded in Boot when present; placeholders cover every missing key. */
export const FILES = {
	images: { 'ui.achievement': 'assets/ui/ui.achievement.png' },
	audio: { 'sfx.achievement': 'assets/audio/sfx/sfx.achievement.mp3' },
} as const;
