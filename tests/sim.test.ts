import { describe, expect, it } from 'bun:test';
import { ENEMIES } from '../src/data/enemies';
import { SIM } from '../src/data/sim';
import { WEAPONS } from '../src/data/weapons';
import { createRunState, runStats } from '../src/logic/run-state';
import { simulateMany, simulateRun, weaponDps } from '../src/logic/sim/run-sim';
import { weaponDamage } from '../src/logic/stats';

describe('balance simulation (balancing §10)', () => {
	it('warrior kills a wave-1 chaser in one blade hit', () => {
		const s = runStats(createRunState('warrior', 1));
		expect(weaponDamage(WEAPONS.energy_blade.damage, s, false)).toBeGreaterThanOrEqual(
			ENEMIES.chaser.hp,
		);
	});

	it('is deterministic for a seed', () => {
		expect(simulateRun('mage', 'random', 42)).toEqual(simulateRun('mage', 'random', 42));
	});

	it('starting weapons have comparable DPS', () => {
		const dps = (['warrior', 'ranger', 'mage'] as const).map((c) => {
			const st = createRunState(c, 1);
			return weaponDps(st, runStats(st));
		});
		const max = Math.max(...dps);
		for (const d of dps) expect(d / max).toBeGreaterThan(0.45);
	});

	it('random builds end in the target band (median waves 10-20)', () => {
		for (const c of ['warrior', 'ranger', 'mage'] as const) {
			const m = simulateMany(c, 'random', 60).median;
			expect(m).toBeGreaterThanOrEqual(10);
			expect(m).toBeLessThanOrEqual(20);
		}
	});

	it('good builds go further than random builds and stay within the wave cap', () => {
		for (const c of ['warrior', 'ranger', 'mage'] as const) {
			const good = simulateMany(c, 'good', 40);
			expect(good.median).toBeGreaterThanOrEqual(25);
			expect(good.max).toBeLessThanOrEqual(SIM.maxWave + 1);
		}
	});
});
