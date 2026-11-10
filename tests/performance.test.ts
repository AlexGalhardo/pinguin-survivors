import { expect, test } from 'bun:test';
import { ARENA } from '../src/data/arena';
import { parseDebugParams } from '../src/debug/params';
import { scaleParticles, tierBudget } from '../src/logic/performance';

test('low follows SDD-007 RF-05; high is the full game', () => {
	const low = tierBudget('low');
	expect(low).toMatchObject({
		decalCap: 1000,
		dynamicLights: false,
		bloom: false,
		particleScale: 0.5,
	});
	const high = tierBudget('high');
	expect(high.decalCap).toBe(ARENA.decalCap);
	expect(high.dynamicLights).toBe(true);
	expect(high.particleScale).toBe(1);
});

test('mid sits between low and high on every knob', () => {
	const [low, mid, high] = (['low', 'mid', 'high'] as const).map(tierBudget);
	for (const k of [
		'decalCap',
		'maxLights',
		'particleScale',
		'critLabels',
		'critSparks',
		'ambientScale',
	] as const) {
		expect(mid?.[k]).toBeGreaterThan(low?.[k] ?? 0);
		expect(mid?.[k]).toBeLessThan(high?.[k] ?? 0);
	}
});

test('scaleParticles keeps at least one particle while the effect is on', () => {
	expect(scaleParticles(10, 0.5)).toBe(5);
	expect(scaleParticles(1, 0.5)).toBe(1);
	expect(scaleParticles(0, 0.5)).toBe(0);
});

test('?tier takes the words as the effects tier and the digits as the hero art tier', () => {
	expect(parseDebugParams('?tier=low').fxTier).toBe('low');
	expect(parseDebugParams('?tier=low').tier).toBeUndefined();
	expect(parseDebugParams('?tier=2').tier).toBe(2);
	expect(parseDebugParams('?tier=2').fxTier).toBeUndefined();
	expect(parseDebugParams('?tier=ultra').fxTier).toBeUndefined();
});
