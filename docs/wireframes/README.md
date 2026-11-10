# Wireframes da UI — Pinguin Survivors

Versão 1.0 · 2026-11-09. Índice dos wireframes das 16 telas e especificação de implementação do estilo escolhido (**Estilo D — Diablo IV orgânico**). Tokens, componentes `D*` e estados ficam no [design system v2](../design-system.md), e a decisão no [ADR-022](../adrs/ADR-022-ui-diablo-4-organica.md). Este arquivo diz **o que cada tela tem e onde**, sem repetir os valores do design system.

## Índice

1. [Arquivo e estilos](#1-arquivo-e-estilos)
2. [Convenções desta especificação](#2-convenções-desta-especificação)
3. [Telas do Estilo D](#3-telas-do-estilo-d)
4. [Checklist de feedback de UX](#4-checklist-de-feedback-de-ux)

## 1. Arquivo e estilos

Fonte: [`pinguin-survivors-wireframes.fig`](pinguin-survivors-wireframes.fig), aberto no OpenPencil. Os SVGs de [`d4/`](d4/) são exportações do D. O SVG não preserva transparências, brilhos nem a quebra de linha de textos longos; a referência visual exata é o `.fig`.

| Página do `.fig` | Estilo | Linguagem | Status |
|---|---|---|---|
| Estilo A | Colunas e listas de botões (próximo da UI atual) | Painéis com moldura, botões retangulares | Descartado |
| Estilo B | Herói ao centro, três colunas, D4 "clássico" | Painéis, chips, grade 2D | Descartado |
| Estilo C | Abas, assistentes e overlays | Uma tarefa por tela, L1/R1 | Descartado |
| **Estilo D — Diablo IV** | Orgânico: texto sobre o fundo, vinheta, filetes, foco por losango | Sem caixas web, texto ≥ 22 px, padding 12–16 | **Escolhido** |
| Estilo D — Design System | Pranchas de tokens e componentes | — | Referência do [design system](../design-system.md) |
| Comparação e feedback | Tabela A/B/C/D e 12 pontos de UX | — | [Seção 4](#4-checklist-de-feedback-de-ux) |

## 2. Convenções desta especificação

- **Medidas em px na base 1920×1080.** A área útil vai de x 56 a 1864 e de y 36 a 1044; as zonas são as de [design-system §2.1](../design-system.md#21-áreas-seguras-e-colunas).
- **Estrutura comum de toda tela (`DScreen`):**
  - camadas de baixo para cima: fundo `night`, brilho central `.d-glow`, conteúdo, `.d-vignette`;
  - cabeçalho com título `title`, `Ornament` e frase `secondary`, de y 36 a ~180;
  - rodapé `DKeyHint` em y ≈ 1010.
- **1280×720:** sempre a mesma composição escalada por 0,667, com o piso de fonte do [§13 do design system](../design-system.md#13-tokens-no-tailwind-v4). Cada tela só anota exceções.
- **844×390 (`useCompact`):** margem lateral de 44, uma zona de lista com 5 itens e paginador, detalhe estreito de ≈ 336 à direita e CTA no canto inferior direito.
- **"Atual"** é a tela de hoje em `src/ui/components/`: listas de `Btn` dentro de `Panel` com moldura, tamanhos em `em` e `Hint` a 0,8em.

## 3. Telas do Estilo D

### 2.1 Menu inicial

Wireframe: [2.1-menu-inicial.svg](d4/2.1-menu-inicial.svg) · [844×390](d4/2.1-menu-inicial-844x390.svg)

- **Componente:** `MainMenu.tsx` (+ `MenuBackground.tsx`). Única tela com arte.
- **Regiões:**
  - arte em tela cheia, com sombreado `shade` de x 0 a 940 e brilho lateral;
  - logotipo `display` 80 em x 110, y 70, com `Ornament` 620 e a tagline `body` 24;
  - lista de `DMenuItem` em x 110, y 300, w 720, em grupos separados por 12 px: jogo (CONTINUAR/JOGAR, NOVO JOGO, CARREGAR), progressão (HERÓIS E POÇÕES, ÁRVORE, CONQUISTAS, HISTÓRICO) e sistema (CONFIGURAÇÕES, SAIR);
  - carteira `DCurrency` 24 em x 1220, y 1012, e a versão em 22 no canto superior direito.
- **Componentes:** `DMenuItem` (focado 36 px), `DCurrency`, `Ornament`.
- **Tokens:** `title` / `display` em Cinzel, `list-item`, `gold-bright`, `crit`, `focus-band`, `shade`.
- **Foco:** primeiro item visível (CONTINUAR ou NOVO JOGO) e ↑↓ em ciclo. Sem Esc. Itens condicionais somem, e a lista se reorganiza sem deixar buracos.
- **844×390:**
  - título 30 e lista de 5 itens (48/46 px) com `DPager` 1/2, sem logotipo grande;
  - a carteira desce para y 356.
- **Diferenças em relação à atual:** botões `Btn` com borda viram texto de 30 px; o foco por contorno vira losango com faixa; sai a moldura do painel da coluna.

### 2.2 Novo jogo e Carregar

Wireframe: [2.2-novo-jogo-e-carregar.svg](d4/2.2-novo-jogo-e-carregar.svg)

- **Componente:** `SaveSlots.tsx`.
- **Regiões:**
  - cabeçalho com "CARREGAR JOGO" ou "NOVO JOGO" e a frase do modo;
  - três colunas `SaveSlot` de w 540, centradas, com gap 24 e padding 16;
  - cada coluna tem: "SLOT n · ATIVO" em `section` 24, retrato de 200 (`HeroSprite` 2,5× → usar 240 ou 160 inteiros), nome Cinzel 36, "Nível 12 · melhor round 14" em 24, "Jogado 3h 05m · Salvo em 08/11/2026 18:42" em 22, "RUN EM ANDAMENTO" em `fish` 22 e as ações `DMenuItem` em linha (CARREGAR ou COMEÇAR AQUI, APAGAR em `blood`);
  - slot vazio: círculo `panel-top` + `shadow-inset` com "+", "Slot vazio" e a ação principal desabilitada.
- **Confirmação:** inline na própria coluna (`DConfirm` sem caixa): pergunta em 24 bold e CONFIRMAR / CANCELAR. Foco inicial em CANCELAR.
- **Foco:** ←→ trocam de slot e ↑↓ trocam de ação. Esc volta ao menu (ou cancela a confirmação).
- **844×390:** uma coluna por vez, com ‹ › entre slots; retrato de 96, textos de 18.
- **Diferenças em relação à atual:** sem cartão com borda; o slot focado ganha `focus-band` + `shadow-focus`; a confirmação deixa de ser um modal sobre o painel.

### 2.3 Escolha seu Pinguim

Wireframe: [2.3-escolha-seu-pinguim.svg](d4/2.3-escolha-seu-pinguim.svg)

- **Componente:** `HeroSelect.tsx`.
- **Regiões:**
  - **cabeçalho:** título e abas de herói em texto (JACK focado; BOB e LUCIA bloqueados em `text-dim` 26, com o requisito numa frase de 22 abaixo);
  - **esquerda** (x 70, w 560): "ATRIBUTOS BASE" com 9 `DStatRow` de 24 (pares compactos: armadura · velocidade, crítico · dano crítico, esquiva · parry, fogo, mágico, resistências) e a super magia (nome em Cinzel 28 e descrição 22);
  - **centro** (x 690, w 540): sprite de 320 com brilho de pedestal, papel e recorde em 24;
  - **direita** (x 1290, w 560): PERIGO `‹ ☠ DANGER 2 ›` 30, recorde e modificadores 22 (`blood`/`xp`), e ARMA INICIAL `‹ MACHETE ›` com números e descrição em 22;
  - **rodapé:** `DCta` "INICIAR RUN" centrado em y 950 e `DKeyHint`.
- **Foco:** aba de herói → coluna de opções (Perigo, Arma) → INICIAR RUN. ←→ mudam o valor nos seletores. Herói bloqueado deixa o CTA desabilitado. Esc volta.
- **844×390:**
  - herói e atributos em aba (ATRIBUTOS / SUPER / ARMA), com o seletor de Perigo fixo e o CTA à direita;
  - sem pedestal; sprite de 160.
- **Diferenças em relação à atual:** os cartões de herói viram abas de texto, e a ficha deixa de ser `Panel` com `StatRow` pontilhado. A tabela "o que muda" do Perigo fica resumida em 3 linhas (os seis valores completos ficam num `DTooltip` ao focar o seletor).

### 2.4 Heróis e poções

Wireframe: [2.4-herois-e-pocoes.svg](d4/2.4-herois-e-pocoes.svg)

- **Componente:** `HeroScreen.tsx`.
- **Regiões:**
  - **esquerda** (x 60, y 180, w 620): "3 PONTOS DE ATRIBUTO" em 28 `crit`, seguido das 11 linhas de atributo de 58 px (rótulo 24, valor e ganho por ponto em `xp`);
  - **centro** (x 720, w 480): `‹ JACK ›` em Cinzel 36, nível e XP em 22, `DBar` 380 × 6, sprite de 260 e GAMBITS com 3 encaixes circulares de 88 (poção em 22 e condição + ⟳ em 22 abaixo);
  - **direita** (x 1250, w 610): "POÇÕES · 45 PÉROLAS" e 6 linhas de 60 px (ícone de 44, "Cura · 2 no estoque", "comprar 15" em `ice`), com a explicação de gambit em 22 no fim.
- **Foco:** atributos ↑↓, depois → encaixes de gambit (←→ entre eles; Enter troca a poção e Y/⟳ troca a condição), depois → poções. Sem pontos ou sem pérolas, as linhas ficam desabilitadas (`text-dim`). Esc volta.
- **844×390:** duas abas (ATRIBUTOS | POÇÕES E GAMBITS); 6 atributos por página com `DPager`.
- **Diferenças em relação à atual:** sem painel de duas colunas; atributo e poção viram linhas de texto com ganho visível; os gambits viram encaixes circulares.

### 2.5 Árvore de habilidades

Wireframe: [2.5-arvore-de-habilidades.svg](d4/2.5-arvore-de-habilidades.svg)

- **Componente:** `SkillTree.tsx` (a câmera e o grafo atuais continuam).
- **Regiões:**
  - **grafo em tela cheia** atrás da vinheta;
  - **topo esquerdo:** título Cinzel 40 e `‹ JACK · NÍVEL 12 › 5 PONTOS 130 PÉROLAS` em 24;
  - **topo direito:** campo "Buscar nós" (linha `gold-aged` de 2 px, sem caixa, texto 22) e zoom − + com alvos de 48;
  - **canto inferior esquerdo:** "BÔNUS DA ÁRVORE" + soma em 24 `xp`;
  - **rodapé direito:** `DKeyHint` "R REINICIAR · 150 PÉROLAS · ESC VOLTAR";
  - **detalhe:** `DTooltip` (w 460, borda `gold-aged`, cabeçalho na cor do ramo a 20 %) ancorado ao nó selecionado, com nome em Cinzel 30, "LÂMINA · NOTÁVEL · NÍVEL 2/5" em 22, bônus em 24 `xp` e ação em 24 `crit`.
- **Nós:** caminho 18, passiva 22, notável 36–40, pedra-chave 44 (losango). Alocado em `gold-bright` com brilho; prévia tracejada; resultado de busca com halo `crit`; foco com borda de 3 `crit` + brilho de 24 px.
- **Foco:** o direcional pula para o nó vizinho mais próximo na direção, o stick move a câmera, Enter aloca. No gamepad, o tooltip fica ancorado num canto fixo (ver checklist, item 5).
- **844×390:** sem busca; tooltip fixo à direita (w 336) e ferramentas numa linha superior.
- **Diferenças em relação à atual:** sai o painel lateral de 22 rem; os detalhes vão para o tooltip e os bônus para o canto.

### 2.6 Conquistas e Loja de extras

Wireframe: [2.6-conquistas-e-extras.svg](d4/2.6-conquistas-e-extras.svg)

- **Componente:** `Lists.tsx` (`Achievements` e `Extras`).
- **Regiões:**
  - **cabeçalho:** "17/178 DESBLOQUEADAS ◆ 4 PONTOS PARA GASTAR" em 24, `DBar` 640 × 4 em `gold-bright` e a frase em 22;
  - **esquerda** (x 80, y 220, w 880): 8 `DMenuItem` de 60 px (nome em 30; obtida em `gold-bright` com "◆ obtida", bloqueada em `text-light` com "%"), com `DPager` "PÁGINA 1 / 23";
  - **direita** (x 1060, w 700): selo de 180 com brilho, nome em Cinzel 36, descrição em 26, `Ornament` e "+1 PONTO DE CONQUISTA" em 28.
- **Loja de extras:** o mesmo layout. À esquerda os 10 bônus como `DMenuItem` com pips ●●○○○; à direita, antes → depois em `DStatRow` 24, o preço e o `DCta` COMPRAR. "MÁX." desabilita.
- **Foco:** lista ↑↓ e página com L2/R2 ou ‹ ›. L abre os extras e Esc volta.
- **844×390:** 5 itens por página; o detalhe vira uma linha de 18 sob o item focado.
- **Diferenças em relação à atual:** sem cartões em grade; a descrição sai da lista e vai para o detalhe.

### 2.7 Histórico de partidas

Wireframe: [2.7-historico.svg](d4/2.7-historico.svg)

- **Componente:** `Lists.tsx` (`History`).
- **Regiões:**
  - livro-razão em x 160, y 200, w 1600: cabeçalho de colunas em `section` 22 (DATA 300, HERÓI 210, ROUND 140, ABATES 160, TEMPO 130, PEIXES 150 e DESFECHO no restante);
  - 10 linhas de 64 px com texto 24 e round em Cinzel 28; o recorde leva ♛;
  - desfecho: MORREU em `blood` 900, TEMPO DO CHEFE em `fish`, DESISTIU com a linha toda em `text-dim`;
  - `DPager` em y 900; estado vazio com frase de 22 e sprite apagado.
- **Foco:** linhas ↑↓, páginas ‹ › e Esc volta.
- **844×390:** colunas Data, Herói, Round e Desfecho; os demais campos aparecem numa linha de 18 sob a linha focada.
- **Diferenças em relação à atual:** linhas mais altas e texto 24; sem faixa colorida de borda (o desfecho é texto colorido com palavra); separadores de 1 px `gold-aged` a 20 %.

### 2.8 Configurações

Wireframe: [2.8-configuracoes.svg](d4/2.8-configuracoes.svg)

- **Componente:** `Settings.tsx` (+ `AdjustRow` de `MenuScreen.tsx` → `DAdjustRow`).
- **Regiões:**
  - **cabeçalho:** título e 4 `DTab` (TELA, ÁUDIO, JOGABILIDADE, DADOS E CONTROLES);
  - **centro** (x 380, y 220, w 1160): até 6 `DAdjustRow` de 64 px (rótulo 30, valor 26–28; o slider de volume é de losangos);
  - **rodapé** (y 900): `Ornament` mais **uma única área de dica** em 24 sobre a opção focada (ex.: idiomas disponíveis) e `DKeyHint`.
- **Aba Dados:** ação de dados local (ON/OFF) e os itens Exportar save, Importar save, Exportar dados das partidas e CONTROLES… como `DMenuItem`.
- **Foco:** ↑↓ trocam a opção, ←→ mudam o valor, L1/R1 trocam a aba. Esc volta (à pausa quando aberta pela pausa).
- **844×390:** abas com ícone + rótulo de 18 e 4 linhas por aba.
- **Diferenças em relação à atual:** as duas colunas com dica por linha viram abas com dica única no rodapé; sem painel.

### 2.9 Controles

Wireframe: [2.9-controles.svg](d4/2.9-controles.svg)

- **Componente:** `Controls.tsx`.
- **Regiões:**
  - lista em x 460, y 200, w 1000: 7 linhas de 64 px ("MOVER PARA CIMA" em 30 e a tecla em Cinzel 32 `gold-bright`);
  - conflito: tecla em `blood` mais "Tab já é usada em Velocidade" em 22 bold;
  - espera: faixa de foco com "PAUSA: APERTE UMA TECLA…" em `crit`;
  - rodapé com a legenda do controle em 24 e `DKeyHint` "R RESTAURAR PADRÃO · ESC VOLTAR".
- **Foco:** ↑↓ e Enter entra no modo de espera. Na espera, Esc cancela e VOLTAR fica bloqueado.
- **844×390:** 4 linhas por página e a legenda do controle em 18.
- **Diferenças em relação à atual:** linhas sem caixa, keycap como letra Cinzel e conflito com mensagem; a resolução do conflito está no checklist, item 9.

### 2.10 HUD de gameplay (proposta em texto, não desenhada)

- **Componentes:** `Hud.tsx` (`Hud` / `HudView`) e `TouchControls.tsx`.
- **Princípio:** HUD sem molduras, legível sobre neve clara ou floresta escura.
  - Todo texto do HUD tem sombra `0 2px 4px #000` mais contorno de 1 px `night`.
  - Barras com trilho `panel-bottom` a 80 % e preenchimento com `glow-bar`.
  - Nenhuma vinheta de menu durante o jogo; só uma vinheta muito leve (`inset 0 0 160px rgb(0 0 0 / 0.35)`) para ancorar os cantos.
- **Superior esquerdo** (x 56, y 36, w 360):
  - HP como `DBar` de 28 em `blood` com "140 / 140" em 22 bold dentro;
  - XP como `DBar` de 8 em `xp` com "NV 6" em 22;
  - "🐟 120" em `fish` 24 e "☠ 342" em 24 numa linha;
  - frasco de poção como ícone de 32 mais "3/2" em `ice` 22 e uma barra de abates de 4 px;
  - gambits em 22 (usado: riscado e `text-dim`).
- **Topo central:**
  - "ROUND 7" em `section` 24, com o timer em Cinzel 56 entre dois losangos de 12;
  - com 5 s ou menos, ou em round de chefe, o timer fica em `blood`;
  - em round de chefe, `DBar` de 600 × 16 em `rarity5` com o nome em Cinzel 24;
  - a faixa "ROUND DE ELITE" em 22 bold `rarity5`/`rarity4` fica sob o timer.
  - Ordem da pilha: timer, depois faixa, depois barra do chefe (checklist, item 2).
- **Superior direito:** "60 FPS" em 22 (só desktop).
- **Inferior esquerdo:** SUPER MAGIA em `section` 24 mais `DBar` de 340 × 12. Carregando: "SUPER MAGIA 61/100" em `blood`. Pronta: "SUPER MAGIA · SPACE" em `crit` com barra `gold-bright` e brilho. Oculta abaixo do nível 5.
- **Inferior direito:** "TAB · VELOCIDADE 3x ▶▶" em `key-hint` (`crit` quando ativo).
- **844×390:**
  - status em x 52, w 230, com textos de 18 e no máximo 2 gambits;
  - timer em Cinzel 28;
  - botão de pausa "II" de 44 no canto superior direito;
  - joystick de 144 com polegar de 56 no canto inferior esquerdo;
  - ★ de 80 (borda `crit` quando pronta) e velocidade de 48 no canto inferior direito;
  - SUPER MAGIA no centro inferior;
  - FPS some; nada sobrepõe os controles de toque.
- **Diferenças em relação à atual:** textos sobem para ≥ 22, o timer passa para Cinzel e a pilha do topo fica definida.

### 2.11 Cartas de level-up

Wireframe: [2.11-cartas-de-level-up.svg](d4/2.11-cartas-de-level-up.svg)

- **Componente:** `LevelUpCards.tsx`.
- **Regiões:**
  - jogo parado e escurecido;
  - "NÍVEL 7" em Cinzel 68 com `Ornament`;
  - fileira centrada de até 4 cartas: w 380 (a focada 400), superfície `panel-top` + `shadow-inset`, faixa de 6 px na cor da raridade no topo, "1 · COMUM" em 22 900, ícone de 128 (focada 144), nome em Cinzel 28–30 e descrição em 24, padding 16;
  - a focada usa o fundo da raridade, borda de 2 `crit`, brilho e "◆ ENTER ◆";
  - rodapé "1–4 ESCOLHER · R REROLAR · 2 RESTANTES".
- **Foco:** 1–4 ou ←→ + Enter. Sem cancelar. Com 0 rerolagens a dica fica em `text-dim`. Com 2 ou 3 cartas a fileira se recentra. A entrada é ignorada por 500 ms.
- **844×390:** cartas de 180 × 300 com ícone de 64 ao lado do nome, texto de 18.
- **Diferenças em relação à atual:** cartas sem borda grossa e descrição maior; a raridade aparece como faixa e palavra.

### 2.12 Loja do lojista

Wireframe: [2.12-loja.svg](d4/2.12-loja.svg) · [844×390](d4/2.12-loja-844x390.svg)

- **Componentes:** `Shop.tsx`, `ShopHost.tsx`, `PlayerPanel.tsx`, `ItemViews.tsx` (`WeaponCardView`/`GearCardView` → `DTooltip`, `SlotIcon` → `DSlot`).
- **Regiões:**
  - **cabeçalho** (y 36): "LOJA · ROUND 7" em Cinzel 42, `DCurrency` "🐟 120 PEIXES" 28 e o aviso de elites em `blood` 22 bold à direita;
  - **esquerda superior** (x 80, y 130, w 600): lojista de 240 (`MerchantSprite`, escala inteira) e a fala em Cinzel 26 entre aspas;
  - **esquerda inferior** (x 56, y 470, w 660): 4 ofertas como `DMenuItem` de 72 px, cada uma com `DSlot` de 52, nome 26 na cor da raridade e preço 26 `fish`. Estados: travado ("· travado" em `gold-bright`), sem Fish (`text-dim`), VENDIDO;
  - **direita**, em duas sub-colunas de mesma largura (x 760 a 1864, gap 28):
    - **"SEU EQUIPAMENTO"** (esquerda): "ARMAS n/6" com uma linha por arma (`DSlot` de 40, nome na cor da raridade, numeral à direita; na arma focada, "VENDER · 27" e "FUNDIR" na mesma linha), "EQUIPAMENTO" com os 5 slots fixos (vazio em `text-dim`) e "SUPORTE n/4" com os itens de suporte e a poção ("Nv 2/5"); cada linha é focável e leva ao painel de detalhes;
    - **"DETALHES"** (direita, sempre no mesmo lugar): o `DTooltip` do item em foco, seja uma oferta ("à venda", e para equipamento o "equipado" empilhado abaixo) ou um item próprio, seguido, nas ofertas, da frase do que a compra faz em 24 `crit` e das mudanças de atributo (verde sobe, ouro desce, uma por linha). No pé da coluna, "SEU PINGUIM" com os atributos em grade de 2 colunas (HP, armadura e dano primeiro, em negrito);
  - **rodapé** (y 980): "R REROLAR · 8" e `DCta` PRÓXIMO ROUND.
- **Foco:** ofertas ↑↓, depois → linhas do equipamento (↑↓, armas, equipamento, suporte), depois o CTA. Enter compra ou mostra as ações do slot, T trava. Esc não fecha.
- **844×390:**
  - 4 ofertas de 52 px à esquerda (w 400);
  - à direita, a frase de ação, os afixos e os 6 `DSlot` de 36;
  - "Toque no slot: vender/fundir" em 18;
  - REROLAR e PRÓXIMO ROUND no rodapé (y 334);
  - sem lojista nem tooltip comparativo.
- **Diferenças em relação à atual:** a grade 2×2 de cartões e o painel com moldura somem; o jogador (esquerda) e o detalhe (direita) ficam em colunas fixas, a comparação empilha na coluna de detalhes e os atributos viram uma grade compacta.

### 2.13 Pausa

Wireframe: [2.13-pausa.svg](d4/2.13-pausa.svg)

- **Componentes:** `Pause.tsx` e `PlayerPanel.tsx` (modo só visualização).
- **Regiões:**
  - "PAUSADO" em Cinzel 52;
  - **esquerda** (x 60, y 150, w 460): "HP 152 · ARM 12 · DANO 105%" em 30 900, 6 `DStatRow` de 24, mais CARTAS E HABILIDADES e SUPORTE E POÇÃO em `section` com o conteúdo em 24;
  - **centro** (x 580, w 760): coluna de equipamento (5 `DSlot` de 88), herói de 320 com brilho de pedestal e coluna de armas (6 `DSlot` de 88);
  - **direita** (x 1380, w 480): `DTooltip` do slot focado e, no pé, os 3 `DMenuItem` (CONTINUAR focado, CONFIGURAÇÕES, DESISTIR DA PARTIDA em `blood`) com a frase de 22.
- **Desistir:** `DConfirm` "DESISTIR? VOCÊ MANTÉM XP E PEIXES" com SIM, DESISTIR e CONTINUAR JOGANDO; foco em CONTINUAR JOGANDO.
- **Foco:** ações (CONTINUAR inicial), depois ← slots (navegação em grade); o tooltip segue o slot focado. Esc/B continua.
- **844×390:** sem herói; os slots em duas fileiras de 36, o tooltip fixo à direita e as ações em linha no rodapé.
- **Diferenças em relação à atual:** ficha em três zonas sem painel, slots maiores e as ações viram lista de texto.

### 2.14 Fim de run

Wireframe: [2.14-fim-de-run.svg](d4/2.14-fim-de-run.svg)

- **Componente:** `GameOver.tsx`.
- **Regiões:** tudo centrado, sem caixa:
  - "VOCÊ MORREU" em Cinzel 100 `blood` (variante "O CHEFE SOBREVIVEU AO TEMPO" em `gold-bright`) sobre a vinheta de morte;
  - `Ornament`, "ROUND 14" em Cinzel 56 e "1.532 abates · 12:35 · 48.210 de dano" em 26;
  - recompensas numa linha de 28 900 (XP em `xp`, peixes em `fish`, níveis em `gold-bright`, Pérolas em `ice`);
  - selo "NOVO RECORDE!" em Cinzel 26 sobre `gold-bright`, girado −4°, com `shadow-1` (só quando há recorde);
  - ações JOGAR DE NOVO (focado) e MENU PRINCIPAL lado a lado, e a frase de 22.
- **Sequência:** título 0 ms → números 600 ms → recompensas 1200 ms → ações 2000 ms. Enter pula. A entrada é ignorada por 500 ms.
- **Foco:** JOGAR DE NOVO; Esc vai ao menu.
- **844×390:** duas colunas (resumo | recompensas e ações), título em Cinzel 44.
- **Diferenças em relação à atual:** sem painel central, números maiores e uma sequência de entrada.

### 2.15 Desbloqueio

Wireframe: [2.15-desbloqueio.svg](d4/2.15-desbloqueio.svg)

- **Componente:** `Unlock.tsx`.
- **Regiões:**
  - **esquerda** (x 140): sprite de 600 com brilho dourado;
  - **direita:** "NOVO PINGUIM · 1/3" em `section` 28, nome em Cinzel 88, "BOB DESBLOQUEADO!" em Cinzel 36, `Ornament`, apresentação em 26, super magia em 24, `DMenuItem` CONTINUAR focado e uma frase de 22.
- **Variantes:** arma ("NOVA ARMA" + nome + ícone de 192) e conquista ("CONQUISTA" + nome + descrição + "+1 ponto de conquista") usam o mesmo layout, com o objeto menor.
- **Entrada:** fade de 300 ms mais brilho de 400 ms no sprite. A entrada é ignorada por 500 ms.
- **Foco:** CONTINUAR; Enter ou Esc fecham e o próximo da fila entra.
- **844×390:** sprite de 160 à esquerda e textos de 18–30 à direita.
- **Diferenças em relação à atual:** de cartaz em painel para tela cheia com sprite grande.

### 2.16 Fim da demo

Wireframe: [2.16-fim-da-demo.svg](d4/2.16-fim-da-demo.svg)

- **Componente:** `DemoEnd.tsx`.
- **Regiões:**
  - **esquerda** (x 110, w 860): "DEMO COMPLETA" em Cinzel 72 ("FIM DA DEMO" na derrota), `Ornament`, "Round 10" em Cinzel 44, resumo em 26, teaser "Bob é desbloqueado no jogo completo" em 26 `gold-bright` e os pontos de venda em 24;
  - **CTA:** `DCta` focado "DESEJAR NA STEAM" (Cinzel 38, h 76), seguido de JOGAR DE NOVO e MENU PRINCIPAL como `DMenuItem` e a frase de 22;
  - **direita** (x 1000 até a borda): pôster com arte (placeholder).
- **Foco:** DESEJAR NA STEAM. Abre no navegador do sistema e nunca navega a janela. A entrada é ignorada por 500 ms (checklist, item 11). Esc vai ao menu.
- **844×390:** sem pôster; o resumo e o CTA em uma coluna.
- **Diferenças em relação à atual:** botão com borda vira faixa CTA; entra o pôster.

## 4. Checklist de feedback de UX

Pontos levantados na comparação dos 4 estilos (página "Comparação e feedback" do `.fig`). Marque ao implementar ou ao decidir não fazer, registrando o motivo.

- [ ] 1. **2.12 Loja:** dimensionar a comparação pelo conteúdo (sem área vazia). No 844×390, a seleção de slot mostra uma barra de ação (VENDER / FUNDIR) em vez de "toque no slot".
- [ ] 2. **2.10 HUD:** pilha do topo fixa (timer, depois faixa de elite, depois barra do chefe); no máximo 2 gambits visíveis no celular.
- [ ] 3. **2.3:** lembrar a última escolha (herói, perigo, arma) e permitir INICIAR RUN sem revisitar seletores.
- [ ] 4. **2.4:** ganho de atributo nunca em `blood`; usar `xp`, `crit` ou `gold-bright`.
- [ ] 5. **2.5 Árvore:** no gamepad, detalhe do nó em posição fixa (não ancorado) para não cobrir os vizinhos; tooltip ancorado só com mouse.
- [ ] 6. **2.6 Conquistas:** com 178 itens (até 23 páginas), filtros (todas, desbloqueadas, em progresso, por herói) e salto de página com L2/R2.
- [ ] 7. **2.7 Histórico:** caber em ES e ZH-CN; se a coluna de desfecho estourar, trocar por selo curto com tooltip.
- [ ] 8. **2.8 Configurações:** uma única área de dica no rodapé, nunca dica por linha; sem prévia ao vivo.
- [ ] 9. **2.9 Controles:** conflito de tecla com ação explícita (trocar as duas teclas ou cancelar).
- [ ] 10. **2.11 Cartas:** sem rotação de cartas; atalhos 1–4 visíveis.
- [ ] 11. **2.11, 2.14, 2.15 e 2.16:** ignorar entrada por 500 ms ao abrir, para não confirmar sem querer vindo do combate.
- [ ] 12. **Consistência e contraste:** desabilitado sempre como `text-dim` ≥ 22 e borda tracejada (nunca opacidade); `snow` nunca como texto; `blood` só em texto bold ≥ 24.
