import type { HeroId } from '../config/constants';
import { VOICE, type VoEvent } from '../data/voice';

export function voKey(hero: HeroId, event: VoEvent, lang: string, n: number): string {
	return `vo.${hero}.${event}.${lang}.${n}`;
}

/** Decides whether a voice line may play now (per-event cooldowns + a global gap). */
export class VoiceDirector {
	private lastAny = Number.NEGATIVE_INFINITY;
	private readonly last = new Map<VoEvent, number>();
	private lowHpArmed = true;

	tryPlay(event: VoEvent, now: number): boolean {
		const priority = (VOICE.priority as readonly VoEvent[]).includes(event);
		if (!priority && now - this.lastAny < VOICE.globalGap) return false;
		const prev = this.last.get(event);
		if (prev !== undefined && now - prev < VOICE.cooldown[event]) return false;
		this.last.set(event, now);
		this.lastAny = now;
		return true;
	}

	/** True once each time HP dips under the low threshold (hysteresis avoids spam). */
	checkLowHp(ratio: number): boolean {
		if (ratio >= VOICE.lowHpReset) this.lowHpArmed = true;
		if (!this.lowHpArmed || ratio >= VOICE.lowHp || ratio <= 0) return false;
		this.lowHpArmed = false;
		return true;
	}
}
