# SDD-015 — UI Diablo 4 orgânica (Estilo D)

**Versão** 1.0 · **Data** 2026-11-09 · **Status** Aprovada (2026-11-09, desenvolvedor: com Cinzel) · **ADR** [022](../adrs/ADR-022-ui-diablo-4-organica.md) · **Depende de** SDD-004 · **Wireframes** [docs/wireframes/](../wireframes/README.md)

Reestiliza todas as telas React existentes no Estilo D. A lógica, os contratos (`store.ts`, `GameEvents`, `GameCommands`, views como `ShopOfferView` e `PlayerPanelView`), a navegação por foco, o i18n e os fluxos continuam como estão. Muda a camada visual e, onde o wireframe pede, a disposição dos elementos na tela.

## Requisitos

- **RF-01 Tokens.** O `@theme` (em `src/ui/theme.css`) ganha os tokens do [design system v2](../design-system.md):
  - escala de espaçamento em 4 px;
  - escala tipográfica (`display`, `title`, `item-name`, `section`, `list-item`, `body`, `secondary`, `key-hint`, `value`) com os tamanhos de desktop e de celular;
  - elevações (`elev-0` a `elev-2`, `focus-glow`), vinheta e filetes.
  - As cores continuam geradas de `src/config/palette.ts` (`bun scripts/export-palette-css.ts`). As transparências do design system são derivadas desses tokens, sem nenhum hex literal em componente.
- **RF-02 Fonte de títulos.** Com a aprovação do ADR-022, entra o `@fontsource/cinzel` 5.3.0 (exato, pesos 700 e 900) em `--font-title`. Sem aprovação, `--font-title` continua Roboto 900 com tracking 0,25em. Em ZH-CN, o título cai em Noto Sans SC (`lang-font.ts`).
- **RF-03 Componentes D.** Os primitivos ganham a aparência D, sem mudar a API pública, ou ganham uma prop `variant` quando as duas aparências precisarem conviver durante a migração.
  - `Panel`, `Heading`, `Filet`, `Divider`, `StatRow`, `ItemCard`, `Hint`, `Bar`, `Btn`, `MenuScreen`, `AdjustRow`, `SlotIcon`, `Toast`.
  - Novos: `Ornament` (losango, canto, filete SVG inline), `Vignette` (camada fixa com `pointer-events: none`) e `MenuList` (lista vertical de opções em texto com foco por losango).
  - A anatomia, as medidas e os estados de cada um estão no design system v2.
- **RF-04 Telas.** Cada tela segue a especificação dela em `docs/wireframes/README.md`.

  | Tela | Componente |
  |---|---|
  | 2.1 | `MainMenu` |
  | 2.2 | `SaveSlots` |
  | 2.3 | `HeroSelect` |
  | 2.4 | `HeroScreen` |
  | 2.5 | `SkillTree` |
  | 2.6 | `Achievements` e `Extras` (`Lists.tsx`) |
  | 2.7 | `History` |
  | 2.8 | `Settings` |
  | 2.9 | `Controls` |
  | 2.10 | `Hud` e `TouchControls` |
  | 2.11 | `LevelUpCards` |
  | 2.12 | `Shop`, `PlayerPanel` e `ItemViews` |
  | 2.13 | `Pause` |
  | 2.14 | `GameOver` |
  | 2.15 | `Unlock` |
  | 2.16 | `DemoEnd` |

- **RF-05 Legibilidade.** Nenhum texto fica abaixo de 22 px em 1920×1080 (18 px em 844×390), exceto contadores do HUD já existentes que o design system liste como exceção. O par texto/fundo precisa de contraste AA. `text-dim` só aparece em texto desabilitado de 22 px ou mais.
- **RF-06 Padding.** O padding interno de painéis, tooltips e itens fica entre 12 e 16 px, com no máximo 20. A caixa se ajusta ao conteúdo, sem `min-h` decorativo.
- **RF-07 Sem cara de web.** Nenhuma grade de cards com borda em cada item:
  - listas de opção usam `MenuList`;
  - as ações principais ficam em texto com losango, com área clicável de pelo menos 44 px;
  - bordas completas só no tooltip de item, no slot de item e em diálogos.
- **RF-08 Profundidade com orçamento.** Há no máximo 3 camadas com blur por tela. Vinheta e brilho usam gradientes estáticos, sem `backdrop-filter` em tela cheia. No Android, `prefers-reduced-motion` desliga as animações de brilho.
- **RF-09 Inalterados.** Continuam como estão:
  - fluxo, foco (setas, Enter, Esc, gamepad, toque), menus neutros e a key art só no menu inicial;
  - paginação sem scroll e textos via `t()` nos quatro idiomas;
  - `describeOffer` e `rarityColor`.
- **RF-10 Feedback dos wireframes.** Os 12 pontos de `docs/wireframes/README.md` são aplicados quando a tela correspondente for migrada. Ponto descartado tem o motivo anotado na tarefa.

## Especificação

- **Ordem de migração:**
  1. tokens e primitivos (RF-01 a RF-03);
  2. telas fora da run: 2.1, 2.2, 2.3, 2.4, 2.8, 2.9;
  3. coleções: 2.5, 2.6, 2.7;
  4. telas da run: 2.11, 2.12, 2.13, 2.14, 2.15, 2.16;
  5. HUD (2.10).
- **Arquivos:** `src/ui/theme.css`, `src/ui/components/*.tsx`, `src/ui/components/Ornament.tsx` (novo), `src/ui/components/MenuList.tsx` (novo), `scripts/export-palette-css.ts` (só se um token derivado exigir), `tests/ui/*.test.tsx`.
- **Dependência nova:** só o `@fontsource/cinzel` 5.3.0 (RF-02), e só com a aprovação. Nenhuma biblioteca de UI.
- **Textos:** as chaves novas de i18n entram nos quatro idiomas juntas. `bun scripts/lint-i18n.ts` continua verde.

## Critérios de aceite

| # | Assert | Verificação |
|---|---|---|
| A1 | Tokens D no `@theme`, sem hex literal em `src/ui/components` | `rg -n "#[0-9a-fA-F]{3,8}" src/ui/components` vazio; `bun run build` |
| A2 | Primitivos D com todos os estados (normal, foco, hover, desabilitado, selecionado) e foco visível | `bun test tests/ui` verde, com os testes novos de `MenuList` e `Ornament` |
| A3 | As 16 telas no Estilo D, sem overflow nem rolagem em 1920×1080, 1280×720 e 844×390 | capturas pelo `bun run e2e` (sem som) comparadas aos SVGs de `docs/wireframes/d4/` |
| A4 | Texto mínimo de 22 px (18 px no celular) e contraste AA | script de checagem no E2E (`getComputedStyle` de todo nó de texto visível) |
| A5 | Fluxo completo sem regressão | `bun run e2e` e `bun run e2e -- --demo` zero erros; `bun test` verde |
| A6 | Desempenho | `bun scripts/perf.ts` mantém 60 FPS com 300 inimigos e o HUD D |

## Plano de testes

Os testes de componente existentes (`tests/ui/*.test.tsx`) são atualizados só onde a estrutura muda, mantendo a mesma intenção. Os componentes novos ganham teste. Os E2E existentes cobrem os fluxos. As capturas nas três resoluções servem de evidência de cada tarefa.

## Fora de escopo

- Arte nova (PixelLab), som novo, mudanças de gameplay, números de balanceamento e telas novas.
- Reformatar o código para TAB 4 ou trocar o Biome.

## Riscos

- **Cinzel em ZH-CN:** a fonte não tem glifos de chinês, e o fallback muda o peso visual dos títulos.
- **Blur e sombras no Android:** podem custar FPS (RF-08 e A6).
- **Diff grande nas telas:** a migração vai em micro-commits por tela, cada um com teste e captura.
