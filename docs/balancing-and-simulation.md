# Balanceamento e simulação — Pinguin Survivors

> **Versão** 2.6 · **Data** 2026-11-08 · Documento único de balanceamento: **metodologia** (Parte A), **números e fórmulas** (Parte B, fonte espelhada de `src/data/*.ts`) e **histórico de calibração** (Parte C). Substitui `balancing.md`. Ferramentas e asserts em [sdds/SDD-013](sdds/SDD-013-balanceamento-e-simulacao.md); design em [gdd.md](gdd.md).
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
2. **Jogador novo morre entre os rounds 8 e 20** no Danger 1 sem meta-progressão; **jogador com level 10 e Oficina** passa do boss 20; **jogador level 20+** só morre na volta do endless (round 31+). Esses três perfis definem tudo (§A4).
3. **Nenhuma arma/classe dominante**: em 100 runs simuladas, nenhuma arma pode aparecer em mais de 35% das builds finais nem menos de 3%.
4. **Economia fechada por run**: Fish ganho ≈ Fish gasto; reroll é luxo (≤ 15% do gasto médio).
5. **Medir antes de mexer**: toda mudança de número vem com relatório antes/depois (sim ou bot).

### A2. Ferramentas

| Ferramenta | O quê | Comando | Quando usar |
|---|---|---|---|
| **Sim headless** (`src/logic/sim/run-sim.ts`) | Modelo analítico da run com as fórmulas reais; determinística por seed; roda centenas de runs em segundos | `bun scripts/sim.ts [runs] [--rounds] [--danger d] [--hero h] [--level L]` | Comparar variantes de números rapidamente; gate de CI (`tests/sim.test.ts`) |
| **Bot de playtest** (`scripts/playtest-bot.ts`) | Joga o jogo real no Chrome (Playwright): foge do perigo, mantém alcance, usa superpoder, compra na loja pela política, escolhe cartas | `bun scripts/playtest-bot.ts --url http://localhost:4173 --heroes jack,bob,lucia --levels 1,10,20 --danger 1 --runs 2 --react 0.2 --mistakes 0.05 --json out.jsonl` | Aprovar milestones; validar o que a sim não modela (posicionamento, projéteis, poças) |
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

### A4. Metas e critério de saída

Medidas com **bot médio**, **Danger 1**, seeds 100 e 101, build DEV congelado.

| # | Perfil | Meta | Status |
|---|---|---|---|
| 1 | L1, sem Oficina/poções, arma inicial padrão | mediana de morte entre os rounds **8 e 20**; nenhum herói passa do 30 | ✓ na sim (2026-11-08): 17 / 17 / 10, máx. 27; bot real pendente |
| 2 | L10 + Oficina `all:2` + gambits | cada herói passa do boss 20 em ≥ 1 de 2 seeds; **≤ 5% das runs morrem antes do round 12** (o boss do 10 faz 2–3% de mortes por variância de seed) | ✓ na sim (2026-11-08): jack 2%, bob 0%, lucia 2% |
| 3 | L20 + Oficina `all:4` + gambits | os 3 heróis passam do round 30; morrem antes do 60 | ✓ na sim (2026-11-08): 51 / 51 / 42 |
| 4 | Danger 0 vs 5 (L10) | D0 chega ≥ 5 rounds além de D1; D5 morre ≤ round 15 | ✓ na sim (2026-11-08): D0 53, D1 34, D5 10 |
| 5 | Diversidade de build (sim, 100 runs/herói, **medida por herói**) | dentro das builds de cada herói (L10, D1, sem a arma inicial): nenhuma arma em > 35% e nenhum set em > 50%; no geral nenhuma arma < 3% nem nunca comprada | ✗ na sim (2026-11-08): armas de 72% a 78% e sets de 80% a 97% por herói; ver `docs/reports/balance-proposal-2026-11-08.md` (passadas 2 e 3) |
| 6 | Economia (sim) | Fish gasto / ganho entre 0,85 e 1,0; reroll ≤ 15% do gasto | ✓ na sim (2026-11-08): 0,897, reroll 0,7% |
| 7 | Duração | run L1 mediana 10–18 min reais (com lojas); demo completa 12–25 min (tempo de jogo do bot + 45 s por loja/cartas, SDD-006 A5) | a medir; demo: ver `docs/reports/demo-time-2026-11-08.md` |
| 8 | Performance | 60 FPS médio, p95 ≤ 18 ms, 300 inimigos + 2.000 decalques, 1920×1080 | ✓ no iso (2026-09-27); remedir na arena |

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
- **Danger 0–5** (ADR-008): substitui EASY/NORMAL/HARD; multiplicadores iniciais em SDD-005 RF-01.
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
| Duração do round N (não boss) | `min(20 + 5·(N−1), 60)` s [1.0: revisar] |
| Boss | rounds `N % 10 == 0`; limite **180 s**; timeout = game over |
| Elite roxo (2×) | rounds `N % 3 == 0` e não boss; 8% dos spawns do round |
| Elite laranja (3×) | idem, a partir do round 11; 4% dos spawns |
| Elite | HP ×2 / ×3, dano ×2 / ×3, escala visual 1,25 / 1,4, drop garantido de Fish |

### 2. Escala dos inimigos

- `hpMul(N) = (1 + 0,15·(N−1)) · 1,12^ciclo · 1,6^volta`, com `ciclo = floor((N−1)/10)` e `volta = floor((N−1)/30)` (endless: a cada volta completa pelos 3 biomas)
- `dmgMul(N) = (1 + 0,26·(N−1)) · 1,08^ciclo · 1,5^volta` (`src/data/rounds.ts`: `dmgPerRound` 0,26, `dmgPerCycle` 1,08, `dmgPerLoop` 1,5; 2026-11-08, commit `2f822aa`)
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
| HP | **140** | 110 | **85** |
| Regen/s | 0,8 | 0,4 | 0,3 |
| Armadura | **12** | 4 | 1 |
| Vel. movimento (u/s) | **95** (lento) [1.0: revisar] | **135** (rápido) | 115 |
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

| Poção | Preço |
|---|---|
| Cura / Antídoto | 15 |
| Escudo / Pressa / Fúria | 25 |
| Mega Cura | 40 |

### 8b. Oficina (upgrades permanentes com Fish, `src/data/upgrades.ts`)

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
| 1 | L10 + Oficina `all:2` + poções | cada herói passa do round 30 (vence o boss 30) em **≥ 1 de 2 seeds**, e nenhum herói morre antes do round 20 em ambas |
| 2 | L20 + Oficina `all:4` + poções | os 3 heróis passam do round 30 |
| 3 | L1 sem Oficina/poções (jogador novo) | mediana de morte entre os rounds **8 e 20** (nenhum herói passa do 30) |
| 4 | Endless (L20) | a run termina antes do round 60 (a volta do endless mata) [1.0: revisar] |
| 5 | EASY / HARD (L10, 1 seed) | EASY chega pelo menos tão longe quanto NORMAL; HARD morre antes do NORMAL |

A sim (`bun scripts/sim.ts`) é só apoio: serve para comparar mudanças antes de gastar tempo no bot, não para aprovar o milestone.

**Orçamento:** no máximo **3 passadas do bot** depois da b6 (cerca de 1 h de relógio cada, 2 Chromes). Se a meta não fechar dentro disso, a frente para, integra o que tiver no `dev` e registra aqui o que ficou fora da meta e por quê.

## Parte C — Histórico de calibração

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
