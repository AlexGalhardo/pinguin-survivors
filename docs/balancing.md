# Balanceamento — números e fórmulas

> **Valores iniciais** (a calibrar por simulação headless e playtest). A fonte de verdade no código é `src/data/*.ts`; este arquivo espelha os valores. Mudou um número? Atualize os dois.
> Unidades: distâncias em **unidades de mundo** (1 tile = 32 u no eixo cartesiano; ver architecture §Projeção). Tempo em segundos.

## 1. Rounds

| Regra | Valor |
|---|---|
| Duração do round N (não boss) | `min(20 + 5·(N−1), 60)` s |
| Boss | rounds `N % 10 == 0`; limite **180 s**; timeout = game over |
| Elite roxo (2×) | rounds `N % 3 == 0` e não boss; 8% dos spawns do round |
| Elite laranja (3×) | idem, a partir do round 11; 4% dos spawns |
| Elite | HP ×2 / ×3, dano ×2 / ×3, escala visual 1,25 / 1,4, drop garantido de Fish |

## 2. Escala dos inimigos

- `hpMul(N) = (1 + 0,15·(N−1)) · 1,12^ciclo · 1,6^volta`, com `ciclo = floor((N−1)/10)` e `volta = floor((N−1)/30)` (endless: a cada volta completa pelos 3 biomas)
- `dmgMul(N) = (1 + 0,08·(N−1)) · 1,08^ciclo · 1,5^volta`
- `spawnRate(N)` (inimigos/s) = `min(1,5 + 0,5·N, 25)`; **×0,5 nos rounds de boss** (a luta é contra o boss; a arma mira o inimigo mais próximo); teto de **300 vivos**
- Bosses: HP base × `1,35^ciclo` (round 10 ×1, 20 ×1,35, 30 ×1,82…)
- Biomas: rounds 1–10 Antártida, 11–20 estação/porto, 21–30 cidade em ruínas, depois repete (`src/logic/biome.ts`). Os inimigos dos biomas 2–3 já têm base maior, por isso o salto por ciclo é pequeno.

### 2.1 Antártida (rounds 1–10)

| Inimigo (id) | Comportamento | HP | Vel. (u/s) | Dano | Raio | XP | Desde o round | Peso |
|---|---|---|---|---|---|---|---|---|
| zombiePenguin | perseguidor | 12 | 80 | 4 | 10 | 1 | 1 | 10 |
| zombieSkua | voador | 10 | 115 | 3 | 9 | 1 | 2 | 5 |
| zombieSeal | tanque | 45 | 40 | 8 | 16 | 3 | 3 | 4 |
| zombieScientist | à distância (220 u, 2,5 s) | 20 | 55 | 6 | 11 | 2 | 4 | 3 |
| bloaterPenguin | explosivo (40 u) | 18 | 60 | 14 | 12 | 2 | 5 | 3 |
| zombieWalrus | investida (200 u, 4 s) | 60 | 50 | 12 | 18 | 4 | 7 | 2 |

### 2.2 Estação de pesquisa / porto (rounds 11–20)

| Inimigo (id) | Comportamento | HP | Vel. (u/s) | Dano | Raio | XP | Desde o round | Peso |
|---|---|---|---|---|---|---|---|---|
| zombieSailor | perseguidor | 16 | 85 | 5 | 10 | 1 | 11 | 10 |
| zombieGull | voador | 12 | 125 | 4 | 9 | 1 | 11 | 5 |
| zombieSeaLion | tanque | 60 | 45 | 10 | 17 | 3 | 12 | 4 |
| zombieMedic | à distância (240 u, 2,2 s) | 24 | 55 | 7 | 11 | 2 | 13 | 3 |
| fuelBloater | explosivo (42 u) | 22 | 62 | 16 | 12 | 2 | 14 | 3 |
| zombieNarwhal | investida (220 u, 3,5 s) | 70 | 55 | 14 | 18 | 4 | 16 | 2 |

### 2.3 Cidade em ruínas (rounds 21–30)

| Inimigo (id) | Comportamento | HP | Vel. (u/s) | Dano | Raio | XP | Desde o round | Peso |
|---|---|---|---|---|---|---|---|---|
| zombieCitizen | perseguidor | 20 | 85 | 6 | 10 | 1 | 21 | 9 |
| zombieRat | perseguidor | 8 | 130 | 3 | 7 | 1 | 21 | 6 |
| zombiePigeon | voador | 14 | 125 | 5 | 9 | 1 | 22 | 4 |
| zombieRiotCop | tanque | 80 | 45 | 12 | 16 | 3 | 22 | 4 |
| zombieSoldier | à distância (260 u, 2 s) | 30 | 60 | 8 | 11 | 2 | 23 | 3 |
| acidBloater | explosivo (44 u) | 26 | 64 | 18 | 12 | 2 | 24 | 3 |
| zombieBrute | investida (220 u, 3,5 s) | 90 | 55 | 16 | 19 | 5 | 26 | 2 |

### 2.4 Bosses (pool rotativo)

| Boss | Round | HP base | Vel. | Dano | Raio | Alcance | Recarga | Padrão |
|---|---|---|---|---|---|---|---|---|
| polarBear | 10 (+30·k) | 3000 | 70 | 25 | 40 | 90 u | 3 s | patada 0,4 s de preparo, alcance ×1,3; investida a cada 8 s; rugido a cada 12 s invoca 6× zombiePenguin |
| kraken | 20 (+30·k) | 3000 | 45 | 22 | 44 | 150 u | 2,6 s | patada 0,55 s de preparo, alcance ×1,2; rajada de 7 projéteis a cada 4 s; rugido a cada 14 s invoca 6× zombieSailor |
| abomination | 30 (+30·k) | 3500 | 80 | 28 | 42 | 95 u | 2,6 s | patada 0,35 s de preparo, alcance ×1,3; investida a cada 5 s; 4 poças de ácido a cada 6 s; rugido a cada 13 s invoca 10× zombieRat |

Rajada do kraken: 170 u/s, alcance 520 u, dano 35% do dano do boss. Poças da abominação: raio 46 u, 4 s, 35% do dano do boss por segundo.

Spawn: ponto aleatório no perímetro da área **visível real** + 48 px (ultrawide incluso).

## 3. Combate

| Fórmula | Valor |
|---|---|
| Crítico | base 5%; dano crítico base 150% |
| Redução física | `armor / (armor + 100)`, teto 80% |
| Resistência elemental | % direta, teto 75% (negativa amplifica) |
| Dodge | teto 60%; evita qualquer golpe |
| Parry | teto 40%; só golpes corpo a corpo e de contato; anula e devolve 50% do dano |
| Sangramento | 20% do golpe em 3 s (físico, afetado por armadura); até 5 acúmulos |
| Veneno | 10% do golpe/s por 4 s; ignora armadura; até 10 acúmulos |
| Queimadura (fogo) | 15% do golpe/s por 3 s; não acumula, renova |
| Gelo | −10% vel. por acúmulo; 5 acúmulos = congelado por 1,5 s |
| Terra | knockback ×1,5; 10% de chance de atordoar 0,5 s; −10% armadura por 4 s |
| Energia | salta para até 2 alvos a 90 u com 60% do dano |
| Invulnerabilidade após ser atingido | 0,6 s |

## 4. Heróis (level 1)

| Stat | Jack | Bob | Lucia |
|---|---|---|---|
| HP | **140** | 110 | **85** |
| Regen/s | 0,8 | 0,4 | 0,3 |
| Armadura | **12** | 4 | 1 |
| Vel. movimento (u/s) | **95** (lento) | **135** (rápido) | 115 |
| Dodge | 3% | **12%** | 6% |
| Parry | **15%** | 0% | 0% |
| Crítico | 5% | **12%** | 5% |
| Dano crítico | 150% | 175% | 150% |
| Resist. (fogo/terra/gelo/energia) | 0/10/5/0 | 5/0/5/0 | 10/10/10/10 |
| Mult. dano **melee** | **×1,30** | ×0,70 | ×0,80 |
| Mult. dano **fogo** | ×1,00 | **×1,30** | ×0,85 |
| Mult. dano **magia** | ×0,65 | ×1,00 | **×1,50** |

Os multiplicadores por tag valem para a arma assinada, secundárias e cartas de magia (incluindo as de outras tags que o herói pegar).

**Crescimento automático por level** (somado ao valor base): Jack +4 HP, +0,4 armadura, +0,1% parry · Bob +2,5 HP, +0,3% crítico, +0,1% dodge · Lucia +1,5 HP, +0,6% dano mágico.
**Ponto de stat** (1 por level): +1% vel. de ataque · +0,1 regen/s · +1 armadura · +1% resist. elemental (escolhe o elemento) · +0,5% dodge · +0,5% parry · +0,5% crítico · +5 HP.

### 4.1 Cartas exclusivas (valores de nível 1; +50% por nível até 5)

| Herói | Carta | Valor |
|---|---|---|
| Jack | Sede de Sangue | +2% vel. ataque por inimigo sangrando a ≤ 150 u, máx. +20% |
| Jack | Contra-Ataque | golpe 360°, 200% do dano da arma, raio 90 u |
| Jack | Redemoinho de Lâminas | 3 lâminas, 8 de dano, raio 70 u, 1 volta/s |
| Jack | Pele de Ferro | +6 armadura; espinhos = 10% da armadura |
| Jack | Açougueiro | 15% de drop de carne; cura 3% HP máx. |
| Jack | Pisão Sísmico | a cada 6 s, 20 de dano, raio 110 u, atordoa 0,6 s |
| Bob | Pontas Ocas | críticos aplicam 1 acúmulo de sangramento |
| Bob | Ricochete | +1 quique, 70% do dano, alcance 120 u |
| Bob | Drone-Sentinela | 6 de dano, 3 tiros/s, alcance 220 u |
| Bob | Atirar Correndo | +15% de cadência em movimento |
| Bob | Reflexo | próximo tiro crítico após dodge (janela 2 s) |
| Bob | Cinto de Granadas | a cada 5 s, 30 de dano, raio 70 u |
| Lucia | Sintonia Elemental | +5% dano mágico por elemento distinto em 4 s, máx. +20% |
| Lucia | Corrente Arcana | 18 de dano, salta 5×, 80% por salto, recarga 2 s |
| Lucia | Nova Glacial | congela raio 120 u por 1,5 s, recarga 8 s |
| Lucia | Chuva de Meteoros | 3 meteoros, 40 de dano, raio 60 u, a cada 4 s |
| Lucia | Barreira Arcana | absorve 1 golpe, recarga 10 s |
| Lucia | Florescer Tóxico | nuvem de 60 u, 8 de veneno/s por 3 s |

### 4.2 Superpoderes

| Regra | Valor |
|---|---|
| Desbloqueio | level 5 do herói |
| Carga | 100 abates (qualquer inimigo; elite conta 3, boss não conta); persiste entre rounds da mesma run |
| Colheita Rubra (Jack) | 3 s; 800% do dano da arma/s; raio 180 u; puxa 60 u/s; sangramento 5 acúmulos |
| Bombardeio (Bob) | 16 explosões em 2,5 s na área visível; 600% do dano da arma cada; raio 80 u; queimadura |
| Cataclismo Elemental (Lucia) | 4 s; 1000% do dano mágico distribuído; raio 260 u; aplica os 4 elementos |
| Invulnerabilidade | durante a animação (0,8 s) |

## 5. XP e level (persistente)

- `xpToNext(L) = floor(30 · L^1,55 + 50)`; level máximo 100.
- Meta de ritmo: level 10 na 3ª run, level 30 em ~15 runs, level 100 em ~150 runs (validar na sim).
- Orbe de XP: inimigo comum 1, elite roxo 5, elite laranja 10, boss 100; × `(1 + 0,05·N)`.

## 6. Armas assinadas

> 2026-09-27: alcance das armas do Jack +50% em todos os tiers (pedido do usuário; T1 70 → 105 u).

| Arma | Tag | Dano | Cadência (/s) | Alcance | Especial |
|---|---|---|---|---|---|
| Machete (T1) | melee | 14 | 1,4 | arco 140° · 150 u | 15% sangramento |
| Katana (T2) | melee | 26 | 1,8 | arco 170° · 180 u | 25% sangramento, golpe duplo |
| Espada-motosserra (T3) | melee | 48 (12 × 4) | 2,2 | arco 200° · 195 u | contínuo, 40% sangramento |
| Escopeta cano duplo (T1) | firearm | 7 × 6 bagos | 1,1 | 220 u · 30° | knockback |
| Escopeta automática (T2) | firearm | 8 × 7 | 1,6 | 240 u · 35° | perfura 1 |
| Escopeta-foguete (T3) | firearm | 10 × 7 + explosão 30 | 1,4 | 260 u | explosão em área |
| Cajado dos 4 elementos (T1) | magic | 16 | 1,3 | 260 u | alterna elemento a cada disparo; perfura 1 |
| Cajado arcano (T2) | magic | 24 | 1,4 | 280 u | projéteis em área 40 u |
| Cajado das Quatro Tempestades (T3) | magic | 30 | 1,8 | 300 u | 4 elementos simultâneos |

## 7. Cartas

- Raridade por round (comum/rara/épica/lendária): `[70, 22, 7, 1]%` no round 1 → `[40, 35, 18, 7]%` no round 30 (interpolação linear) + sorte.
- Stat por raridade: multiplicador ×1 / ×1,6 / ×2,4 / ×3,5 sobre o valor base da carta.
- Evolução T2: aparece com 100% de chance na 1ª escolha após vencer o boss 10; T3 após o boss 20.

## 8. Economia (Fish 🐟)

| Fonte | Fish |
|---|---|
| Inimigo comum | 5% de chance de 1 |
| Elite roxo / laranja | 3 / 6 garantidos |
| Fim de round | `2 + floor(N/2)` |
| Boss | `25 · (1 + ciclo)` |

| Poção | Preço |
|---|---|
| Cura / Antídoto | 15 |
| Escudo / Pressa / Fúria | 25 |
| Mega Cura | 40 |

## 8b. Oficina (upgrades permanentes com Fish, `src/data/upgrades.ts`)

Compartilhados pelos heróis; aplicados aos stats iniciais de toda run. Preço do nível L+1 = `base · crescimento^L`.

| Upgrade | Stat | Por nível | Nível máx. | Preço base | Crescimento |
|---|---|---|---|---|---|
| vitality | maxHp | +5 | 10 | 30 | ×1,35 |
| might | damage | +0,03 | 10 | 40 | ×1,4 |
| haste | attackSpeed | +0,02 | 10 | 40 | ×1,4 |
| plating | armor | +1 | 8 | 35 | ×1,4 |
| recovery | regen | +0,1 | 8 | 35 | ×1,4 |
| swiftness | moveSpeed | +3 | 5 | 45 | ×1,5 |
| magnet | pickupRange | +8 | 5 | 25 | ×1,4 |
| wisdom | xpGain | +0,04 | 10 | 45 | ×1,4 |
| fortune | luck | +0,02 | 5 | 60 | ×1,5 |

A loja de extras das conquistas (`ACHIEVEMENT_SHOP`, P-61) soma no máximo +10 HP, +0,2 regen, +1 armadura, +1% crítico, +10% dano crítico, +1% esquiva, +1% aparar, +2% vel. de ataque, +2% dano e +5 vel.; é pequena demais para mudar a curva e fica fora da sim.

## 9. Metas de sessão

- Run média de um jogador novo: morrer entre os rounds 6 e 9 (5–7 min).
- Boss do round 10 vencível por ~50% dos jogadores com Jack level 5–8.
- 60 FPS com 300 inimigos + 2.000 decalques de sangue.

### 9.1 Critério de saída do balanceamento (milestone "Balance 1.0")

O trabalho de balanceamento da frente `wt/balance` **termina** quando o lote abaixo passar, ou quando o orçamento acabar (o que vier primeiro). Medido com o **bot médio** (`--react 0.2 --mistakes 0.05`, dificuldade NORMAL, seeds 100 e 101, build DEV congelado):

| # | Perfil | Meta |
|---|---|---|
| 1 | L10 + Oficina `all:2` + poções | cada herói passa do round 30 (vence o boss 30) em **≥ 1 de 2 seeds**, e nenhum herói morre antes do round 20 em ambas |
| 2 | L20 + Oficina `all:4` + poções | os 3 heróis passam do round 30 |
| 3 | L1 sem Oficina/poções (jogador novo) | mediana de morte entre os rounds **8 e 20** (nenhum herói passa do 30) |
| 4 | Endless (L20) | a run termina antes do round 60 (a volta do endless mata) |
| 5 | EASY / HARD (L10, 1 seed) | EASY chega pelo menos tão longe quanto NORMAL; HARD morre antes do NORMAL |

A sim (`bun scripts/sim.ts`) é só apoio: serve para comparar mudanças antes de gastar tempo no bot, não para aprovar o milestone.

**Orçamento:** no máximo **3 passadas do bot** depois da b6 (cerca de 1 h de relógio cada, 2 Chromes). Se a meta não fechar dentro disso, a frente para, integra o que tiver no `dev` e registra aqui o que ficou fora da meta e por quê.

## 10. Calibração (2026-09-27)

### 10.0 1ª passada

Ferramentas: `bun scripts/sim.ts [runs]` (modelo analítico, `src/logic/sim/run-sim.ts`) e `bun scripts/playtest-bot.ts <url> [runs] [segundos]` (bot no jogo real, 2×, foge do grupo mais próximo e escolhe a 1ª carta).

Ajustes da 1ª passada (o jogo estava difícil demais: bot morria nos rounds 1–3):

| O quê | Antes | Depois |
|---|---|---|
| Invulnerabilidade do herói após golpe | 0,35 s | **0,6 s** |
| Dano de contato (pinguim/skua/foca/cientista/inchado/morsa/urso) | 6/5/12/8/20/16/30 | **4/3/8/6/14/12/25** |
| Spawn | 2 + 0,6·N | **1,5 + 0,5·N** (teto 25) |
| HP Bob / Lucia | 100 / 70 | **110 / 85** |
| Escopeta cano duplo (cadência) | 0,9/s | **1,1/s** |
| Cajado dos 4 elementos | 1,1/s, sem perfuração | **1,3/s, perfura 1** |

Resultado do bot (nível 1, seed 100): Jack vivo no round 7 no limite de 4 min; Bob morre no **boss do round 10**; Lucia morre no round 9 → dentro da meta (§9: morrer entre 6 e 9).
Pendente: o modelo analítico ainda prevê rounds 3–4 (não modela a fuga do jogador); calibrar `SIM.contactShare` com o bot antes de usá-lo para decisões finas.

### 10.1 2ª passada (sim calibrada + bot com build)

**Ferramentas.** `bun scripts/sim.ts [runs] [--rounds]` imprime herói × level (1/5/10/20/30) com round médio, mediana e % que passa do round 30. A sim modela secundárias, superpoder, elites, biomas, bosses rotativos e upgrades da Oficina; escolhe cartas com a mesma política do bot (`src/logic/sim/card-policy.ts`). As constantes de contato (`SIM.safeCrowd = 100`, `hitPerExtra = 0,001`, `bossLand = 0,1`, `engageHalf`) foram ajustadas por *grid fit* contra os logs do bot (erro de dano por faixa de rounds + round de morte). A sim é determinística por seed (`tests/sim.test.ts`).

`bun scripts/playtest-bot.ts --url <url> --heroes jack,bob,lucia --levels 1,10 --runs 2 --react 0.2 --mistakes 0.05 --upgrades all:2 --potions --json out.jsonl` joga o build real: cérebro dentro da página (escolhe a cada frame a direção de menor "perigo" entre 8, mantém o inimigo mais próximo no alcance da arma quando o HP > 50%, luta contra o boss no alcance e sai da frente na preparação, desvia de projéteis, poças e obstáculos), usa o superpoder em boss/multidão, escolhe cartas pela política, injeta level/pontos/poções/upgrades pelo save e roda N substeps por frame (`--speed 4`, mesmo dt do 1×). Use um build DEV congelado (`NODE_ENV=development vite build --mode development` + `vite preview`) para editar o código sem recarregar as runs, e no máximo 2 instâncias em paralelo.

Perfis: **bot médio** = reação 0,2 s e 5% de movimentos errados (proxy de um jogador razoável); **bot hábil** = reação por frame, sem erros.

**Achados** (bot, antes desta passada): o bot hábil de level 10 com Oficina 2 chegava aos rounds 49–63; os biomas recomeçavam na volta do endless (round 31 = Antártida de novo) e a curva desabava; os bosses 10/20 eram o funil (arma mira o inimigo mais próximo, então o boss quase não apanha no meio da horda); o salto do round 10→11 somava ciclo ×1,25 à base maior dos inimigos da estação.

| O quê | Antes | Depois |
|---|---|---|
| Escala por volta do endless (a cada 30 rounds) | — | **HP ×1,6, dano ×1,5** |
| Spawn nos rounds de boss | 100% | **50%** |
| HP / dano por ciclo | ×1,25 / ×1,15 | **×1,12 / ×1,08** |
| HP do boss por ciclo | ×1,6 | **×1,35** |
| Kraken / Abominação (HP base) | 3.400 / 3.800 | **3.000 / 3.500** |
| Rajada de tinta do kraken | 45% do dano | **35%** |

**Resultados do bot médio** (build com a volta do endless, antes do ajuste de ciclo/bosses; 1–2 seeds por célula, variância alta):

| Perfil | Jack | Bob | Lucia |
|---|---|---|---|
| L1, sem Oficina/poções | 10 / 20 (boss) | 13 / 14 | 13 / 15 |
| L10, Oficina 2, poções | 14 / 20 (boss 20) | 18 / 39 | — |
| L20, Oficina 4, poções | 42 | — | — |

Com o ajuste de ciclo/bosses, a sim prevê (L10, sem Oficina): Jack ~37, Lucia ~29, Bob ~22 (a sim subestima o Bob: o bot hábil com Bob L1 chegou ao 26). 1ª run do bot médio depois do ajuste: Jack L10 morreu no boss 20 (80% de HP restante) → o kraken continua sendo o funil do Jack.

**Pendente:** (a) lote com a prioridade de alvo no boss/elite e a cura de fim de round (sistemas, `ROUND_END_HEAL`) e mais seeds; (b) velocidade dos inimigos por volta do endless (`speedMul` via mods de dificuldade); (c) conferir Bob/Lucia no bioma 2 e o boss 30.

### 10.2 Estado ao fim da sessão (passadas b5–b7, bot médio, NORMAL)

Com a prioridade de alvo boss/elite, a cura de 25% entre rounds, o alcance novo do Jack e o nerf do kraken (dano 22 → 17, patada a cada 3,2 s, rajada de 5):

| Perfil | Jack | Bob | Lucia |
|---|---|---|---|
| L1, sem Oficina/poções | 20 / 20 (boss 20) | **45 / 51** | 24 |
| L10, Oficina 2, poções | 55+ / 42 | 27 / 56+ | **24 / 26** |
| L20, Oficina 4, poções | 55+ | 68+ | (inválido) |

`+` = vivo no limite de tempo do bot. Runs da Lucia no b6 ficaram inválidas (o jogo andou ~0,3× por concorrência de CPU/GPU; repetida isoladamente, a run anda normalmente).

Contra o critério §9.1: **#1** ✗ (Lucia morre nos rounds 24–26 com L10); **#2** Jack e Bob ✓, Lucia não medida; **#3** ✗ (Bob L1 chega aos rounds 45–51: forte demais para jogador novo); **#4** ✗ (Bob L20 passou do 60; falta o `speedPerLoop` e/ou dano por volta maior); **#5** não medido.

**Próximos passos (pendentes):**
1. Lucia: +sobrevivência (HP 85 → ~100, armadura 1 → 3) e medir de novo o #1.
2. Bob: devolver parte do buff (escopeta cano duplo 8 → 7 por bago) e medir L1 com 2 seeds.
3. Endless: `speedPerLoop` 1 → ~1,1 e/ou `dmgPerLoop` 1,5 → 1,8 até o #4 passar.
4. Incluir no bot/sim os equipamentos e packs de vida (v0.1.0-beta.7, `src/data/equipment.ts`): o bot já os recebe do jogo real se forem automáticos; a sim ainda não os modela.
5. Rodar o #5 (EASY/HARD) com L10.

A política de cartas deixa de escolher a Nova Glacial como arma (ela só dispara quando o herói é atingido).
