# Balanceamento da progressão, rodada 2 — sim nova (2026-11-10)

Relatório do estagiário (SDD-016 RF-08), salvo pelo orquestrador. Feito com a sim atualizada (dois relógios, ataques em área, campanha de 50, peixe por abate). Só análise: nada em `src/` ou `docs/` foi editado pelo estagiário.

## Conclusão

Nenhuma variante fecha as metas. A proposta W4 abaixo **não é robusta** a ±50% em `SIM.eliteHit`, então não deve ser aplicada antes de calibrar `eliteHit` e `bossLand` contra o bot.

## Linha de base

Sim atual, Danger 1, 200 seeds, `bun scripts/balance-goals.ts 200`:

- #1: Lucia L1 mediana 10 (BAD).
- #2: Bob e Lucia morrem antes do 20 em 56–57% (BAD).
- #3: L20 mediana 20–25 e ninguém passa do 70 (BAD).
- D0−D1 e D5: ok.
- Paredes: a Cidade (21–30) mata 100% dos L10/L20 que chegam nela; a Floresta mata 81–100% no L1.

**Causa:** rounds de elite (12, 15, 18, 21, 24, 27) e bosses 30, 45 e 50. Dano médio recebido pelo Jack L10 por round: r18 381, r24 681, r27 1050. A vida do boss dobra a cada boss (r50 = ×512 do r5).

A proposta P2 do relatório anterior, rodada na sim nova: L1 mediana 24–27 (máx. 50); L10 mediana 45/30/27; Jack e Bob morrem nas Ruínas em 98–100% (boss 45). Não se sustenta.

## Proposta W4

Spawn, share e vida dos elites, Danger e durações mantidos.

| Chave | Hoje | W4 |
|---|---|---|
| `scaling.hpPerRound` | 0,15 | 0,12 |
| `scaling.dmgPerRound` | 0,26 | 0,18 |
| `scaling.hpPerCycle` | 1,3 | 1,25 |
| `scaling.dmgPerCycle` | 1,15 | 1,12 |
| `scaling.bossHpPerBoss` | 2 | 1,35 |
| `scaling.hpPerLoop` | 4,5 | 1,3 |
| `scaling.dmgPerLoop` | 1,6 | 1,25 |
| `scaling.speedPerLoop` | 1 | 1 |
| `elite.purple.damage` | 2 | 1,5 |
| `elite.orange.damage` | 3 | 2 |

**Curva W4** (hpMul / dmgMul / spawn por s): r1 1,00/1,00/2,0 · r5 1,48/1,72/2,0 · r10 2,08/2,62/3,3 · r11 2,75/3,14/7,0 · r20 4,10/4,95/5,8 · r21 5,31/5,77/12,0 · r30 7,00/7,80/8,3 · r31 8,98/8,99/17,0 · r40 11,09/11,27/10,8 · r41 14,16/12,90/22,0 · r50 16,80/15,45/12,5 · r51 27,77/22,03/25,0 · r60 32,06/25,60/12,5 · r70 46,02/33,11/12,5.

Salto 50 → 51: vida ×1,65 e dano ×1,43 (hoje ×6 e ×1,9). Vida do boss no r50: 35.745 (hoje 1.228.800).

## Metas: linha de base → W4

Jack / Bob / Lucia, 200 seeds.

| Meta | Linha de base | W4 |
|---|---|---|
| #1 L1 mediana | 18 / 18 / 10 | 24 / 24 / 24 (máx. 51 / 51 / 50) |
| #2 L10 mediana | 24 / 18 / 18 | 51 / 27 / 30 |
| #2 L10 morre antes do 20 | 3 / 56 / 57% | 0 / 3 / 1% |
| #2 L10 passa do 35 | 0 / 0 / 0% | 91 / 45 / 35% |
| #3 L20 mediana (meta 50–70) | 25 / 24 / 20 | 51 / 48 / 45 |
| #3 L20 passa do 70 | 0% | 26 / 6 / 1% |
| #4 D0 / D1 / D5 (Jack L10) | 30 / 24 / 10 | 71 / 51 / 24 (D0 no teto) |

## Morte por bioma

Percentual de quem chegou ao bioma, Danger 1, 200 seeds; linha de base → W4.

- L1 Floresta: Jack 81 → 25, Bob 94 → 45, Lucia 100 → 31. L1 Cidade: 100 → 75 / 81 / 93.
- L10 Floresta: Jack 14 → 0, Bob 60 → 3, Lucia 91 → 1.
- L10 Cidade: 100 → 10 / 54 / 65. L10 Ruínas: — → 40 / 62 / 96. L10 endless: — → 78 / 91 / 100.
- Paredes que sobram com W4: a Cidade para a Lucia (boss 30) e as Ruínas para Bob e Lucia (boss 45).

## Sensibilidade (W4, 100 seeds, ±50% nas constantes da sim)

- **`eliteHit`, decisiva:** +50% derruba a L10 de Bob e Lucia para mediana 24, com 21% morrendo antes do 20; −50% leva a L10 a 55/50/36 e a L20 do Jack a 71, com 51% passando do 70.
- **`bossLand`, moderada:** +50% derruba a Lucia L20 de 45 para 30; −50% leva a Lucia L20 a 48 (3% passam do 70).
- **`hazardHit`:** quase nenhum efeito.
- **`safeCrowd`, moderada:** −50% leva o Bob L10 a 39; +50% leva o Jack L20 a 60.

## Decisão de design em aberto

A parede de boss vem da vida dobrando a cada boss. Uma curva por boss em `src/data` (ou um teto de vida para os bosses 30, 45 e 50) resolveria melhor do que mexer só no multiplicador.

## Comandos

Harness no scratchpad da sessão (não versionado): `bal/analyze.ts`, com `OVR='{"ROUNDS.scaling.hpPerLoop":1.3}' RUNS=200 MODE=goals|biome|hist|table|dmg|grid bun …analyze.ts`. Imports absolutos criam uma segunda instância de `src/data` (os overrides não chegam em `hpMul`); use imports relativos, como `scripts/balance-goals.ts`. Não rodados: bot, `bun test`, lint e typecheck (sem alteração de código). Uma grade de 48 candidatos foi interrompida; só 12 linhas válidas foram usadas.
