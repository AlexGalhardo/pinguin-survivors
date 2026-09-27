import { expect, test } from 'bun:test';
import { ALL_CARDS } from '../src/data/cards';
import { setLang } from '../src/i18n';
import { cardDescription, cardName } from '../src/ui/card-text';

test('every card has EN/PT-BR text with filled values', () => {
	for (const lang of ['en', 'pt-BR'] as const) {
		setLang(lang);
		for (const c of ALL_CARDS) {
			expect(cardName(c)).not.toContain('card.');
			expect(cardDescription(c, 'rare')).not.toContain('{');
		}
	}
	setLang('en');
});

test('values scale with rarity and format', () => {
	setLang('en');
	const crit = ALL_CARDS.find((c) => c.id === 'crit');
	const hp = ALL_CARDS.find((c) => c.id === 'maxHp');
	if (!crit || !hp) throw new Error('missing cards');
	expect(cardDescription(crit, 'common')).toBe('+4% critical chance');
	expect(cardDescription(hp, 'legendary')).toBe('+42 max HP');
});
