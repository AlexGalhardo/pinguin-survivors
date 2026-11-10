import { describe, expect, test } from 'bun:test';
import { BIOME_IDS, ENDLESS_BIOMES } from '../src/config/constants';
import { BOSS_ROUNDS, ENEMIES, ENEMY_LIST } from '../src/data/enemies';
import { biomeForRound, bossForRound, enemyPoolForRound, isBiomeStart } from '../src/logic/biome';
import { cloakAlpha } from '../src/logic/enemy-ai';
import { Rng } from '../src/logic/rng';
import { pickEnemy } from '../src/logic/spawn';

describe('biomes', () => {
	test('switch every 10 rounds and loop', () => {
		expect(biomeForRound(1)).toBe('antarctica');
		expect(biomeForRound(10)).toBe('antarctica');
		expect(biomeForRound(11)).toBe('forest');
		expect(biomeForRound(20)).toBe('forest');
		expect(biomeForRound(21)).toBe('city');
		expect(biomeForRound(30)).toBe('city');
		expect(biomeForRound(31)).toBe('station');
		expect(biomeForRound(40)).toBe('station');
		expect(biomeForRound(41)).toBe('ruins');
		expect(biomeForRound(50)).toBe('ruins');
	});

	test('the campaign has a distinct boss every 5 rounds, in BOSS_ROUNDS order', () => {
		expect(BOSS_ROUNDS.length).toBe(10);
		const ids = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((r) => bossForRound(r).id);
		expect(ids).toEqual([...BOSS_ROUNDS]);
		expect(new Set(ids).size).toBe(10);
		expect(bossForRound(10).id).toBe('polarBear');
		expect(bossForRound(20).id).toBe('mooseKing');
		expect(bossForRound(30).id).toBe('biomechColossus');
	});

	test('station is rounds 31-40 and ruins 41-50', () => {
		for (let r = 31; r <= 40; r++) expect(biomeForRound(r)).toBe('station');
		for (let r = 41; r <= 50; r++) expect(biomeForRound(r)).toBe('ruins');
	});

	test('biome start rounds', () => {
		expect([1, 11, 21, 31, 41, 51].map(isBiomeStart)).toEqual([
			false,
			true,
			true,
			true,
			true,
			true,
		]);
		expect(isBiomeStart(12)).toBe(false);
	});

	test('every biome has 6+ regular enemies, two bosses, and spawns from its first round', () => {
		for (const biome of BIOME_IDS) {
			const own = ENEMY_LIST.filter((e) => e.biome === biome);
			expect(own.filter((e) => e.behavior !== 'boss').length).toBeGreaterThanOrEqual(6);
			expect(own.filter((e) => e.behavior === 'boss').length).toBe(2);
		}
		for (const round of [11, 21, 31, 41]) {
			const rng = new Rng(round);
			for (let i = 0; i < 200; i++) {
				const e = pickEnemy(rng, ENEMY_LIST, round);
				expect(e.biome).toBe(biomeForRound(round));
				expect(e.behavior).not.toBe('boss');
			}
		}
	});

	test('boss summons exist', () => {
		for (const e of ENEMY_LIST) if (e.boss) expect(e.boss.summon in ENEMIES).toBe(true);
	});
});

describe('endless mode (round 51+)', () => {
	test('the biome of each block of 10 is deterministic per seed and every biome shows up', () => {
		const seen = new Set<string>();
		for (let seed = 0; seed < 200; seed++) {
			for (const round of [51, 61, 71, 81]) {
				const b = biomeForRound(round, seed);
				expect(biomeForRound(round, seed)).toBe(b);
				// Rounds of one block share the biome.
				expect(biomeForRound(round + 9, seed)).toBe(b);
				seen.add(b);
			}
		}
		expect([...seen].sort()).toEqual([...ENDLESS_BIOMES].sort());
	});

	test('the campaign ignores the seed', () => {
		for (const round of [1, 15, 25, 30, 45, 50])
			expect(biomeForRound(round, 7)).toBe(biomeForRound(round, 99));
	});

	test('every regular enemy of every biome can spawn, and bosses are drawn from all of them', () => {
		const regular = ENEMY_LIST.filter((e) => e.behavior !== 'boss').map((e) => e.id);
		expect(
			enemyPoolForRound(51)
				.map((e) => e.id)
				.sort(),
		).toEqual([...regular].sort());
		const bosses = new Set<string>();
		for (let seed = 0; seed < 400; seed++) bosses.add(bossForRound(55, seed).id);
		expect([...bosses].sort()).toEqual([...BOSS_ROUNDS].sort());
		expect(bossForRound(55, 5).id).toBe(bossForRound(55, 5).id);
	});

	test('pickEnemy in the endless draws from the whole roster', () => {
		const rng = new Rng(4);
		const seen = new Set<string>();
		for (let i = 0; i < 20000; i++) seen.add(pickEnemy(rng, ENEMY_LIST, 55).id);
		expect(seen.size).toBe(enemyPoolForRound(55).length);
	});
});

describe('camouflage', () => {
	test('fully visible inside the range, fading to a floor outside it', () => {
		expect(cloakAlpha(100, 220)).toBe(1);
		expect(cloakAlpha(330, 220)).toBeCloseTo(0.5);
		expect(cloakAlpha(2000, 220)).toBe(0.25);
		expect(ENEMIES.camoStalker.cloakRange).toBeGreaterThan(0);
	});
});
