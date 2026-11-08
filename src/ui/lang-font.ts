import type { Lang } from '../i18n';

/** CJK glyphs come from Noto Sans SC, fetched only when the player picks zh-CN (SDD-009). */
let cjk: Promise<void> | null = null;

/**
 * Makes sure the font the language needs is ready. Canvas text rasterizes once, so callers wait
 * for this before building scenes in a new language.
 */
export function ensureLangFont(lang: Lang): Promise<void> {
	if (lang !== 'zh-CN') return Promise.resolve();
	cjk ??= (async () => {
		await Promise.all([
			import('@fontsource/noto-sans-sc/chinese-simplified-500.css'),
			import('@fontsource/noto-sans-sc/chinese-simplified-700.css'),
		]);
		await Promise.all(
			['500 16px "Noto Sans SC"', 'bold 16px "Noto Sans SC"'].map((f) =>
				document.fonts.load(f, '简体中文').catch(() => undefined),
			),
		);
	})();
	return cjk;
}
