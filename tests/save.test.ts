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
