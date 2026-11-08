import { describe, expect, test } from 'bun:test';
import {
	defaultSave,
	HISTORY_SIZE,
	parseSave,
	pushHistory,
	type RunRecord,
	recordBuildSets,
	recordRunEnd,
	recordSetCount,
	recordTierIVSlots,
	SAVE_VERSION,
	serializeSave,
} from '../src/logic/save';
import type { RunEndEvent } from '../src/logic/telemetry';
import demoFixture from './fixtures/save-demo.json';
import v1Fixture from './fixtures/save-v1.json';

function run(over: Partial<RunRecord> = {}): RunRecord {
	return {
		id: 'r1',
		startedAt: 0,
		endedAt: 1000,
		hero: 'jack',
		heroLevel: 3,
		tier: 1,
		round: 7,
		outcome: 'death',
		durationSec: 240,
		kills: 350,
		damageDealt: 12_000,
		fishEarned: 20,
		xpEarned: 400,
		levelsGained: 1,
		secondaries: [{ id: 'knives', level: 2 }],
		cards: ['atkSpeed'],
		seed: 1,
		...over,
	};
}

describe('parseSave', () => {
	test('missing or corrupt data → defaults (only Jack unlocked)', () => {
		for (const input of [null, '', '{bad json', '[]', '42']) {
			const s = parseSave(input, 'pt-BR');
			expect(s.version).toBe(SAVE_VERSION);
			expect(s.settings.lang).toBe('pt-BR');
			expect(s.heroes.jack.unlocked).toBe(true);
			expect(s.heroes.bob.unlocked).toBe(false);
			expect(s.gambits).toHaveLength(3);
		}
	});

	test('round-trips a full save', () => {
		const s = defaultSave();
		s.fish = 99;
		s.heroes.bob = { unlocked: true, level: 12, xp: 30, tree: [] };
		s.gambits[0] = { potion: 'shield', condition: 'hpBelow25' };
		s.achievements.unlocked['kills.1'] = 5;
		pushHistory(s, run());
		s.activeRun = { savedAt: 1, seed: 7, hero: 'jack', nextRound: 4, state: { hp: 50 } };
		expect(parseSave(serializeSave(s))).toEqual(s);
	});

	test('bad fields fall back one by one and values are clamped', () => {
		const raw = JSON.parse(serializeSave(defaultSave()));
		raw.fish = 'lots';
		raw.heroes.jack.level = 500;
		raw.settings.volume.music = 3;
		raw.gambits = [{ potion: 'beer', condition: 'hpBelow50' }];
		raw.history = [run(), { junk: true }];
		raw.activeRun = { hero: 'nobody' };
		const s = parseSave(JSON.stringify(raw));
		expect(s.fish).toBe(0);
		expect(s.heroes.jack.level).toBe(100);
		expect(s.settings.volume.music).toBe(1);
		expect(s.gambits[0]).toEqual({ potion: null, condition: 'hpBelow50' });
		expect(s.history).toHaveLength(1);
		expect(s.activeRun).toBeNull();
	});

	test('a save from a newer game version is not trusted', () => {
		expect(parseSave(JSON.stringify({ version: SAVE_VERSION + 1, fish: 500 })).fish).toBe(0);
	});
});

describe('older saves (ADR-020: no compatibility)', () => {
	test('a v1 or v2 file starts empty, without throwing', () => {
		expect(parseSave(JSON.stringify(v1Fixture))).toEqual(defaultSave());
		expect(parseSave(JSON.stringify({ ...v1Fixture, version: 2 }))).toEqual(defaultSave());
	});

	test('dangerUnlocked and pearls survive a round-trip and are clamped', () => {
		const s = defaultSave();
		s.pearls = 7;
		s.progress.hero.bob.dangerUnlocked = 3;
		expect(parseSave(serializeSave(s))).toEqual(s);
		const raw = JSON.parse(serializeSave(s));
		raw.progress.hero.bob.dangerUnlocked = 99;
		raw.progress.hero.jack.dangerUnlocked = -4;
		const back = parseSave(JSON.stringify(raw));
		expect(back.progress.hero.bob.dangerUnlocked).toBe(6);
		expect(back.progress.hero.jack.dangerUnlocked).toBe(1);
	});
});

describe('history and run end', () => {
	test(`history keeps the newest ${HISTORY_SIZE} runs`, () => {
		const s = defaultSave();
		for (let i = 0; i < HISTORY_SIZE + 5; i++) pushHistory(s, run({ id: `r${i}` }));
		expect(s.history).toHaveLength(HISTORY_SIZE);
		expect(s.history[0]?.id).toBe(`r${HISTORY_SIZE + 4}`);
	});

	test('recordRunEnd adds counters, bests, history, clears snapshot and unlocks achievements', () => {
		const s = defaultSave();
		s.activeRun = { savedAt: 1, seed: 7, hero: 'jack', nextRound: 8, state: {} };
		const fresh = recordRunEnd(
			s,
			run({ round: 10, kills: 150 }),
			{ kills: 150, superUses: 1 },
			9,
		);
		expect(s.progress.lifetime.kills).toBe(150);
		expect(s.progress.lifetime.runs).toBe(1);
		expect(s.progress.hero.jack.bestRound).toBe(10);
		expect(s.progress.runBests.maxRound).toBe(10);
		expect(s.history).toHaveLength(1);
		expect(s.activeRun).toBeNull();
		const ids = fresh.map((a) => a.id);
		expect(ids).toEqual(
			expect.arrayContaining([
				'kills.1',
				'runs.1',
				'round.2',
				'heroRound.jack.1',
				'super.jack.1',
			]),
		);
	});
});

describe('liveProgress', () => {
	test('merges run counters without mutating the save', async () => {
		const { liveProgress } = await import('../src/logic/save');
		const s = defaultSave();
		s.progress.lifetime.kills = 90;
		const p = liveProgress(s, { hero: 'bob', round: 6, kills: 20 }, { kills: 20, crits: 3 }, 4);
		expect(p.lifetime.kills).toBe(110);
		expect(p.lifetime.crits).toBe(3);
		expect(p.lifetime.runs).toBe(1);
		expect(p.hero.bob.bestRound).toBe(6);
		expect(p.heroLevels.bob).toBe(4);
		expect(s.progress.lifetime.kills).toBe(90);
		expect(s.progress.lifetime.runs).toBe(0);
	});
});

describe('demo save → full game (SDD-006 A4)', () => {
	test('a save written by the demo imports without error and keeps Jack progress', () => {
		const raw = JSON.stringify(demoFixture);
		const s = parseSave(raw);
		expect(s.version).toBe(SAVE_VERSION);
		expect(s.heroes.jack).toMatchObject({ unlocked: true, level: 14, xp: 220 });
		expect(s.heroes.jack.tree).toEqual([]);
		expect(s.heroes.bob.unlocked).toBe(false);
		expect(s.pearls).toBe(96);
		expect(s.achievements.unlocked['kills.1']).toBe(1769000000000);
		expect(s.progress.hero.jack.bestRound).toBe(10);
		expect(s.bestRoundByDanger.jack).toEqual([10, 10, 0, 0, 0, 0]);
		expect(s.history).toHaveLength(1);
	});

	test('re-importing is stable (idempotent)', () => {
		const once = parseSave(JSON.stringify(demoFixture));
		expect(parseSave(serializeSave(once))).toEqual(once);
		expect(serializeSave(once)).toBe(serializeSave(parseSave(JSON.stringify(demoFixture))));
	});
});

describe('telemetry in the save (SDD-013 A5)', () => {
	const event = (round: number): RunEndEvent => ({
		version: '0.1.0',
		hero: 'jack',
		danger: 1,
		level: 1,
		round,
		weapons: ['machete:1'],
		cause: 'death',
		durationS: 100,
		platform: 'web',
	});

	test('defaults: opt-out and empty; old saves parse without the fields', () => {
		const s = defaultSave();
		expect(s.settings.telemetry).toBe(false);
		expect(s.telemetry).toEqual([]);
		const old = parseSave(JSON.stringify({ version: SAVE_VERSION }));
		expect(old.settings.telemetry).toBe(false);
		expect(old.telemetry).toEqual([]);
	});

	test('is capped at 200, validated, and exported in the .json round-trip', () => {
		const s = defaultSave();
		s.settings.telemetry = true;
		s.telemetry = Array.from({ length: 250 }, (_, i) => event(i));
		const raw = JSON.parse(serializeSave(s));
		raw.telemetry.push({ junk: true });
		const back = parseSave(JSON.stringify(raw));
		expect(back.telemetry).toHaveLength(200);
		expect(back.telemetry[0]?.round).toBe(50);
		expect(back.telemetry.at(-1)?.round).toBe(249);
		expect(back.settings.telemetry).toBe(true);
		expect(parseSave(serializeSave(back))).toEqual(back);
	});
});

describe('set and tier IV records (T7.8)', () => {
	test('keep the best value, survive a round-trip, default to zero', () => {
		const s = defaultSave();
		recordSetCount(s, 'blade', 3);
		recordSetCount(s, 'blade', 2);
		recordBuildSets(s, { gun: 4, blade: 1 });
		recordTierIVSlots(s, 2);
		recordTierIVSlots(s, 1);
		expect(s.progress.setBest.blade).toBe(3);
		expect(s.progress.setBest.gun).toBe(4);
		expect(s.progress.runBests.tierIVSlots).toBe(2);
		const back = parseSave(serializeSave(s));
		expect(back.progress.setBest).toEqual(s.progress.setBest);
		const old = parseSave(JSON.stringify({ version: SAVE_VERSION }));
		expect(old.progress.setBest.blade).toBe(0);
		expect(old.progress.runBests.tierIVSlots).toBe(0);
	});
});

describe('starting weapon unlocks (SDD-005 RF-05)', () => {
	test('round-trip keeps them; old saves, junk ids and duplicates parse to a clean list', () => {
		const s = defaultSave();
		s.unlocks.startingWeapons.jack = ['hammer', 'molotov'];
		expect(parseSave(serializeSave(s)).unlocks.startingWeapons.jack).toEqual([
			'hammer',
			'molotov',
		]);
		const raw = JSON.parse(serializeSave(s));
		raw.unlocks.startingWeapons.bob = ['mine', 'mine', 'nope', 7];
		expect(parseSave(JSON.stringify(raw)).unlocks.startingWeapons.bob).toEqual(['mine']);
		delete raw.unlocks;
		expect(parseSave(JSON.stringify(raw)).unlocks.startingWeapons).toEqual({
			jack: [],
			bob: [],
			lucia: [],
		});
	});
});
