import type Phaser from 'phaser';

/** Group atlases packed by scripts/pack-atlas.ts (paths relative to public/). */
export const ATLAS_DIR = 'assets/atlas/';

/** Texture key of a group atlas (the frames themselves become textures named by their key). */
export const atlasKey = (group: string): string => `atlas:${group}`;

/** Groups present in public/assets/atlas at build/dev-server start. */
export function atlasGroups(files: readonly string[]): string[] {
	return files
		.filter((f) => f.startsWith(ATLAS_DIR) && f.endsWith('.json'))
		.map((f) => f.slice(ATLAS_DIR.length, -'.json'.length));
}

/**
 * Registers every frame of a loaded group atlas as its own texture key (the manifest key), so
 * `scene.add.image(x, y, 'weapon.machete')` works exactly like with the code placeholders.
 * The new textures share the atlas GPU texture (WebGL), so there is one upload per atlas and
 * sprites from the same atlas still batch together.
 */
export function registerAtlasFrames(textures: Phaser.Textures.TextureManager, key: string): number {
	if (!textures.exists(key)) return 0;
	const atlas = textures.get(key);
	const src = atlas.source[0];
	// Canvas renderer has no glTexture: the image itself is shared (no GPU upload there).
	const shared = src?.glTexture ?? src?.image;
	if (!src || !shared) return 0;
	let count = 0;
	for (const name of atlas.getFrameNames()) {
		if (textures.exists(name)) continue;
		const f = atlas.get(name);
		const tex = textures.create(
			name,
			shared as Phaser.Types.Textures.TextureSource,
			src.width,
			src.height,
		);
		if (!tex) continue;
		tex.add('0', 0, f.cutX, f.cutY, f.cutWidth, f.cutHeight);
		count++;
	}
	return count;
}
