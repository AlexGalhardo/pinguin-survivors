import { HERO_IDS, type HeroId } from '../config/constants';
import type { PlatformKind } from '../core/platform/types';
import { DANGER_LEVELS, type Danger } from '../data/difficulty';

/**
 * Local, opt-in run telemetry (SDD-013 RF-05). Nothing leaves the machine: events are kept in a
 * capped buffer the player can export as JSONL, and the same format feeds `balance-report.ts`
 * (sim and bot write it too). The caller passes `enabled` from the player's setting.
 * The save keeps them in `telemetry` (see `parseRunEndEvents`), gated by `settings.telemetry`.
 */
export const TELEMETRY_LIMIT = 200;

export type RunEndCause = 'death' | 'bossTimeout' | 'quit';
export type TelemetrySource = 'player' | 'sim' | 'bot';

export interface RunEndEvent {
	version: string;
	hero: HeroId;
	danger: Danger;
	level: number;
	round: number;
	/** Final weapon slots as `id:tier`. */
	weapons: string[];
	cause: RunEndCause;
	/** Run length in game seconds. */
	durationS: number;
	platform: PlatformKind;
	source?: TelemetrySource;
	/** Workshop upgrade level the profile was played with (0 = none); sim and bot only. */
	workshop?: number;
	/** Real wall-clock seconds (bot only). */
	wallS?: number;
	fishEarned?: number;
	fishSpent?: number;
	/** Part of `fishSpent` paid for rerolls. */
	fishRerolled?: number;
}

/** Appends an event (newest last), keeping the last `TELEMETRY_LIMIT`; unchanged when disabled. */
export function recordRunEnd(
	events: readonly RunEndEvent[],
	event: RunEndEvent,
	enabled: boolean,
): RunEndEvent[] {
	if (!enabled) return [...events];
	return [...events, event].slice(-TELEMETRY_LIMIT);
}

export function toJsonl(events: readonly RunEndEvent[]): string {
	return events.map((e) => JSON.stringify(e)).join('\n') + (events.length ? '\n' : '');
}

function isRunEnd(v: unknown): v is RunEndEvent {
	if (typeof v !== 'object' || v === null) return false;
	const e = v as Record<string, unknown>;
	return (
		HERO_IDS.includes(e.hero as HeroId) &&
		DANGER_LEVELS.includes(e.danger as Danger) &&
		typeof e.level === 'number' &&
		typeof e.round === 'number' &&
		Array.isArray(e.weapons) &&
		e.weapons.every((w) => typeof w === 'string') &&
		['death', 'bossTimeout', 'quit'].includes(e.cause as string) &&
		typeof e.durationS === 'number'
	);
}

/** Validates a stored array (e.g. `save.telemetry`): drops junk, keeps the newest `TELEMETRY_LIMIT`. */
export function parseRunEndEvents(v: unknown): RunEndEvent[] {
	return (Array.isArray(v) ? v : []).filter(isRunEnd).slice(-TELEMETRY_LIMIT);
}

/** Parses JSONL text, skipping blank, malformed or foreign lines. */
export function parseJsonl(text: string): RunEndEvent[] {
	const out: RunEndEvent[] = [];
	for (const line of text.split('\n')) {
		if (!line.trim()) continue;
		try {
			const v: unknown = JSON.parse(line);
			if (isRunEnd(v)) out.push(v);
		} catch {
			/* not JSON: skip */
		}
	}
	return out;
}
