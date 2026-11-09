# Balanceamento e simulação — Pinguin Survivors

> **Versão** 2.10 · **Data** 2026-11-08 · Documento único de balanceamento: **metodologia** (Parte A), **números e fórmulas** (Parte B, fonte espelhada de `src/data/*.ts`) e **histórico de calibração** (Parte C). Substitui `balancing.md`. Ferramentas e asserts em [sdds/SDD-013](sdds/SDD-013-balanceamento-e-simulacao.md); design em [gdd.md](gdd.md).
> Regra de ouro: **a fonte de verdade dos números é `src/data/`**; este arquivo espelha. Mudou um número, atualize os dois no mesmo commit (`balance:` no escopo).

## Índice

- [Parte A — Metodologia](#parte-a--metodologia)
  - [A1. Filosofia](#a1-filosofia)
  - [A2. Ferramentas](#a2-ferramentas)
  - [A3. Fluxo de uma passada de balanceamento](#a3-fluxo-de-uma-passada-de-balanceamento)
  - [A4. Metas e critério de saída](#a4-metas-e-critério-de-saída)
  - [A5. Perfis de bot](#a5-perfis-de-bot)
  - [A6. Balanceamento do design 1.0 (o que muda)](#a6-balanceamento-do-design-10-o-que-muda)
  - [A7. Pós-1.0: telemetria, cadência e patches](#a7-pós-10-telemetria-cadência-e-patches)
  - [A8. Checklist por mudança de número](#a8-checklist-por-mudança-de-número)
- [Parte B — Números e fórmulas](#parte-b--números-e-fórmulas)
- [Parte C — Histórico de calibração](#parte-c--histórico-de-calibração)

## Parte A — Metodologia

### A1. Filosofia

1. **Curva de poder, não parede**: o jogador deve sentir que fica forte; a morte vem de decisões ruins de build ou de posicionamento, não de um pico de dificuldade arbitrário.
2. **Jogador novo morre entre os rounds 8 e 20** no Danger 1 sem meta-progressão; **jogador com level 10 e a árvore de habilidades** (alocação automática) passa do boss 20; **jogador level 20+** só morre na volta do endless (round 31+). Esses três perfis definem tudo (§A4).
3. **Nenhuma arma/classe dominante**: em 100 runs simuladas, nenhuma arma pode aparecer em mais de 35% das builds finais nem menos de 3%.
4. **Economia fechada por run**: Fish ganho ≈ Fish gasto; reroll é luxo (≤ 15% do gasto médio).
5. **Medir antes de mexer**: toda mudança de número vem com relatório antes/depois (sim ou bot).

### A2. Ferramentas

| Ferramenta | O quê | Comando | Quando usar |
|---|---|---|---|
| **Sim headless** (`src/logic/sim/run-sim.ts`) | Modelo analítico da run com as fórmulas reais; determinística por seed; roda centenas de runs em segundos | `bun scripts/sim.ts [runs] [--rounds] [--danger d] [--hero h] [--level L]` | Comparar variantes de números rapidamente; gate de CI (`tests/sim.test.ts`) |
| **Bot de playtest** (`scripts/playtest-bot.ts`) | Joga o jogo real no Chrome (Playwright): foge do perigo, mantém alcance, usa superpoder, compra na loja pela política, escolhe cartas | `bun scripts/playtest-bot.ts --url http://localhost:4173 --heroes jack,bob,lucia --levels 1,10,20 --danger 1 --runs 2 --react 0.2 --mistakes 0.05 --json out.jsonl` | Aprovar milestones; validar o que a sim não modela (posicionamento, projéteis, poças) |
| **Metas** (`scripts/balance-goals.ts`) | Metas #1–#6 da sim numa tabela ok/BAD; `--patch v.json` aplica overrides em memória (sem editar `src/`), `--seed` troca o conjunto | `bun scripts/balance-goals.ts 100 --seed 300 --patch v.json` | Comparar variantes em paralelo |
| **Relatório** (`scripts/balance-report.ts`) | Tabelas herói × level × danger, DPS por arma, compra por item, metas ✓/✗ | `bun scripts/balance-report.ts out.jsonl` → `docs/reports/balance-<data>.md` | Fim de cada passada |
| **Perf** (`scripts/perf.ts`) | 300 inimigos + 2.000 decalques, FPS médio e p95 | `bun scripts/perf.ts --round 40` | Depois de mudanças em spawn/arena/efeitos |
| **Debug no browser** | `?skipMenu=1&hero=jack&round=12&seed=7&level=10&danger=3&weapons=…&god=1&debug=1` | — | Reproduzir uma situação específica |

Build para o bot: `NODE_ENV=development vite build --mode development && vite preview --port 4173` (edita código sem recarregar as runs). Máximo 2 instâncias de Chrome em paralelo (CPU/GPU compartilhados invalidam o tempo).

### A3. Fluxo de uma passada de balanceamento

1. **Hipótese** escrita (ex.: "Bob L1 forte demais: chega ao 45"). Registrar em `docs/reports/balance-<data>.md` §Hipótese.
2. **Sim** com a mudança candidata (A/B por seed): aceitar só se mover a métrica na direção certa sem quebrar as outras metas.
3. **Bot** nos perfis afetados (2 seeds, bot médio); se a métrica estiver dentro da faixa, aplicar em `src/data/` e neste arquivo (Parte B).
4. **Gates**: `bun test` (inclui `sim.test.ts`), `bun run lint`, `typecheck`.
5. **Commit** `balance(<escopo>): …` com o link do relatório; CHANGELOG `### Changed` → "Balance: …".
6. **Orçamento**: no máximo 3 passadas de bot por milestone (~1 h cada); se não fechar, registrar o que ficou fora e por quê.

**Modelo de comprador da sim** (`src/logic/sim/shop-policy.ts`, `playShop` com `preference`): modela um jogador médio, não um maximizador de DPS. Escolhe a oferta por softmax sobre o valor por Fish (`SHOP_POLICY.temperature` 0,15: duas ofertas parecidas dividem a compra em cerca de 2/3 e 1/3), dá +20% por arma do mesmo set já na build, e cada run tem um "gosto" fixo por seed (multiplicador 0,8 a 1,2 por arma). O bot do jogo real usa a política gulosa (`nextShopAction`).

### A4. Metas e critério de saída

Medidas com **bot médio**, **Danger 1**, seeds 100 e 101, build DEV congelado.

| # | Perfil | Meta | Status |
|---|---|---|---|
| 1 | L1, árvore vazia, sem poções, arma inicial padrão | mediana de morte entre os rounds **8 e 20**; nenhum herói passa do 30 | ✓ na sim com a loja de evolução (2026-11-08, ADR-021, 400 seeds em 4 conjuntos): medianas 18–19 / 18 / 16–17, ≤ 1% das runs passa do 30 (`bun scripts/balance-goals.ts`; com 100 seeds, "nenhuma run" é lido como ≤ 1%). Antes: 18 / 18 / 16, máx. 27. Bot real com a raridade e os drops (13 runs): jack 10 (4 runs), bob 24 (3 runs), **lucia 6 (6 runs, 2 mortes no round 3)** antes do ajuste; com Lucia HP base 85→100 e armadura 1→3: sim 18 / 18 / 17 e bot real **lucia 14 (6 runs: 3, 13, 13, 15, 17, 34)**, acima do piso |
| 2 | L10 + árvore automática + gambits | cada herói passa do boss 20 em ≥ 1 de 2 seeds; **≤ 5% das runs morrem antes do round 12** (o boss do 10 faz 2–3% de mortes por variância de seed) | ✓ na sim com a loja de evolução (2026-11-08): morte antes do 12 em 0–1%; medianas L10 31 / 31 / 26–27 |
| 3 | L20 + árvore automática + gambits | os 3 heróis passam do round 30; morrem antes do 60 | ✓ na sim com a loja de evolução (2026-11-08, 400 seeds): medianas L20 32 / 31 / 31; passam do 60 em 0–1% (antes do `hpPerLoop` 4,5: 18–44%) |
| 4 | Danger 0 vs 5 (L10) | D0 chega ≥ 5 rounds além de D1; D5 morre ≤ round 15 | ✓ na sim com a loja de evolução (2026-11-08): D0 33–61, D1 26–31, D5 10–15 (D5 dano ×1,6); curva D0→D5 monótona em todo herói e level |
| 5 | Diversidade de build (sim, 100 runs/herói, L10, D1) | **toda arma de loja aparece em ≥ 3% das builds de pelo menos um herói.** Os limites de 35% por arma e 50% por set dentro de cada herói são **exceção justificada**: com ~15 armas candidatas para 5 vagas livres a média por arma já é ~33%, e o bônus de classe (`tagMul`) é intencional | ✓ (2026-11-08): nenhuma arma abaixo de 3%. Exceção medida: armas líderes de 63% a 69% por herói (jack `hammer`, bob `elementStaff`, lucia `flameRing`), sets de 74% a 93% |
| 6 | Economia (sim) | Fish gasto / ganho entre 0,85 e 1,0; reroll ≤ 15% do gasto | ✓ na sim com a loja de evolução (2026-11-08): 0,851–0,859, reroll 0–0,2%. Ressalva: a sim só compra armas; equipamento, suporte e poção (o resto do gasto no jogo real) não entram |
| 7 | Duração | run L1 mediana 10–18 min (tempo de jogo + 45 s por loja/cartas); demo completa 12–25 min (mesmo critério, SDD-006 A5) | ✓ com o bot real (2026-11-08, raridade I–V, 13 runs L1 D1): mediana 13,1 min (tempo de jogo 6,3 min + 45 s por loja). Demo: `docs/reports/demo-time-2026-11-08.md` ✓ |
| 8 | Performance | ≥ 58 FPS médios, p95 ≤ 18 ms, 300 inimigos + 2.000 decalques, 1920×1080, round 40 | ✓ (2026-11-08, `bun scripts/perf.ts --round 40`, 3 medições mudas): 58 / 59 / 59 FPS, p95 16,8 ms (`docs/reports/perf-2026-11-08.jsonl`) |

Milestone **"Balance 1.0"** fecha quando #1–#8 passam ou o orçamento de 3 passadas acaba (registrar exceções).

### A5. Perfis de bot

| Perfil | Flags | Representa |
|---|---|---|
| Bot médio | `--react 0.2 --mistakes 0.05` | jogador razoável |
| Bot hábil | `--react 0 --mistakes 0` | jogador experiente |
| Bot novato | `--react 0.35 --mistakes 0.12 --shop-policy greedy` | primeira sessão |

Política de loja padrão: maior DPS/preço na classe favorita do herói, fundir quando possível, reroll só se sobrar > 2× o preço médio, equipamento quando o slot está vazio.

### A6. Balanceamento do design 1.0 (o que muda)

Impacto das decisões de 2026-11-08 ([brainstorming.md](brainstorming.md)) sobre a Parte B:

- **6 slots iguais e tiers I–IV** (ADR-005): o DPS do herói passa a crescer pela loja, não por cartas de evolução. A Parte B §6 precisa de uma tabela por arma × tier; ponto de partida: tier I = valores atuais das secundárias; tier IV ≈ 3,5× o tier I em DPS (Brotato escala ~1,6×/tier, aqui 4 tiers em 20 rounds).
- **Loja e Fish da run** (ADR-006/007): a renda de Fish por round define o ritmo de compra. Alvo: 1 compra de arma a cada ~2 rounds até o round 12, 1 fusão a cada ~4 rounds depois.
- **Arena quadrada** (ADR-003): densidade de inimigos por área cai conforme a arena cresce; `spawnRate(N)` precisa ser reavaliado com a área (`side²`). Hipótese inicial: manter `spawnRate` e aceitar menor densidade no round 31+ como alívio antes da volta do endless.
- **Danger 0–5** (ADR-008): substitui EASY/NORMAL/HARD; multiplicadores iniciais em SDD-005 RF-01. **Danger 0 = 0,5×** de vida e dano dos inimigos (2026-11-08, pedido do desenvolvedor; antes 0,8×); velocidade 0,95× e drops 0,9× seguem.
- **Cartas só de stat** (4 opções): a curva de stats por round sobe (mais cartas de stat por run). Compensar reduzindo o multiplicador de raridade em ~10% se o #1 estourar.
- **Sem arma assinada**: multiplicadores por classe do herói continuam; o Jack com 6 armas melee tem +30% em tudo: observar meta #5.

### A7. Pós-1.0: telemetria, cadência e patches

- **Telemetria local opt-in** (`save.telemetry`, SDD-013 RF-05): `runEnd {version, hero, danger, level, round, weapons, cause, durationS, platform}`; o jogador pode exportar e enviar voluntariamente (formulário/Discord). Sem servidor na 1.0.
- **Leaderboards Steam** (por herói × danger) dão a distribuição real de melhor round: usar p50 e p90 como termômetro.
- **Reviews e Discord**: classificar feedback em "arma fraca/forte", "danger X injusto", "boss Y", "economia". Toda reclamação repetida 3× vira hipótese (§A3).
- **Cadência**: patch de balanceamento no máximo a cada **2 semanas**; hotfix só para exploits (ex.: arma com dano infinito). Cada patch: relatório antes/depois no `docs/reports/`, `### Changed` → "Balance:" no CHANGELOG, versão PATCH.
- **Compatibilidade**: mudanças de dados nunca invalidam saves; mudanças de schema seguem a migração (SDD-005).
- **Conteúdo novo** (bioma, armas, herói): entra com a própria passada de balanceamento e metas #1–#7 remedidas.

### A8. Checklist por mudança de número

- [ ] Hipótese e métrica alvo escritas.
- [ ] Sim A/B (mesmas seeds) anexada ao relatório.
- [ ] Bot nos perfis afetados (2 seeds).
- [ ] `src/data/*` e Parte B atualizados no mesmo commit.
- [ ] `bun test` (inclui `sim.test.ts`), `lint`, `typecheck` verdes.
- [ ] CHANGELOG `### Changed` → "Balance: …".
- [ ] Relatório em `docs/reports/balance-<data>.md`.

## Parte B — Números e fórmulas

> Espelho de `src/data/*.ts` no estado de 2026-09-27 (design isométrico, arma assinada, EASY/NORMAL/HARD). Itens marcados **[1.0: revisar]** mudam com as SDDs 001–005; tabela por arma × tier (§6) e bônus de set (§4.3) seguem a SDD-002, reespelhados em 2026-11-08.

### 1. Rounds

| Regra | Valor |
|---|---|
| Duração do round N (não boss) | `20 + 5·(N−1)` s, sem teto (2026-11-08) |
| Boss | rounds `N % 5 == 0`; limite `120 + 60·(N/5 − 1)` s (round 5: 2 min, 10: 3 min, 15: 4 min…); timeout = game over; vida do boss `× 2^(N/5 − 1)` (`bossHpPerBoss` 2: round 5 ×1, 10 ×2, 15 ×4, 20 ×8) |
| Elite roxo (2×) | rounds `N % 3 == 0` e não boss; 8% dos spawns do round |
| Elite laranja (3×) | idem, a partir do round 11; 4% dos spawns |
| Elite | HP ×2 / ×3, dano ×2 / ×3, escala visual 1,25 / 1,4, drop garantido de Fish |

### 2. Escala dos inimigos

- `hpMul(N) = (1 + 0,15·(N−1)) · 1,3^ciclo · 4,5^volta`, com `ciclo = floor((N−1)/10)` e `volta = floor((N−1)/30)` (endless: a cada volta completa pelos 3 biomas)
- `dmgMul(N) = (1 + 0,26·(N−1)) · 1,15^ciclo · 1,6^volta` (`src/data/rounds.ts`: `dmgPerRound` 0,26, `dmgPerCycle` 1,15 (era 1,08; `hpPerCycle` era 1,12), `dmgPerLoop` 1,6, `hpPerLoop` 4,5; 2026-11-08, loja de evolução, ADR-021: o endless passou a escalar pela vida para segurar builds com IV e V)
- `spawnRate(N)` (inimigos/s) = `min(1,5 + 0,5·N, 25)`; **×0,5 nos rounds de boss** (a luta é contra o boss; a arma mira o inimigo mais próximo); teto de **300 vivos** [1.0: revisar]
- Bosses: HP base × `1,35^ciclo` (round 10 ×1, 20 ×1,35, 30 ×1,82…)
- Biomas da campanha: rounds 1–10 Antártida, 11–20 floresta, 21–30 cidade destruída (ADR-016); no endless, a cada 10 rounds a seed sorteia entre os cinco biomas, incluindo estação e cidade em ruínas legados (`src/logic/biome.ts`). Os inimigos dos biomas 2–3 já têm base maior, por isso o salto por ciclo é pequeno.

#### 2.1 Antártida (rounds 1–10)

| Inimigo (id) | Comportamento | HP | Vel. (u/s) | Dano | Raio | XP | Desde o round | Peso |
|---|---|---|---|---|---|---|---|---|
| zombiePenguin | perseguidor | 12 | 80 | 4 | 10 | 1 | 1 | 10 |
| zombieSkua | voador | 10 | 115 | 3 | 9 | 1 | 2 | 5 |
| zombieSeal | tanque | 45 | 40 | 8 | 16 | 3 | 3 | 4 |
| zombieScientist | à distância (220 u, 2,5 s) [1.0: revisar] | 20 | 55 | 6 | 11 | 2 | 4 | 3 |
| bloaterPenguin | explosivo (40 u) | 18 | 60 | 14 | 12 | 2 | 5 | 3 |
| zombieWalrus | investida (200 u, 4 s) | 60 | 50 | 12 | 18 | 4 | 7 | 2 |

#### 2.2 Floresta (rounds 11–20) — proposta, ADR-016 [1.0: calibrar]

Papéis iguais aos da campanha antiga; números copiados do papel equivalente (enxame ← ratos, voador ← gaivota, tanque ← leão-marinho, à distância ← médico, explosivo ← bloater de combustível, investida ← narval). Números marcados [1.0: calibrar] no título da tabela.

| Inimigo (id) | Comportamento | HP | Vel. (u/s) | Dano | Raio | XP | Desde o round | Peso |
|---|---|---|---|---|---|---|---|---|
| zombieWolf | enxame (rápido e frágil) | 8 | 130 | 3 | 7 | 1 | 11 | 6 |
| zombieCrow | voador | 12 | 125 | 4 | 9 | 1 | 11 | 5 |
| zombieMoose | tanque | 60 | 45 | 10 | 17 | 3 | 12 | 4 |
| zombieFox | à distância (240 u, 2,2 s) [1.0: revisar] | 24 | 55 | 7 | 11 | 2 | 13 | 3 |
| sporeBloater | explosivo (42 u) | 22 | 62 | 16 | 12 | 2 | 14 | 3 |
| zombieBoar | investida (220 u, 3,5 s) | 70 | 55 | 14 | 18 | 4 | 16 | 2 |

#### 2.3 Cidade destruída (rounds 21–30) — proposta, ADR-016 [1.0: calibrar]

Papéis iguais aos da campanha antiga; números copiados do papel equivalente (enxame ← ratos, voador ← pombo, tanque ← policial de choque, à distância ← soldado, explosivo ← bloater ácido, investida ← brutamontes). Os aliens são originais (ADR-016 decisão 4).

| Inimigo (id) | Comportamento | HP | Vel. (u/s) | Dano | Raio | XP | Desde o round | Peso |
|---|---|---|---|---|---|---|---|---|
| acidSwarmer | enxame (rápido e frágil, rastro de ácido) | 8 | 130 | 3 | 7 | 1 | 21 | 6 |
| alienFlyer | voador | 14 | 125 | 5 | 9 | 1 | 22 | 4 |
| armorGuard | tanque | 80 | 45 | 12 | 16 | 3 | 22 | 4 |
| camoStalker | à distância (260 u, 2 s) [1.0: revisar] | 30 | 60 | 8 | 11 | 2 | 23 | 3 |
| cystBloater | explosivo (44 u) | 26 | 64 | 18 | 12 | 2 | 24 | 3 |
| clawCharger | investida (220 u, 3,5 s) | 90 | 55 | 16 | 19 | 5 | 26 | 2 |

#### 2.4 Bosses (pool rotativo)

Campanha: urso polar (10), Alce-rei zumbi (20, proposta [1.0: calibrar]) e Colosso biomecânico (30, proposta [1.0: calibrar]). Os bosses legados kraken e abomination entram só no endless (ADR-016 decisão 7).

| Boss | Round | HP base | Vel. | Dano | Raio | Alcance | Recarga | Padrão |
|---|---|---|---|---|---|---|---|---|
| polarBear | 10 (+30·k) | 3000 | 70 | 25 | 40 | 90 u | 3 s | patada 0,4 s de preparo, alcance ×1,3; investida a cada 8 s; rugido a cada 12 s invoca 6× zombiePenguin |
| mooseKing [1.0: calibrar] | 20 (+30·k) | 3000 | 70 | 25 | 40 | 90 u | 3 s | mesmo papel do urso polar (proposta): investida de chifres a cada 8 s; rugido a cada 12 s invoca 6× zombieWolf |
| biomechColossus [1.0: calibrar] | 30 (+30·k) | 3500 | 80 | 28 | 42 | 95 u | 2,6 s | mesmo papel da abominação (proposta): investida a cada 5 s; 4 poças de ácido a cada 6 s; rugido a cada 13 s invoca 10× acidSwarmer |
| kraken (legado, endless) | 20 (+30·k) | 3000 | 45 | 22 | 44 | 150 u | 2,6 s | patada 0,55 s de preparo, alcance ×1,2; rajada de 7 projéteis a cada 4 s; rugido a cada 14 s invoca 6× zombieSailor |
| abomination (legado, endless) | 30 (+30·k) | 3500 | 80 | 28 | 42 | 95 u | 2,6 s | patada 0,35 s de preparo, alcance ×1,3; investida a cada 5 s; 4 poças de ácido a cada 6 s; rugido a cada 13 s invoca 10× zombieRat |

Rajada do kraken: 170 u/s, alcance 520 u [1.0: revisar], dano 35% do dano do boss. Poças da abominação: raio 46 u, 4 s, 35% do dano do boss por segundo.

Spawn: ponto aleatório no perímetro da área **visível real** + 48 px (ultrawide incluso). [1.0: revisar]

#### 2.5 Legado do endless: estação de pesquisa / porto (ADR-016 decisão 7)

| Inimigo (id) | Comportamento | HP | Vel. (u/s) | Dano | Raio | XP | Desde o round | Peso |
|---|---|---|---|---|---|---|---|---|
| zombieSailor | perseguidor | 16 | 85 | 5 | 10 | 1 | 11 | 10 |
| zombieGull | voador | 12 | 125 | 4 | 9 | 1 | 11 | 5 |
| zombieSeaLion | tanque | 60 | 45 | 10 | 17 | 3 | 12 | 4 |
| zombieMedic | à distância (240 u, 2,2 s) [1.0: revisar] | 24 | 55 | 7 | 11 | 2 | 13 | 3 |
| fuelBloater | explosivo (42 u) | 22 | 62 | 16 | 12 | 2 | 14 | 3 |
| zombieNarwhal | investida (220 u, 3,5 s) | 70 | 55 | 14 | 18 | 4 | 16 | 2 |

#### 2.6 Legado do endless: cidade em ruínas (ADR-016 decisão 7)

| Inimigo (id) | Comportamento | HP | Vel. (u/s) | Dano | Raio | XP | Desde o round | Peso |
|---|---|---|---|---|---|---|---|---|
| zombieCitizen | perseguidor | 20 | 85 | 6 | 10 | 1 | 21 | 9 |
| zombieRat | perseguidor | 8 | 130 | 3 | 7 | 1 | 21 | 6 |
| zombiePigeon | voador | 14 | 125 | 5 | 9 | 1 | 22 | 4 |
| zombieRiotCop | tanque | 80 | 45 | 12 | 16 | 3 | 22 | 4 |
| zombieSoldier | à distância (260 u, 2 s) [1.0: revisar] | 30 | 60 | 8 | 11 | 2 | 23 | 3 |
| acidBloater | explosivo (44 u) | 26 | 64 | 18 | 12 | 2 | 24 | 3 |
| zombieBrute | investida (220 u, 3,5 s) | 90 | 55 | 16 | 19 | 5 | 26 | 2 |

### 3. Combate

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

### 4. Heróis (level 1)

| Stat | Jack | Bob | Lucia |
|---|---|---|---|
| HP | **140** | 110 | 100 |
| Regen/s | 0,8 | 0,4 | 0,5 |
| Armadura | **12** | 4 | 5 |
| Vel. movimento (u/s) | **95** (lento) [1.0: revisar] | **135** (rápido) | 115 |
| Dodge | 3% | **12%** | 6% |
| Parry | **15%** | 0% | 0% |
| Crítico | 5% | **12%** | 5% |
| Dano crítico | 150% | 175% | 150% |
| Resist. (fogo/terra/gelo/energia) | 0/10/5/0 | 5/0/5/0 | 10/10/10/10 |
| Mult. dano **melee** | **×1,30** | ×0,70 | ×0,80 |
| Mult. dano **fogo** | ×1,00 | **×1,30** | ×0,85 |
| Mult. dano **magia** | ×0,65 | ×1,00 | **×1,45** |

Os multiplicadores por tag valem para a arma assinada, secundárias e cartas de magia (incluindo as de outras tags que o herói pegar).

**Crescimento automático por level** (somado ao valor base): Jack +4 HP, +0,4 armadura, +0,1% parry · Bob +2,5 HP, +0,3% crítico, +0,1% dodge · Lucia +3 HP, +0,8% dano mágico (2026-11-08, loja de evolução: antes +1,5 e +0,6%).
**Ponto de stat** (1 por level): +1% vel. de ataque · +0,1 regen/s · +1 armadura · +1% resist. elemental (escolhe o elemento) · +0,5% dodge · +0,5% parry · +0,5% crítico · +5 HP.

#### 4.1 Cartas exclusivas (valores de nível 1; +50% por nível até 5)

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

#### 4.2 Superpoderes

| Regra | Valor |
|---|---|
| Desbloqueio | level 5 do herói |
| Carga | 100 abates (qualquer inimigo; elite conta 3, boss não conta); persiste entre rounds da mesma run |
| Colheita Rubra (Jack) | 3 s; 800% do dano da arma/s; raio 180 u; puxa 60 u/s; sangramento 5 acúmulos |
| Bombardeio (Bob) | 16 explosões em 2,5 s na área visível [1.0: revisar]; 600% do dano da arma cada; raio 80 u; queimadura |
| Cataclismo Elemental (Lucia) | 4 s; 1000% do dano mágico distribuído; raio 260 u; aplica os 4 elementos |
| Invulnerabilidade | durante a animação (0,8 s) |

#### 4.3 Bônus de set

Só o maior patamar atingido vale. Valores são totais por patamar (`SET_BONUSES` em `src/data/sets.ts`). [1.0: calibrar no T2.10]

| Set | Armas | 2 armas | 4 armas | 6 armas |
|---|---|---|---|---|
| blade | machete, knives, bladeWhirl | chance de sangramento +5% | chance de sangramento +12% | chance de sangramento +25% |
| blunt | hammer | armadura +2 | armadura +5 | armadura +10 |
| thrown | knives, fishBoomerang | vel. de ataque +5% | vel. de ataque +12% | vel. de ataque +25% |
| gun | doubleBarrel, auxPistol, crossbow, droneSentinel | crítico +4% | crítico +10% | crítico +20% |
| explosive | molotov, mine, grenadeBelt | área +10% | área +22% | área +40% |
| elemental | molotov, elementStaff, iceShards, flameRing | chance de queimadura +5% + chance de gelo +5% | chance de queimadura +12% + chance de gelo +12% | chance de queimadura +25% + chance de gelo +25% |
| support | droneSentinel, poisonCloud, lightningTotem | regen +1/s | regen +2,5/s | regen +5/s |

### 5. XP e level (persistente)

- `xpToNext(L) = floor(30 · L^1,55 + 50)`; level máximo 100.
- Meta de ritmo: level 10 na 3ª run, level 30 em ~15 runs, level 100 em ~150 runs (validar na sim).
- Orbe de XP: inimigo comum 1, elite roxo 5, elite laranja 10, boss 100; × `(1 + 0,05·N)`.

### 6. Armas (17 linhas × 4 tiers)

> Espelho de `src/data/weapons.ts` em 2026-11-08 (export `WEAPON_LINES`). Tiers I–IV: dano, cooldown, alcance e raio multiplicados por `TIER_SCALE`; tier III+ ganha +1 perfuração em armas que a têm.

**DPS aprox.** = dano / cooldown. Não conta projéteis por ativação, perfuração, área, crítico nem status. [1.0: calibrar no T2.10]

| Arma | Classe | Sets | Tier | Dano [1.0: calibrar no T2.10] | Cooldown (s) [1.0: calibrar no T2.10] | Alcance (u) [1.0: calibrar no T2.10] | DPS aprox. [1.0: calibrar no T2.10] |
|---|---|---|---|---|---|---|---|
| machete | melee | blade | I | 9 | 0,71 | 150 | 12,6 |
| machete | melee | blade | II | 14 | 0,68 | 158 | 20,6 |
| machete | melee | blade | III | 20 | 0,64 | 165 | 31,1 |
| machete | melee | blade | IV | 28 | 0,63 | 173 | 44,5 |
| hammer | melee | blunt | I | 14 | 1,2 | 120 | 11,7 |
| hammer | melee | blunt | II | 21 | 1,14 | 126 | 18,4 |
| hammer | melee | blunt | III | 31 | 1,08 | 132 | 28,7 |
| hammer | melee | blunt | IV | 43 | 1,06 | 138 | 40,7 |
| knives | melee | blade + thrown | I | 13 | 1,2 | 240 | 10,8 |
| knives | melee | blade + thrown | II | 20 | 1,14 | 252 | 17,5 |
| knives | melee | blade + thrown | III | 29 | 1,08 | 264 | 26,9 |
| knives | melee | blade + thrown | IV | 40 | 1,06 | 276 | 37,9 |
| fishBoomerang | melee | thrown | I | 13 | 1,8 | 200 | 7,2 |
| fishBoomerang | melee | thrown | II | 20 | 1,71 | 210 | 11,7 |
| fishBoomerang | melee | thrown | III | 29 | 1,62 | 220 | 17,9 |
| fishBoomerang | melee | thrown | IV | 40 | 1,58 | 230 | 25,3 |
| bladeWhirl | melee | blade | I | 6 | 0,4 | 70 | 15 |
| bladeWhirl | melee | blade | II | 9 | 0,38 | 74 | 23,7 |
| bladeWhirl | melee | blade | III | 13 | 0,36 | 77 | 36,1 |
| bladeWhirl | melee | blade | IV | 19 | 0,35 | 81 | 54 |
| doubleBarrel | firearm | gun | I | 7 | 0,91 | 220 | 7,7 |
| doubleBarrel | firearm | gun | II | 11 | 0,86 | 231 | 12,7 |
| doubleBarrel | firearm | gun | III | 15 | 0,82 | 242 | 18,3 |
| doubleBarrel | firearm | gun | IV | 22 | 0,8 | 253 | 27,5 |
| auxPistol | firearm | gun | I | 9 | 0,6 | 240 | 15 |
| auxPistol | firearm | gun | II | 14 | 0,57 | 252 | 24,6 |
| auxPistol | firearm | gun | III | 20 | 0,54 | 264 | 37 |
| auxPistol | firearm | gun | IV | 28 | 0,53 | 276 | 53 |
| crossbow | firearm | gun | I | 20 | 1,4 | 320 | 14,3 |
| crossbow | firearm | gun | II | 30 | 1,33 | 336 | 22,6 |
| crossbow | firearm | gun | III | 44 | 1,26 | 352 | 34,9 |
| crossbow | firearm | gun | IV | 62 | 1,23 | 368 | 50,3 |
| molotov | firearm | explosive + elemental | I | 4 | 3 | 220 | 1,3 |
| molotov | firearm | explosive + elemental | II | 6 | 2,85 | 231 | 2,1 |
| molotov | firearm | explosive + elemental | III | 9 | 2,7 | 242 | 3,3 |
| molotov | firearm | explosive + elemental | IV | 12 | 2,64 | 253 | 4,5 |
| mine | firearm | explosive | I | 24 | 2,5 | 30 | 9,6 |
| mine | firearm | explosive | II | 36 | 2,38 | 32 | 15,2 |
| mine | firearm | explosive | III | 53 | 2,25 | 33 | 23,6 |
| mine | firearm | explosive | IV | 74 | 2,2 | 35 | 33,6 |
| grenadeBelt | firearm | explosive | I | 33 | 5 | 240 | 6,6 |
| grenadeBelt | firearm | explosive | II | 50 | 4,75 | 252 | 10,5 |
| grenadeBelt | firearm | explosive | III | 73 | 4,5 | 264 | 16,2 |
| grenadeBelt | firearm | explosive | IV | 102 | 4,4 | 276 | 23,2 |
| droneSentinel | firearm | gun + support | I | 6 | 0,33 | 220 | 18 |
| droneSentinel | firearm | gun + support | II | 9 | 0,32 | 231 | 28,4 |
| droneSentinel | firearm | gun + support | III | 13 | 0,3 | 242 | 43,3 |
| droneSentinel | firearm | gun + support | IV | 19 | 0,29 | 253 | 64,8 |
| elementStaff | magic | elemental | I | 16 | 0,77 | 260 | 20,8 |
| elementStaff | magic | elemental | II | 24 | 0,73 | 273 | 32,9 |
| elementStaff | magic | elemental | III | 35 | 0,69 | 286 | 50,7 |
| elementStaff | magic | elemental | IV | 50 | 0,68 | 299 | 73,5 |
| iceShards | magic | elemental | I | 8 | 0,5 | 60 | 16 |
| iceShards | magic | elemental | II | 12 | 0,47 | 63 | 25,3 |
| iceShards | magic | elemental | III | 18 | 0,45 | 66 | 40 |
| iceShards | magic | elemental | IV | 25 | 0,44 | 69 | 56,8 |
| flameRing | magic | elemental | I | 3 | 0,4 | 75 | 7,5 |
| flameRing | magic | elemental | II | 5 | 0,38 | 79 | 13,2 |
| flameRing | magic | elemental | III | 7 | 0,36 | 83 | 19,4 |
| flameRing | magic | elemental | IV | 9 | 0,35 | 86 | 25,6 |
| lightningTotem | magic | support | I | 16 | 7 | 170 | 2,3 |
| lightningTotem | magic | support | II | 24 | 6,65 | 179 | 3,6 |
| lightningTotem | magic | support | III | 35 | 6,3 | 187 | 5,6 |
| lightningTotem | magic | support | IV | 50 | 6,16 | 195 | 8,1 |
| poisonCloud | magic | support | I | 6 | 4 | 230 | 1,5 |
| poisonCloud | magic | support | II | 9 | 3,8 | 242 | 2,4 |
| poisonCloud | magic | support | III | 13 | 3,6 | 253 | 3,6 |
| poisonCloud | magic | support | IV | 19 | 3,52 | 265 | 5,4 |

### 7. Cartas

- Raridade por round (comum/rara/épica/lendária): `[70, 22, 7, 1]%` no round 1 → `[40, 35, 18, 7]%` no round 30 (interpolação linear) + sorte.
- Stat por raridade: multiplicador ×1 / ×1,6 / ×2,4 / ×3,5 sobre o valor base da carta.
- Evolução T2: aparece com 100% de chance na 1ª escolha após vencer o boss 10; T3 após o boss 20.

### 8. Economia (Fish 🐟)

| Fonte | Fish |
|---|---|
| Inimigo comum | 5% de chance de 1 |
| Elite roxo / laranja | 3 / 6 garantidos |
| Fim de round | `2 + floor(N/2)` |
| Boss | `25 · (1 + ciclo)` |

| Poção de gambit (Pérolas) | Preço |
|---|---|
| Antídoto | 15 |
| Escudo / Pressa / Fúria | 25 |

Cura e Mega Cura saíram: a cura é a **poção de cura da run** e os **itens de suporte** (SDD-014), vendidos na loja em Fish.

| Loja (Fish, mais `2 × round`) | Preço | Efeito |
|---|---|---|
| Poção de cura (nível 1 a 10) | 16 por nível | carrega `nível` poções, bebe a ≤ 50% de vida, 2 s entre poções, todas vazias no início de cada round, uma enche a cada 100 abates; cura 25 / 30 / 35 / 40 / 50% por raridade I a V |
| Item de suporte (nível 1 a 5) | 14 por nível | Magnético: raio 40 a 200 u, puxada ×1,25 a ×2,8; Botas: +4 a +20 de velocidade; Sorte: +3% a +15% |

Drops de melhoria da poção: Elite 12% por abate (II ou III), Boss 100% (IV ou V). Fatia da loja por tipo (`kindShare`): suporte 12% e poção de cura 10%, renormalizadas com o que a prateleira tem.

> A sim (`scripts/sim.ts`) não modela loja, poções nem suporte; a entrega da frente (2026-11-08) não mexe nela: `--report` com 100 runs deu #1 18 / 18 / 17 e #6 0,885, sem regressão (metas #1 a #6 inalteradas). Cura, preços e drops novos só têm teste unitário e playtest; calibrar com o bot (`bun scripts/playtest-bot.ts`) quando houver tempo.

### 8b. Oficina (removida — substituída pela árvore de habilidades, ADR-019)

> Histórico: a Oficina e os pontos de stat saíram em 2026-11-08. A meta-progressão agora é a árvore por herói (`src/data/skill-tree.ts`): passiva menor = 1,5× um antigo ponto de stat, notáveis 2–4 stats, pedras-chave com custo. A sim e o bot usam `autoAllocate` (ordem `SIM_BRANCH_ORDER`). Resultado da sim com a árvore (2026-11-08): #1 18/18/17, #2 ✓, #3 33/33/32, #4 D0 58 / D1 31 / D5 10, #5 ✓, #6 0,888. O texto abaixo descreve o modelo antigo.

Compartilhados pelos heróis; aplicados aos stats iniciais de toda run. Preço do nível L+1 = `base · crescimento^L`.

| Upgrade | Stat | Por nível | Nível máx. | Preço base | Crescimento |
|---|---|---|---|---|---|
| vitality | maxHp | +3 | 10 | 30 | ×1,35 |
| might | damage | +0,018 | 10 | 40 | ×1,4 |
| haste | attackSpeed | +0,012 | 10 | 40 | ×1,4 |
| plating | armor | +0,6 | 8 | 35 | ×1,4 |
| recovery | regen | +0,06 | 8 | 35 | ×1,4 |
| swiftness | moveSpeed | +1,8 | 5 | 45 | ×1,5 |
| magnet | pickupRange | +4,8 | 5 | 25 | ×1,4 |
| wisdom | xpGain | +0,024 | 10 | 45 | ×1,4 |
| fortune | luck | +0,012 | 5 | 60 | ×1,5 |
| insight | cardRerolls | +1 | 1 | 80 | ×1 |

Bônus por nível ×0,6 em relação ao desenho original (balance-proposal-2026-11-08: a Oficina cheia no L20 batia o teto de 60 rounds); `insight` é uma contagem de rerolls de carta por run.

A loja de extras das conquistas (`ACHIEVEMENT_SHOP`, P-61) soma no máximo +10 HP, +0,2 regen, +1 armadura, +1% crítico, +10% dano crítico, +1% esquiva, +1% aparar, +2% vel. de ataque, +2% dano e +5 vel.; é pequena demais para mudar a curva e fica fora da sim.

### 9. Metas de sessão

- Run média de um jogador novo: morrer entre os rounds 6 e 9 (5–7 min).
- Boss do round 10 vencível por ~50% dos jogadores com Jack level 5–8.
- 60 FPS com 300 inimigos + 2.000 decalques de sangue. [1.0: revisar]

#### 9.1 Critério de saída do balanceamento (milestone "Balance 1.0")

O trabalho de balanceamento da frente `wt/balance` **termina** quando o lote abaixo passar, ou quando o orçamento acabar (o que vier primeiro). Medido com o **bot médio** (`--react 0.2 --mistakes 0.05`, dificuldade NORMAL, seeds 100 e 101, build DEV congelado):

| # | Perfil | Meta |
|---|---|---|
| 1 | L10 + árvore automática + poções | cada herói passa do round 30 (vence o boss 30) em **≥ 1 de 2 seeds**, e nenhum herói morre antes do round 20 em ambas |
| 2 | L20 + árvore automática + poções | os 3 heróis passam do round 30 |
| 3 | L1 sem árvore/poções (jogador novo) | mediana de morte entre os rounds **8 e 20** (nenhum herói passa do 30) |
| 4 | Endless (L20) | a run termina antes do round 60 (a volta do endless mata) [1.0: revisar] |
| 5 | EASY / HARD (L10, 1 seed) | EASY chega pelo menos tão longe quanto NORMAL; HARD morre antes do NORMAL |

A sim (`bun scripts/sim.ts`) é só apoio: serve para comparar mudanças antes de gastar tempo no bot, não para aprovar o milestone.

**Orçamento:** no máximo **3 passadas do bot** depois da b6 (cerca de 1 h de relógio cada, 2 Chromes). Se a meta não fechar dentro disso, a frente para, integra o que tiver no `dev` e registra aqui o que ficou fora da meta e por quê.

### 8c. Raridade I–V, afixos e drops (ADR-017, `src/data/rarity.ts`, `affixes.ts`, `equipment.ts`)

- Raridade: I branco (0 afixos), II azul (1), III verde (2), IV roxo (3), V laranja (4). A loja vende só I a III; IV só cai de Elite e V só de Boss. Arma: fusão até o III.
- Valor de um afixo = `base × power × (1 + 0,25·(raridade−1)) × (1 + 0,02·round)`, com `power` = 0,3 (`AFFIX_SCALE`; calibrado com a sim, 0,5 empurrava o Bob L20 acima do round 60). Um item nunca repete o mesmo stat.
- Arma V: stats e arte do IV, dano ×`WEAPON_V_DAMAGE_MUL` (1,0).

| Afixo | Stat | Valor base (I, round 0, antes do `power`) | Escopo |
|---|---|---|---|
| damage | damage | 0,04 | arma, equipamento |
| attackSpeed | attackSpeed | 0,03 | arma, equipamento |
| crit | crit | 0,015 | arma, equipamento |
| critDamage | critDamage | 0,08 | arma, equipamento |
| area | area | 0,04 | arma |
| lifesteal | lifesteal | 0,01 | arma |
| bleedChance | bleedChance | 0,03 | arma |
| maxHp | maxHp | 6 | equipamento |
| regen | regen | 0,15 | equipamento |
| armor | armor | 0,8 | equipamento |
| moveSpeed | moveSpeed | 3 | equipamento |
| dodge | dodge | 0,01 | equipamento |
| luck | luck | 0,02 | equipamento |
| harvesting | harvesting | 0,03 | equipamento |
| xpGain | xpGain | 0,04 | equipamento |
| resistFire | resist.fire | 0,03 | equipamento |
| resistIce | resist.ice | 0,03 | equipamento |

Preços (Fish, mais `2 × round`): arma I a V = 8, 20, 45, 90, 160; equipamento I a V = 12, 30, 70, 140, 250 (IV e V só valem na venda). Drops por abate: Elite dá arma IV com 0,08% e equipamento IV com 1%; Boss dá arma V com 10% e equipamento V com 100% (1 item V garantido por Boss). As chances de arma foram calibradas com a sim (drops de arma mais frequentes empurravam #1 e #3 para fora das metas); a sim modela só os drops de arma (a sim não tem equipamento).

## Parte C — Histórico de calibração

### C-2026-11-08b. Loja de evolução (ADR-021)

A sim passou a modelar a loja de evolução: Marcas de Elite e Núcleos de Boss, pool só de upgrades e compra que substitui a cópia mais fraca. Três estagiários testaram variantes em paralelo com `bun scripts/balance-goals.ts --patch` (overrides em memória), e o resultado foi validado em 4 conjuntos de 100 seeds (100, 300, 500, 700).

| Mudança | Antes | Depois | Meta |
|---|---|---|---|
| `ROUNDS.scaling.hpPerLoop` / `dmgPerLoop` | 1,6 / 2 | 4,5 / 1,6 | #3: L20 passando do 60 caiu de 18–44% para 0–1% |
| Lucia armadura / regen / magia | 3 / 0,3 / ×1,5 | 5 / 0,5 / ×1,45 | #1: máx. L1 31 → 25–31 (≤ 1%) |
| Lucia crescimento por level | +1,5 HP, +0,6% magia | +3 HP, +0,8% magia | #3: mediana L20 27–29 → 31 |
| Danger 5 dano | ×1,5 | ×1,6 | #4: Jack D5 16 → 10 no conjunto 500 |
| `SHOP.rarityFromRound` | IV e V desde o round 1 | IV do round 11, V do 21 | bot real L1: quem comprava IV no round 4 passava do 30 (31, 42) |
| `hpPerCycle` / `dmgPerCycle` | 1,12 / 1,08 | 1,3 / 1,15 | bot real L1: builds que passavam do boss 10 não tomavam dano nenhum nos rounds 11–29 e chegavam a 30–33 |

**Sim × bot.** O bot real (L1, Danger 1, seeds 100 e 101) deu runs bimodais: morte no boss 10 ou disparo até 30–42, com 2.200+ Fish e 6 armas IV/V. A sim não reproduz isso porque não modela equipamento, poção, suporte nem a mira real; ela subestima a força do jogador do meio do jogo. Com a escala por ciclo nova, a sim mostra L20 com mediana 24–31 (abaixo da meta #3 para Bob e Lucia), mas a meta vale no jogo real: confirmar com o bot em L10/L20 antes de mexer de novo (passada em andamento na 0.7.0).

Rejeitado: tirar a raridade V da loja (`maxRarity` 4) fechava #6, mas contraria o pedido do desenvolvedor (loja I–V). O gasto/ganho da sim é pouco sensível a preço e ganho, porque o comprador da sim só compra armas e a loja de evolução fica com menos ofertas úteis no fim da run.

### C0. Calibração do design isométrico (2026-09-27)

#### 10.0 1ª passada

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

#### 10.1 2ª passada (sim calibrada + bot com build)

**Ferramentas.** `bun scripts/sim.ts [runs] [--rounds]` imprime herói × level (1/5/10/20/30) com round médio, mediana e % que passa do round 30. A sim modela secundárias, superpoder, elites, biomas, bosses rotativos e upgrades da Oficina; escolhe cartas com a mesma política do bot (`src/logic/sim/card-policy.ts`). As constantes de contato (`SIM.safeCrowd = 100`, `hitPerExtra = 0,001`, `bossLand = 0,1`, `engageHalf`) foram ajustadas por *grid fit* contra os logs do bot (erro de dano por faixa de rounds + round de morte). A sim é determinística por seed (`tests/sim.test.ts`).

`bun scripts/playtest-bot.ts --url <url> --heroes jack,bob,lucia --levels 1,10 --runs 2 --react 0.2 --mistakes 0.05 --upgrades all:2 --potions --json out.jsonl` joga o build real: cérebro dentro da página (escolhe a cada frame a direção de menor "perigo" entre 8, mantém o inimigo mais próximo no alcance da arma quando o HP > 50%, luta contra o boss no alcance e sai da frente na preparação, desvia de projéteis, poças e obstáculos), usa o superpoder em boss/multidão, escolhe cartas pela política, injeta level/pontos/poções/upgrades pelo save e roda N substeps por frame (`--speed 4`, mesmo dt do 1×). Use um build DEV congelado (`NODE_ENV=development vite build --mode development` + `vite preview`) para editar o código sem recarregar as runs, e no máximo 2 instâncias em paralelo.

Perfis: **bot médio** = reação 0,2 s e 5% de movimentos errados (proxy de um jogador razoável); **bot hábil** = reação por frame, sem erros.

**Achados** (bot, antes desta passada): o bot hábil de level 10 com Oficina 2 chegava aos rounds 49–63; os biomas recomeçavam na volta do endless (round 31 = Antártida de novo) e a curva desabava; os bosses 10/20 eram o funil (arma mira o inimigo mais próximo, então o boss quase não apanha no meio da horda); o salto do round 10→11 somava ciclo ×1,25 à base maior dos inimigos da estação.

| O quê | Antes | Depois |
|---|---|---|
| Escala por volta do endless (a cada 30 rounds) | — | **HP ×1,6, dano ×2** |
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

#### 10.2 Estado ao fim da sessão (passadas b5–b7, bot médio, NORMAL)

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
