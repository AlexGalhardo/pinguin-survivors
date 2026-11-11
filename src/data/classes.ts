import type { HeroId } from '../config/constants';
import type { StatKey } from '../logic/stats';

/** Stats a class may scale instead of add to (applied after the additions). */
export type ClassMulStat = 'maxHp' | 'armor' | 'regen';

/**
 * A way to play a hero (SDD-024): stat modifiers applied once, when the run starts. `add` uses
 * the unit of the stat (`damage` 0.25 = +25%); `mul` scales the final value. Numbers are
 * provisional until the balance pass.
 */
export interface HeroClassDef {
	/** `<hero>.<name>`; the i18n key of the name is `class.<id>`. */
	id: string;
	hero: HeroId;
	/** Hero level that makes the class selectable (1 = from the start). */
	unlockLevel: number;
	add: Partial<Record<StatKey, number>>;
	mul: Partial<Record<ClassMulStat, number>>;
}

const cls = (
	hero: HeroId,
	name: string,
	unlockLevel: number,
	add: HeroClassDef['add'] = {},
	mul: HeroClassDef['mul'] = {},
): HeroClassDef => ({ id: `${hero}.${name}`, hero, unlockLevel, add, mul });

/** Four per hero; the first one is the hero unchanged. */
export const HERO_CLASSES: readonly HeroClassDef[] = [
	cls('jack', 'survivor', 1),
	cls('jack', 'berserker', 5, { damage: 0.25, attackSpeed: 0.1 }, { armor: 0, maxHp: 0.85 }),
	cls('jack', 'butcher', 10, {
		lifesteal: 0.03,
		'tagMul.melee': 0.2,
		'tagMul.firearm': -0.3,
		'tagMul.magic': -0.3,
	}),
	cls('jack', 'bulwark', 20, { armor: 8, damage: -0.15, moveSpeed: -8 }, { maxHp: 1.3 }),

	cls('bob', 'gunner', 1),
	cls('bob', 'pyro', 5, { burnChance: 0.15, area: 0.2, attackSpeed: -0.1 }),
	cls('bob', 'sharpshooter', 10, { crit: 0.1, critDamage: 0.5, attackSpeed: -0.2 }),
	cls('bob', 'scavenger', 20, { luck: 0.15, pickupRange: 40, harvesting: 0.1, damage: -0.12 }),

	cls('lucia', 'arcanist', 1),
	cls('lucia', 'stormcaller', 5, { shockChance: 0.15, attackSpeed: 0.15 }, { maxHp: 0.8 }),
	cls('lucia', 'frostweaver', 10, { chillChance: 0.2, area: 0.15, moveSpeed: -6, damage: -0.1 }),
	cls('lucia', 'glassCannon', 20, { 'tagMul.magic': 0.35 }, { maxHp: 0.7, regen: 0 }),
];
