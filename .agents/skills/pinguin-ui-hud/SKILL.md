---
name: pinguin-ui-hud
description: Builds or migrates any Penguin Survivors menu, overlay or HUD in the Diablo 4 organic style (Style D, ADR-022, SDD-015). Use whenever you touch src/ui/ (MainMenu, SaveSlots, HeroSelect, HeroScreen, SkillTree, Achievements/Extras/History, Settings, Controls, Hud, TouchControls, LevelUpCards, Shop/PlayerPanel/ItemViews, Pause, GameOver, Unlock, DemoEnd, Toast), when the user mentions a menu, screen, HUD, wireframe, design system, font size, padding or "Diablo 4 look", or when reviewing a UI diff.
---

# Pinguin UI/HUD — Estilo D (Diablo 4 orgânico)

Skill própria do projeto. Para a arquitetura genérica de UI de jogos (âncoras, safe area, pilha de telas), veja também `gd-game-ui-ux`. Em caso de conflito, esta skill e as regras do projeto vencem.

## Fontes da verdade (leia antes de editar)

1. **[`docs/design-system.md`](../../../docs/design-system.md) v2:** tokens, escala tipográfica, elevação, ornamentos, anatomia e estados dos componentes.
2. **[`docs/wireframes/README.md`](../../../docs/wireframes/README.md):** a especificação da tela que você vai mexer, mais os SVGs de referência em `docs/wireframes/d4/`. O original editável está em `docs/wireframes/pinguin-survivors-wireframes.fig`, que abre no OpenPencil.
3. **[SDD-015](../../../docs/sdds/SDD-015-ui-diablo-4-organica.md)** (requisitos e critérios de aceite) e **[ADR-022](../../../docs/adrs/ADR-022-ui-diablo-4-organica.md)**.
4. **`.agents/rules/react-ui.md`** e **`.agents/rules/game-data-and-i18n.md`**.

## As 6 regras que mais quebram

1. **Nada de cara de web.**
   - Não use grade de cards com borda em cada item nem botão-retângulo de site.
   - Lista de opções = `MenuList`: texto em caixa alta, com foco por losango e brilho `#ffd84a`.
   - Bordas completas só no tooltip de item, no slot de item e em diálogos.
2. **Texto legível.**
   - Texto secundário com pelo menos 22 px em 1920×1080 (18 px em 844×390); item de lista com pelo menos 30 px.
   - Contraste AA em todo texto.
   - `text-dim` só em texto desabilitado de 22 px ou mais.
   - `snow` (`#5a6378`) nunca é cor de texto. `blood` só em texto bold de 24 px ou mais.
3. **Pouco padding.**
   - Padding interno de 12 a 16 px (no máximo 20), com a caixa ajustada ao conteúdo e sem `min-h` decorativo.
   - O respiro fica fora do painel: vem da vinheta e do fundo.
4. **Tokens, nunca literais.**
   - Cores vêm de `src/config/palette.ts`, geradas em `palette.css` por `bun scripts/export-palette-css.ts`. Raridade só via `rarityColor`.
   - Espaçamento, tipografia, elevação, vinheta e filetes vêm das variáveis do `@theme` em `src/ui/theme.css`.
   - `rg -n "#[0-9a-fA-F]{3,8}" src/ui/components` tem que voltar vazio.
5. **Profundidade com orçamento.** No máximo 3 camadas com blur por tela, sem `backdrop-filter` em tela cheia. A vinheta é estática (componente `Vignette`). Sob `prefers-reduced-motion`, tire o brilho animado.
6. **Jogo, não site.**
   - Nada de scroll: pagine com ◀ ▶.
   - O foco é sempre visível e a navegação funciona igual por teclado, gamepad e toque (`focus.tsx`, `focus-nav.ts`).
   - Alvo de toque com pelo menos 44 px, mesmo quando a ação parece só texto.
   - Textos só via `t()`, nos quatro idiomas.

## Fluxo para migrar ou criar uma tela

1. Confira no ROADMAP a tarefa (T3.13 a T3.18) e se a SDD-015 está **Aprovada**. Sem SDD aprovada, não implemente.
2. Abra a especificação da tela no `docs/wireframes/README.md` e o SVG dela. Liste as regiões, os componentes do design system e a ordem de foco.
3. Use os primitivos D (`Panel`, `Heading`, `Filet`/`Divider`, `Ornament`, `Vignette`, `MenuList`, `StatRow`, `ItemCard`, `SlotIcon`, `Bar`, `AdjustRow`, `Btn`, `MenuScreen`, `Toast`). Faltou algum? Crie no design system primeiro (doc mais componente mais teste), não um estilo local na tela.
4. Mantenha os contratos: `store.ts`, as views (`ShopOfferView`, `PlayerPanelView`, `HudSnapshot`) e os comandos. A migração é visual e de layout, não de lógica.
5. Aplique o ponto de feedback da tela (checklist no `docs/wireframes/README.md`) ou anote por que não aplicou.
6. Verifique:
   - `bun run typecheck && bun run lint && bun run lint:i18n && bun test tests/ui`
   - `SOUND_MUTED=true bun run e2e` (e `-- --demo` nas telas da demo)
   - Capturas em **1920×1080, 1280×720 e 844×390** (`agent-browser` ou o E2E), sem overflow (`scrollWidth/Height` igual ao viewport), comparadas ao SVG da tela.
   - Tamanho mínimo de fonte e contraste: no console, percorra os nós de texto visíveis com `getComputedStyle` e confira os pisos de 22 px (18 px no celular) e o AA.
7. Faça um micro-commit por tela, com o teste e a evidência (comando e resultado) anotada na tarefa do ROADMAP.

## HUD (2.10)

- O HUD é jogo: leitura rápida, cobrindo pouco a arena.
  - Pilha no topo: primeiro o timer, depois a faixa de evento (elite ou chefe), depois a barra do chefe.
  - Vida, XP e a poção ficam no canto superior esquerdo. Fish fica à direita.
  - No celular, limite os gambits visíveis a 2.
- Os números usam `tabular-nums`. Contadores podem ficar abaixo de 22 px só onde o design system listar a exceção.
- Sem blur no HUD (custa FPS). Sem sombras: a UI é plana (design system v2.1, ADR-027). Rode `bun scripts/perf.ts` (60 FPS com 300 inimigos) depois de mexer.

## Revisão de diff de UI (checklist rápido)

- [ ] Nenhum hex literal nem cor fora do `palette.ts`
- [ ] Texto com pelo menos 22 px (18 px no celular), lista com pelo menos 30 px e contraste AA
- [ ] Padding de no máximo 20 px e caixa ajustada ao conteúdo
- [ ] Nenhum card ou botão com cara de web, e no máximo 3 blurs
- [ ] Foco visível; teclado, gamepad e toque equivalentes; alvos de 44 px
- [ ] Sem scroll, paginação ok nas três resoluções
- [ ] i18n nos quatro idiomas e `lint:i18n` verde
- [ ] Teste de componente e E2E verdes, capturas anexadas
