import { describe, expect, test } from 'bun:test';
import { ACHIEVEMENTS } from '../src/data/achievements';
import { STEAM_ACHIEVEMENTS, STEAM_NAME_MAX, steamApiName } from '../src/data/steam-achievements';

describe('Steam achievement map', () => {
	test('covers every achievement, with unique ACH_ names within the length limit', () => {
		expect(Object.keys(STEAM_ACHIEVEMENTS)).toHaveLength(ACHIEVEMENTS.length);
		const names = new Set<string>();
		for (const a of ACHIEVEMENTS) {
			const name = STEAM_ACHIEVEMENTS[a.id];
			expect(name).toBeDefined();
			expect(name).toMatch(/^ACH_[A-Z0-9_]+$/);
			expect((name as string).length).toBeLessThanOrEqual(STEAM_NAME_MAX);
			names.add(name as string);
		}
		expect(names.size).toBe(ACHIEVEMENTS.length);
	});

	test('naming convention', () => {
		expect(steamApiName('kills.1')).toBe('ACH_KILLS_1');
		expect(steamApiName('heroRound.jack.2')).toBe('ACH_HERO_ROUND_JACK_2');
		expect(steamApiName('feat.bossNoPotion')).toBe('ACH_FEAT_BOSS_NO_POTION');
		expect(steamApiName('difficultyWin.bob.2')).toBe('ACH_DIFFICULTY_WIN_BOB_2');
	});
});
