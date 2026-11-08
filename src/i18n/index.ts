import { en, type I18nKey } from './en';
import { es } from './es';
import { ptBR } from './pt-BR';
import { zhCN } from './zh-CN';

export const LANGS = ['en', 'pt-BR', 'es', 'zh-CN'] as const;
export type Lang = (typeof LANGS)[number];

const TABLES: Record<Lang, Record<I18nKey, string>> = {
	en,
	'pt-BR': ptBR,
	es,
	'zh-CN': zhCN,
};

let current: Lang = 'en';

export function setLang(lang: Lang): void {
	current = lang;
}

export function getLang(): Lang {
	return current;
}

/** Browser language → supported language (pt-* → pt-BR, es-* → es, zh-* → zh-CN, else en). */
export function detectLang(navigatorLang: string | undefined): Lang {
	const l = navigatorLang?.toLowerCase() ?? '';
	if (l.startsWith('pt')) return 'pt-BR';
	if (l.startsWith('es')) return 'es';
	if (l.startsWith('zh')) return 'zh-CN';
	return 'en';
}

export function t(key: I18nKey, vars?: Record<string, string | number>): string {
	const text = TABLES[current][key];
	if (!vars) return text;
	return text.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

export type { I18nKey };
export const TABLES_FOR_TEST = TABLES;
