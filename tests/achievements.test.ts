import { describe, expect, test } from 'bun:test';
import { ACHIEVEMENTS } from '../src/data/achievements';
import {
	achievementProgress,
	availablePoints,
	buyExtra,
	emptyAchievementState,
	emptyProgress,
	evaluateAchievements,
	toRoman,
} from '../src/logic/achievements';

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
