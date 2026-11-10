import { expect, test } from 'bun:test';
import { BIOME_IDS } from '../src/config/constants';
import { AMBIENT, CAMPFIRE, MAX_DARKNESS } from '../src/data/ambient';
import {
	campfireCount,
	campfireSpots,
	emitRate,
	firePulse,
	lightingFor,
	weatherFor,
} from '../src/logic/ambient';
import { arenaBounds, arenaSide } from '../src/logic/arena';
import { tierBudget } from '../src/logic/performance';

test('every biome has its own weather: snow, wind, spores, rain, embers', () => {
	expect(BIOME_IDS.map((b) => weatherFor(b, 1)?.def.kind)).toEqual([
		'snow',
		'wind',
		'spores',
		'rain',
		'embers',
	]);
});

test('the tier scales the live particle cap; low keeps a reduced effect', () => {
	for (const b of BIOME_IDS) {
		const [low, mid, high] = (['low', 'mid', 'high'] as const).map(
			(t) => weatherFor(b, tierBudget(t).ambientScale)?.count ?? 0,
		);
		expect(high).toBe(AMBIENT[b].count);
		expect(low).toBeGreaterThan(0);
		expect(low).toBeLessThan(mid ?? 0);
		expect(mid).toBeLessThan(high ?? 0);
	}
	expect(weatherFor('forest', 0)).toBeNull();
});

test('emitRate sustains the cap with batches at most every frame', () => {
	for (const b of BIOME_IDS) {
		const { def, count } = weatherFor(b, 1) ?? { def: AMBIENT[b], count: 0 };
		const { frequency, quantity } = emitRate(count, def.life);
		const avg = (def.life[0] + def.life[1]) / 2;
		expect((quantity / frequency) * avg).toBeCloseTo(count, 5);
		expect(frequency).toBeGreaterThanOrEqual(30);
	}
});

test('darkness stays under the readability cap in every biome', () => {
	for (const b of BIOME_IDS) expect(lightingFor(b).darkness).toBeLessThanOrEqual(MAX_DARKNESS);
});

test('campfires are deterministic per seed, inside the arena and clear of props and the hero', () => {
	const side = arenaSide(30);
	const bounds = arenaBounds(30);
	const props = [{ x: 300, y: 300, r: 60 }];
	const a = campfireSpots(7, bounds, side, props);
	expect(campfireSpots(7, bounds, side, props)).toEqual(a);
	expect(campfireSpots(8, bounds, side, props)).not.toEqual(a);
	expect(a.length).toBeGreaterThanOrEqual(2);
	expect(a.length).toBeLessThanOrEqual(campfireCount(side));
	for (const s of a) {
		expect(Math.hypot(s.x, s.y)).toBeGreaterThanOrEqual(CAMPFIRE.clearRadius);
		expect(s.x).toBeGreaterThan(bounds.minX + CAMPFIRE.edgeMargin);
		expect(s.x).toBeLessThan(bounds.maxX - CAMPFIRE.edgeMargin);
		for (const p of props) expect(Math.hypot(s.x - p.x, s.y - p.y)).toBeGreaterThan(p.r);
	}
});

test('growing the arena never moves a fire that is already placed', () => {
	const small = campfireSpots(3, arenaBounds(1), arenaSide(1), []);
	const big = campfireSpots(3, arenaBounds(40), arenaSide(40), [], small);
	expect(big.slice(0, small.length)).toEqual(small);
	expect(big.length).toBeGreaterThan(small.length);
});

test('the fire pulse is steady with reduced flashes and stays in 0..1 otherwise', () => {
	expect(firePulse(1.3, 0.4, true)).toBe(CAMPFIRE.pulse.base);
	for (let t = 0; t < 5; t += 0.1) {
		const v = firePulse(t, 1, false);
		expect(v).toBeGreaterThan(0);
		expect(v).toBeLessThanOrEqual(1);
	}
});
