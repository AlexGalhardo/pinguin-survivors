import type { StatKey } from '../logic/stats';

export const SET_IDS = [
	'blade',
	'blunt',
	'thrown',
	'gun',
	'explosive',
	'elemental',
	'support',
] as const;
export type SetId = (typeof SET_IDS)[number];

/** Weapons of the same set needed for each bonus step. */
export const SET_THRESHOLDS = [2, 4, 6] as const;

export interface SetModifier {
	stat: StatKey;
	value: number;
}

/**
 * Set bonuses (GDD §8): only the highest step reached applies, values are totals per step
 * (2 / 4 / 6 weapons). Initial numbers, to be tuned with the sim (T2.10).
 */
export const SET_BONUSES: Readonly<
	Record<SetId, readonly [SetModifier[], SetModifier[], SetModifier[]]>
> = {
	blade: [
		[{ stat: 'bleedChance', value: 0.05 }],
		[{ stat: 'bleedChance', value: 0.12 }],
		[{ stat: 'bleedChance', value: 0.25 }],
	],
	blunt: [
		[{ stat: 'armor', value: 2 }],
		[{ stat: 'armor', value: 5 }],
		[{ stat: 'armor', value: 10 }],
	],
	thrown: [
		[{ stat: 'attackSpeed', value: 0.05 }],
		[{ stat: 'attackSpeed', value: 0.12 }],
		[{ stat: 'attackSpeed', value: 0.25 }],
	],
	gun: [
		[{ stat: 'crit', value: 0.04 }],
		[{ stat: 'crit', value: 0.1 }],
		[{ stat: 'crit', value: 0.2 }],
	],
	explosive: [
		[{ stat: 'area', value: 0.1 }],
		[{ stat: 'area', value: 0.22 }],
		[{ stat: 'area', value: 0.4 }],
	],
	elemental: [
		[
			{ stat: 'burnChance', value: 0.05 },
			{ stat: 'chillChance', value: 0.05 },
		],
		[
			{ stat: 'burnChance', value: 0.12 },
			{ stat: 'chillChance', value: 0.12 },
		],
		[
			{ stat: 'burnChance', value: 0.25 },
			{ stat: 'chillChance', value: 0.25 },
		],
	],
	support: [
		[{ stat: 'regen', value: 1 }],
		[{ stat: 'regen', value: 2.5 }],
		[{ stat: 'regen', value: 5 }],
	],
};
