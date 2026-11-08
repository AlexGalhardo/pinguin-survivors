# Site comercial — Pinguin Survivors

> **Versão** 1.0 · **Data** 2026-11-08 · Especificação de **conteúdo, marketing e estrutura** do site que vende o jogo. A especificação técnica (Astro 7.4, build, deploy) está em [sdds/SDD-008](sdds/SDD-008-site-astro-github-pages.md); a decisão em [adrs/ADR-014](adrs/ADR-014-site-github-pages.md). Nada aqui é implementado nesta sessão: o [ROADMAP.md](../ROADMAP.md) agenda a construção.

## Índice

1. [Objetivo e métricas](#1-objetivo-e-métricas)
2. [Público e mensagem](#2-público-e-mensagem)
3. [Estrutura da landing (uma viewport)](#3-estrutura-da-landing-uma-viewport)
4. [Copy por idioma](#4-copy-por-idioma)
5. [Demo web `/demo`](#5-demo-web-demo)
6. [Trailer](#6-trailer)
7. [Identidade visual do site](#7-identidade-visual-do-site)
8. [SEO, compartilhamento e legal](#8-seo-compartilhamento-e-legal)
9. [Hospedagem e domínio](#9-hospedagem-e-domínio)
10. [Checklist de lançamento do site](#10-checklist-de-lançamento-do-site)

## 1. Objetivo e métricas

- **Objetivo único**: converter visitante em **wishlist na Steam** (antes da 1.0) e em **compra** (depois). O botão "Play Demo" existe para provar o jogo em 1 clique.
- Métricas (sem analytics próprio na 1.0): wishlists via Steamworks (UTM `?utm_source=site` no link da Steam), instalações via Play Console, cliques indiretos por tráfego do Pages (GitHub Insights).
- Metas: ≥ 2.000 wishlists antes do Next Fest (22/02/2027), conversão demo → wishlist ≥ 15% (benchmarks em [web-research.md](web-research.md) §7).

## 2. Público e mensagem

- Jogadores de Brotato, Vampire Survivors, Halls of Torment; 18–35; PC e Android; jogam sessões de 10–25 min.
- **Promessa em uma frase**: "Três pinguins, trezentos zumbis por round, sangue na neve: um arena survivor estilo Brotato com progressão que nunca se perde."
- Três ganchos (ordem): (1) pinguins fofos vs. gore DOOM; (2) 6 armas automáticas, loja e builds; (3) level 1–100 persistente e Danger 0–5.
- Tom: direto, bem-humorado, zero jargão corporativo; nunca prometer conteúdo não entregue (sem "em breve" sem data).

## 3. Estrutura da landing (uma viewport)

```
┌──────────────────────────────────────────────────────────────────────┐
│ [logo] Pinguin Survivors            [EN ▾] [Steam] [Google Play] [GitHub] │  navbar 56 px
├────────────────────────────────┬─────────────────────────────────────┤
│ TÍTULO (Pixelify Sans)         │                                     │
│ Pitch 2–3 frases               │   [ trailer 16:9 / poster ]         │
│ 3 bullets (ganchos)            │   (placeholder até a 1.0)           │
│ [ ▶ Play Demo ]  [ ♥ Wishlist ]│                                     │
│ "Demo: rounds 1–10, só no PC"  │                                     │
├────────────────────────────────┴─────────────────────────────────────┤
│ © Alex Galhardo · Privacidade · Imprensa · Phaser 4 + Astro · v1.x   │  footer 48 px
└──────────────────────────────────────────────────────────────────────┘
```

- Fundo: key art escurecida (Jack ou Bob, sorteio no build, não no cliente) com vinheta; partículas de brasa em CSS (sem JS).
- Em celular (< 900 px): coluna única, trailer acima dos botões, scroll permitido.
- Botão "Play Demo" aponta para `/demo/`; desabilitado em telas < 1024 px com texto "Demo disponível no PC" (o jogo web não tem controles de toque na 1.0; Android é app).
- Botão "Wishlist" → página da Steam com UTM; após a 1.0 vira "Comprar na Steam" + "Google Play".

## 4. Copy por idioma

Textos em `site/src/i18n/{en,pt-br,es,zh-cn}.json`, mesmas chaves. Glossário compartilhado com o jogo ([sdds/SDD-009](sdds/SDD-009-i18n-es-zh.md)).

| Chave | EN | PT-BR |
|---|---|---|
| `hero.title` | Pinguin Survivors | Pinguin Survivors |
| `hero.pitch` | Three penguins. Three hundred zombies a round. Blood on the snow. A Brotato-style arena survivor where your progress never dies. | Três pinguins. Trezentos zumbis por round. Sangue na neve. Um arena survivor estilo Brotato em que seu progresso nunca morre. |
| `hero.bullet1` | Cute penguins, DOOM-grade gore (toggle it if you must). | Pinguins fofos, gore nível DOOM (dá para desligar, se precisar). |
| `hero.bullet2` | Six auto-firing weapons, a shop every round, builds that break the game. | Seis armas automáticas, loja a cada round, builds que quebram o jogo. |
| `hero.bullet3` | Level 1–100 per hero, Danger 0–5, endless rounds. | Level 1–100 por herói, Danger 0–5, rounds sem fim. |
| `cta.demo` | Play Demo | Jogar Demo |
| `cta.wishlist` | Wishlist on Steam | Wishlist na Steam |
| `cta.buy` | Buy on Steam | Comprar na Steam |
| `demo.note` | Demo: rounds 1–10 with Jack. Desktop browser only. | Demo: rounds 1–10 com Jack. Só no navegador de PC. |
| `footer.made` | Made with Phaser 4 and Astro | Feito com Phaser 4 e Astro |

ES e ZH traduzidos do EN pelo agente `text-editor` e revisados antes do deploy.

## 5. Demo web `/demo`

- Build Vite do jogo com `VITE_DEMO=1`, rounds 1–10, só Jack, Danger 0–1, tela final com botão de wishlist ([sdds/SDD-006](sdds/SDD-006-demo.md)).
- Carregamento: tela de loading com dica de controles (WASD, Espaço, TAB); ≤ 15 MB iniciais; assets de biomas 2–3 não entram no bundle da demo.
- Save em `localStorage` do domínio do site; aviso "seu progresso fica neste navegador; exporte em Configurações".
- Sem iframe: a demo é uma página própria em tela cheia com link "← Voltar ao site" discreto no canto.

## 6. Trailer

- Até 2 min, produzido após a 1.0; até lá `<video poster>` com a key art e o texto "Trailer em breve" **com data prevista** (ou sem o texto, só poster).
- Estrutura sugerida: 0–5 s gancho (horda + gore), 5–40 s loop (round, loja, level-up), 40–80 s heróis e superpoderes, 80–110 s bosses e biomas, 110–120 s logo + "Wishlist".
- Formato: MP4 H.264 1080p60 + WebM; legendas embutidas nos 4 idiomas opcionais; hospedado no repositório (≤ 100 MB) ou no YouTube com embed sem cookies (`youtube-nocookie.com`) se passar do limite.

## 7. Identidade visual do site

Tokens de `src/config/palette.ts` exportados para CSS: fundo noite polar, painéis escuros com borda metálica, destaque vermelho-sangue nos CTAs, dourado para "Wishlist". Títulos em Pixelify Sans, corpo em Rubik (Noto Sans SC em ZH). Nenhum asset de terceiros; ícones de lojas são os badges oficiais da Steam e do Google Play dentro das regras de marca de cada uma.

## 8. SEO, compartilhamento e legal

- `title`: "Pinguin Survivors — Brotato-style arena survivor with penguins and DOOM gore"; `description` ≤ 155 caracteres por idioma; `hreflang` x4; Open Graph/Twitter card com key art 1200×630.
- Páginas estáticas adicionais (pós-1.0): `/press/` (press kit: logos, screenshots, fact sheet), `/privacy/` (sem coleta de dados; o jogo salva localmente; Steam/Google gerenciam compras).
- Rodapé: © Alex Galhardo, ano; "Steam é marca da Valve Corporation; Google Play é marca do Google LLC".
- Classificação etária visível na landing (16+/Mature) quando emitida.

## 9. Hospedagem e domínio

GitHub Pages do repositório `AlexGalhardo/pinguin-survivors` (`https://alexgalhardo.github.io/pinguin-survivors/` com `SITE_BASE=/pinguin-survivors/`). Quando o desenvolvedor criar o DNS: `CNAME` no `site/public/`, `SITE_BASE=/`, HTTPS forçado nas configurações do Pages.

## 10. Checklist de lançamento do site

- [ ] Página da Steam publicada (link real no CTA).
- [ ] Demo `/demo/` com tela final de wishlist funcional.
- [ ] 4 idiomas revisados; `hreflang` conferido.
- [ ] Lighthouse ≥ 95 nas 4 categorias; sem scroll em 1920×1080 e 1366×768.
- [ ] OG image e favicon; `robots.txt` e sitemap.
- [ ] Badges oficiais das lojas dentro das regras de marca.
- [ ] Workflow `pages.yml` verde; URL respondendo 200.
- [ ] Trailer ou poster com data.
