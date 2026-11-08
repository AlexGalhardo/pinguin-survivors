import { afterEach, expect, test } from 'bun:test';
import { reportAchievements, setPlatform } from '../src/core/platform';
import { createWebPlatform } from '../src/core/platform/web';
import { STEAM_ACHIEVEMENTS } from '../src/data/steam-achievements';
import { evaluateAchievements } from '../src/logic/achievements';
import { defaultSave } from '../src/logic/save';

afterEach(() => setPlatform(undefined));

test('reportAchievements forwards each earned id to the platform', () => {
	const unlocked: string[] = [];
	setPlatform({ ...createWebPlatform(), achievements: { unlock: (id) => unlocked.push(id) } });
	reportAchievements([{ id: 'kills.1' }, { id: 'round.2' }]);
	expect(unlocked).toEqual(['kills.1', 'round.2']);
});

test('on the web it is a harmless no-op', () => {
	setPlatform(createWebPlatform());
	expect(() => reportAchievements([{ id: 'kills.1' }])).not.toThrow();
});

test('a real unlock reaches the platform under an id the Steam map knows', () => {
	const unlocked: string[] = [];
	setPlatform({ ...createWebPlatform(), achievements: { unlock: (id) => unlocked.push(id) } });
	const save = defaultSave();
	save.progress.lifetime.kills = 1_000_000;
	reportAchievements(evaluateAchievements(save.progress, save.achievements, 1));
	expect(unlocked.length).toBeGreaterThan(0);
	for (const id of unlocked) expect(STEAM_ACHIEVEMENTS[id]).toMatch(/^ACH_/);
});
