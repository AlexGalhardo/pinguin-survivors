import { type BiomeId, HERO_IDS, type HeroId } from '../config/constants';
import { MUSIC_KEYS } from '../core/music';
import { SFX, SFX_VARIANTS } from '../data/sfx';
import { VO_EVENTS, VOICE } from '../data/voice';
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
	/** Ground splats: 4 variants each, red (`blood`) and green (`goo`, gore setting). */
	splat: (kind: 'blood' | 'goo', n: number) => `fx.splat.${kind}.${n}`,
	gib: (n: number) => `fx.gib.${n}`,
	droplet: 'fx.droplet',
	/** Signature/secondary weapon held by the hero, drawn pointing right, pivot at the grip (P-56). */
	weapon: (id: string) => `weapon.${id}`,
	muzzle: 'fx.muzzle',
	pickup: (kind: 'xp' | 'fish' | 'meat') => `pickup.${kind}`,
	ring: 'fx.ring',
	zone: 'fx.zone',
	drone: 'fx.drone',
	barrier: 'fx.barrier',
	/** Shared achievement badge (PixelLab; placeholder until public/assets/ui/ui.achievement.png). */
	achievementBadge: 'ui.achievement',
	sfxAchievement: 'sfx.achievement',
	/** Approved PixelLab concept (south view), used as portrait in menus. */
	portrait: (hero: HeroId) => `portrait.${hero}`,
	/** Main menu key art (PixelLab, 688×384). */
	keyart: (hero: HeroId) => `keyart.${hero}`,
} as const;

export const BIOMES = {
	antarctica: { id: 'antarctica', tileVariants: 4, decoVariants: 3, decoDensity: 0.03 },
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

/** Recorded hero lines of one language: vo.<hero>.<event>.<lang>.<n> (scripts/el-voice.ts). */
export function voiceFiles(lang: string): Record<string, string> {
	const out: Record<string, string> = {};
	for (const hero of HERO_IDS)
		for (const event of VO_EVENTS)
			for (let n = 1; n <= VOICE.variants; n++) {
				const key = `vo.${hero}.${event}.${lang}.${n}`;
				out[key] = `assets/audio/vo/${key}.mp3`;
			}
	return out;
}
