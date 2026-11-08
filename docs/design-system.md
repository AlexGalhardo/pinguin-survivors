# Design system da UI — Pinguin Survivors

Versão 1.0 · 2026-11-08. Vale para toda a UI React (menus, HUD, loja, pausa, telas de run). O código segue este documento e o documento reflete o código: cores em `src/config/palette.ts` (gera `src/ui/palette.css` pelo `scripts/export-palette-css.ts`), componentes em `src/ui/components/`, estilos globais em `src/ui/theme.css`. Direção: escuro, neutro nos menus, ornamentado com ouro envelhecido, inspirado na linguagem de Diablo IV (nunca copiada; referências em `references/ui/`, fora do repositório público). Regras de entrada: [ADR-018](adrs/ADR-018-linguagem-visual-diablo-4-e-menus-neutros.md), [SDD-004](sdds/SDD-004-ui-react-tailwind.md).

## Índice

1. [Princípios](#1-princípios)
2. [Cor](#2-cor)
3. [Tipografia](#3-tipografia)
4. [Espaçamento e grade](#4-espaçamento-e-grade)
5. [Molduras, bordas e cantos](#5-molduras-bordas-e-cantos)
6. [Sombras e brilhos](#6-sombras-e-brilhos)
7. [Iconografia](#7-iconografia)
8. [Componentes](#8-componentes)
9. [Estados](#9-estados)
10. [Responsividade](#10-responsividade)
11. [Movimento](#11-movimento)
12. [Como estender](#12-como-estender)

## 1. Princípios

- **Escuro e neutro.** Todo menu (exceto o inicial) usa fundo escuro liso. A cor serve para informar (raridade, ganho, perda, ação), não para decorar.
- **Hierarquia por tamanho, peso e cor**, nesta ordem: título da tela, título de seção, nome do item, valor, rótulo, dica.
- **Didático.** Cada opção diz o que faz (linha `Hint` dim sob o rótulo). Cada oferta diz o que a compra muda (antes → depois).
- **Telas de jogo não rolam; paginam.** Loja e pausa cabem inteiras de 1280×720 a 3840×2160: texto em `vh`, ícones por `useUiScale`, listas compactas e conteúdo extra (mochila) em páginas ◀ ▶ navegáveis por teclado e gamepad (`Panel fit` corta em vez de rolar, e o `qa-menus` falha se algum elemento tiver mais conteúdo que espaço). Nos outros menus, a página nunca rola e só painéis rolam por dentro (`data-panel-scroll`) com a barra escondida (`.no-scrollbar`: `scrollbar-width: none` e `::-webkit-scrollbar { display: none }`). A árvore de habilidades usa câmera própria.
- **Três entradas iguais:** teclado, gamepad (vira teclas sintéticas) e toque/mouse. Todo alvo tem ao menos 44 px (`min-h-11 min-w-11`), foco visível.
- **Uma fonte de verdade por conceito:** cor de raridade em `rarityColor`, texto em `src/i18n/` (4 idiomas juntos), números em `src/data/`.

## 2. Cor

A teoria: poucos neutros frios para fundo e superfície, **um** acento quente (ouro) para moldura e ação principal, cores semânticas para estado e uma escala de raridade que nunca se mistura com as outras. Contraste mínimo **AA** (4,5:1 para texto normal, 3:1 para texto grande e bordas de componentes) sobre `night`/`panel`.

### 2.1 Papéis

| Papel | Token (`--color-*` / `PALETTE.*`) | Valor | Uso |
|---|---|---|---|
| Fundo | `night` | `#0b0e14` | Fundo de menus e base de painéis |
| Superfície alta | `panel-top` | `#161c29` | Topo do gradiente de painel |
| Superfície baixa | `panel-bottom` | `#0a0d13` | Base do gradiente de painel |
| Borda neutra | `snow-dark` | `#3a4152` | Bordas e linhas internas |
| Borda forte | `snow` | `#5a6378` | Botões neutros, contornos |
| Texto principal | `text-light` | `#e8ecf2` | Texto, valores (contraste > 14:1 sobre `night`) |
| Texto secundário | `text-dim` | `#9aa3b5` | Rótulos, dicas (contraste ≈ 7:1) |
| Acento (moldura) | `gold-aged` | `#a8843a` | Cantos, filetes, losangos |
| Acento (brilho) | `gold-bright` | `#e0bb62` | Títulos de seção, losangos |
| Ação principal | `crit` | `#ffd84a` | Botão primário, foco, destaque |
| Moeda | `fish` | `#ff9a3c` | Fish, preço, comprar |
| Ganho / ok | `xp` | `#4fd06a` | Stats que sobem, afixos, XP |
| Perda / perigo | `blood` | `#c4161c` | Stats que caem, sair, perigo |
| Informação | `ice` | `#6fa3c7` | Links, ações secundárias de atenção |

### 2.2 Raridade (uma escala para armas e equipamentos)

`rarityColor(n)` em `src/config/palette.ts` é a única fonte. Nome, borda do ícone, cabeçalho do card, brilho do drop e borda do slot do HUD usam a mesma cor. Numeral romano ao lado, para quem não distingue cores.

| Raridade | Token | Cor | Afixos |
|---|---|---|---|
| I | `rarity1` | branco `#e8ecf2` | 0 |
| II | `rarity2` | azul `#4f9dff` | 1 |
| III | `rarity3` | verde `#4fd06a` | 2 |
| IV | `rarity4` | roxo `#b347ff` | 3 (só drop de Elite) |
| V | `rarity5` | laranja `#ff8a1f` | 4 (só drop de Boss) |

### 2.3 Cor por arma

17 tokens `w-*` (um por linha de arma) colorem número de dano, projétil e brilho de área. Não entram nos menus: servem ao mundo e ao HUD de combate. Distância RGB mínima entre eles: 40 (teste em `tests/weapon-colors.test.ts`).

### 2.4 Regras

- Nunca hexadecimal solto em componente: use token Tailwind (`text-xp`, `border-snow-dark`) ou `toCss(PALETTE.x)`/`rarityCss(n)` quando a cor vem de dado.
- Cor sozinha não carrega significado: ganho/perda leva sinal (`+`, `-`) ou seta, raridade leva numeral.
- Texto sobre cor de raridade usa o próprio nome do item (já contrasta com o fundo escuro).

## 3. Tipografia

- **Fonte única: Roboto** (pedido do desenvolvedor, sem fonte pixel). Fallback `Noto Sans SC` carregada sob demanda para zh-CN (`ensureLangFont`). Token `--font-body` e `--font-title`; `UI_FONT` para texto Phaser.
- Tamanho base do overlay: `clamp(0.8rem, 1.7vh, 1.125rem)` no container da tela; tudo o mais em `em`, então a UI escala com a altura.

| Papel | Classe | Tamanho | Peso | Extras |
|---|---|---|---|---|
| Título de tela (`Heading`) | `font-title` | 1,9em | 900 | caixa alta, `tracking-[0.18em]`, losangos laterais |
| Título de seção | `font-title` | 0,95–1,05em | 700 | caixa alta, `tracking-[0.14em]`, `text-gold-bright`, losango |
| Nome de item | `font-title` | 1,1em | 700 | caixa alta, `tracking-[0.06em]`, cor da raridade |
| Valor destacado | `font-title` | 1,6em | 900 | `tabular-nums` |
| Corpo | `font-body` | 1em | 500 | — |
| Rótulo | — | 1em | 500 | `text-text-dim` |
| Dica (`Hint`) | — | 0,8em | 500 | `text-text-dim`, `leading-snug` |
| Tipo/legenda | — | 0,8em | 500 | caixa alta, `tracking-wider` |

Números sempre `tabular-nums` quando alinhados em coluna. Sem texto em itálico exceto a fala do lojista.

## 4. Espaçamento e grade

Escala base de 4 px (Tailwind): `1 = 4`, `2 = 8`, `3 = 12`, `4 = 16`. Em tela, margens e vãos grandes usam `vw`/`vh` para acompanhar a resolução.

| Uso | Valor |
|---|---|
| Entre ícone e texto | `gap-2` |
| Entre linhas de lista | `gap-1` a `gap-2` |
| Padding de painel | `p-4` |
| Padding de card | `px-3`, `pt-2`/`pb-3` |
| Entre blocos de um painel | `gap-3` |
| Margem lateral de tela | `px-[2vw]`–`px-[3vw]` |
| Margem vertical de tela | `py-[1.5vh]`–`py-[2.5vh]` |

Largura máxima de conteúdo: 56 rem (listas, configurações), 90 rem (loja, pausa, ficha). Grades: 1 coluna abaixo de 1000–1100 px, 2 colunas a partir daí, 3 colunas só para listas longas (conquistas ≥ 1700 px).

## 5. Molduras, bordas e cantos

- **Painel (`Panel`)**: classe `.ornate` (gradiente `panel-top → panel-bottom` com brilho suave no topo) + borda `snow-dark` + anel interno duplo (`inset 3px night`, `inset 4px snow-dark`) + **quatro cantos dourados** (`gold-aged`, 18 px, 2 px) desenhados em CSS no `::before`.
- **Filete (`Filet`)**: linha de 1 px em gradiente transparente → `gold-aged` → transparente; fecha cabeçalhos.
- **Separador (`Divider`)**: duas linhas em gradiente com um losango central; divide base e afixos de um item, e seções longas.
- **Título de tela (`Heading`)**: linha — losango — título — losango — linha.
- **Card de item (`ItemCard`)**: borda de 2 px na cor da raridade, **cabeçalho com gradiente** da cor (38 % → transparente) contendo o nome e o tipo, corpo escuro abaixo.
- **Slot de ícone (`SlotIcon`)**: quadrado de 2 px com a cor da raridade e fundo da própria cor a 20 % sobre `night`.
- Cantos retos (sem `rounded`) nos painéis e cards; `rounded` só em botões de ícone circulares (pausa/velocidade no toque).
- HUD de combate: **sem molduras** (ícones de arma soltos, raridade como numeral colorido e brilho `drop-shadow`).

## 6. Sombras e brilhos

- Painel: `0 4px 24px shadow` para destacar do fundo.
- Título de tela: `text-shadow 0 2px 8px shadow`.
- Losango: `box-shadow` de `gold-aged` a 80 %.
- Ícone de arma no HUD: `filter: drop-shadow(0 0 5px <raridade>99)`.
- Numeral de raridade no HUD: `text-shadow` preto de 3 px para ler sobre o mundo.
- Brilhos de mundo (drops, crítico) vivem em Phaser, não aqui; ver [visual.md](visual.md).

## 7. Iconografia

- Ícones vêm do atlas (`AtlasIcon`, `background-position`, escala inteira, `image-rendering: pixelated`). Nunca escala fracionária em pixel art.
- Tamanhos: 24 px (moeda no HUD), 32–44 px (gear), 48 px (slots de arma), 56 px (ofertas da loja), 64 px (arma inicial na ficha). `HeroSprite` e `MerchantSprite` usam o frame cheio com escala 1–3.
- Herói bloqueado: silhueta (`brightness(0)`) com cadeado SVG inline.
- Glifos de texto permitidos como ornamento: `◀ ▶ ◆ ✦ ⟳` (sem tradução).

## 8. Componentes

| Componente | Arquivo | Função |
|---|---|---|
| `Panel` | `Panel.tsx` | Moldura ornamentada com título opcional e corpo que rola por dentro |
| `Heading`, `Filet`, `Divider` | `Panel.tsx` | Título de tela e separadores |
| `StatRow` | `Panel.tsx` | Rótulo, pontilhado e valor alinhado (`accent` para cor) |
| `ItemCard` | `Panel.tsx` | Card/tooltip de item: cabeçalho de raridade, tipo, linhas, rodapé |
| `Hint`, `Bar` | `Panel.tsx` | Dica dim e barra de progresso |
| `Btn` | `Btn.tsx` | Botão focável; `variant`: `primary` (ouro), `secondary` (neutro), `danger` (sangue) |
| Botão de item por raridade | `Btn` com `tint` (`rarityCss(n)`) | Comprar, Trava, Vender e Fundir levam a cor da raridade do item (I branco, II azul, III verde, IV roxo, V laranja): borda e texto na cor, fundo a 14 % (32 % no hover e foco, com brilho). Desabilitado: borda tracejada, sem fundo e texto da cor misturado ao `text-dim` (contraste AA mantido). Classe `.rarity-btn` em `theme.css` |
| `MenuScreen`, `BackBtn`, `AdjustRow` | `MenuScreen.tsx` | Quadro das telas de menu, voltar, linha ◀ valor ▶ com dica |
| `PlayerPanel` | `PlayerPanel.tsx` | Ficha do jogador: três números de destaque, stats, 6 armas, equipamento, card do item focado (só visualização) |
| `WeaponCardView`, `GearCardView`, `AffixLines`, `SlotIcon` | `ItemViews.tsx` | Tooltip de arma e de equipamento (base ◆, separador, afixos ✦), ícone de slot |
| `Shop`, `Pause` | `Shop.tsx`, `Pause.tsx` | Loja (lojista, ofertas, comparação com o equipado, jogador) e pausa (ficha grande + 3 botões) |
| `HeroSprite`, `MerchantSprite` | `HeroSprite.tsx`, `MerchantSprite.tsx` | Personagens animados em idle |
| Abas | `Btn` com `variant` alternando `primary`/`secondary` | Heróis/Oficina |

Tooltip de item (referência D4): nome em caixa alta na cor da raridade, tipo e numeral, linha de base com `◆`, separador com losango, afixos com `✦` em verde, valor de venda no rodapé (botão Vender na loja). Comparação: lado a lado, "Equipado" à esquerda e "À venda" à direita, mais as linhas `antes → depois` em verde/vermelho.

## 9. Estados

| Estado | Regra |
|---|---|
| Normal | Borda `snow`/`snow-dark`, fundo `night/80` |
| Hover (mouse) | Fundo `snow-dark/60`; o mouse também move o foco |
| Foco (teclado/gamepad) | `outline-2` em `crit`, offset 2 px; vale também para toque via `data-focused` |
| Ativo (clique/Enter) | Som `sfx.uiConfirm`; a ação roda no `onActivate` |
| Desabilitado | `opacity-40`, `cursor-not-allowed`, `aria-disabled` e `tabIndex -1`; some do ciclo de foco |
| Bloqueado (herói) | Silhueta e texto de requisito em `blood` |
| Selecionado | Borda `crit` e fundo `crit/10` (cards), variante `primary` (abas) |
| Ganho/perda | `xp` / `blood`, com sinal |

## 10. Responsividade

- Âncora: altura. `font-size: clamp(0.8rem, 1.7vh, 1.125rem)` no container; todo o resto em `em`. Larguras em `vw` com `max-w` em `rem`.
- Breakpoints usados: `min-[1000px]`/`min-[1100px]` (2 colunas), `min-[1280px]` (grade de ofertas 2 colunas), `min-[1500px]` (stats em 2 colunas), `min-[1700px]` (3 colunas de conquistas).
- Telas baixas (`max-height: 500px`, celular em paisagem): `useCompact()` e classes `[@media(max-height:500px)]:`; ícones menores, painéis simplificados, lojista oculto.
- Telas altas (`min-height: 860px`): escala 2 dos personagens; 1200 px: escala 3 do lojista (`useMedia`).
- Zero scroll de página de 1280×720 a 3840×2160, verificado por `bun scripts/qa-menus.ts <pasta>` (screenshots em 1280×720, 1920×1080, 2560×1080); loja e pausa também sem conteúdo cortado.
- HUD: some por completo enquanto qualquer menu ou overlay cobre o jogo (`useOverlayOpen`).

## 11. Movimento

| Elemento | Duração | Curva |
|---|---|---|
| Transição de cor de botão | 150 ms (`transition-colors`) | padrão |
| Idle de personagem | 4 fps (lojista), 6 fps (heróis) | quadros |
| Número de dano | 700 ms de vida, sobe 30 px/s | linear |
| Crítico | pop 180 ms, tremida 250 ms | quadrático |
| Rastro de esquiva | 400 ms | `Quad.easeOut` |

Sem animação decorativa nos menus além do idle dos personagens. `Reduced flashes` (Configurações) suaviza brilhos.

## 12. Como estender

1. Cor nova: adicione em `src/config/palette.ts`, rode `bun scripts/export-palette-css.ts` (gera `palette.css` do jogo e do site) e documente o papel na seção 2.
2. Componente novo: reaproveite `Panel`, `ItemCard`, `StatRow` e `Btn`; se for genérico, ponha em `src/ui/components/` e liste na seção 8.
3. Texto novo: chave em `src/i18n/` nos 4 idiomas; `bun scripts/i18n-check.ts` e `bun run lint:i18n` devem ficar 0/0/0.
4. Tela nova: valide com `bun scripts/qa-menus.ts` e confirme que não há scroll de página.
