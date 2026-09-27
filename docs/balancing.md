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
| Especialista | +25% de dano na tag do herói |
| Invulnerabilidade após ser atingido | 0,35 s |

## 4. Heróis (level 1)

| Stat | Jack | Bob | Lucia |
|---|---|---|---|
| HP | 120 | 100 | 80 |
| Regen/s | 0,6 | 0,4 | 0,4 |
| Armadura | 8 | 4 | 2 |
| Vel. movimento (u/s) | 120 | 110 | 115 |
| Dodge | 5% | 3% | 8% |
| Parry | 10% | 0% | 0% |
| Crítico | 5% | 10% | 5% |
| Resist. (fogo/terra/gelo/energia) | 0/5/5/0 | 0/0/5/0 | 10/10/10/10 |

**Crescimento automático por level** (somado ao valor base): Jack +4 HP, +0,5 armadura · Bob +3 HP, +0,4% crítico · Lucia +2 HP, +0,5% dano elemental.
**Ponto de stat** (1 por level): +1% vel. de ataque · +0,1 regen/s · +1 armadura · +1% resist. elemental (escolhe o elemento) · +0,5% dodge · +0,5% parry · +0,5% crítico · +5 HP.

## 5. XP e level (persistente)

- `xpToNext(L) = floor(30 · L^1,55 + 50)`; level máximo 100.
- Meta de ritmo: level 10 na 3ª run, level 30 em ~15 runs, level 100 em ~150 runs (validar na sim).
- Orbe de XP: inimigo comum 1, elite roxo 5, elite laranja 10, boss 100; × `(1 + 0,05·N)`.

## 6. Armas assinadas

| Arma | Tag | Dano | Cadência (/s) | Alcance | Especial |
|---|---|---|---|---|---|
| Machete (T1) | melee | 14 | 1,4 | arco 110° · 70 u | 15% sangramento |
| Katana (T2) | melee | 26 | 1,8 | arco 140° · 85 u | 25% sangramento, golpe duplo |
| Espada-motosserra (T3) | melee | 12 × 4 | 2,2 | arco 160° · 90 u | contínuo, 40% sangramento |
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
