# SDD-008 — Site comercial estático (Astro 7.4) com a demo em `/demo` no GitHub Pages

**Versão** 1.0 · **Data** 2026-11-08 · **Status** Aprovada · **ADR** [014](../adrs/ADR-014-site-github-pages.md) · **Conteúdo e marketing** [../site.md](../site.md)

## Requisitos

- RF-01 Projeto `site/` com **Astro 7.4.x** (última estável no momento do `bun create astro`; 7.4.7 em 2026-11-08), `output: 'static'`, Tailwind CSS v4 via `@tailwindcss/vite`, sem adapter, sem frameworks de ilha na 1.0 (HTML/CSS puro; JS mínimo só para o seletor de idioma e o botão de tela cheia do trailer).
- RF-02 Páginas: `/` (EN, padrão), `/pt-br/`, `/es/`, `/zh-cn/` via `i18n.routing` do Astro; `/demo/` é diretório estático copiado (não é rota Astro). `404.html`.
- RF-03 Landing **em uma viewport** (sem scroll em 1920×1080 e 1366×768; scroll permitido no celular): navbar (logo, idioma, links Steam/Google Play/GitHub), duas colunas (esquerda: título, pitch de 2–3 frases, botões **Play Demo** → `/demo/` e **Wishlist on Steam**; direita: trailer `<video controls poster>` 16:9 com placeholder), footer (© Alex Galhardo, links legais, "feito com Phaser e Astro", versão do site).
- RF-04 SEO estático: `<title>`, `description`, Open Graph/Twitter cards com key art, `hreflang` por idioma, `sitemap` (`@astrojs/sitemap`), `robots.txt`. Sem analytics, sem cookies, sem fontes externas (fontes self-hosted via `@fontsource`).
- RF-05 Performance: Lighthouse ≥ 95 em Performance, Acessibilidade, Best Practices e SEO; imagens em AVIF/WebP via `astro:assets`; peso da landing ≤ 600 kB sem o vídeo.
- RF-06 Build pipeline: `bun run build:demo` (raiz, `VITE_DEMO=1`, `base: '/demo/'`) → copiar `dist-demo/` para `site/public/demo/` → `cd site && bun run build` → `site/dist/`. Script `bun scripts/build-site.ts` faz tudo.
- RF-07 Deploy `.github/workflows/pages.yml` em push na `main` que toque `site/**`, `src/**`, `public/**` ou o workflow: gates do jogo (`lint`, `typecheck`, `test`) → `build-site` → `actions/upload-pages-artifact` → `actions/deploy-pages`. `site.astro.config` lê `SITE_BASE` (`/pinguin-survivors/` no Pages de projeto; `/` com DNS próprio) e `SITE_URL`.
- RF-08 O jogo completo nunca entra no site.

## Especificação

- `site/astro.config.mjs`: `site: process.env.SITE_URL`, `base: process.env.SITE_BASE ?? '/'`, `i18n: { defaultLocale: 'en', locales: ['en','pt-br','es','zh-cn'] }`, `integrations: [sitemap()]`, `vite: { plugins: [tailwindcss()] }`.
- `site/src/pages/index.astro`, `site/src/pages/[lang]/index.astro`, `site/src/i18n/*.json` (copy nos 4 idiomas, chaves iguais ao jogo quando fizer sentido), `site/src/components/{Nav,Hero,Trailer,Footer,LangSwitch}.astro`, `site/src/styles/theme.css` (tokens exportados de `src/config/palette.ts` por `bun scripts/export-palette-css.ts`).
- `site/public/`: `demo/` (gerado, gitignored), `og.png`, `trailer-poster.png`, `robots.txt`, `favicon.svg`.
- Dependências fixas: `astro`, `@astrojs/sitemap`, `tailwindcss`, `@tailwindcss/vite`, `@fontsource/roboto`, `@fontsource/noto-sans-sc`.

## Critérios de aceite

| # | Assert | Verificação |
|---|---|---|
| A1 | `cd site && bun run build` termina sem erros e gera `dist/index.html`, `dist/pt-br/index.html`, `dist/es/index.html`, `dist/zh-cn/index.html`, `dist/demo/index.html` | saída do build + `ls` |
| A2 | `rg -n "astro:server\|output: 'server'\|adapter" site/astro.config.mjs` vazio | grep |
| A3 | Lighthouse (chrome-devtools) em `dist/index.html` servido por `bunx serve`: ≥ 95 nas 4 categorias | relatório |
| A4 | Screenshot 1920×1080 e 1366×768: landing sem barra de scroll; 390×844: layout em coluna única legível | agent-browser |
| A5 | `/demo/` carrega o jogo demo, round 1 começa, zero erros de console, `href` do wishlist aponta para a página da Steam | agent-browser |
| A6 | Workflow `pages.yml` verde e URL do Pages respondendo 200 | `gh run list`, `curl -I` |
| A7 | `hreflang` presente para os 4 idiomas em cada página | grep no HTML |

## Fora de escopo

Blog/devlog, newsletter, analytics, loja própria, press kit (podem entrar pós-1.0 como páginas estáticas).
