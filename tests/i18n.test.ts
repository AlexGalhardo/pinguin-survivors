import { describe, expect, test } from 'bun:test';
import { detectLang, setLang, TABLES_FOR_TEST, t } from '../src/i18n';

describe('i18n', () => {
	test('EN and PT-BR have the same keys and no empty strings', () => {
		const en = Object.keys(TABLES_FOR_TEST.en).sort();
		const pt = Object.keys(TABLES_FOR_TEST['pt-BR']).sort();
		expect(pt).toEqual(en);
		for (const table of Object.values(TABLES_FOR_TEST))
			for (const v of Object.values(table)) expect(v.length).toBeGreaterThan(0);
	});

	test('interpolates vars and keeps unknown placeholders', () => {
		setLang('en');
		expect(t('hud.round', { n: 7 })).toBe('ROUND 7');
		expect(t('hud.round')).toBe('ROUND {n}');
		setLang('pt-BR');
		expect(t('boot.loading')).toBe('Carregando…');
		setLang('en');
	});

	test('detects Portuguese browsers', () => {
		expect(detectLang('pt-BR')).toBe('pt-BR');
		expect(detectLang('pt-PT')).toBe('pt-BR');
		expect(detectLang('es-MX')).toBe('es');
		expect(detectLang('zh-TW')).toBe('zh-CN');
		expect(detectLang('en-US')).toBe('en');
		expect(detectLang(undefined)).toBe('en');
	});
});
