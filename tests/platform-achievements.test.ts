import { afterEach, expect, test } from 'bun:test';
import { reportAchievements, setPlatform } from '../src/core/platform';
import { createWebPlatform } from '../src/core/platform/web';

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
