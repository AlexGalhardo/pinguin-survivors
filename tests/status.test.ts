import { describe, expect, test } from 'bun:test';
import {
	applyBleed,
	applyBurn,
	applyEarth,
	applyIce,
	applyPoison,
	emptyStatus,
	shredFactor,
	speedFactor,
	type Tick,
	tickStatus,
} from '../src/logic/status';

const tick = (): Tick => ({ bleed: 0, poison: 0, burn: 0 });

describe('damage over time', () => {
	test('bleed: 20% of the hit over 3s per stack, max 5 stacks', () => {
		const s = emptyStatus();
		applyBleed(s, 30);
		let total = 0;
		for (let i = 0; i < 40; i++) total += tickStatus(s, 0.1, tick()).bleed;
		expect(total).toBeCloseTo(6);
		for (let i = 0; i < 9; i++) applyBleed(s, 30);
		expect(s.bleedStacks).toBe(5);
	});

	test('poison stacks to 10 and expires after 4s', () => {
		const s = emptyStatus();
		for (let i = 0; i < 12; i++) applyPoison(s, 10);
		expect(s.poisonStacks).toBe(10);
		expect(tickStatus(s, 1, tick()).poison).toBeCloseTo(10);
		tickStatus(s, 3.5, tick());
		expect(s.poisonStacks).toBe(0);
	});

	test('burn keeps the strongest hit and does not stack', () => {
		const s = emptyStatus();
		applyBurn(s, 20);
		applyBurn(s, 10);
		expect(tickStatus(s, 1, tick()).burn).toBeCloseTo(3);
	});
});

describe('crowd control', () => {
	test('ice slows per stack and freezes at 5', () => {
		const s = emptyStatus();
		applyIce(s);
		applyIce(s);
		expect(speedFactor(s)).toBeCloseTo(0.8);
		for (let i = 0; i < 3; i++) applyIce(s);
		expect(s.frozen).toBeCloseTo(1.5);
		expect(speedFactor(s)).toBe(0);
		tickStatus(s, 2, tick());
		expect(speedFactor(s)).toBe(1);
	});

	test('earth stuns on a low roll and shreds defenses', () => {
		const s = emptyStatus();
		applyEarth(s, 0.5);
		expect(s.stunned).toBe(0);
		expect(shredFactor(s)).toBeCloseTo(1.1);
		applyEarth(s, 0.05);
		expect(speedFactor(s)).toBe(0);
	});
});
