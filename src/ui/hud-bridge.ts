import { createStore } from './store';

/** Everything the React HUD shows; plain data, translated by the components. */
export interface HudWeapon {
	id: string;
	tier: 1 | 2 | 3 | 4 | 5;
	/** Rarity I to V of the slot (same number as `tier`; the game always sets it), for the slot border color. */
	rarity?: 1 | 2 | 3 | 4 | 5;
}

export interface HudGambit {
	/** Gambit slot index (stable key). */
	slot: number;
	potion: string;
	condition: string;
	used: boolean;
}

export interface HudSnapshot {
	hp: number;
	maxHp: number;
	level: number;
	xp: number;
	xpToNext: number;
	fish: number;
	kills: number;
	round: number;
	timeLeft: number;
	bossRound: boolean;
	boss: { id: string; hp: number; maxHp: number } | null;
	/** Null until the superpower unlocks. */
	superpower: { charge: number; cost: number } | null;
	elite: 'none' | 'purple' | 'orange';
	weapons: HudWeapon[];
	/** Worn gear ids per slot (helmet, armor, legs, ring, amulet); null = empty. */
	gear: (string | null)[];
	gambits: HudGambit[];
	speed: number;
	fps: number;
}

/** Publish rate: the HUD does not need every frame. */
export const HUD_INTERVAL_MS = 100;

export const hudStore = createStore<{ hud: HudSnapshot | null }>({ hud: null });

let last = Number.NEGATIVE_INFINITY;

/** True when a new snapshot is due, so callers can skip building one on other frames. */
export function hudDue(now: number = performance.now()): boolean {
	return now - last >= HUD_INTERVAL_MS;
}

export function publishHud(snapshot: HudSnapshot, now: number = performance.now()): void {
	last = now;
	hudStore.set({ hud: snapshot });
}

/** Run build to the 6 weapon slots: `weapons` (1.0) or, while T2.3 is pending, the old secondaries. */
export function hudWeapons(build: {
	weapons: readonly { id: string; tier: 1 | 2 | 3 | 4 | 5 }[];
}): HudWeapon[] {
	return build.weapons.slice(0, 6).map((w) => ({ id: w.id, tier: w.tier, rarity: w.tier }));
}
