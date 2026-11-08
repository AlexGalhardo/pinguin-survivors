import Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import type { SignatureWeapon } from '../data/weapons';
import { depthOf, worldToScreen } from '../logic/projection';
import { weaponPose } from '../logic/weapon-anim';

/** Hand height above the feet, in screen px. */
const HAND_Z = 18;

/**
 * The signature weapon as its own sprite next to the hero, animated in code like Brotato
 * (P-56): it aims at the target, swings/recoils/glows when attacking and idles between attacks.
 */
export class WeaponView {
	private readonly sprite: Phaser.GameObjects.Image;
	private readonly muzzle: Phaser.GameObjects.Image;
	private aim = Math.PI / 4;
	private since = Number.POSITIVE_INFINITY;
	private cooldown = 1;

	constructor(
		scene: Phaser.Scene,
		private weapon: SignatureWeapon,
	) {
		this.sprite = scene.add.image(0, 0, KEYS.weapon(weapon.id)).setOrigin(0.15, 0.5);
		this.muzzle = scene.add.image(0, 0, KEYS.muzzle).setOrigin(0, 0.5).setVisible(false);
	}

	setWeapon(weapon: SignatureWeapon): void {
		this.weapon = weapon;
		this.sprite.setTexture(KEYS.weapon(weapon.id));
	}

	/** Called by the weapon system on every attack (world angle towards the target). */
	fire(worldAngle: number, cooldown: number): void {
		this.aim = worldAngle;
		this.since = 0;
		this.cooldown = cooldown;
	}

	/** Idle aim follows movement so the weapon points where the hero walks. */
	face(worldAngle: number): void {
		if (this.since > this.cooldown) this.aim = worldAngle;
	}

	update(dt: number, heroX: number, heroY: number): void {
		this.since += dt;
		const arc = ((this.weapon.angle ?? 90) * Math.PI) / 180;
		const pose = weaponPose(this.weapon.kind, this.since, this.cooldown, arc);
		const base = this.aim;
		const left = Math.cos(base) < 0;
		// Mirror the swing on the left side so the blade always sweeps "forward".
		const angle = base + (left ? -pose.angle : pose.angle);
		const hand = worldToScreen(heroX, heroY, HAND_Z);
		const x = hand.x + Math.cos(angle) * pose.reach * 0.5;
		const y = hand.y + Math.sin(angle) * pose.reach * 0.5;
		// Aiming up: weapon behind the hero; aiming down: in front.
		const depth = depthOf(heroX, heroY) + (Math.sin(base) < 0 ? -0.2 : 0.2);
		this.sprite
			.setPosition(Math.round(x), Math.round(y))
			.setRotation(angle)
			.setFlipY(left)
			.setScale(pose.scale)
			.setDepth(depth);
		const flash = this.weapon.kind === 'spread' && pose.glow > 0.3;
		this.muzzle.setVisible(flash);
		if (flash) {
			const tip = this.sprite.width * 0.85 * pose.scale;
			this.muzzle
				.setPosition(x + Math.cos(angle) * tip, y + Math.sin(angle) * tip)
				.setRotation(angle)
				.setAlpha(pose.glow)
				.setDepth(depth + 0.1);
		}
		if (this.weapon.kind === 'bolt') {
			this.sprite.setTint(
				Phaser.Display.Color.GetColor(255, 255, Math.round(255 - 80 * pose.glow)),
			);
		}
	}
}
