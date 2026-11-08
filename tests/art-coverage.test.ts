import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { ACTIVE_CARDS, PERK_CARDS, STAT_CARDS } from '../src/data/cards';
import { GEAR } from '../src/data/equipment';
import { POTION_TYPES } from '../src/data/potions';
import { WEAPON_LINES } from '../src/data/weapons';

/** Every sprite the UI asks the atlas for must have art in `art-src/selection.json` (T7.2). */
const selection = JSON.parse(readFileSync('art-src/selection.json', 'utf8')) as Record<
	string,
	unknown
>;
const missing = (keys: string[]): string[] => keys.filter((k) => !(k in selection));

describe('art coverage', () => {
	test('every weapon line has art for the 4 tiers', () => {
		const keys = WEAPON_LINES.flatMap((w) => [1, 2, 3, 4].map((t) => `weapon.${w.id}.t${t}`));
		expect(missing(keys)).toEqual([]);
	});

	test('every card has an icon (stat, active and perk cards)', () => {
		expect(missing(STAT_CARDS.map((c) => `icon.${c.id}`))).toEqual([]);
		expect(
			missing(ACTIVE_CARDS.map((c) => `icon.weapon.${c.id.slice('active.'.length)}`)),
		).toEqual([]);
		expect(missing(PERK_CARDS.map((c) => `icon.${c.id}`))).toEqual([]);
	});

	test('every potion, gear item, currency and danger level has an icon', () => {
		expect(missing(POTION_TYPES.map((p) => `icon.potion.${p}`))).toEqual([]);
		expect(missing(GEAR.map((g) => `item.${g.id}`))).toEqual([]);
		expect(missing(['icon.currency.fish', 'icon.currency.pearl'])).toEqual([]);
		expect(missing([0, 1, 2, 3, 4, 5].map((d) => `icon.danger.${d}`))).toEqual([]);
	});
});

test('the shop merchant atlas has the south idle loop the UI plays', async () => {
	const atlas = (await Bun.file('public/assets/enemies/npc.merchant.json').json()) as {
		frames: Record<string, unknown>;
	};
	for (let i = 0; i < 4; i++) expect(atlas.frames[`idle.s.0${i}`]).toBeDefined();
});
