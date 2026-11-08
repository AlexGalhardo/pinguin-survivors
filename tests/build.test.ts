import { describe, expect, test } from 'bun:test';
import { MAX_WEAPON_SLOTS } from '../src/data/weapons';
import { addWeapon, canFuse, emptyBuild, fuse } from '../src/logic/build';

describe('weapon slots and fusion (SDD-002 A1)', () => {
	test('addWeapon refuses the 7th weapon', () => {
		const b = emptyBuild();
		for (let i = 0; i < MAX_WEAPON_SLOTS; i++) expect(addWeapon(b, 'machete')).toBe(true);
		expect(addWeapon(b, 'knives')).toBe(false);
		expect(b.weapons.length).toBe(6);
	});

	test('fuse needs same id and tier, tier < 4; result is tier+1 in one slot', () => {
		const b = emptyBuild();
		addWeapon(b, 'machete');
		addWeapon(b, 'knives');
		addWeapon(b, 'machete');
		expect(fuse(b, 0, 1)).toBe(false);
		expect(fuse(b, 0, 0)).toBe(false);
		expect(fuse(b, 0, 2)).toBe(true);
		expect(b.weapons).toEqual([
			{ id: 'machete', tier: 2 },
			{ id: 'knives', tier: 1 },
		]);
	});

	test('different tiers do not fuse and tier IV is capped', () => {
		const b = emptyBuild();
		addWeapon(b, 'machete', 2);
		addWeapon(b, 'machete', 1);
		expect(canFuse(b, 0, 1)).toBe(false);
		const c = emptyBuild();
		addWeapon(c, 'machete', 4);
		addWeapon(c, 'machete', 4);
		expect(fuse(c, 0, 1)).toBe(false);
		expect(c.weapons.length).toBe(2);
	});

	test('fusing frees a slot for a new weapon', () => {
		const b = emptyBuild();
		for (let i = 0; i < MAX_WEAPON_SLOTS; i++) addWeapon(b, 'machete');
		fuse(b, 0, 1);
		expect(addWeapon(b, 'knives')).toBe(true);
	});
});
