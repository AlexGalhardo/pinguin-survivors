import { describe, expect, test } from 'bun:test';
import {
	freshUnlocks,
	markSeen,
	systemUnlocked,
	type TipState,
	tipStep,
} from '../src/logic/onboarding';
import { defaultSave, parseSave } from '../src/logic/save';

const state = (over: Partial<TipState> = {}): TipState => ({
	moved: false,
	kills: 0,
	superReady: false,
	superUsed: false,
	...over,
});

describe('onboarding milestones (SDD-022 RF-01)', () => {
	test('a new save hides the skill tree and the hero screen', () => {
		const save = defaultSave();
		expect(systemUnlocked(save, 'tree')).toBe(false);
		expect(systemUnlocked(save, 'heroes')).toBe(false);
	});

	test('the tree shows from hero level 2, an allocated node or the level reached mid-run', () => {
		const leveled = defaultSave();
		leveled.heroes.jack.level = 2;
		expect(systemUnlocked(leveled, 'tree')).toBe(true);
		const allocated = defaultSave();
		allocated.heroes.bob.tree = ['bob.b0.s1'];
		expect(systemUnlocked(allocated, 'tree')).toBe(true);
		expect(systemUnlocked(defaultSave(), 'tree', 2)).toBe(true);
	});

	test('the hero screen shows after a run, with pearls or with a potion', () => {
		const pearls = defaultSave();
		pearls.pearls = 1;
		expect(systemUnlocked(pearls, 'heroes')).toBe(true);
		const potion = defaultSave();
		potion.potions.shield = 1;
		expect(systemUnlocked(potion, 'heroes')).toBe(true);
	});
});

describe('unlock notices (RF-02)', () => {
	test('each system is announced once', () => {
		const save = defaultSave();
		expect(freshUnlocks(save)).toEqual([]);
		save.heroes.jack.level = 3;
		save.pearls = 5;
		expect(freshUnlocks(save)).toEqual(['tree', 'heroes']);
		markSeen(save, ['tree', 'tree']);
		expect(save.onboarding.seen).toEqual(['tree']);
		expect(freshUnlocks(save)).toEqual(['heroes']);
	});

	test('a save written before the field existed reads as nothing seen (RF-04)', () => {
		const old = JSON.parse(JSON.stringify(defaultSave())) as Record<string, unknown>;
		delete old.onboarding;
		expect(parseSave(JSON.stringify(old)).onboarding).toEqual({ seen: [] });
		const kept = defaultSave();
		kept.onboarding.seen = ['tree', 'tip.move'];
		expect(parseSave(JSON.stringify(kept)).onboarding.seen).toEqual(['tree', 'tip.move']);
	});
});

describe('first-run tips (RF-03)', () => {
	test('move, then auto, then super when it is charged; one at a time', () => {
		expect(tipStep([], state())).toEqual({ show: 'move', done: [] });
		// The charge being ready does not jump the queue.
		expect(tipStep([], state({ superReady: true })).show).toBe('move');
		expect(tipStep([], state({ moved: true }))).toEqual({ show: 'auto', done: ['move'] });
		expect(tipStep(['tip.move'], state({ moved: true, kills: 3 }))).toEqual({
			show: null,
			done: ['auto'],
		});
		const seen = ['tip.move', 'tip.auto'];
		expect(tipStep(seen, state({ superReady: true })).show).toBe('super');
		expect(tipStep(seen, state({ superUsed: true }))).toEqual({ show: null, done: ['super'] });
	});

	test('a player who saw every tip sees none', () => {
		expect(tipStep(['tip.move', 'tip.auto', 'tip.super'], state({ superReady: true }))).toEqual(
			{
				show: null,
				done: [],
			},
		);
	});
});
