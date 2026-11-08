import en from './en.json';
import es from './es.json';
import ptBr from './pt-br.json';
import zhCn from './zh-cn.json';

export const LOCALES = ['en', 'pt-br', 'es', 'zh-cn'] as const;
export type Locale = (typeof LOCALES)[number];
export type Copy = typeof en;

export const COPY: Record<Locale, Copy> = { en, 'pt-br': ptBr, es, 'zh-cn': zhCn };

/** Shown in the language switcher (each language in its own name). */
export const LOCALE_NAMES: Record<Locale, string> = {
	en: 'English',
	'pt-br': 'Português (BR)',
	es: 'Español',
	'zh-cn': '简体中文',
};

/** BCP 47 tag for `<html lang>`, `hreflang` and Open Graph. */
export const LOCALE_TAGS: Record<Locale, string> = {
	en: 'en',
	'pt-br': 'pt-BR',
	es: 'es',
	'zh-cn': 'zh-CN',
};

export const isLocale = (value: string): value is Locale =>
	(LOCALES as readonly string[]).includes(value);

/** Path of the landing page for a locale, relative to the site base (`/` for English). */
export const localePath = (locale: Locale): string => (locale === 'en' ? '' : `${locale}/`);
