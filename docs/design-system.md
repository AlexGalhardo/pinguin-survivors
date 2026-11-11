# Design system da UI — Penguin Survivors

Versão 2.1 (Diablo IV orgânico, "Estilo D", regra plano) · 2026-11-10. A v2.1 emenda a v2.0 (2026-11-09) só em elevação, bordas e cards (ver §5 e ADR-027); a v2.0 substituiu a v1.0 de 2026-11-08. Vale para toda a UI React: menus, HUD, loja, pausa e telas de run.

O código segue este documento, e o documento reflete o código:

- cores: `src/config/palette.ts`, que gera `src/ui/palette.css` via `scripts/export-palette-css.ts`;
- componentes: `src/ui/components/`;
- estilos globais e tokens: `src/ui/theme.css`.

Decisão de origem: [ADR-022](adrs/ADR-022-ui-diablo-4-organica.md), que complementa o [ADR-018](adrs/ADR-018-linguagem-visual-diablo-4-e-menus-neutros.md). Especificação de UI: [SDD-004](sdds/SDD-004-ui-react-tailwind.md). Wireframes e especificação por tela: [wireframes/README.md](wireframes/README.md). Pranchas do design system em SVG: [`wireframes/d4/`](wireframes/d4/).

## Índice

0. [O que mudou em relação à v1](#0-o-que-mudou-em-relação-à-v1)
1. [Princípios](#1-princípios)
2. [Grade e espaçamento](#2-grade-e-espaçamento)
3. [Cor](#3-cor)
4. [Tipografia](#4-tipografia)
5. [Elevação e efeitos: regra plano](#5-elevação-e-efeitos-regra-plano-v21)
6. [Bordas e ornamentos](#6-bordas-e-ornamentos)
7. [Componentes](#7-componentes)
8. [Estados](#8-estados)
9. [Foco, gamepad e toque](#9-foco-gamepad-e-toque)
10. [Ícones e pixel art](#10-ícones-e-pixel-art)
11. [Layout, paginação e resoluções](#11-layout-paginação-e-resoluções)
12. [Movimento](#12-movimento)
13. [Tokens no Tailwind v4](#13-tokens-no-tailwind-v4)
14. [Como estender](#14-como-estender)
15. [Pranchas (SVG)](#15-pranchas-svg)

## 0. O que mudou em relação à v1

| Tema | v1 (2026-11-08) | v2 (Estilo D) |
|---|---|---|
| Agrupamento | Tudo dentro de `Panel` com borda, cantos e anel duplo | O conteúdo flutua sobre o fundo e se agrupa por luz (brilho central), vinheta e espaço. Superfície só em cartas, tooltips, encaixes e diálogos |
| Botões | `Btn` retangular com borda (`primary`, `secondary`, `danger`) | Itens de lista em texto caixa alta (`DMenuItem`). O CTA principal é uma faixa dourada com losangos (`DCta`). Nada de retângulo com borda em toda ação |
| Foco | `outline-2` em `crit` | Losango de 14 px em `crit` com brilho, faixa `gold-bright` a 12 % e texto em `crit`. Sem contorno |
| Tipografia | Só Roboto, tamanhos em `em` a partir de `clamp(0.8rem, 1.7vh, 1.125rem)`, dica a 0,8em | Títulos em Cinzel 700 (depende de aprovação, ver §4), texto em Roboto. Escala em px na base 1080 com piso para celular. **Secundário ≥ 22 px, lista ≥ 30 px.** `Hint` dim pequeno foi abolido |
| Padding | `p-4` em painel, sem limite de área vazia | 12–16 px (máximo 20) e caixa ajustada ao conteúdo. O respiro fica fora das caixas |
| Profundidade | Sombra `0 4px 24px` no painel | Vinheta de tela, brilho central, sombra interna nas superfícies e 3 níveis de elevação (§5) |
| Ornamento | Quatro cantos dourados em todo painel, filete de 1 px | Filete que afina (§6), losangos por contexto, cantos em L só em diálogos, moldura recortada (chanfro de 12 px) |
| Tooltip | `ItemCard` com borda de 2 px e cabeçalho em gradiente a 38 % | `DTooltip` com cabeçalho na cor da raridade a 20 %, borda de 1 px "desgastada" (tracejado 22-2-5-2) e elevação 2 |
| Desabilitado | `opacity-40` | Texto em `text-dim` (contraste 7,62) e borda tracejada `snow` 6-4 quando há borda. Sem opacidade global, para manter o AA |
| Rolagem | Painéis podiam rolar por dentro (`data-panel-scroll`) | **Nada rola**, nem dentro de painel: toda lista longa pagina |

Continuam valendo da v1:

- a paleta e os nomes de token de `src/config/palette.ts` (nenhuma cor nova);
- `rarityColor` e `rarityCss` como fonte única da raridade, sempre com numeral;
- as cores por arma (`w-*`) só no mundo e no HUD de combate;
- os menus neutros (só o menu inicial tem arte);
- as três entradas iguais (teclado, gamepad e toque) e alvos ≥ 44 px;
- `tabular-nums` em números alinhados;
- `AtlasIcon` com escala inteira;
- `qa-menus` como verificação.

## 1. Princípios

- **Orgânico, não web.** Não usar grade de cards, caixa com borda em cada elemento nem botão-retângulo de site. O que agrupa é a luz (brilho atrás do grupo), a vinheta e o espaço entre grupos.
- **Legível para qualquer pessoa.** O texto secundário tem pelo menos 22 px em 1920×1080 (18 px em 844×390), os itens de lista pelo menos 30 px, e todo texto tem contraste AA. `text-dim` aparece só em estado desabilitado ou bloqueado, e sempre com 22 px ou mais.
- **Denso por dentro, arejado por fora.** O padding interno fica entre 12 e 16 px (no máximo 20) e as caixas se ajustam ao conteúdo. O vazio fica no fundo, nunca dentro do painel.
- **Hierarquia por tamanho, cor e peso**, nesta ordem:
  1. título Cinzel;
  2. item focado;
  3. itens de lista;
  4. valores;
  5. secundário;
  6. dicas de tecla.
- **Didático.** Cada opção diz o que faz numa área única de dica, e cada compra diz o que muda (antes → depois).
- **Telas não rolam: paginam.** Ver §11.
- **Três entradas iguais**, foco sempre visível e alvo ≥ 44 px. Ver §9.
- **Uma fonte de verdade por conceito.** A cor vem de `palette.ts`, a raridade de `rarityColor`, o texto de `src/i18n/` (4 idiomas juntos) e os números de `src/data/`.

## 2. Grade e espaçamento

Unidade de **4 px**. Todo tamanho, posição e espaçamento é múltiplo de 4. Só os filetes (1–2 px) e as bordas (1–3 px) fogem da regra. Prancha: [`ds-01-grade.svg`](wireframes/d4/ds-01-grade.svg).

| Token | px | Uso |
|---|---|---|
| `space-1` | 4 | Entre título e subtítulo dentro de um cabeçalho |
| `space-2` | 8 | Entre ícone e texto, entre linhas de tooltip |
| `space-3` | 12 | **Padding interno padrão**; gap entre grupos pequenos |
| `space-4` | 16 | Padding interno máximo usual; gap entre seções de uma coluna |
| `space-5` | 20 | Padding máximo permitido; gap entre tooltips lado a lado |
| `space-6` | 24 | Gap entre blocos (título e conteúdo) |
| `space-8` | 32 | Gap entre colunas próximas |
| `space-10` | 40 | Gap entre zonas da tela |
| `space-12` | 48 | Margem interna de pranchas e diálogos grandes |
| `space-14` | 56 | Margem lateral de tela em 1920×1080 |

Regras:

- Dentro de listas o gap é 0: a altura do item (54/64) dá o ritmo.
- Separador entre grupos de lista: 12 px de espaço, sem linha.

### 2.1 Áreas seguras e colunas

| Resolução | Margem lateral | Topo / base | Colunas | Área de conteúdo |
|---|---|---|---|---|
| 1920×1080 (base) | 56 | 36 / 36 | 12 × 112, gutter 32 | 1808 × 1008 |
| 1280×720 | 37 (56 × 0,667) | 24 / 24 | as mesmas 12 colunas escaladas | 1206 × 672 |
| 2560×1080 (ultrawide) | conteúdo centrado em 1920 | 36 / 36 | iguais à base | o fundo e a vinheta ocupam a largura toda |
| 844×390 (celular, DPR 3) | 44 (notch e barra de gestos) | 8 / 8 | 6 × 112, gutter 16 | 756 × 374 |

Toda tela de menu se divide em **3 zonas** de 4 colunas cada:

- esquerda: lista ou atributos (≈ 560–620 px);
- centro: herói, objeto ou brilho;
- direita: detalhe ou tooltip.

No celular há uma zona por vez, mais uma zona de detalhe estreita (§11).

## 3. Cor

Pranchas: [`ds-02-cores.svg`](wireframes/d4/ds-02-cores.svg) e [`ds-02b-raridades-gradientes.svg`](wireframes/d4/ds-02b-raridades-gradientes.svg). Nenhuma cor nova em relação à v1: tudo sai de `src/config/palette.ts`.

### 3.1 Papéis e contraste

O contraste foi medido contra `night` (`#0b0e14`) e contra `panel-top` (`#161c29`):

- AA para texto normal exige 4,5;
- AA para texto grande (≥ 24 px, ou ≥ 19 px bold) exige 3.

| Token (`--color-*`) | Hex | Papel | Contraste night / panel | Uso como texto |
|---|---|---|---|---|
| `night` | `#0b0e14` | Fundo de tela | — | — |
| `panel-bottom` | `#0a0d13` | Camada mais funda: trilho de barra, encaixe vazio | — | — |
| `panel-top` | `#161c29` | Superfície (carta, encaixe, tooltip de nó) | — | — |
| `snow-dark` | `#3a4152` | Trilho vazio, placeholder, ícone apagado | 1,9 | Proibido |
| `snow` | `#5a6378` | Borda tracejada de desabilitado ou vazio | 3,21 / 2,83 | Proibido |
| `text-light` | `#e8ecf2` | Texto primário **e** secundário | 16,29 / 14,37 | Qualquer tamanho |
| `text-dim` | `#9aa3b5` | Só desabilitado ou bloqueado | 7,62 / 6,72 | ≥ 22 px |
| `gold-aged` | `#a8843a` | Filetes, setas ‹ ›, faixa do CTA | 5,54 / 4,89 | ≥ 24 px |
| `gold-bright` | `#e0bb62` | Títulos, rótulos de seção, dicas de tecla, "obtido" | 10,54 / 9,30 | Qualquer tamanho |
| `crit` | `#ffd84a` | **Foco** e "ação disponível agora" | 13,96 / 12,31 | Qualquer tamanho |
| `fish` | `#ff9a3c` | Fish e preços | 9,14 / 8,07 | Qualquer tamanho |
| `xp` | `#4fd06a` | Ganho, afixo, valor que melhora | 9,72 / 8,57 | Qualquer tamanho |
| `blood` | `#c4161c` | Perda, perigo, ação destrutiva | 3,20 / 2,82 | **Só bold ≥ 24 px** sobre `night` |
| `ice` | `#6fa3c7` | Informação, pérolas, poção | 7,12 / 6,28 | Qualquer tamanho |

### 3.2 Raridade

A escala é a da v1, sem mudança: `rarityColor(n)` / `rarityCss(n)`, sempre acompanhada do numeral.

| Raridade | Token | Cor | Contraste night | Fundo do slot (sólido) | Cabeçalho de tooltip |
|---|---|---|---|---|---|
| I | `rarity1` | `#e8ecf2` | 16,29 | `#3a4152` | cor a 12 % |
| II | `rarity2` | `#4f9dff` | 6,99 | `#16263f` | cor a 20 % |
| III | `rarity3` | `#4fd06a` | 9,72 | `#163222` | cor a 20 % |
| IV | `rarity4` | `#b347ff` | 4,84 | `#2a1640` | cor a 20 % |
| V | `rarity5` | `#ff8a1f` | 8,19 | `#3a2210` | cor a 20 % |

- **Fundo de slot:** em código, é a cor da raridade a 20 % sobre `night` (`color-mix(in srgb, <raridade> 20%, var(--color-night))`). Os hex da tabela são o resultado aproximado.
- **Cartas de level-up** usam a escala de 4 níveis que já existe: `rarity-common` `#9aa3b5`, `rarity-rare`, `rarity-epic` e `rarity-legendary`.

### 3.3 Transparências permitidas

Só estas. Nenhuma outra opacidade arbitrária.

| Nome | Valor | Uso |
|---|---|---|
| `focus-band` | `gold-bright` a 12 % (`#e0bb621f`) | Fundo do item focado |
| `hover-band` | `gold-bright` a 6 % (`#e0bb620f`) | Hover de mouse |
| `cta-band` | `gold-aged` a 20 % (`#a8843a33`) | Faixa do CTA; 25 % (`#a8843a40`) quando focado |
| `glow` | `panel-top` a 60 % (`#161c2999`) | Brilho central atrás do grupo principal |
| `shade` | `night` a 87 % (`#0b0e14dd`) | Escurecer o fundo sob um diálogo, ou o lado da arte no menu inicial |
| `divider` | `gold-aged` a 40 % (`#a8843a66`) | Linha separadora dentro de tooltip ou seção |
| `rarity-head` | raridade a 20 % (`…33`) | Cabeçalho do tooltip de item |

### 3.4 Gradientes (stops exatos)

| Nome | Definição CSS |
|---|---|
| Vinheta de tela | `radial-gradient(ellipse at center, transparent 55%, rgb(0 0 0 / 0.7) 100%)`. Equivalente usado no wireframe: `box-shadow: inset 0 0 280px #000` (844×390: 120px) |
| Brilho central | `radial-gradient(ellipse at center, rgb(22 28 41 / 0.6) 0%, rgb(22 28 41 / 0) 70%)` |
| Brilho de destaque (desbloqueio) | `radial-gradient(circle, rgb(168 132 58 / 0.2) 0%, transparent 70%)` |
| Filete que afina | `linear-gradient(90deg, transparent 0%, #a8843a 25%, #e0bb62 50%, #a8843a 75%, transparent 100%)` |
| Superfície | `linear-gradient(180deg, #161c29 0%, #0a0d13 100%)` |
| Vinheta de morte (2.14) | `box-shadow: inset 0 0 320px rgb(196 22 28 / 0.4)` |

## 4. Tipografia

Prancha: [`ds-03-tipografia.svg`](wireframes/d4/ds-03-tipografia.svg).

**Famílias:**

- **Cinzel 700** só em títulos: `display`, `title`, `item-name` e o rótulo do `DCta`.
- **Roboto 500/700/900** no resto.
- Fallback ZH-CN: Noto Sans SC, que já é carregada por `ensureLangFont`. Para títulos ZH-CN, Noto Serif SC é desejável, mas fica fora do escopo enquanto não houver aprovação.

> **Dependência de aprovação.** A Cinzel (`@fontsource/cinzel`, versão exata) só entra com a aprovação do [ADR-022](adrs/ADR-022-ui-diablo-4-organica.md). Enquanto não for aprovada, `--font-title` continua Roboto, e todo texto que aqui é Cinzel vira **Roboto 900 com tracking 0,25em** (mesmo tamanho e cor). O resto do Estilo D vale igual.

### 4.1 Escala

Os tamanhos estão em px na base 1080 de altura. A coluna 844×390 é o **piso** (veja como escalar em §13).

| Token | Família e peso | 1920×1080 tamanho / line-height | Tracking | Caixa | 844×390 | Uso |
|---|---|---|---|---|---|---|
| `display` | Cinzel 700 | 88 / 96 | 0,10em | ALTA | 44 | Nome do herói no desbloqueio, logotipo; "VOCÊ MORREU" a 100 |
| `title` | Cinzel 700 | 48 / 56 | 0,25em | ALTA | 24–30 | Título de tela, gold-bright |
| `item-name` | Cinzel 700 | 30–32 / 38 | 0,03em | Capitalizada | 22 | Nome de item, nó, conquista ou herói no tooltip; cor da raridade |
| `cta` | Cinzel 700 | 32–38 / 40 | 0,20em | ALTA | 22 | Rótulo do `DCta` |
| `section` | Roboto 900 | 24–26 / 32 | 0,15em | ALTA | 18 | Rótulo de seção, gold-bright |
| `list-item` | Roboto 700 | 30 / 36 | 0,12em | ALTA | 24 | Item de menu ou lista; focado em 900, 32–36 |
| `body` | Roboto 500 | 24 / 32 | 0 | Frase | 18 | Descrições, linhas de atributo, linhas de tooltip |
| `secondary` | Roboto 500 | 22 / 30 | 0 | Frase | 18 | **Mínimo absoluto** de texto na UI (dica, legenda, data) |
| `key-hint` | Roboto 700 | 22 / 28 | 0,08em | ALTA | 18 | Rodapé "ENTER CONFIRMAR · ESC VOLTAR", gold-bright |
| `value` | Roboto 700–900 | 24–30 | 0 | — | 18–24 | Números (`tabular-nums`), na cor do papel |
| `value-hero` | Roboto 900 | 30 | 0 | — | 20 | Três números de destaque (HP, Armadura, Dano) |

Regras:

- Itálico não existe; a fala do lojista é Cinzel regular em aspas tipográficas.
- `text-dim` só em `secondary` ou maior e só em estado desabilitado.
- Número de dano no mundo continua em Phaser ([visual.md](visual.md)).

## 5. Elevação e efeitos: regra plano (v2.1)

Decisão: [ADR-027](adrs/ADR-027-ui-plana.md) (emenda o ADR-022) e [SDD-020](sdds/SDD-020-ui-plana.md). A tipografia, as cores, a Cinzel, os losangos de foco e o filete de título do Estilo D continuam; muda só como as superfícies são desenhadas.

**A regra:**

- **Sem sombras e sem elevação.** Nada de `box-shadow`, `drop-shadow`, brilho (`glow`), `shadow-inset`, `shadow-1`, `shadow-2` ou `shadow-focus`. Os tokens `--shadow-*` foram removidos do `@theme`.
- **Sem moldura de card.** Sem chanfro (`.d-chamfer`), sem borda tracejada "desgastada" (`.d-worn`), sem cantos em L, sem gradiente de painel (`.ornate`) e sem borda grossa: toda superfície é um retângulo liso de cor sólida.
- **Grupo = borda fina.** Cada grupo de botões ou de conteúdo (painel, coluna, lista de opções, carta, toast) é delimitado por **uma** borda de 1 px no token único `border-line` (`--color-line`, derivado de `gold-aged`, sem hex novo). Os itens de dentro não têm borda de grupo; o espaçamento (gap de 8 px, padding de 12 px) separa os itens. Não há grupo dentro de grupo com a mesma borda.
- **Um estilo de botão por função, em todas as telas** (`Btn`):

  | Função | Variante | Aparência |
  |---|---|---|
  | Primário (a ação principal da tela, no máximo uma) | `primary` | Borda 1 px `gold-bright`, fundo `gold-aged` a 20 %, texto `gold-bright` |
  | Secundário (voltar, trocar, opção) | `secondary` | Borda 1 px `line`, fundo transparente, texto `text-light` |
  | Perigo (apagar, vender) | `danger` | Borda 1 px `blood`, fundo transparente, texto `blood` |
  | Desabilitado | qualquer | Borda tracejada `snow` 1 px, texto `text-dim` (sem opacidade) |

- **Foco sem sombra:** a borda do item vira `crit` (1 px, sem engrossar para não mexer no layout), o fundo ganha `gold-bright` a 12 %, o losango de 14 px `crit` fica à esquerda (sem brilho) e o texto vira `crit`. Mouse, teclado, gamepad e toque iguais.
- **Texto:** sem `text-shadow` nos menus. Exceção única: texto sobre o mundo do jogo ou sobre a arte do menu inicial (HUD e título), onde o contraste AA depende do contorno.
- **Camadas:** vinheta de tela e brilho central continuam (fundo, não elevação); 1 por tela.
- **Legibilidade inalterada:** texto secundário ≥ 22 px, itens de lista ≥ 30 px, alvo ≥ 44 px, contraste AA.

Prancha histórica (v2.0, com sombras): [`ds-04-05-elevacao-ornamentos.svg`](wireframes/d4/ds-04-05-elevacao-ornamentos.svg); vale só a vinheta.

| Token | Valor | Quando usar |
|---|---|---|
| `border-line` (`--color-line`) | 1 px, `gold-aged` a 55 % sobre `night` | Borda de todo grupo |
| `vignette` | §3.4 | Uma por tela, sempre a última camada não interativa (`pointer-events: none`) |

## 6. Bordas e ornamentos

| Elemento | Medidas |
|---|---|
| Filete de título (`Ornament`) | 620 × 16: pontas de 130 px com 1 px de `gold-aged` a 20 %, miolo de 170 px com 2 px de `gold-aged`, losango central de 10 px `gold-bright` a 45°. Versão curta: 520 (pontas 110, miolo 140). Em 844×390: 320 (pontas 60, miolo 90, losango 8) |
| Losango | 16 px no foco da lista principal (menu inicial), 14 px no foco padrão, 12 px no CTA e marcadores, 10 px no filete e no celular, 8 px nos passos do slider de volume |
| Separador | 1 px `gold-aged` a 20–40 %. Dentro de tooltip, 1 px `divider` |
| Borda de tooltip | 1 px na cor da raridade (ou `gold-aged` no nó da árvore), tracejado "desgastado" 22-2-5-2 |
| Borda de desabilitado ou vazio | 1–2 px `snow`, tracejado 6-4 |
| Moldura recortada | `clip-path` com chanfro de 12 px a 45° nos 4 cantos de tooltips e diálogos. Painéis não têm `border-radius` |
| Cantos ornamentados | L de 18 × 18 px, 2 px, `gold-aged`, só em diálogos de confirmação |
| Círculos | Só em encaixe de gambit (88), joystick, botões de toque do HUD, selo de conquista e brilhos |

## 7. Componentes

Pranchas: [`ds-06a-lista-botoes.svg`](wireframes/d4/ds-06a-lista-botoes.svg), [`ds-06b-linhas-slots-tooltip.svg`](wireframes/d4/ds-06b-linhas-slots-tooltip.svg) e [`ds-06c-painel-dialogo-toast.svg`](wireframes/d4/ds-06c-painel-dialogo-toast.svg).

Os nomes `D*` são os componentes React sugeridos. Os da v1 (`Panel`, `Btn`, `ItemCard`…) continuam até cada tela migrar. A coluna "Substitui" indica qual peça atual o componente aposenta.

| Componente | Substitui | Anatomia e medidas (1920×1080) | 844×390 |
|---|---|---|---|
| `DMenuItem` | `Btn` secondary em listas | Linha de largura cheia. Altura 54 (normal) e 64 (focado). Padding-x 14 quando há losango, 42–46 sem (para alinhar o texto ao do focado). `list-item` 30 | Altura 46–48, texto 24 |
| `DCta` | `Btn` primary | Faixa `cta-band` com losango de 12 px em cada lado e rótulo `cta`. Altura 64–76, padding-x 16–20. Um por tela | Altura 48, texto 22 |
| `DTab` | Abas com `Btn` | Texto 26 Roboto 700, tracking 0,15em, altura 52. Ativa: texto `crit` 900 com sublinhado 70 × 2 px e brilho | Texto 18, altura 44 |
| `DPager` | `◀ ▶` com `Btn` | ‹ › em Cinzel 32 `gold-bright`, cada um num alvo de 48 × 48, mais "PÁGINA 1 / 23" em 24 px. Na primeira e na última página a seta some | Alvo 44, texto 18 |
| `DStatRow` | `StatRow` | Altura 36–40. Rótulo `body` `text-light` à esquerda, valor `value` bold à direita, delta "→ 7%" em `xp`/`blood`. Sem pontilhado | Texto 18 |
| `StatLine` (`ItemViews.tsx`) | Linhas de atributo soltas | Ícone `icon.<stat>` do atlas (32 px, escala inteira; `statIconFrames` resolve resistências e dano por classe), rótulo capitalizado que trunca em vez de quebrar e valor `value` à direita. `strong` para os números de destaque, `accent` para bônus ou penalidade, `icon={false}` onde a linha precisa ter a altura do texto. Usado na faixa da loja, na pausa e na escolha do pinguim (SDD-021) | Sem ícone |
| `RunStat` (`GameOver.tsx`) | Frases com "·" no fim de run | Valor `cta` 900 `tabular-nums` na cor do papel sobre um rótulo `secondary` em caixa alta. Um número por bloco, sem substantivo no plural | Valor `item` |
| `DAdjustRow` | `AdjustRow` | Altura 64 (68 focado). Rótulo `list-item` mais `‹ valor ›` com valor de 28 numa coluna de 220–360. O slider usa 10 losangos de 8 px; o atual tem 12 px e é `crit` | Altura 48, texto 18–24 |
| `DSlot` | `SlotIcon` | Quadrado de 88 (pausa), 64 (loja e painel), 52 (lista de ofertas) ou 36 (celular). Borda de 2 px na raridade, fundo da raridade a 20 %, numeral 24 bold. Vazio: tracejado `snow` com o nome do slot em 22 | 36, numeral 18 |
| `DTooltip` | `ItemCard`, `WeaponCardView`, `GearCardView` | Largura 460–580 (celular 336), borda de 1 px na cor da raridade, sem chanfro e sem sombra. Cabeçalho com padding 14 × 12 e fundo `rarity-head`: nome `item-name` e linha de tipo "ARMA · II · …" em 22 bold. Corpo com padding 14 × 12 e gap 6: base com ◆, separador, afixos com ✦ em `xp`, frase de ação em `crit` bold 24 e dica de tecla em `key-hint` | Largura 336, texto 18 |
| `DSection` | `Panel` (sem caixa) | Rótulo `section` mais separador de 1 px a 40 %. Conteúdo direto sobre o fundo. Quando precisa de superfície, usa `night` liso + borda `line` de 1 px + padding 12–16 | — |
| `DConfirm` | Modal de confirmação | Largura 620, padding 16, borda de 1 px `line`, sem cantos em L e sem sombra. Abre sobre `shade`. Pergunta em 26 bold e duas ações `DMenuItem` (a destrutiva em `blood`). Foco inicial na opção segura | Largura 600, texto 18 |
| `DToast` | `ToastHost` | Altura 56, padding-x 16, fundo `night`, borda `line` de 1 px, losango de 10 na cor do papel e texto 24 bold. No topo central, dura 3 s e nunca recebe foco | Altura 44, texto 18 |
| `DBar` | `Bar` | Altura 4–6 nos menus e 14–28 no HUD. Trilho `panel-bottom`, preenchimento liso na cor do papel. O rótulo fica fora da barra quando a altura é menor que 14 | — |
| `DCurrency` | Contadores soltos | Ícone pixel art de 24/32 mais número 28 900 `tabular-nums` na cor da moeda. Preço insuficiente em `blood` bold | Texto 18–20 |
| `DKeyHint` | `Hint` de teclas | `key-hint` em `gold-bright`, separados por 6 espaços. No gamepad vira ícone A/B de 32 px. No toque cada dica é um alvo tocável ≥ 44 px | Texto 18 |
| `Ornament` | `Filet`, `Divider`, losangos do `Heading` | SVG inline com as medidas de §6 | 320 |
| `DScreen` | `MenuScreen` | Fundo `night` mais brilho, vinheta, título `title` + `Ornament` + frase `secondary` no topo (y 36), zonas de conteúdo e rodapé `DKeyHint` (y ≈ 1010) | Topo em y 8 e rodapé em y 334 |

## 8. Estados

Prancha dos estados de lista e CTA: [`ds-06a-lista-botoes.svg`](wireframes/d4/ds-06a-lista-botoes.svg).

| Estado | `DMenuItem` / `DAdjustRow` | `DCta` | `DSlot` | Regra geral |
|---|---|---|---|---|
| Normal | Texto `text-light` 700, sem fundo | `cta-band`, texto e losangos `gold-bright` | Borda de raridade de 2 px | — |
| Hover (mouse) | `hover-band` e texto `gold-bright` | `cta-band` 25 % | Borda de 3 px | O mouse também move o foco |
| Foco | Losango de 14 `crit` sem brilho, `focus-band`, borda `crit` de 1 px, texto `crit` 900 e altura 64 | Losangos, borda e texto `crit`, `cta-band` 25 % | Borda de 3 px `crit`, sem brilho | Sempre visível em teclado, gamepad e toque (`data-focused`) |
| Pressionado | `cta-band` e losango `gold-bright` | Fundo `gold-aged` a 33 % | Escala 0,96 por 80 ms | Som `sfx.uiConfirm` |
| Selecionado | Losango de 10 `gold-bright` fixo e texto `gold-bright` | — | Selo ✓ `gold-bright` | Valor atual de uma lista de escolha |
| Desabilitado | Texto `text-dim` ≥ 22 (sem opacidade), `aria-disabled`, fora do ciclo de foco | Borda tracejada `snow` 6-4, texto `text-dim` | Fundo `panel-bottom`, borda tracejada | Contraste AA mantido (7,62) |
| Vazio | — | — | Tracejado `snow` com o nome do slot em 22 | Lista vazia mostra frase em `body` mais sprite apagado de 96 |
| Erro / perigo | Texto `blood` bold ≥ 24 com "✕" | — | — | Mensagem curta junto do elemento, nunca só cor |
| Bloqueado | Texto `text-dim` mais requisito em `text-light` 22 ("Vença o chefe do round 10") | — | Silhueta | O requisito não usa `blood` (contraste 3,2) |

## 9. Foco, gamepad e toque

- **Ordem de foco:** zona esquerda (de cima para baixo), depois centro, depois direita, depois CTA. Cada tela lista a sua em [wireframes/README.md](wireframes/README.md).
- **Navegação:**
  - ↑↓ movem dentro da coluna e ←→ trocam de zona ou mudam o valor de `DAdjustRow`;
  - L1/R1 (Q/E no teclado) trocam aba ou categoria, e L2/R2 trocam a página;
  - Enter/A confirma e Esc/B volta;
  - na loja, Esc não fecha: só `PRÓXIMO ROUND` sai.
- **Foco inicial:** a ação mais provável (CONTINUAR, JOGAR DE NOVO). Em diálogos destrutivos, a opção segura.
- **Atraso de entrada:** telas que abrem durante o combate (cartas, fim de run, fim de demo, desbloqueio) ignoram entrada por 500 ms.
- **Toque:**
  - cada `DMenuItem` é tocável na linha inteira (≥ 44 px de altura);
  - ‹ › têm alvo de 48;
  - dicas de tecla viram itens tocáveis;
  - toque simples foca e dá preview, e o segundo toque ativa; na árvore, arrastar nunca aloca;
  - áreas seguras: 44 px laterais no celular.
- **Dicas de tecla:** mudam conforme a última entrada usada (teclado, gamepad ou toque).

## 10. Ícones e pixel art

Prancha: [`ds-07-09-icones-layout-react.svg`](wireframes/d4/ds-07-09-icones-layout-react.svg).

- Só **múltiplos inteiros** do pixel original, com `image-rendering: pixelated` e posição em pixel inteiro (sem `translate` fracionário).

| Asset | Tamanho de origem | Tamanhos permitidos |
|---|---|---|
| Ícone de item ou moeda | 16 | 32, 48, 64 (dentro do `DSlot`, centrado a 2× ou 3×) |
| Herói (`HeroSprite`) | 80 | 160, 240, 320 |
| Lojista (`MerchantSprite`) | 96 | 192, 288 |

- Herói bloqueado: silhueta (`brightness(0)`) dentro de um brilho apagado; o cadeado é um glifo SVG de 24 px.
- Glifos de ornamento permitidos: `◆ ✦ ‹ › ⟳ ✕ ♛`. As setas ◀ ▶ da v1 viram ‹ › em Cinzel.

## 11. Layout, paginação e resoluções

- **Hierarquia vertical fixa:**
  1. título com filete e frase de contexto (y 36–180);
  2. as três zonas de conteúdo (y 200–940);
  3. rodapé `DKeyHint` em y ≈ 1010.
- **Alinhamento:** todo texto de lista começa no mesmo x do texto focado (28 px depois do losango). Valores alinham à direita da coluna.
- **Paginar, nunca rolar:**
  - listas usam 8 a 12 itens por página com `DPager` (conquistas 8, histórico 10, atributos 11, configurações 6 por categoria);
  - abas ou categorias com L1/R1;
  - tooltips sobrepõem a tela (elevação 2) em vez de crescer a coluna;
  - nenhum `overflow: auto`. O `qa-menus` falha se houver scroll ou corte.
- **1280×720:** a mesma composição escalada por 0,667. Os tokens de texto têm piso (§13), então o secundário nunca fica abaixo de 18 px reais. Se uma lista não couber, reduz-se o número de itens por página, nunca o tamanho da fonte abaixo do piso.
- **844×390 (`useCompact`):**
  - uma zona principal (lista) à esquerda e o detalhe estreito à direita (≈ 336);
  - listas de 5 itens com paginador;
  - sem herói grande nem lojista;
  - títulos de 24–30 e secundário de 18;
  - CTA no canto inferior direito, fora das áreas de gesto.
- **2560×1080 ou maior:** o conteúdo fica centrado em 1920 de largura; só o fundo, o brilho e a vinheta se estendem.
- **HUD:** some por completo quando qualquer menu cobre o jogo (`useOverlayOpen`), como na v1.

## 12. Movimento

| Elemento | Duração | Curva |
|---|---|---|
| Foco (faixa e losango) | 120 ms | `ease-out` |
| Hover | 150 ms | padrão |
| Entrada de tooltip | 120 ms (opacidade + 4 px) | `ease-out` |
| Entrada de tela overlay (cartas, fim de run, desbloqueio) | 300 ms de fade + brilho de 400 ms no objeto principal | `ease-out` |
| Sequência do fim de run | título 0 ms → números 600 ms → recompensas 1200 ms → ações 2000 ms; Enter pula | — |
| Idle de personagem | 4 fps (lojista), 6 fps (heróis) | quadros |

`Flashes reduzidos` (Configurações) remove o brilho de entrada e as pulsações. `prefers-reduced-motion` tem o mesmo efeito.

## 13. Tokens no Tailwind v4

A paleta continua gerada em `src/ui/palette.css` (`@theme` com `--color-*`, nomes da v1: `--color-night`, `--color-panel-top`, `--color-panel-bottom`, `--color-snow-dark`, `--color-snow`, `--color-text-light`, `--color-text-dim`, `--color-gold-aged`, `--color-gold-bright`, `--color-crit`, `--color-fish`, `--color-xp`, `--color-blood`, `--color-ice`, `--color-rarity1` … `--color-rarity5`, `--color-rarity-common` … `--color-rarity-legendary`). Os tokens novos vão em `src/ui/theme.css`:

```css
@theme {
  --font-title: "Cinzel", "Noto Sans SC", serif; /* sem aprovação do ADR-022: "Roboto", "Noto Sans SC", sans-serif */
  --font-body: "Roboto", "Noto Sans SC", sans-serif;

  /* Escala por altura com piso de celular: max(piso, base × 100vh / 1080). */
  --text-display: max(44px, calc(88 / 1080 * 100vh));
  --text-title: max(24px, calc(48 / 1080 * 100vh));
  --text-item: max(22px, calc(32 / 1080 * 100vh));
  --text-cta: max(22px, calc(36 / 1080 * 100vh));
  --text-section: max(18px, calc(26 / 1080 * 100vh));
  --text-list: max(24px, calc(30 / 1080 * 100vh));
  --text-body: max(18px, calc(24 / 1080 * 100vh));
  --text-secondary: max(18px, calc(22 / 1080 * 100vh));
  --text-key: max(18px, calc(22 / 1080 * 100vh));

  --spacing: calc(4 / 1080 * 100vh); /* p-3 = 12 px e p-4 = 16 px na base 1080 */

  --color-line: color-mix(in srgb, var(--color-gold-aged) 55%, var(--color-night)); /* borda fina de grupo */

  --tracking-title: 0.25em;
  --tracking-list: 0.12em;
  --tracking-section: 0.15em;
}
```

Utilitários em `@layer components` (`theme.css`):

| Classe | Conteúdo |
|---|---|
| `.d-vignette` | Pseudo-elemento fixo `inset: 0`, `pointer-events: none`, gradiente de §3.4 |
| `.d-glow` | Elipse com o brilho central (§3.4), atrás da zona principal |
| `.d-filet` | Linha lisa de 1 px em `line` |
| `.d-focus` | `:focus-visible, [data-focused="true"]`: `::before` com losango de 14 px `crit` sem brilho, fundo `focus-band`, borda `crit`, texto `crit` (sem sombra) |

Na escala por altura, `--spacing` em `vh` mantém o padding proporcional. Medidas que precisam ser exatas no celular (alvos de 44 px) usam `max(44px, …)`.

## 14. Como estender

1. **Cor nova:** não há; um papel novo reaproveita os tokens de §3. Se for inevitável, adicione em `src/config/palette.ts`, rode `bun scripts/export-palette-css.ts` e documente o papel e o contraste em §3.1.
2. **Componente novo:** derive dos `D*` de §7, use só os tokens de §13 e documente a anatomia, as medidas e os estados (§7 e §8).
3. **Texto novo:** chave em `src/i18n/` nos 4 idiomas; `bun scripts/i18n-check.ts` e `bun run lint:i18n` precisam dar 0/0/0. Confira se o texto em ES e ZH cabe no tamanho mínimo (22 px).
4. **Tela nova:** desenhe com as regras de §11, acrescente a especificação em [wireframes/README.md](wireframes/README.md) e valide com `bun scripts/qa-menus.ts` (sem scroll, sem corte, texto ≥ 22 px).

## 15. Pranchas (SVG)

Exportadas do OpenPencil (`docs/wireframes/pinguin-survivors-wireframes.fig`, páginas "Estilo D — Diablo IV" e "Estilo D — Design System"). A exportação SVG não preserva transparências nem a quebra de linha de textos longos; a referência visual exata é o arquivo `.fig`.

| Prancha | Arquivo |
|---|---|
| Regras do dono | [d-regras.svg](wireframes/d4/d-regras.svg) |
| Capa | [ds-00-capa.svg](wireframes/d4/ds-00-capa.svg) |
| 1 Grade e espaçamento | [ds-01-grade.svg](wireframes/d4/ds-01-grade.svg) |
| 2 Cores | [ds-02-cores.svg](wireframes/d4/ds-02-cores.svg) |
| 2b Raridades, transparências e gradientes | [ds-02b-raridades-gradientes.svg](wireframes/d4/ds-02b-raridades-gradientes.svg) |
| 3 Tipografia | [ds-03-tipografia.svg](wireframes/d4/ds-03-tipografia.svg) |
| 4–5 Elevação e ornamentos | [ds-04-05-elevacao-ornamentos.svg](wireframes/d4/ds-04-05-elevacao-ornamentos.svg) |
| 6a Lista e botões | [ds-06a-lista-botoes.svg](wireframes/d4/ds-06a-lista-botoes.svg) |
| 6b Linhas, slots e tooltip | [ds-06b-linhas-slots-tooltip.svg](wireframes/d4/ds-06b-linhas-slots-tooltip.svg) |
| 6c Painel, diálogo, toast, barra, moeda e dica | [ds-06c-painel-dialogo-toast.svg](wireframes/d4/ds-06c-painel-dialogo-toast.svg) |
| 7–9 Ícones, layout e React | [ds-07-09-icones-layout-react.svg](wireframes/d4/ds-07-09-icones-layout-react.svg) |
