import type { CharacterId } from '../data/characters';
import { UNLOCKS } from '../data/unlocks';
import type { SaveData } from './save';

export function isUnlocked(save: SaveData, c: CharacterId): boolean {
	return save.unlocked.includes(c);
}

/** Event that can unlock characters. */
export type UnlockEvent =
	| { kind: 'wave'; character: CharacterId; wave: number }
	| { kind: 'bossKilled' };

/** Returns the characters unlocked by this event (and adds them to the save). */
export function checkUnlocks(save: SaveData, event: UnlockEvent): CharacterId[] {
	const out: CharacterId[] = [];
	for (const rule of UNLOCKS) {
		if (save.unlocked.includes(rule.character)) continue;
		const ok =
			(rule.kind === 'wave' &&
				event.kind === 'wave' &&
				event.character === rule.with &&
				event.wave >= rule.wave) ||
			(rule.kind === 'bossKilled' && event.kind === 'bossKilled');
		if (ok) {
			save.unlocked.push(rule.character);
			out.push(rule.character);
		}
	}
	return out;
}
