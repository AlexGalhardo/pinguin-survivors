import { describe, expect, test } from 'bun:test';
import { ACHIEVEMENTS } from '../src/data/achievements';
import { BUILD_TAG, DEMO, type DemoConfig } from '../src/data/demo';
import {
	demoAllowsDanger,
	demoAllowsHero,
	demoAllowsRound,
	demoDanger,
	demoEndReason,
	demoHero,
	demoHidesAchievement,
} from '../src/logic/demo';

const on: DemoConfig = { enabled: true, maxRound: 10, heroes: ['jack'], maxDanger: 1 };
const off: DemoConfig = { ...on, enabled: false };

describe('demo gating (SDD-006)', () => {
	test('the demo allows only Jack, rounds up to 10 and Danger 0-1', () => {
		expect(demoAllowsHero('jack', on)).toBe(true);
		expect(demoAllowsHero('bob', on)).toBe(false);
		expect(demoAllowsHero('lucia', on)).toBe(false);
		expect(demoAllowsRound(10, on)).toBe(true);
		expect(demoAllowsRound(11, on)).toBe(false);
		expect(demoAllowsDanger(1, on)).toBe(true);
		expect(demoAllowsDanger(2, on)).toBe(false);
	});

	test('the full game allows everything', () => {
		expect(demoAllowsHero('lucia', off)).toBe(true);
		expect(demoAllowsRound(99, off)).toBe(true);
		expect(demoAllowsDanger(5, off)).toBe(true);
		expect(demoEndReason(10, { cleared: true, died: false }, off)).toBeNull();
	});

	test('a locked hero falls back to Jack; Danger is capped by the demo', () => {
		expect(demoHero('bob', on)).toBe('jack');
		expect(demoHero('bob', off)).toBe('bob');
		expect(demoDanger(4, on)).toBe(1);
		expect(demoDanger(0, on)).toBe(0);
		expect(demoDanger(4, off)).toBe(4);
	});

	test('the run ends on clearing round 10 or on dying, not before', () => {
		expect(demoEndReason(9, { cleared: true, died: false }, on)).toBeNull();
		expect(demoEndReason(10, { cleared: false, died: false }, on)).toBeNull();
		expect(demoEndReason(10, { cleared: true, died: false }, on)).toBe('won');
		expect(demoEndReason(4, { cleared: false, died: true }, on)).toBe('lost');
	});

	test('tests run as the full build', () => {
		expect(DEMO.enabled).toBe(false);
		expect(BUILD_TAG).toBe('full-build');
	});
});

describe('demo achievements (SDD-006 RF-04)', () => {
	const hidden = (id: string): boolean =>
		demoHidesAchievement(
			ACHIEVEMENTS.find((a) => a.id === id) as (typeof ACHIEVEMENTS)[number],
			on,
		);

	test('rounds past 10, Danger wins and other heroes are hidden in the demo', () => {
		expect(hidden('round.2')).toBe(false);
		expect(hidden('round.4')).toBe(true);
		expect(hidden('heroRound.jack.2')).toBe(true);
		expect(hidden('dangerWin.jack.1')).toBe(true);
		expect(hidden('heroLevel.bob.1')).toBe(true);
		expect(hidden('kills.1')).toBe(false);
		expect(hidden('feat.bossBiome2')).toBe(true);
	});

	test('nothing is hidden in the full game', () => {
		expect(ACHIEVEMENTS.some((a) => demoHidesAchievement(a, off))).toBe(false);
	});
});
