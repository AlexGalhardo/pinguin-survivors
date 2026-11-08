/** Tuning of the weapon sprite animation around the hero (P-56); times in s, lengths in px, angles in rad. */
export const WEAPON_ANIM = {
	/** Swing length as a fraction of the cooldown, clamped. */
	swingShare: 0.45,
	swingMin: 0.1,
	swingMax: 0.28,
	recoilTime: 0.16,
	recoil: 12,
	kick: 0.55,
	/** Guns are drawn bigger while they fire and their muzzle flash is scaled up. */
	gunBase: 1.35,
	gunScale: 0.3,
	flashScale: 1.8,
	castTime: 0.32,
	/** Staff cast: how far it lifts (angle), pushes towards the target (px) and swells. */
	castLift: 0.9,
	castPush: 10,
	castScale: 0.35,
	idleReach: 12,
	/** Melee: longest lunge (half is drawn), stopping `lungeGap` short of the target's distance from the mount. */
	lunge: 96,
	lungeGap: 18,
	/** Thrown weapons: how far the hand pushes out, how long the throw takes and how long the sprite is gone. */
	throwReach: 44,
	throwTime: 0.14,
	throwGone: 0.28,
	/** Planted weapons (mines, totems, clouds): dip towards the ground and squash. */
	plantTime: 0.22,
	plantDip: 0.7,
	plantSquash: 0.25,
	/** Orbiting blades, auras and drones: spin and pulse when they strike. */
	pulseTime: 0.3,
	spin: Math.PI * 2,
	pulseScale: 0.3,
} as const;
