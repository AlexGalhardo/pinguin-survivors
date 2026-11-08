import { describe, expect, test } from 'bun:test';
import { HERO_IDS } from '../src/config/constants';
import {
	defaultSave,
	HISTORY_SIZE,
	parseSave,
	pushHistory,
	type RunRecord,
	recordRunEnd,
	SAVE_VERSION,
	serializeSave,
} from '../src/logic/save';
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
		s.heroes.bob = { unlocked: true, level: 12, xp: 30, points: { crit: 3 } };
		s.gambits[0] = { potion: 'heal', condition: 'hpBelow25' };
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

describe('save v1 → v2 migration', () => {
	const v1 = JSON.stringify(v1Fixture);

	test('A2: real v1 save migrates keeping heroes, XP and achievements', () => {
		const s = parseSave(v1);
		expect(s.version).toBe(2);
		expect(s.heroes.jack).toMatchObject({ level: 23, xp: 140, unlocked: true });
		expect(s.heroes.bob.level).toBe(9);
		expect(s.fish).toBe(412);
		expect(s.achievements.unlocked['kills.1']).toBe(1700000000000);
		expect(s.progress.hero.jack.bestRound).toBe(17);
		expect(s.settings.lang).toBe('pt-BR');
		expect(s.settings.volume).toEqual({ master: 0.7, music: 0.5, sfx: 0.9 });
		expect(s.settings).not.toHaveProperty('subtitles');
	});

	test('discards activeRun and carries fish over as pearls, dangerUnlocked = 1 for every hero', () => {
		const s = parseSave(v1);
		expect(s.activeRun).toBeNull();
		expect(s.pearls).toBe(412);
		for (const h of HERO_IDS) expect(s.progress.hero[h].dangerUnlocked).toBe(1);
	});

	test('A3: migrating twice gives the same object', () => {
		const once = parseSave(v1);
		expect(parseSave(serializeSave(once))).toEqual(once);
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
