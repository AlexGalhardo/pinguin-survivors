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

- `hpMul(N) = (1 + 0,15·(N−1)) · 1,25^ciclo`, com `ciclo = floor((N−1)/10)`
- `dmgMul(N) = (1 + 0,08·(N−1)) · 1,15^ciclo`
- `spawnRate(N)` (inimigos/s) = `min(2 + 0,6·N, 25)`; teto de **300 vivos**
- Bosses: HP base × `1,6^ciclo` quando voltam no pool rotativo

### 2.1 Inimigos da Antártida (`src/data/enemies.ts`)

| Inimigo | Comportamento | HP | Vel. (u/s) | Dano | Raio | XP | Desde o round | Peso |
|---|---|---|---|---|---|---|---|---|
| Pinguim zumbi | perseguidor | 12 | 80 | 6 | 10 | 1 | 1 | 10 |
| Skua zumbi | voador | 10 | 115 | 5 | 9 | 1 | 2 | 5 |
| Foca zumbi | tanque | 45 | 40 | 12 | 16 | 3 | 3 | 4 |
| Cientista zumbi | à distância (220 u, 2,5 s) | 20 | 55 | 8 | 11 | 2 | 4 | 3 |
| Pinguim inchado | explosivo (40 u) | 18 | 60 | 20 | 12 | 2 | 5 | 3 |
| Morsa zumbi | investida (200 u, 4 s) | 60 | 50 | 16 | 18 | 4 | 7 | 2 |
| **Urso polar zumbi** (boss) | boss (90 u, 3 s) | 3.000 | 70 | 30 | 40 | 100 | round 10 | — |

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
| Invulnerabilidade após ser atingido | 0,35 s |

## 4. Heróis (level 1)

| Stat | Jack | Bob | Lucia |
|---|---|---|---|
| HP | **140** | 100 | **70** |
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
| Machete (T1) | melee | 14 | 1,4 | arco 110° · 105 u | 15% sangramento |
| Katana (T2) | melee | 26 | 1,8 | arco 140° · 128 u | 25% sangramento, golpe duplo |
| Espada-motosserra (T3) | melee | 12 × 4 | 2,2 | arco 160° · 135 u | contínuo, 40% sangramento |
| Escopeta cano duplo (T1) | firearm | 7 × 6 bagos | 0,9 | 220 u · 30° | knockback |
| Escopeta automática (T2) | firearm | 8 × 7 | 1,6 | 240 u · 35° | perfura 1 |
| Escopeta-foguete (T3) | firearm | 10 × 7 + explosão 30 | 1,4 | 260 u | explosão em área |
| Cajado dos 4 elementos (T1) | magic | 16 | 1,1 | 260 u | alterna elemento a cada disparo |
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

## 9. Metas de sessão

- Run média de um jogador novo: morrer entre os rounds 6 e 9 (5–7 min).
- Boss do round 10 vencível por ~50% dos jogadores com Jack level 5–8.
- 60 FPS com 300 inimigos + 2.000 decalques de sangue.

## 10. Calibração (2026-09-27)

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
