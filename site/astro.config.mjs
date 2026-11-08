import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// Static site (ADR-014): SITE_URL / SITE_BASE come from the Pages workflow; defaults suit a local build.
export default defineConfig({
	site: process.env.SITE_URL ?? 'https://alexgalhardo.github.io',
	base: process.env.SITE_BASE ?? '/',
	trailingSlash: 'always',
	i18n: {
		defaultLocale: 'en',
		locales: ['en', 'pt-br', 'es', 'zh-cn'],
	},
	integrations: [
		sitemap({
			i18n: {
				defaultLocale: 'en',
				locales: { en: 'en', 'pt-br': 'pt-BR', es: 'es', 'zh-cn': 'zh-CN' },
			},
		}),
	],
	vite: { plugins: [tailwindcss()] },
});
