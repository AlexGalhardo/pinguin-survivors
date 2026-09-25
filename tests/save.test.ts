import { describe, expect, it } from 'bun:test';
import { defaultSave, parseSave, recordRun, SAVE_VERSION, serializeSave } from '../src/logic/save';

describe('save format', () => {
	it('falls back to defaults on missing, corrupt or future data', () => {
		expect(parseSave(null)).toEqual(defaultSave());
		expect(parseSave('{oops')).toEqual(defaultSave());
		expect(parseSave('42')).toEqual(defaultSave());
		expect(parseSave(JSON.stringify({ version: SAVE_VERSION + 1 }))).toEqual(defaultSave());
	});

	it('round-trips', () => {
		const s = defaultSave();
		s.settings.sfxVolume = 0.3;
		s.best.mage = { wave: 12, kills: 400, timeSec: 600 };
		s.unlocked = ['warrior', 'mage'];
		expect(parseSave(serializeSave(s))).toEqual(s);
	});

	it('fills missing fields and sanitizes values', () => {
		const s = parseSave(
			JSON.stringify({ version: 1, settings: { sfxVolume: 9, screenShake: 'x' }, best: {} }),
		);
		expect(s.settings.sfxVolume).toBe(1);
		expect(s.settings.screenShake).toBe(true);
		expect(s.best.warrior).toEqual({ wave: 0, kills: 0, timeSec: 0 });
		expect(s.stats.runs).toBe(0);
	});
});

describe('recordRun', () => {
	const run = {
		character: 'ranger' as const,
		wave: 8,
		kills: 150,
		goldEarned: 200,
		damageDealt: 5000.4,
		timeSec: 300.7,
	};

	it('sets a new best and accumulates lifetime stats', () => {
		const { save, newBest } = recordRun(defaultSave(), run);
		expect(newBest).toBe(true);
		expect(save.best.ranger).toEqual({ wave: 8, kills: 150, timeSec: 301 });
		expect(save.stats).toEqual({
			runs: 1,
			kills: 150,
			goldEarned: 200,
			damageDealt: 5000,
			timeSec: 301,
		});
	});

	it('keeps the old best when the run is worse', () => {
		const first = recordRun(defaultSave(), run).save;
		const { save, newBest } = recordRun(first, { ...run, wave: 5 });
		expect(newBest).toBe(false);
		expect(save.best.ranger.wave).toBe(8);
		expect(save.stats.runs).toBe(2);
	});
});

describe('save v2 and unlocks', () => {
	it('migrates a v1 save: keeps records, unlocks classes already played', () => {
		const v1 = JSON.stringify({
			version: 1,
			best: { ranger: { wave: 4, kills: 10, timeSec: 60 } },
		});
		const s = parseSave(v1);
		expect(s.version).toBe(SAVE_VERSION);
		expect(s.unlocked).toEqual(['warrior', 'ranger']);
		expect(s.history).toEqual([]);
		expect(s.meta).toEqual({ cores: 0, upgrades: {} });
	});

	it('keeps the last 10 runs, newest first', () => {
		let save = defaultSave();
		for (let i = 1; i <= 12; i++) {
			save = recordRun(save, {
				character: 'warrior',
				wave: i,
				kills: 0,
				goldEarned: 0,
				damageDealt: 0,
				timeSec: 1,
				at: i,
			}).save;
		}
		expect(save.history).toHaveLength(10);
		expect(save.history[0]?.wave).toBe(12);
	});

	it('unlocks the ranger at wave 10 with the warrior and the mage on the first boss kill', async () => {
		const { checkUnlocks, isUnlocked } = await import('../src/logic/meta');
		const s = defaultSave();
		expect(checkUnlocks(s, { kind: 'wave', character: 'warrior', wave: 9 })).toEqual([]);
		expect(checkUnlocks(s, { kind: 'wave', character: 'ranger', wave: 20 })).toEqual([]);
		expect(checkUnlocks(s, { kind: 'wave', character: 'warrior', wave: 10 })).toEqual([
			'ranger',
		]);
		expect(checkUnlocks(s, { kind: 'wave', character: 'warrior', wave: 11 })).toEqual([]);
		expect(checkUnlocks(s, { kind: 'bossKilled' })).toEqual(['mage']);
		expect(isUnlocked(s, 'mage')).toBe(true);
	});
});
