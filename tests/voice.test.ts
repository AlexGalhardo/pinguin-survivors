import { describe, expect, test } from 'bun:test';
import { HERO_IDS } from '../src/config/constants';
import { VO_EVENTS, VOICE } from '../src/data/voice';
import { en } from '../src/i18n/en';
import { VoiceDirector, voKey } from '../src/logic/voice';

describe('voice director', () => {
	test('global gap blocks barks but not priority lines', () => {
		const v = new VoiceDirector();
		expect(v.tryPlay('levelUp', 0)).toBe(true);
		expect(v.tryPlay('potion', 1)).toBe(false);
		expect(v.tryPlay('boss', 1)).toBe(true);
		expect(v.tryPlay('potion', 1 + VOICE.globalGap)).toBe(true);
	});

	test('per-event cooldown', () => {
		const v = new VoiceDirector();
		expect(v.tryPlay('levelUp', 0)).toBe(true);
		expect(v.tryPlay('levelUp', 5)).toBe(false);
		expect(v.tryPlay('levelUp', VOICE.cooldown.levelUp + 0.1)).toBe(true);
	});

	test('low HP fires once per dip', () => {
		const v = new VoiceDirector();
		expect(v.checkLowHp(0.8)).toBe(false);
		expect(v.checkLowHp(0.2)).toBe(true);
		expect(v.checkLowHp(0.1)).toBe(false);
		expect(v.checkLowHp(0.4)).toBe(false);
		expect(v.checkLowHp(0.2)).toBe(false);
		expect(v.checkLowHp(0.6)).toBe(false);
		expect(v.checkLowHp(0.2)).toBe(true);
	});

	test('keys and a subtitle for every hero, event and variant', () => {
		expect(voKey('jack', 'boss', 'pt-BR', 2)).toBe('vo.jack.boss.pt-BR.2');
		const keys = en as Record<string, string>;
		for (const h of HERO_IDS)
			for (const e of VO_EVENTS)
				for (let n = 1; n <= VOICE.variants; n++)
					expect(keys[`vo.${h}.${e}.${n}`]).toBeString();
	});
});
