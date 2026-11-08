import { describe, expect, test } from 'bun:test';
import {
	parseJsonl,
	type RunEndEvent,
	recordRunEnd,
	TELEMETRY_LIMIT,
	toJsonl,
} from '../src/logic/telemetry';

const ev = (round: number, over: Partial<RunEndEvent> = {}): RunEndEvent => ({
	version: '0.1.0',
	hero: 'jack',
	danger: 1,
	level: 1,
	round,
	weapons: ['machete:1'],
	cause: 'death',
	durationS: 300,
	platform: 'web',
	...over,
});

describe('telemetry', () => {
	test('records nothing unless the player opted in', () => {
		expect(recordRunEnd([], ev(5), false)).toEqual([]);
		expect(recordRunEnd([ev(1)], ev(5), false)).toEqual([ev(1)]);
		expect(recordRunEnd([], ev(5), true)).toEqual([ev(5)]);
	});

	test('keeps only the newest 200 events and does not mutate the input', () => {
		let events: RunEndEvent[] = [];
		const first = events;
		for (let i = 0; i < TELEMETRY_LIMIT + 25; i++) events = recordRunEnd(events, ev(i), true);
		expect(first).toEqual([]);
		expect(events).toHaveLength(TELEMETRY_LIMIT);
		expect(events[0]?.round).toBe(25);
		expect(events.at(-1)?.round).toBe(TELEMETRY_LIMIT + 24);
	});

	test('JSONL round-trips and skips junk lines', () => {
		const events = [ev(3), ev(9, { hero: 'lucia', danger: 4, fishSpent: 12 })];
		expect(parseJsonl(toJsonl(events))).toEqual(events);
		const dirty = `${toJsonl(events)}\nnot json\n{"hero":"nobody"}\n\n`;
		expect(parseJsonl(dirty)).toEqual(events);
		expect(toJsonl([])).toBe('');
	});
});
