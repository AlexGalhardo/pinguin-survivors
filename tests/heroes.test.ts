import { describe, expect, test } from 'bun:test';
import { HERO_IDS } from '../src/config/constants';
import { HEROES } from '../src/data/heroes';
import { WEAPON_LINE_BY_ID } from '../src/data/weapons';
import { defaultSave } from '../src/logic/save';
import {
	availableStartingWeapons,
	buyStartingWeapon,
	unlockableWeapons,
} from '../src/logic/unlocks';

describe('hero starting weapons (SDD-002 A4)', () => {
	test('3 valid weapons per hero: favorite class, exclusives only for the owner', () => {
		for (const id of HERO_IDS) {
			const hero = HEROES[id];
			const fav = (Object.entries(hero.tagMul).sort((a, b) => b[1] - a[1])[0] ?? [])[0];
			expect(hero.startingWeapons.length).toBe(3);
			expect(new Set(hero.startingWeapons).size).toBe(3);
			for (const w of hero.startingWeapons) {
				const def = WEAPON_LINE_BY_ID[w];
				expect(def).toBeDefined();
				expect(String(def.classTag)).toBe(String(fav));
				expect(def.hero === undefined || def.hero === id).toBe(true);
			}
		}
	});
});

describe('Pearl starting weapons (SDD-002 RF-05)', () => {
	test('a bought weapon joins the hero picker; exclusives of other heroes stay off sale', () => {
		const save = defaultSave();
		expect(availableStartingWeapons(save, 'jack')).toEqual([...HEROES.jack.startingWeapons]);
		save.pearls = 1000;
		expect(unlockableWeapons(save, 'jack').some((u) => u.weapon === 'droneSentinel')).toBe(
			false,
		);
		expect(unlockableWeapons(save, 'bob').some((u) => u.weapon === 'bladeWhirl')).toBe(false);
		expect(buyStartingWeapon(save, 'jack', 'hammer')).toBe(true);
		expect(availableStartingWeapons(save, 'jack')).toContain('hammer');
		expect(availableStartingWeapons(save, 'bob')).not.toContain('hammer');
		expect(buyStartingWeapon(save, 'jack', 'hammer')).toBe(false);
	});

	test('too few pearls changes nothing', () => {
		const save = defaultSave();
		save.pearls = 10;
		expect(buyStartingWeapon(save, 'jack', 'hammer')).toBe(false);
		expect(save.pearls).toBe(10);
	});
});
