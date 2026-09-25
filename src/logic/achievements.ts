import { ACHIEVEMENTS } from '../data/achievements';
import type { CharacterId } from '../data/characters';
import type { SaveData } from './save';

/** What a finished run did (plus lifetime data from the save). */
export interface AchievementRun {
	character: CharacterId;
	wave: number;
	kills: number;
	goldEarned: number;
	bossKills: number;
	evolved: number;
	abilities: number;
}

type Check = (r: AchievementRun, save: SaveData) => boolean;

const CHECKS: Record<string, Check> = {
	first_steps: () => true,
	exterminator: (r) => r.kills >= 500,
	survivor: (r) => r.wave >= 10,
	veteran: (r) => r.wave >= 20,
	legend: (r) => r.wave >= 30,
	boss_slayer: (r) => r.bossKills > 0,
	evolution: (r) => r.evolved > 0,
	full_kit: (r) => r.abilities >= 6,
	hoarder: (r) => r.goldEarned >= 1000,
	all_rounder: (_r, save) =>
		(['warrior', 'ranger', 'mage'] as const).every((c) =>
			save.history.some((h) => h.character === c),
		),
};

/** Unlocks every achievement this run earned; returns the new ids (the save is mutated). */
export function checkAchievements(save: SaveData, run: AchievementRun): string[] {
	const out: string[] = [];
	for (const a of ACHIEVEMENTS) {
		if (save.achievements.includes(a.id)) continue;
		if (CHECKS[a.id]?.(run, save)) {
			save.achievements.push(a.id);
			out.push(a.id);
		}
	}
	return out;
}
