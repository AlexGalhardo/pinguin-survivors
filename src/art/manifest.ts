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
} as const;

export const BIOMES = {
	antarctica: { id: 'antarctica', tileVariants: 4, decoVariants: 3, decoDensity: 0.03 },
} as const;
export type BiomeId = keyof typeof BIOMES;
