# SDD-020 — UI plana (emenda da SDD-015)

**Versão** 1.0 · **Data** 2026-11-10 · **Status** Aprovada (2026-11-10, desenvolvedor no chat) · **ADR** [025](../adrs/ADR-027-ui-plana.md) · **Emenda** [SDD-015](SDD-015-ui-diablo-4-organica.md) · **Depende de** SDD-004 · **Design system** [v2.1](../design-system.md)

Torna toda a UI React plana: sem sombra, sem elevação, sem moldura de card, com grupos delimitados por borda fina e um estilo de botão por função. Lógica, contratos, i18n (exceto as chaves órfãs abaixo) e fluxos não mudam.

## Requisitos

- **RF-01 Tokens.** `src/ui/theme.css` perde `--shadow-inset`, `--shadow-1`, `--shadow-2` e `--shadow-focus`, e ganha `--color-line` (`gold-aged` a 55 % sobre `night`, sem hex). Sem nenhum `box-shadow`, `drop-shadow` ou brilho em classe ou componente de menu.
- **RF-02 Primitivos.**
  - `Panel`: fundo `night` liso e borda `line` de 1 px, sem gradiente nem sombra.
  - `ItemCard`: borda de 1 px na cor da raridade, sem chanfro, sem tracejado e sem sombra.
  - `Btn`: sempre com borda de 1 px. `primary` (`gold-bright` + fundo `gold-aged` a 20 %), `secondary` (`line`), `danger` (`blood`); desabilitado com borda tracejada `snow`. A variante de raridade (`tint`) perde o brilho.
  - `MenuList`, `Toast`, `Filet` e `Divider`: planos (o filete vira linha de 1 px em `line`); `.ornate`, `.d-chamfer` e `.d-worn` saem do CSS.
  - Foco (`d-focus`) sem sombra e sem brilho no losango.
- **RF-03 Telas.** Menu inicial, slots, seleção de herói (via primitivos), herói, conquistas/extras, histórico, configurações, controles, cartas de level-up, loja, painel do jogador, pausa, fim de partida, desbloqueio e fim da demo usam só os primitivos planos: nenhuma tela define sombra, moldura ou botão próprio. Grupos de botões têm borda `line` e gap consistente. Hud.tsx recebe só o visual dos primitivos; a árvore de habilidades fica fora desta SDD.
- **RF-03b Loja.** Os atributos do herói saem da coluna DETAILS e viram uma faixa de 4 colunas × 3 linhas sob as duas colunas da direita (full width, texto ≥ 22 px), acima do rodapé de ações; as linhas de equipamento ficam em 34 px de altura mínima. No pior caso (6 armas, 5 equipamentos, 3 suportes e poção, e oferta com item equipado) em 1920×1080 e 2400×1080, nada invade o rodapé.
- **RF-04 Menu inicial.** Remove o subtítulo (`menu.tagline`) e o rodapé de pérolas e pontos (`menu.wallet`), e as duas chaves nos 4 idiomas.
- **RF-05 Legibilidade.** Texto secundário ≥ 22 px em 1920×1080, contraste AA e foco visível sem sombra.

## Aceite

`bun test` (inclui `tests/ui`), `bun run typecheck`, `bunx biome check`, `bun scripts/lint-i18n.ts` e capturas antes/depois em 1920×1080 (e o menu inicial em 844×390).
