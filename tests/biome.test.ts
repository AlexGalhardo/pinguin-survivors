import { describe, expect, test } from 'bun:test';
import { BIOME_IDS } from '../src/config/constants';
import { ENEMIES, ENEMY_LIST } from '../src/data/enemies';
import { biomeForRound, bossForRound, isBiomeStart } from '../src/logic/biome';
import { Rng } from '../src/logic/rng';
import { pickEnemy } from '../src/logic/spawn';

describe('biomes', () => {
	test('switch every 10 rounds and loop', () => {
		expect(biomeForRound(1)).toBe('antarctica');
		expect(biomeForRound(10)).toBe('antarctica');
		expect(biomeForRound(11)).toBe('station');
		expect(biomeForRound(20)).toBe('station');
		expect(biomeForRound(21)).toBe('ruins');
		expect(biomeForRound(30)).toBe('ruins');
		expect(biomeForRound(31)).toBe('antarctica');
	});

	test('boss rotates with the biome', () => {
		expect(bossForRound(10).id).toBe('polarBear');
		expect(bossForRound(20).id).toBe('kraken');
		expect(bossForRound(30).id).toBe('abomination');
		expect(bossForRound(40).id).toBe('polarBear');
	});

	test('biome start rounds', () => {
		expect([1, 11, 21, 31].map(isBiomeStart)).toEqual([false, true, true, true]);
		expect(isBiomeStart(12)).toBe(false);
	});

	test('every biome has 6+ regular enemies, one boss, and spawns from its first round', () => {
		for (const biome of BIOME_IDS) {
			const own = ENEMY_LIST.filter((e) => e.biome === biome);
			expect(own.filter((e) => e.behavior !== 'boss').length).toBeGreaterThanOrEqual(6);
			expect(own.filter((e) => e.behavior === 'boss').length).toBe(1);
		}
		for (const round of [11, 21, 31]) {
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
