import type { HeroId } from '../config/constants';
import { HERO_CLASSES, type HeroClassDef } from '../data/classes';
import type { StatKey } from './stats';

/** Classes of a hero in unlock order; the first is the base class (the hero unchanged). */
export function classesOf(hero: HeroId): HeroClassDef[] {
	return HERO_CLASSES.filter((c) => c.hero === hero);
}

export function baseClass(hero: HeroId): HeroClassDef {
	return classesOf(hero)[0] as HeroClassDef;
}

export function classUnlocked(def: HeroClassDef, heroLevel: number): boolean {
	return heroLevel >= def.unlockLevel;
}

/**
 * The class a run really uses: the requested one when it belongs to the hero and its level
 * allows it, otherwise the base class (a stale request or a tampered URL never breaks a run).
 */
export function resolveClass(
	hero: HeroId,
	heroLevel: number,
	requested: string | undefined,
): HeroClassDef {
	const def = classesOf(hero).find((c) => c.id === requested);
	return def && classUnlocked(def, heroLevel) ? def : baseClass(hero);
}

/** One line of what a class changes: the stat, the amount and whether it helps. */
export interface ClassLine {
	stat: StatKey;
	/** `add`: amount in the unit of the stat; `mul`: factor (0.85 = -15%). */
	kind: 'add' | 'mul';
	value: number;
	good: boolean;
}

/** What to tell the player about a class, gains first (SDD-024 RF-03). */
export function classLines(def: HeroClassDef): ClassLine[] {
	const lines: ClassLine[] = [
		...Object.entries(def.add).map(([stat, value]) => ({
			stat: stat as StatKey,
			kind: 'add' as const,
			value,
			good: value > 0,
		})),
		...Object.entries(def.mul).map(([stat, value]) => ({
			stat: stat as StatKey,
			kind: 'mul' as const,
			value,
			good: value > 1,
		})),
	];
	return [...lines.filter((l) => l.good), ...lines.filter((l) => !l.good)];
}
