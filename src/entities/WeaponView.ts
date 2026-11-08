import type Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import { weaponArt } from '../art/weapon-art';
import { WEAPON_ANIM } from '../data/weapon-anim';
import { depthOf, worldToScreen } from '../logic/projection';
import { weaponPose } from '../logic/weapon-anim';
import type { ActiveWeapon } from '../logic/weapons';

/** Hand height above the feet, in screen px. */
const HAND_Z = 18;
const TURN_SPEED = 10;
/** Ring sprites float around the hero; a bit bigger reads better than the raw art. */
const SCALE = 1.2;
/** Behaviors whose weapon shows a flash at the tip when it fires. */
const FLASH: ReadonlySet<string> = new Set(['spread', 'shooter', 'bolt']);

/**
 * One weapon slot as a sprite next to the hero, animated in code like Brotato (P-56): it turns
 * towards its target, swings/recoils/glows when attacking and idles between attacks.
 */
export class WeaponView {
	private readonly sprite: Phaser.GameObjects.Image;
	private readonly muzzle: Phaser.GameObjects.Image;
	private weapon: ActiveWeapon | null = null;
	private aim = 0;
	private since = Number.POSITIVE_INFINITY;
	private cooldown = 1;
	/** Distance to the current target from the mount point; sets how far a melee lunge reaches. */
	private targetDist = 0;

	constructor(private readonly scene: Phaser.Scene) {
		this.sprite = scene.add.image(0, 0, KEYS.shadow).setOrigin(0.15, 0.5).setScale(SCALE);
		this.muzzle = scene.add.image(0, 0, KEYS.muzzle).setOrigin(0, 0.5).setVisible(false);
	}

	setWeapon(w: ActiveWeapon): void {
		this.weapon = w;
		const art = weaponArt(this.scene.textures, w.id, w.tier);
		this.sprite.setTexture(art.key);
		if (art.tint === null) this.sprite.clearTint();
		else this.sprite.setTint(art.tint);
	}

	get id(): string | undefined {
		return this.weapon?.id;
	}

	get tier(): number | undefined {
		return this.weapon?.tier;
	}

	/** Called on every attack (world angle towards the target). */
	fire(worldAngle: number, cooldown: number): void {
		this.aim = worldAngle;
		this.since = 0;
		this.cooldown = cooldown;
	}

	/** Turns towards `want` unless an attack animation is still playing. */
	turn(want: number, dt: number, dist = 0): void {
		if (this.since > this.cooldown) this.targetDist = dist;
		if (this.since <= this.cooldown) return;
		let d = want - this.aim;
		d = Math.atan2(Math.sin(d), Math.cos(d));
		this.aim += d * Math.min(1, TURN_SPEED * dt);
	}

	/** `x`,`y` is the mount point in world space (on the ring around the hero). */
	update(dt: number, x: number, y: number): void {
		const w = this.weapon;
		if (!w) return;
		this.since += dt;
		const arc = (w.angle * Math.PI) / 180;
		// Lunge up to the target (never farther than the weapon reaches), then back.
		const lunge = Math.min(
			WEAPON_ANIM.lunge,
			2 * Math.max(0, this.targetDist - WEAPON_ANIM.lungeGap),
		);
		const pose = weaponPose(w.behavior, this.since, this.cooldown, arc, lunge);
		const base = this.aim;
		const left = Math.cos(base) < 0;
		// Mirror the swing on the left side so the blade always sweeps "forward".
		const angle = base + (left ? -pose.angle : pose.angle);
		const hand = worldToScreen(x, y, HAND_Z);
		const px = hand.x + Math.cos(angle) * pose.reach * 0.5;
		const py = hand.y + Math.sin(angle) * pose.reach * 0.5;
		// Aiming up: weapon behind the hero; aiming down: in front.
		const depth = depthOf(x, y) + (Math.sin(base) < 0 ? -0.2 : 0.2);
		this.sprite
			.setPosition(Math.round(px), Math.round(py))
			.setRotation(angle)
			.setFlipY(left)
			.setScale(SCALE * pose.scale)
			.setAlpha(pose.alpha)
			.setDepth(depth);
		// Guns flash at the barrel; staves flash at the tip when they cast.
		const flash = FLASH.has(w.behavior) && pose.glow > 0.3;
		this.muzzle.setVisible(flash);
		if (flash) {
			const tip = this.sprite.width * 0.85 * SCALE * pose.scale;
			this.muzzle
				.setPosition(px + Math.cos(angle) * tip, py + Math.sin(angle) * tip)
				.setRotation(angle)
				.setAlpha(pose.glow)
				.setScale(WEAPON_ANIM.flashScale)
				.setDepth(depth + 0.1);
		}
	}

	destroy(): void {
		this.sprite.destroy();
		this.muzzle.destroy();
	}
}
