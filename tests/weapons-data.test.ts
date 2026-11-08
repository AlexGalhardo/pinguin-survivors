import { describe, expect, test } from 'bun:test';
import { KEYS } from '../src/art/manifest';
import { HERO_IDS } from '../src/config/constants';
import { PALETTE } from '../src/config/palette';
import { SET_IDS } from '../src/data/sets';
import { STARTING_WEAPON_UNLOCKS, STARTING_WEAPONS } from '../src/data/unlocks';
import {
	WEAPON_LINE_BY_ID,
	WEAPON_LINES,
	WEAPON_TIER_TINT,
	WEAPON_TIERS,
} from '../src/data/weapon-lines';
import { TABLES_FOR_TEST, t } from '../src/i18n';

describe('weapon lines (SDD-002 A3)', () => {
	test('at least 17 lines with unique ids and 1-2 valid sets', () => {
		expect(WEAPON_LINES.length).toBeGreaterThanOrEqual(17);
		expect(new Set(WEAPON_LINES.map((w) => w.id)).size).toBe(WEAPON_LINES.length);
		for (const w of WEAPON_LINES) {
			expect([1, 2]).toContain(w.sets.length);
			for (const s of w.sets) expect(SET_IDS).toContain(s);
		}
	});

	test('every set is used by at least one weapon', () => {
		for (const s of SET_IDS)
			expect(WEAPON_LINES.some((w) => (w.sets as readonly string[]).includes(s))).toBe(true);
	});

	test('4 tiers with strictly growing damage and DPS, range never shrinks', () => {
		for (const w of WEAPON_LINES) {
			expect(w.tiers.length).toBe(4);
			for (const [i, b] of w.tiers.slice(1).entries()) {
				const a = w.tiers[i];
				if (!a) throw new Error('missing tier');
				expect(b.damage).toBeGreaterThan(a.damage);
				expect(b.damage / b.cooldown).toBeGreaterThan(a.damage / a.cooldown);
				expect(b.range).toBeGreaterThanOrEqual(a.range);
			}
			const dps = (i: number): number =>
				(w.tiers[i]?.damage ?? 0) / (w.tiers[i]?.cooldown ?? 1);
			expect(dps(3) / dps(0)).toBeGreaterThan(3);
			expect(dps(3) / dps(0)).toBeLessThan(4);
		}
	});

	test('every tier has a manifest key, tint and a name in both languages', () => {
		for (const w of WEAPON_LINES) {
			for (const tier of WEAPON_TIERS) {
				expect(KEYS.weaponTier(w.id, tier)).toBe(`weapon.${w.id}.t${tier}`);
			}
			expect(t(`weapon.${w.id}.name` as never).length).toBeGreaterThan(0);
			expect(TABLES_FOR_TEST['pt-BR'][`weapon.${w.id}.name` as never]).toBeDefined();
		}
		expect(WEAPON_TIER_TINT[1]).toBe(PALETTE.weaponTier1);
		expect(new Set(Object.values(WEAPON_TIER_TINT)).size).toBe(4);
	});

	test('starting weapons: 3 per hero, valid, favorite class or neutral', () => {
		const favorite = { jack: 'melee', bob: 'firearm', lucia: 'magic' } as const;
		for (const hero of HERO_IDS) {
			expect(STARTING_WEAPONS[hero].length).toBe(3);
			for (const id of STARTING_WEAPONS[hero]) {
				const w = WEAPON_LINE_BY_ID[id];
				expect(w.classTag).toBe(favorite[hero]);
				expect(w.hero === undefined || w.hero === hero).toBe(true);
			}
		}
		for (const u of STARTING_WEAPON_UNLOCKS) {
			expect(WEAPON_LINE_BY_ID[u.weapon]).toBeDefined();
			expect(u.cost).toBeGreaterThan(0);
		}
	});
});
