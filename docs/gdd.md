# Game Design Document — Pinguin Survivors

> **Versão** 2.1 · **Data** 2026-11-08 · **Status** fonte única de game design e mecânicas para a **1.0 comercial** (Steam + Android).
> Substitui `game-design.md` e `ui-hud.md`. Números em [balancing-and-simulation.md](balancing-and-simulation.md) (Parte B); decisões em [brainstorming.md](brainstorming.md) (B-xx) e [adrs/](adrs/README.md); histórico anterior (P-xx) no `docs/decisions.md` removido, recuperável pelo git (`git log -- docs/decisions.md`). Arte em [visual.md](visual.md); som em [audio.md](audio.md); técnica em [architecture.md](architecture.md); especificações de implementação em [sdds/](sdds/README.md).
> Onde este documento e o código atual divergem, **este documento é o alvo** e o [ROADMAP.md](../ROADMAP.md) lista o trabalho para alinhar o código.

## Índice

1. [Pitch e pilares](#1-pitch-e-pilares)
2. [Plataformas, público e classificação](#2-plataformas-público-e-classificação)
3. [Core loop](#3-core-loop)
4. [Arena e câmera](#4-arena-e-câmera)
5. [Controles](#5-controles)
6. [Heróis](#6-heróis)
7. [Atributos](#7-atributos)
8. [Armas](#8-armas)
9. [Loja do fim de round](#9-loja-do-fim-de-round)
10. [Cartas de level-up](#10-cartas-de-level-up)
11. [Equipamentos, itens e packs](#11-equipamentos-itens-e-packs)
12. [Poções e gambits](#12-poções-e-gambits)
13. [Superpoderes](#13-superpoderes)
14. [Inimigos, elites e bosses](#14-inimigos-elites-e-bosses)
15. [Biomas](#15-biomas)
16. [Dificuldade (Danger) e endless](#16-dificuldade-danger-e-endless)
17. [Economia](#17-economia)
18. [Progressão persistente](#18-progressão-persistente)
19. [Conquistas e extras](#19-conquistas-e-extras)
20. [Game feel e gore](#20-game-feel-e-gore)
21. [UI e telas](#21-ui-e-telas)
22. [Demo](#22-demo)
23. [Fora do escopo da 1.0](#23-fora-do-escopo-da-10)

## 1. Pitch e pilares

Jack, Bob e Lucia são os **três últimos pinguins sobreviventes de um apocalipse zumbi** na Antártida. Arena survivor top-down estilo Brotato em pixel art: rounds cronometrados contra hordas de até 300 inimigos, loja entre rounds, até 6 armas atacando sozinhas, boss a cada 5 rounds, gore nível DOOM e progressão RPG que nunca se perde.

**Pilares**

1. **Frenético e sangrento**: hordas densas, hit-stop, shake, gibs e poças de sangue que ficam a run inteira.
2. **Build crafting de verdade**: 6 slots, classes de arma com bônus de set, fusão de armas, loja com reroll e lock, cartas de stat no level-up.
3. **Progressão que nunca é perdida**: level 1–100 por herói, árvore de habilidades por herói, Pérolas, Danger desbloqueável.
4. **Identidade por herói**: perfil de stats, multiplicadores por classe de arma, 6 cartas exclusivas e um superpoder.
5. **Contraste visual**: pinguins fofos e marcados pela guerra num mundo escuro iluminado por tiros e magias.

## 2. Plataformas, público e classificação

| Item | Decisão |
|---|---|
| Plataformas 1.0 | Steam (Windows, Electron) e Google Play (Android, Capacitor, landscape). Demo web em `/demo`. |
| Preço | US$ 4,99 na Steam (regional), Android premium. Sem DLC na 1.0. (ADR-011) |
| Idiomas | EN, PT-BR, ES, ZH simplificado. (ADR-010) |
| Classificação | 16+/Mature pela IARC (gore explícito); gore com toggle nas opções. |
| Telas-alvo | 1920×1080 e 2560×1440 (desktop); 6,7" e 6,8" em landscape (mobile). Altura lógica 540 com zoom inteiro. |
| Público | Jogadores de Brotato/Vampire Survivors; sessões de 10–25 min. |
| Marcos | Demo no Steam Next Fest 22/02–01/03/2027; 1.0 depois. |

## 3. Core loop

```
Menu (árvore de habilidades · Pérolas: poções/gambits · arma inicial)
  → Herói + Danger + arma inicial → Run:
      Round N (timer) → mata hordas, coleta XP e Fish
        → level-up: 4 cartas (stats/exclusivas) [tempo pausado]
      → fim do timer (ou boss morto) → LOJA (4 ofertas, reroll, lock, equipamento) → Round N+1
      → round 5k: BOSS (2 min no round 5, +1 min a cada boss; timeout = game over)
  → Morte / desistência → resumo → XP, Pérolas e conquistas ficam → Menu
```

- **Duração do round N** (não boss): `20 + 5·(N−1)` s, sem teto (pedido do desenvolvedor, 2026-11-08: o jogo estava fácil).
- **Boss**: rounds 5, 10, 15, 20…; barra de boss e timer de `2 + (N/5 − 1)` min (round 5: 2:00, round 10: 3:00, round 15: 4:00…); matar encerra o round; zerar o timer é game over. O boss do meio do bioma (rounds 5, 15, 25…) é o mesmo do bioma com `ROUNDS.midBossHp` da vida. Biomas e ciclos de escala continuam em blocos de 10 rounds.
- **Elites** nos rounds múltiplos de 3 (roxo 2×; laranja 3× a partir do round 11). Waves de elite/horda extras por Danger (§16).
- **Endless**: sem fim e sem tela de vitória (ADR-008).
- Cura de 25% do HP máximo ao fim de cada round; o HP restante passa para o próximo.

## 4. Arena e câmera

- **Câmera top-down 2D** (vista 3/4 nos sprites, como Brotato). (ADR-003)
- **Arena quadrada fechada**: `side(N) = min(10 + (N−1), 40)` tiles de **64 px**. Round 1 = 10×10 (640×640), round 2 = 11×11 … round 31+ = 40×40 (2.560×2.560). Parede visível nas bordas; nada sai da arena (voadores inclusos).
- **Spawn**: anel interno de 1 tile junto à borda; fora da área visível quando a arena for maior que a tela; com telegraph de 0,5 s quando a borda estiver visível.
- **Câmera** segue o herói com lerp, clampada à arena; arena menor que a tela fica centrada.
- **Obstáculos**: props sólidos por bioma, grandes de propósito (a arte `deco.*` é desenhada 2–3× e ocupa de 3 a 5 vezes a largura do herói), com colisão circular, faixas livres entre eles e no máximo 8% do chão (`src/data/obstacles.ts`); herói e inimigos terrestres deslizam em volta e os andarilhos contornam; voadores e bosses ignoram.
- **Sangue persiste** na textura da arena durante a run inteira (teto de decalques; os mais antigos fundem numa mancha base).

## 5. Controles

| Ação | Teclado | Gamepad | Toque |
|---|---|---|---|
| Mover (8 direções) | WASD / setas | Analógico esquerdo / D-pad | Joystick virtual flutuante (polegar esquerdo) |
| Superpoder | Espaço | △ / Y | Botão na tela (direita) |
| Velocidade 1×/2×/3×/4× (também em Configurações) | TAB | □ / X ou View | Botão na HUD |
| Confirmar / loja / cartas | Enter, mouse, 1–4 | ✕ / A, D-pad | Toque |
| Pausa | Esc / P | Options / Start | Botão na HUD |

Ataques 100% automáticos; sem dash (esquiva é stat). Teclas rebindáveis.

## 6. Heróis

| Herói | Espécie / visual | Classe favorita | Perfil | Desbloqueio |
|---|---|---|---|---|
| **Jack** | Pinguim-saltador-da-rocha, crista amarela, bandana vermelha, ombreira, curativos | **Melee** (+30%) | Muita vida e armadura, parry alto, lento, magia fraca (−35%) | Inicial |
| **Bob** | Pinguim-imperador gordinho, colete tático, cinto de cartuchos, gorro, tapa-olho | **Fogo** (+30%) | Mais rápido, crítico e dodge altos, vida mediana, melee fraco (−30%) | Vencer o boss do round 10 |
| **Lucia** | Pinguim-gentoo pequena, capa roxa rasgada com runas | **Magia** (+50%) | Velocidade mediana, pouca vida, fogo e melee fracos | Vencer o boss do round 20 |

- Cada herói tem **perfil de stats**, **multiplicadores por classe**, **6 cartas exclusivas** (§10) e **1 superpoder** (§13). Números em balancing-and-simulation.md Parte B §4.
- **Arma inicial** escolhida na seleção (ADR-005): Jack machete / facas / bumerangue de peixe; Bob escopeta cano duplo / pistola / besta; Lucia cajado elemental / estilhaços de gelo / anel de chamas. Outras armas iniciais desbloqueiam com Pérolas.
- **Danger** por herói (§16) e **melhor round por herói e danger** aparecem na seleção.

## 7. Atributos

| Grupo | Stats |
|---|---|
| Vida | HP máx., regen/s, roubo de vida % |
| Ataque | dano %, dano por classe (melee/fogo/magia), velocidade de ataque %, crítico %, dano crítico %, alcance %, área % |
| Status on-hit | chance de sangramento, chance de veneno, dano elemental % (fogo/terra/gelo/energia) |
| Defesa | armadura, resistências elementais, dodge %, parry % |
| Utilidade | velocidade, alcance de coleta, sorte (raridade de cartas e ofertas), ganho de XP %, **harvesting** (Fish no fim do round) |

Elementos: **fogo** queima (DoT); **gelo** desacelera e congela ao acumular; **terra** empurra, atordoa e quebra armadura; **energia** salta em corrente. Fórmulas em balancing-and-simulation.md Parte B §3.

## 8. Armas

- **6 slots iguais** (ADR-005). Armas orbitam o herói em anel e cada uma **ataca automaticamente** o alvo mais próximo no seu alcance (bosses e elites têm prioridade quando estão no alcance).
- **Classes**: `melee`, `firearm`, `magic` (multiplicadores por herói) e **sets**: `blade`, `blunt`, `thrown`, `gun`, `explosive`, `elemental`, `support`. Uma arma pode ter 2 sets. **Bônus de set** por 2 / 4 / 6 armas do mesmo set (ex.: `blade` +sangramento, `gun` +crítico, `elemental` +dano elemental, `explosive` +área).
- **Raridade I–V** (ADR-017), a mesma escala dos equipamentos: I branco (0 afixos), II azul (1), III verde (2), IV roxo (3), V laranja (4). Os stats escalam de I a IV (visual crescente); o V reaproveita a arte do IV com brilho laranja. **Afixos** são bônus de stat sorteados que a arma dá ao herói enquanto está na build.
- **Fusão**: duas armas iguais da mesma raridade viram a seguinte, **só até o III** (os afixos que já tinha são mantidos e os que faltam são sorteados). **IV só cai de inimigos Elite e V só de Bosses** (drop no chão, coletado como os itens).
- Mira por tipo: melee = arco ao redor; fogo = inimigo mais próximo; magia = área/corrente/aleatório.

| Arma (tier I → nome da linha) | Classe / set | Comportamento |
|---|---|---|
| Machete → Katana → Chainsword | melee / blade | arco largo, sangramento |
| Facas arremessáveis | melee / thrown | projétil rápido, perfura |
| Bumerangue de peixe | melee / thrown | vai e volta |
| Escopeta cano duplo → automática → foguete | firearm / gun | leque de bagos, knockback, explosão no IV |
| Pistola | firearm / gun | cadência alta, 1 alvo |
| Besta perfurante | firearm / gun | perfura em linha |
| Molotov | firearm / explosive | área de fogo |
| Mina | firearm / explosive | armadilha |
| Cinto de granadas (Bob) | firearm / explosive | granada periódica |
| Cajado elemental → arcano → das Quatro Tempestades | magic / elemental | alterna 4 elementos, área |
| Estilhaços de gelo | magic / elemental | orbitam o herói |
| Anel de chamas | magic / elemental | aura de fogo |
| Totem de raios | magic / elemental | torre de corrente |
| Nuvem de veneno | magic / support | veneno em área |
| Drone-sentinela (Bob) | firearm / support | torreta aérea |
| Redemoinho de lâminas (Jack) | melee / blade | lâminas orbitando |

Lista final e números em `src/data/weapons.ts` e balancing-and-simulation.md Parte B §6 (a reescrever na SDD-002).

## 9. Loja do fim de round

- Abre **ao fim de cada round** com o tempo pausado, em tela estilo **ARPG (Diablo)** (ADR-006):
  - **Esquerda**: paper doll do herói, stats da run com deltas, **5 slots de equipamento** (elmo, armadura, pernas, anel, amuleto) sem mochila (comprar equipa na hora e o item que estava no slot é vendido), 6 slots de arma com fusão.
  - **Direita**: **NPC lojista** (pinguim velho mercador com carrinho de peixes, idle animado, falas curtas por texto) com **4 ofertas** de **evolução** (ADR-021): só **armas e equipamentos que o jogador ainda não tem ou versões melhores dos que já tem**, nunca piores, raridades **I a V** (IV a partir do round 11 e pede 1 **Marca de Elite**; V a partir do round 21 e pede 1 **Núcleo de Boss**, além do Fish; toda Elite dá 1 Marca e todo Boss 1 Núcleo), cada uma já com seus afixos, preço em Fish, **reroll** (preço cresce a cada uso na mesma loja; base cresce por round) e **lock** grátis por oferta (persiste entre lojas).
  - Rodapé: Fish da run, próximo round, avisos de elite/horda (Danger ≥ 2), botão "Próximo round".
- Oferta ponderada por **sorte**, round e classes que o herói já tem (leve viés para sinergia).
- Vende também **poções de velocidade** de run (uso único, não confundir com os gambits do menu) a partir do round 5; as outras poções não são vendidas.
- Vende **itens de suporte** (§12b), sempre raridade I; comprar de novo o mesmo item sobe o nível. A **poção de cura** (§12) aparece como card só até a primeira compra; depois o rodapé tem o botão fixo **+1 poção** até 10.
- Comprar uma versão melhor de uma arma que já se tem substitui a cópia de menor raridade no mesmo slot (a antiga é vendida); arma nova só aparece com slot livre.
- **Didático**: cada oferta explica o que acontece ao comprar (nova arma no slot X, fusão II→III, stats antes→depois, afixos), via `describeOffer` (SDD-003 RF-10).

## 10. Cartas de level-up

- Cada level-up durante o round abre **4 cartas** com o tempo pausado; vários level-ups no mesmo round enfileiram as escolhas (ADR-006).
- Tipos: **stat** (comum/rara/épica/lendária, com multiplicador por raridade) e **exclusiva do herói** (6 por herói, níveis 1–5). Armas e itens **não** aparecem em cartas.
- Raridade cresce com round e sorte (balancing-and-simulation.md Parte B §7).

**Exclusivas**

| Jack | Bob | Lucia |
|---|---|---|
| Sede de Sangue · Contra-Ataque · Redemoinho de Lâminas (vira arma, §8) · Pele de Ferro · Açougueiro · Pisão Sísmico | Pontas Ocas · Ricochete · Drone-Sentinela (vira arma) · Atirar Correndo · Reflexo · Cinto de Granadas (vira arma) | Sintonia Elemental · Corrente Arcana · Nova Glacial · Chuva de Meteoros · Barreira Arcana · Florescer Tóxico |

As três exclusivas marcadas "vira arma" passam a ser **armas iniciais/da loja exclusivas do herói**; cada herói recebe uma exclusiva passiva nova no lugar (definir na SDD-002: Jack "Fôlego de Ferro", Bob "Recarga Rápida", Lucia "Eco Arcano" são propostas, números a balancear).

## 11. Equipamentos, itens e packs

- **Equipamento** (P-66): 5 slots × 10 itens-base (3 comuns, 4 raros, 3 lendários) com a **raridade I–V** e os **afixos** da escala única (ADR-017): na loja, comum, raro e lendário são I, II e III; **IV só de Elite e V só de Boss** (bases lendárias com 3 e 4 afixos). Pego pisando (sem ímã), some em 60 s. Itens antigos sem sorteio leem-se como I, II e III.
- **Itens passivos** da loja (novos, estilo Brotato): modificadores de stat e de regra (ex.: "+1 projétil", "Fish extra por elite"), tiers I–IV, sem limite de quantidade.
- **Packs de vida**: +25% (50%), +50% (30%), +75% (20%); chance 1,2% comuns, 25% elites, 100% bosses.

## 12. Poções e gambits

- **Poção de cura da run** (substitui as antigas Cura e Mega Cura): comprada no lojista, nível 1 = carrega 1 poção, até o nível 10 = 10 poções; **todo round começa com as poções vazias** e cada **100 inimigos mortos** no round enchem uma (uma por vez, até o máximo do nível). Bebe **sozinha** quando a vida chega a 50% ou menos, uma por vez, com 2 s de recarga. Cura por raridade: I 25%, II 30%, III 35%, IV 40%, V 50% da vida máx. O lojista vende só a I; Elites dropam melhoria II ou III (12% por abate) e Bosses IV ou V; a raridade vira a do drop se maior, senão sobe um degrau. HUD: sob a barra de vida, frasco cheio na cor da raridade (apagado sem carga), `cargas/máx.` e `abates/100` até a próxima recarga (SDD-014).
- **3 slots de gambit** configurados no menu (tipo + condição), comprados com **Pérolas**, consumidos uma vez por run: Escudo 30% do HP máx. por 8 s, Fúria +50% dano 8 s, Antídoto (limpa e imuniza 5 s), Pressa +40% vel. de ataque 8 s.
- Condições: HP < 25/50/75%, envenenado, sangrando, boss na tela, ≥ N inimigos perto, início do round. Avaliadas em ordem a cada 0,25 s.

### 12b. Itens de suporte

- Categoria da loja com **4 slots próprios** (separados dos 6 de arma). Comprar de novo o mesmo item sobe o nível (1 a 5); stats por nível em `src/data/support.ts`.
- **Magnético**: puxa as bolinhas de XP e os Fish de mais longe e mais rápido (raio extra 40/75/110/150/200 u). **Botas Ligeiras**: velocidade de movimento +4 por nível. **Amuleto da Sorte**: sorte +3% por nível.

## 13. Superpoderes

- Liberam no **level 5** do herói; carga por abates (100 no 1º uso, +5 a cada uso na run; elite conta 3, boss não conta); carga persiste entre rounds; **Espaço** usa e zera; invulnerável durante a animação.

| Herói | Superpoder | Efeito | VFX |
|---|---|---|---|
| Jack | **Colheita Rubra** | tornado de lâminas 3 s, puxa inimigos, 800% do dano/s em 180 u, sangramento máximo | tornado de sangue e aço |
| Bob | **Bombardeio** | 16 explosões em 2,5 s em dois anéis em volta do Bob (6 a 100 px, depois 10 a 200 px), 600% cada, queimadura | sinalizador, bombas, crateras |
| Lucia | **Cataclismo Elemental** | vórtice dos 4 elementos 4 s em 260 u, 1000% do dano mágico | vórtice de 4 cores, meteoro, pilares, raios |

## 14. Inimigos, elites e bosses

Papéis por bioma: **enxame** (rápido e frágil), **voador** (ignora props), **tanque**, **à distância** (cospe), **explosivo** (nuvem de veneno), **investida**. Elites usam o mesmo sprite ×1,25 (roxo) / ×1,4 (laranja) com aura e barra de HP, drop garantido de Fish.

| Bioma (campanha) | Inimigos | Boss |
|---|---|---|
| Antártida (rounds 1–10) | pinguim zumbi, skua, foca, cientista, pinguim inchado, morsa | **Urso polar zumbi** (patada, investida, rugido que invoca pinguins) |
| Floresta (rounds 11–20) — proposta | lobo zumbi (enxame), corvo zumbi (voador), alce zumbi (tanque), raposa cuspidora (à distância), bloater fúngico (explosivo), javali zumbi (investida) | **Alce-rei zumbi** (investida de chifres, rugido que invoca lobos) |
| Cidade destruída (rounds 21–30) — proposta | Vespa-Ácido (enxame), Sentinela Alada (voador), Couraçado (tanque), Espreitador Óptico (à distância), Cisto Biomecânico (explosivo), Rasgador Biomecânico (investida) | **Colosso Biomecânico** (esmagamento, poças de ácido, invoca Vespas-Ácido) |
| Endless (rounds 31+) | todos os inimigos das campanhas, incluindo os legados estação de pesquisa (marinheiro, gaivota, leão-marinho, médico, bloater de combustível, narval) e cidade em ruínas (cidadão, rato, pombo, policial de choque, soldado, bloater ácido, brutamontes) | sorteado entre todos: urso polar zumbi, alce-rei zumbi, colosso biomecânico, **Kraken do Porto** (tentáculo, rajada de tinta, invoca marinheiros) e **Abominação** (investidas, poças de ácido, invoca ratos) |

Os nomes da floresta e da cidade destruída são propostas (ADR-016) até a aprovação do desenvolvedor. Conceitos e linhas de inspiração por inimigo estão na §15.

Números em balancing-and-simulation.md Parte B §2.

## 15. Biomas

**Campanha** (rounds 1–30, ADR-016):

- **1–10 Antártida**: neve pisoteada, noite polar, zumbis pinguins e focas.
- **11–20 Floresta** (proposta): noite de coníferas, musgo, terra e névoa; zumbis de animais da mata (lobo, corvo, alce, raposa, javali) e um fungo inchado que solta esporos.
- **21–30 Cidade destruída** (proposta): concreto e asfalto queimados, fumaça, vidro quebrado; facção alienígena original, com metal cinza e brilho verde-ácido.

**Conceitos dos aliens** (proposta; cada um com a inspiração de gênero e o que não copiar):

| Papel | Nome | Conceito curto | Inspiração de gênero | Não copiar |
|---|---|---|---|---|
| enxame | Vespa-Ácido | criaturas pequenas em nuvem, rápidas e frágeis, deixam rastro de ácido | enxame com ácido | silhueta de xenomorfo, cabeça dolicocéfala, cauda-lâmina |
| voador | Sentinela Alada | corpo biomecânico com asas de membrana, ignora props, sinaliza o herói | biomecânico | qualquer morfologia de criatura icônica de filme |
| tanque | Couraçado | guerreiro blindado com placas e escudo de energia, lento e pesado | ficção militar blindada | armaduras e silhuetas de facções de Warhammer ou do Predador |
| à distância | Espreitador Óptico | camuflagem óptica (ondula e some ao parar), dispara plasma | caçador com camuflagem óptica | máscara, dreadlocks e armas do caçador icônico |
| explosivo | Cisto Biomecânico | saco que incha e estoura numa nuvem ácida | biomecânico orgânico | — |
| investida | Rasgador Biomecânico | garras retráteis, arranca em linha reta | caçador rápido | lâmina de cauda |
| boss | Colosso Biomecânico | máquina-criatura de placas, esmagamento e poças de ácido, invoca Vespas-Ácido | colosso biomecânico | conceito de rainha/mãe de colmeia com ovos |

Regra geral: a facção é original. Não usar nomes, designs, silhuetas icônicas ou marcas registradas de obras existentes, incluindo xenomorfo, Predador (yautja), facções e unidades de Warhammer (Tyranids, Space Marines, Necrons, Orks, Eldar, Chaos, Imperium e similares).

**Endless** (rounds 31+): sem campanha fixa. A cada 10 rounds, o bioma (visual, tileset, pool de inimigos e boss) é sorteado pela seed da run entre Antártida, floresta, cidade destruída, estação de pesquisa (legado) e cidade em ruínas (legado). O pool de inimigos inclui todos, legados incluídos; o boss de cada sorteio é escolhido entre todos os bosses. Detalhes em §16.

Cada bioma tem tileset top-down 64×64 (chão + borda), decorações e pool próprio de inimigos. Banner de chegada e troca de música no round 11/21.

## 16. Dificuldade (Danger) e endless

- **Danger 0–5 por herói** (ADR-008): vencer o boss do round 20 no Danger D libera D+1 para aquele herói.
- Por danger: multiplicadores de HP/dano dos inimigos e de drops (o **Danger 0** é o modo fácil: inimigos com **0,5×** de vida e de dano, decisão do desenvolvedor 2026-11-08); **waves de elite/horda extras** (D0–1 nenhuma, D2–3 uma, D4–5 três), avisadas na loja a partir do D2.
- **Endless** sem vitória; a cada volta de 30 rounds HP ×1,6 e dano ×2 (balancing-and-simulation.md Parte B §2).
- **Visual e pool no endless** (round 31+): a cada 10 rounds, a seed da run sorteia o bioma entre Antártida, floresta, cidade destruída, estação de pesquisa e cidade em ruínas. O pool de inimigos e o boss usam todos os assets (ADR-016).
- Conquistas e leaderboards por herói e danger.

## 17. Economia

| Moeda | Escopo | Ganho | Gasto |
|---|---|---|---|
| **Fish 🐟** | run (começa com 10; não passa para a próxima run) | drop de inimigos (5% comuns, garantido em elites), fim de round `2 + floor(N/2)` × harvesting, boss | loja, reroll, poções de run |
| **Pérolas** | persistente | round concluído, boss, conquistas, conversão do Fish restante (10:1) | gambits, armas iniciais, devolver nós da árvore |

Preços de loja e reroll em `src/data/economy.ts` (SDD-003); Árvore de habilidades em [ADR-019](adrs/ADR-019-arvore-de-habilidades.md).

## 18. Progressão persistente

- XP coletado na run vai para o **herói** (level 1–100, `xpToNext(L) = floor(30·L^1,55 + 50)`). Cada level: crescimento automático da classe + **1 ponto da árvore de habilidades** do herói (do level 2 ao 99; [ADR-019](adrs/ADR-019-arvore-de-habilidades.md)): passivas, notáveis e uma pedra-chave por ramo, alocadas pelo caminho mais curto; devolver um nó custa 2 Pérolas e reiniciar custa 1 por nó. Não há mais Oficina nem pontos de stat. Alguns nós têm **níveis 0/5** (3 por ramo: +5 de vida no nível 1, +10 no nível 2…), um ponto por nível. A árvore também abre **dentro da run**, pelo botão Árvore de habilidades da Pausa e da Loja (só o herói da run): os níveis ganhos na run já contam como pontos e, ao voltar, o bônus novo entra nos stats da run na hora.
- Morrer mantém XP, Pérolas, conquistas e equipamento lendário desbloqueado no catálogo.
- **Save local em 3 slots** (estilo Hades 2; ADR-020): Novo jogo escolhe o slot (avisa ao sobrescrever), Carregar lista os slots (herói, nível, melhor round, tempo, data) com Carregar e Apagar (confirmação); autosave no slot ativo; configurações globais fora dos slots. Schema versionado e **sem migração antes da 1.0** (arquivo de outra versão começa vazio); Steam Cloud no Electron; export/import `.json` na web.

## 19. Conquistas e extras

131 conquistas globais (1 ponto cada) → **loja de extras** (10 bônus permanentes pequenos, até nível 10). Conquistas viram conquistas Steam. Novas: por danger, por set completo, por fusão IV, por round 20/30/50 por herói.

## 20. Game feel e gore

As armas equipadas **atacam o alvo** de forma visível: golpe com lunge até o inimigo (melee), recuo e flash de cano (fogo), arremesso (facas, bumerangue, molotov, granadas), plantio (mina, totem, nuvem), giro e pulso (lâminas, anel, drone) e conjuração (cajado); cor do tiro e do número por arma. Crítico, esquiva e aparo têm número, cor e *pop* próprios. Hit-stop em crítico/elite/boss, screen shake, flash de acerto limitado, números de dano coloridos por tipo, knockback, jorros e gibs com arco e sombra, poças persistentes, luz dos tiros e magias, zoom-punch em boss, bloom opcional (desligado por padrão). **Gore** máximo por padrão; opções "reduzido" e "gosma verde".

## 21. UI e telas

Toda a UI é React + Tailwind v4 sobre o canvas (ADR-002); textos em `src/i18n/`; navegável por teclado, mouse, gamepad e toque; layouts validados em 1920×1080, 2560×1440 e 2400×1080 (celular landscape) nos 4 idiomas.

```
MainMenu ─► HeroSelect (herói · danger · arma inicial) ─► Game (+ HUD)
   │            │                                            │ level-up ─► LevelUpCards ─► Game
   │            └─► Hero (árvore · gambits · armas)        │ fim do round ─► Shop ─► Game
   ├─► Achievements / Extras                                 │ Esc ─► Pause (stats, armas, equipamento) ─► Settings
   ├─► History · Settings · Credits                          └ morte / timeout ─► GameOver ─► Menu / Retry
   └─► Continue (round N)                                   (demo: round 10 ─► DemoEnd ─► Wishlist)
```

**Linguagem visual e fundos** (ADR-018): Conquistas, Configurações, Árvore de habilidades, Histórico e Escolha seu Pinguim seguem a linguagem visual **Diablo 4** da loja (painéis escuros, moldura metálica, raridade por cor, Roboto). **Todos os menus, exceto o inicial, têm fundo preto ou neutro** (sem a arte do menu), responsivos, fáceis e didáticos. A **Pausa** usa o layout da loja (status do jogador e itens equipados), sem o NPC, com 3 botões: Continuar, Configurações e Sair.

**HUD**: HP e XP grandes com número, Fish da run, round e timer, barra do boss + 3:00, aviso de elite, **SUPER MAGIA** no canto inferior esquerdo (a partir do level 5; as armas são vistas no herói, sem ícones na HUD), 3 gambits, velocidade 1×–4× (TAB), FPS (opcional), rodapé com versão. A HUD some sob qualquer tela cheia (loja, cartas, pausa, resumo, menus).

## 22. Demo

Rounds 1–10 (termina no urso polar), só Jack, Danger 0–1; Bob e Lucia bloqueados com aviso; tela final com resumo, "Bob desbloqueado no jogo completo", botão **Wishlist** e "Jogar de novo"; save migra para o jogo completo. Mesma demo em `/demo` (web) e na Steam (ADR-013).

## 23. Fora do escopo da 1.0

Multiplayer/co-op, iOS, Linux/macOS, portrait, F2P/ads, DLC, vitória/final, vozes, rotação de câmera, 3D.
