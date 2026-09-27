import { expect, test } from 'bun:test';
import { ACHIEVEMENTS } from '../src/data/achievements';
import { setLang } from '../src/i18n';
import { achievementDescription, achievementName } from '../src/ui/achievement-text';

const byId = (id: string) => {
	const def = ACHIEVEMENTS.find((a) => a.id === id);
	if (!def) throw new Error(id);
	return def;
};

test('names with roman tiers and localized descriptions', () => {
	setLang('en');
	expect(achievementName(byId('kills.3'))).toBe('Zombie Slayer III');
	expect(achievementDescription(byId('kills.3'))).toBe('Kill 1,000 zombies');
	expect(achievementDescription(byId('heroLevel.bob.2'))).toBe('Raise Bob to level 25');
	expect(achievementDescription(byId('time.1'))).toBe('Play for 2 hours');
	expect(achievementName(byId('feat.bossNoPotion'))).toBe('Cold Turkey');
	setLang('pt-BR');
	expect(achievementName(byId('kills.3'))).toBe('Matador de Zumbis III');
	expect(achievementDescription(byId('kills.3'))).toBe('Mate 1.000 zumbis');
	setLang('en');
});

test('no achievement text keeps an unfilled placeholder', () => {
	for (const lang of ['en', 'pt-BR'] as const) {
		setLang(lang);
		for (const a of ACHIEVEMENTS) {
			expect(achievementName(a)).not.toContain('{');
			expect(achievementDescription(a)).not.toContain('{');
		}
	}
	setLang('en');
});
