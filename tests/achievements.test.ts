import { describe, expect, test } from 'bun:test';
import { ACHIEVEMENT_SHOP, ACHIEVEMENTS, type ExtraDef } from '../src/data/achievements';
import { HEROES } from '../src/data/heroes';
import {
	achievementProgress,
	applyExtras,
	availablePoints,
	buyExtra,
	emptyAchievementState,
	emptyProgress,
	evaluateAchievements,
	extraLevel,
	toRoman,
} from '../src/logic/achievements';
import { heroStats } from '../src/logic/stats';

describe('achievement definitions', () => {
	test('at least 100, unique ids', () => {
		expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(100);
		expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
	});

	test('nothing unlocks on a fresh save', () => {
		const state = emptyAchievementState();
		expect(evaluateAchievements(emptyProgress(), state, 1)).toEqual([]);
	});
});

describe('evaluateAchievements', () => {
	test('unlocks every reached tier once, with timestamp', () => {
		const p = emptyProgress();
		p.lifetime.kills = 1_200;
		const state = emptyAchievementState();
		const fresh = evaluateAchievements(p, state, 42).map((a) => a.id);
		expect(fresh).toEqual(['kills.1', 'kills.2', 'kills.3']);
		expect(state.unlocked['kills.3']).toBe(42);
		expect(evaluateAchievements(p, state, 43)).toEqual([]);
	});

	test('per-hero, level, feat and all-heroes conditions', () => {
		const p = emptyProgress();
		p.hero.bob.superUses = 1;
		p.heroLevels.lucia = 25;
		p.feats.push('bossNoPotion');
		const state = emptyAchievementState();
		const ids = evaluateAchievements(p, state, 1).map((a) => a.id);
		expect(ids).toContain('super.bob.1');
		expect(ids).not.toContain('super.jack.1');
		expect(ids).toContain('heroLevel.lucia.2');
		expect(ids).toContain('feat.bossNoPotion');
		expect(ids).not.toContain('allHeroes.1');
		p.heroLevels.jack = 10;
		p.heroLevels.bob = 10;
		expect(evaluateAchievements(p, state, 2).map((a) => a.id)).toContain('allHeroes.1');
	});

	test('meta achievements cascade in the same evaluation', () => {
		const p = emptyProgress();
		for (const k of Object.keys(p.lifetime) as (keyof typeof p.lifetime)[]) p.lifetime[k] = 1e9;
		const state = emptyAchievementState();
		const ids = evaluateAchievements(p, state, 1).map((a) => a.id);
		expect(ids).toContain('hunter.1');
		expect(ids).toContain('hunter.2');
	});
});

describe('achievement points', () => {
	test('1 point each; buying spends and cannot repeat', () => {
		const state = emptyAchievementState();
		state.unlocked = { a: 1, b: 1, c: 1 };
		expect(availablePoints(state)).toBe(3);
		expect(buyExtra(state, { id: 'x', cost: 5 })).toBe('insufficient');
		expect(buyExtra(state, { id: 'x', cost: 2 })).toBe('ok');
		expect(availablePoints(state)).toBe(1);
		expect(buyExtra(state, { id: 'x', cost: 0 })).toBe('owned');
	});

	test('leveled extras stack up to their max and add stats', () => {
		const state = emptyAchievementState();
		state.unlocked = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`a${i}`, 1]));
		const crit = ACHIEVEMENT_SHOP.find((e) => e.id === 'crit') as ExtraDef;
		for (let i = 0; i < 10; i++) expect(buyExtra(state, crit)).toBe('ok');
		expect(buyExtra(state, crit)).toBe('owned');
		expect(extraLevel(state, 'crit')).toBe(10);
		expect(availablePoints(state)).toBe(2);
		const base = heroStats(HEROES.bob, 1, {});
		const boosted = applyExtras(heroStats(HEROES.bob, 1, {}), state);
		expect(boosted.crit - base.crit).toBeCloseTo(0.01);
	});

	test('shop: 10 bonuses, 10 levels, 1 point each', () => {
		expect(ACHIEVEMENT_SHOP.length).toBe(10);
		for (const e of ACHIEVEMENT_SHOP) {
			expect(e.maxLevel).toBe(10);
			expect(e.cost).toBe(1);
		}
	});
});

test('progress and roman numerals', () => {
	const p = emptyProgress();
	p.lifetime.kills = 50;
	const def = ACHIEVEMENTS.find((a) => a.id === 'kills.1');
	if (!def) throw new Error('missing kills.1');
	expect(achievementProgress(def, p)).toBeCloseTo(0.5);
	expect(toRoman(9)).toBe('IX');
	expect(toRoman(7)).toBe('VII');
});

test('every achievement family has EN/PT-BR name and description', async () => {
	const { TABLES_FOR_TEST } = await import('../src/i18n');
	for (const a of ACHIEVEMENTS) {
		for (const table of Object.values(TABLES_FOR_TEST)) {
			const t = table as Record<string, string>;
			expect(t[`ach.${a.family}.name`]).toBeDefined();
			expect(t[`ach.${a.family}.desc`]).toBeDefined();
		}
	}
});

describe('1.0 achievements: Danger, sets, fusion, endless', () => {
	const unlocked = (p = emptyProgress()) => {
		const state = emptyAchievementState();
		evaluateAchievements(p, state, 1);
		return Object.keys(state.unlocked);
	};

	test('Danger wins follow dangerUnlocked per hero and for everyone', () => {
		const p = emptyProgress();
		p.hero.jack.dangerUnlocked = 3; // beat D1 and D2 with Jack
		const ids = unlocked(p);
		expect(ids).toContain('dangerWin.jack.1');
		expect(ids).toContain('dangerWin.jack.2');
		expect(ids).not.toContain('dangerWin.jack.3');
		expect(ids).not.toContain('dangerWin.bob.1');
		expect(ids.some((id) => id.startsWith('dangerAll.'))).toBe(false);
		for (const h of ['jack', 'bob', 'lucia'] as const) p.hero[h].dangerUnlocked = 6;
		const all = unlocked(p);
		for (let d = 1; d <= 5; d++) expect(all).toContain(`dangerAll.${d}`);
		expect(all).toContain('dangerWin.lucia.5');
	});

	test('set achievements unlock at 2, 4 and 6 weapons', () => {
		const p = emptyProgress();
		p.setBest.gun = 4;
		const ids = unlocked(p);
		expect(ids).toContain('set.gun.1');
		expect(ids).toContain('set.gun.2');
		expect(ids).not.toContain('set.gun.3');
		expect(ids).not.toContain('set.blade.1');
	});

	test('tier IV slots, many fusions and round 60', () => {
		const p = emptyProgress();
		p.runBests.tierIVSlots = 6;
		p.lifetime.fusions = 30;
		p.runBests.maxRound = 60;
		const ids = unlocked(p);
		expect(ids).toEqual(
			expect.arrayContaining([
				'tierIVSlots.1',
				'tierIVSlots.2',
				'tierIVSlots.3',
				'fuse.1',
				'fuseMany.1',
				'endless.1',
				'round.7',
			]),
		);
		expect(ids).not.toContain('fuseMany.2');
	});

	test('progress bars for the new conditions', () => {
		const p = emptyProgress();
		p.setBest.blade = 3;
		p.hero.bob.dangerUnlocked = 1;
		const find = (id: string) => ACHIEVEMENTS.find((a) => a.id === id);
		expect(achievementProgress(find('set.blade.2') as never, p)).toBe(0.75);
		expect(achievementProgress(find('dangerAll.1') as never, p)).toBe(0.5);
	});
});
