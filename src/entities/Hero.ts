import Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import type { HeroId } from '../config/constants';
import { HERO_SPRITE_SCALE } from '../data/sprite-scale';
import { canInterrupt, fpsToFit, type HeroAnim, locomotion, spriteDir } from '../logic/hero-anim';
import { type Dir, depthOf, dirFromWorld, type Vec2, worldToScreen } from '../logic/projection';

interface AnimMeta {
	frames: number;
	anchorY: number;
	dirs: string[];
}

const LOOP_FPS: Record<string, number> = { idle: 6, walk8: 12 };
const ONE_SHOT_FPS: Record<string, number> = { hurt: 14, death: 8, super: 14, attack: 16 };

/**
 * Hero view over a world-space position; simulation stays in world units (P-35).
 * Uses the PixelLab atlas `hero.<id>.t<tier>` when present (5 directions, mirrored for the
 * west side), otherwise the code-drawn 8-direction placeholder.
 */
export class Hero {
	x = 0;
	y = 0;
	facing: Dir = 's';
	readonly sprite: Phaser.GameObjects.Sprite;
	private readonly shadow: Phaser.GameObjects.Image;
	private flashTime = 0;
	private anims: Record<string, AnimMeta> | null = null;
	private current: HeroAnim | null = null;
	private dead = false;

	constructor(
		private readonly scene: Phaser.Scene,
		readonly id: HeroId,
		private tier: 1 | 2 | 3,
		private readonly stats: { moveSpeed: number },
	) {
		// Small flat contact shadow right under the feet: a big round one read as "floating".
		this.shadow = scene.add
			.image(0, 0, KEYS.shadow)
			.setOrigin(0.5, 0.5)
			.setScale(0.9, 0.6)
			.setAlpha(0.7);
		this.sprite = scene.add
			.sprite(0, 0, KEYS.heroFacing(id, tier, 's'))
			.setOrigin(0.5, 0.95)
			.setScale(HERO_SPRITE_SCALE[id]);
		this.loadAtlas();
		this.sync();
	}

	/** Per-tier atlas when one exists, else the weaponless set shared by the 3 tiers (P-56). */
	private get atlasKey(): string {
		const tiered = `hero.${this.id}.t${this.tier}`;
		return this.scene.textures.exists(tiered) ? tiered : `hero.${this.id}`;
	}

	/** Registers the Phaser animations of the current tier's atlas (once per key). */
	private loadAtlas(): void {
		const key = this.atlasKey;
		if (!this.scene.textures.exists(key)) {
			this.anims = null;
			return;
		}
		const meta = this.scene.textures.get(key).customData as {
			meta?: { anims?: Record<string, AnimMeta> };
		};
		const anims =
			meta.meta?.anims ?? (meta as { anims?: Record<string, AnimMeta> }).anims ?? null;
		this.anims = anims;
		if (!anims) return;
		const manager = this.scene.anims;
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
					frameRate: LOOP_FPS[name] ?? ONE_SHOT_FPS[name] ?? 12,
					repeat: name in LOOP_FPS ? -1 : 0,
				});
			}
		}
	}

	flash(): void {
		this.flashTime = 0.12;
		this.sprite.setTint(0xff4040).setTintMode(Phaser.TintModes.FILL);
	}

	/** Signature attack towards a world angle; `seconds` is the weapon cooldown to fit in. */
	attack(angle: number, seconds: number): void {
		this.facing = dirFromWorld(Math.cos(angle), Math.sin(angle), this.facing);
		this.play('attack', seconds);
	}

	hurt(): void {
		this.play('hurt');
	}

	super(): void {
		this.facing = 's';
		this.play('super');
	}

	die(): void {
		this.dead = true;
		this.play('death');
	}

	/** `move` is a unit world vector (or zero); `collide` pushes the hero out of obstacles. */
	update(dt: number, move: Vec2, collide?: (hero: Hero) => void): void {
		if (!this.dead) {
			this.x += move.x * this.stats.moveSpeed * dt;
			this.y += move.y * this.stats.moveSpeed * dt;
			collide?.(this);
		}
		const moving = move.x !== 0 || move.y !== 0;
		if (moving && !this.isPlaying('attack'))
			this.facing = dirFromWorld(move.x, move.y, this.facing);
		if (this.anims) {
			if (!this.dead) this.play(locomotion(moving));
		} else {
			this.sprite.setTexture(KEYS.heroFacing(this.id, this.tier, this.facing));
		}
		if (this.flashTime > 0) {
			this.flashTime -= dt;
			if (this.flashTime <= 0) this.sprite.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
		}
		this.sync();
	}

	private isPlaying(name: HeroAnim): boolean {
		return this.current === name && this.sprite.anims.isPlaying;
	}

	private play(name: HeroAnim, fitSeconds?: number): void {
		const meta = this.anims?.[name];
		if (!meta) return;
		if (!canInterrupt(this.current, this.sprite.anims.isPlaying, name)) return;
		const { dir, flip } = spriteDir(this.facing);
		// The super cast only exists facing south (P-54).
		const d = meta.dirs.includes(dir) ? dir : 's';
		const key = `${this.atlasKey}.${name}.${d}`;
		const sameLoop = this.current === name && this.sprite.anims.currentAnim?.key === key;
		this.sprite.setFlipX(flip && d === dir).setOrigin(0.5, meta.anchorY);
		if (sameLoop && this.sprite.anims.isPlaying) return;
		this.current = name;
		const fps = fitSeconds
			? fpsToFit(meta.frames, fitSeconds * 0.9, ONE_SHOT_FPS.attack ?? 16)
			: undefined;
		this.sprite.play(fps ? { key, frameRate: fps } : key, !sameLoop);
	}

	private sync(): void {
		const s = worldToScreen(this.x, this.y);
		const depth = depthOf(this.x, this.y);
		this.shadow.setPosition(s.x, s.y).setDepth(depth - 0.5);
		this.sprite.setPosition(Math.round(s.x), Math.round(s.y)).setDepth(depth);
	}
}
