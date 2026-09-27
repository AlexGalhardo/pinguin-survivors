import type Phaser from 'phaser';

/** Per-animation metadata written by scripts/pack-heroes.ts into the atlas JSON (meta.anims). */
export interface AnimMeta {
	frames: number;
	/** Feet position as a fraction of the frame height (origin Y). */
	anchorY: number;
	/** Generated directions (s, se, e, ne, n); the west side is mirrored. */
	dirs: string[];
}

/** Directory of the character animation atlases other than heroes (enemies, bosses). */
export const CHAR_ATLAS_DIR = 'assets/enemies/';

/** Character atlases present in public/assets/enemies (texture key = file name = manifest key). */
export function characterAtlases(files: readonly string[]): string[] {
	return files
		.filter((f) => f.startsWith(CHAR_ATLAS_DIR) && f.endsWith('.json'))
		.map((f) => f.slice(CHAR_ATLAS_DIR.length, -'.json'.length));
}

/**
 * Reads meta.anims of a PixelLab character atlas and registers one Phaser animation per
 * animation × direction (`<key>.<anim>.<dir>`), once. Returns null when the key is a plain
 * texture (code placeholder or a single image).
 */
export function registerCharacterAnims(
	scene: Phaser.Scene,
	key: string,
	fps: Record<string, number>,
	loops: readonly string[],
): Record<string, AnimMeta> | null {
	if (!scene.textures.exists(key)) return null;
	const data = scene.textures.get(key).customData as {
		meta?: { anims?: Record<string, AnimMeta> };
	};
	const anims = data.meta?.anims ?? null;
	if (!anims) return null;
	const manager = scene.anims;
	for (const [name, m] of Object.entries(anims)) {
		for (const d of m.dirs) {
			const animKey = `${key}.${name}.${d}`;
			if (manager.exists(animKey)) continue;
			manager.create({
				key: animKey,
				frames: manager.generateFrameNames(key, {
					prefix: `${name}.${d}.`,
					start: 0,
					end: m.frames - 1,
					zeroPad: 2,
				}),
				frameRate: fps[name] ?? 10,
				repeat: loops.includes(name) ? -1 : 0,
			});
		}
	}
	return anims;
}
