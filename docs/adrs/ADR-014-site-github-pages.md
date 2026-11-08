# ADR-014 — Site comercial 100% estático em Astro, com a demo Vite servida em `/demo`, no GitHub Pages

**Data** 2026-11-08 · **Status** Aceito · **Decisão de origem** B-27 (atualizada em 2026-11-08: Astro)

## Contexto

Landing page em uma viewport (navbar, duas colunas, footer) com botão "Play Demo" e placeholder do trailer, nos 4 idiomas. O desenvolvedor quer hospedagem gratuita (GitHub Pages) e um site **100% estático** feito com a **última versão estável do Astro (7.4.x; 7.4.7 em 2026-11-08)**. O jogo continua sendo um build Vite + Phaser.

## Decisão

- Projeto **Astro** em `site/` (`output: 'static'`, sem adapters, sem SSR), **separado** do build do jogo. Páginas por idioma via i18n routing do Astro (`/`, `/pt-br/`, `/es/`, `/zh-cn/`), Tailwind CSS v4 compartilhando os tokens de `src/config/palette.ts` exportados para CSS.
- A **demo** é o build Vite do jogo com `VITE_DEMO=1` (`base: '/demo/'`), copiado para `site/public/demo/` antes do `astro build`; o Astro publica tudo em `site/dist/`.
- Deploy por GitHub Actions (`.github/workflows/pages.yml`): gates do jogo → build demo → copiar → `astro build` → `actions/deploy-pages`. URL inicial `https://alexgalhardo.github.io/pinguin-survivors/` (`site` configurado com esse `base`); DNS próprio depois (`site` sem `base`).
- Trailer: `<video>` com poster placeholder até a 1.0; nenhum JS de terceiros (sem analytics, sem cookies) na 1.0.
- O jogo completo não é publicado na web.

## Alternativas

- Landing dentro do mesmo build Vite (decisão anterior): mistura UI de jogo com site e perde SEO/i18n estático do Astro. Substituída.
- Vercel: custo potencial e mais uma conta. Rejeitada.
- Next.js/SSR: desnecessário para site estático. Rejeitada.

## Consequências

- Duas árvores de dependências (raiz = jogo; `site/` = Astro); `bun install` em cada uma; versões estáveis fixas.
- Limites do Pages: arquivo ≤ 100 MB, site ≤ 1 GB, build ≤ 10 min; a demo (~12 MB de assets) cabe.
- O caminho `/demo/` precisa de `base` correto no Vite e de links relativos nos assets.
