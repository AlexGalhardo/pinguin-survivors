import { describe, expect, test } from 'bun:test';
import {
	composeSave,
	defaultSave,
	defaultSaveFile,
	newSlot,
	parseSaveFile,
	SAVE_VERSION,
	serializeSaveFile,
	summarizeSlot,
	toSlot,
} from '../src/logic/save';

describe('save file with three slots (ADR-020)', () => {
	test('empty or invalid input starts with three empty slots', () => {
		for (const input of [
			null,
			'',
			'{bad',
			'[]',
			'7',
			'{"version":2,"fish":3}',
			'{"slots":[]}',
		]) {
			const f = parseSaveFile(input, 'es');
			expect(f.slots).toEqual([null, null, null]);
			expect(f.settings.lang).toBe('es');
			expect(f.version).toBe(SAVE_VERSION);
		}
	});

	test('round-trips slots whole, settings stay outside them', () => {
		const file = defaultSaveFile();
		const a = newSlot();
		a.pearls = 77;
		a.heroes.bob = { unlocked: true, level: 9, xp: 4, tree: [] };
		a.potions.shield = 2;
		a.savedAt = 123;
		file.slots[2] = a;
		file.active = 2;
		file.settings.volume.music = 0.1;
		const back = parseSaveFile(serializeSaveFile(file));
		expect(back).toEqual(file);
		expect(back.slots[2]).not.toHaveProperty('settings');
		expect(back.settings.volume.music).toBe(0.1);
	});

	test('a corrupt slot falls back field by field without touching the others', () => {
		const file = defaultSaveFile();
		file.slots[0] = newSlot();
		file.slots[1] = newSlot();
		const raw = JSON.parse(serializeSaveFile(file));
		raw.slots[0].pearls = 'many';
		raw.slots[1].heroes.jack.level = 40;
		raw.slots[2] = 'junk';
		const back = parseSaveFile(JSON.stringify(raw));
		expect(back.slots[0]?.pearls).toBe(0);
		expect(back.slots[1]?.heroes.jack.level).toBe(40);
		expect(back.slots[2]).toBeNull();
	});

	test('active must point at a used slot, else the first used one', () => {
		const file = defaultSaveFile();
		file.slots[1] = newSlot();
		for (const active of [0, 2, 9, -1, 'x']) {
			const back = parseSaveFile(JSON.stringify({ ...file, active }));
			expect(back.active).toBe(1);
		}
	});

	test('composeSave joins the active slot with the global settings', () => {
		const file = defaultSaveFile();
		const slot = newSlot();
		slot.fish = 5;
		file.slots[1] = slot;
		file.active = 1;
		file.settings.gore = 'goo';
		const save = composeSave(file);
		expect(save.fish).toBe(5);
		expect(save.settings.gore).toBe('goo');
		expect(toSlot(save)).toEqual(slot);
		// No slot loaded: an empty game with the same settings.
		expect(composeSave(defaultSaveFile()).settings).toEqual(defaultSave().settings);
	});

	test('summary shows the hero of the run, played time and best round', () => {
		expect(summarizeSlot(null)).toBeNull();
		const slot = newSlot();
		slot.heroes.bob.level = 30;
		slot.progress.runBests.maxRound = 14;
		slot.progress.lifetime.secondsPlayed = 3600.4;
		slot.savedAt = 99;
		expect(summarizeSlot(slot)).toEqual({
			hero: 'bob',
			level: 30,
			bestRound: 14,
			playedSec: 3600,
			savedAt: 99,
			inRun: false,
		});
		slot.activeRun = { savedAt: 1, seed: 1, hero: 'jack', nextRound: 3, state: {} };
		expect(summarizeSlot(slot)).toMatchObject({ hero: 'jack', level: 1, inRun: true });
	});
});
