export type AbilityId =
	| 'orbital_drones'
	| 'chain_lightning'
	| 'plasma_nova'
	| 'cryo_field'
	| 'homing_missiles'
	| 'laser_beam';

export const ABILITY_IDS: readonly AbilityId[] = [
	'orbital_drones',
	'chain_lightning',
	'plasma_nova',
	'cryo_field',
	'homing_missiles',
	'laser_beam',
];

export const MAX_ABILITIES = 6;
export const MAX_ABILITY_LEVEL = 5;
