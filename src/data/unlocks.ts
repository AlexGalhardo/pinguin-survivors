import type { CharacterId } from './characters';

/** Character unlocks (docs/balancing.md §9): Warrior starts unlocked. */
export const UNLOCKS: readonly (
	| { character: CharacterId; kind: 'wave'; with: CharacterId; wave: number }
	| { character: CharacterId; kind: 'bossKilled' }
)[] = [
	{ character: 'ranger', kind: 'wave', with: 'warrior', wave: 10 },
	{ character: 'mage', kind: 'bossKilled' },
];

/** Class passives (Beta). */
export const PASSIVES = {
	warrior: {
		/** +1 Armor per enemy within `radius`, up to `max`. */
		radius: 60,
		armorPerEnemy: 1,
		max: 5,
	},
	ranger: {
		/** +Attack Speed while moving. */
		attackSpeedMoving: 0.2,
	},
	mage: {
		/** +Ability Power per kill in the current wave, up to `max`. */
		abilityPowerPerKill: 0.01,
		max: 0.3,
	},
} as const;
