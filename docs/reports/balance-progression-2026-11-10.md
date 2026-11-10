# Balanceamento da progressão — rounds 1–50 e início do endless (2026-11-10)

Relatório do estagiário (SDD-016 RF-08), salvo pelo orquestrador. Só análise: nenhum código ou dado foi alterado. Sim em Danger 1, 150–200 runs por herói × nível, até o round 60.

## O que o sim mostrou

1. **Baseline:** L1 mediana 14 (meta 8–20, ok). L10 passa do boss 20: Jack e Bob 59%, Lucia 14%. L20 passa do 30: 0–1% (falha). L30 chega ao 50: 0%.
2. **Parede na Cidade (21–30):** quem chega ao 21 morre lá em cerca de 100% (L10–L20). A Floresta mata 98% no L1.
3. **Quebra no início do endless:** `hpMul` 23,9 (r50) → 142 (r51), ×6; `dmgMul` ×1,9; spawn 12,5 (boss do 50, metade) → 25 (teto). `hpPerLoop` 4,5 foi calibrado para a volta de 30 e agora cai no 51.
4. **Vida do boss ×2 por boss:** 2.400 (r5) → 1,79 milhão (r50), ×747. Vira parede nos rounds 25, 30, 45 e 50.
5. **`orangeFrom` 11 contra 16:** diferença de até 2 p.p.; sem motivo para mudar.
6. A vida dos inimigos comuns é a alavanca mais forte do sim (×0,1 → mediana 45+).

## Proposta P2

Sim em Danger 1, 200 runs, Jack, Bob e Lucia.

| Chave | Hoje | P2 |
|---|---|---|
| `scaling.hpPerRound` | 0,15 | 0,10 |
| `scaling.dmgPerRound` | 0,26 | 0,18 |
| `scaling.hpPerCycle` | 1,3 | 1,15 |
| `scaling.dmgPerCycle` | 1,15 | 1,08 |
| `scaling.bossHpPerBoss` | 2 | 1,6 |
| `scaling.hpPerLoop` | 4,5 | 1,5 |
| `scaling.dmgPerLoop` | 1,6 | 1,2 |

Mantidos: `loopRounds` 50, `orangeFrom` 11, share e vida dos elites, `fromRound` da Estação e das Ruínas, durações dos rounds (decisão de design).

**Resultado:** L1 mediana 18 (ok). L10 mediana 45, passa do 20 em 95%. L20 passa do 30 em 60–91% e morre antes do 60 em 77–97%. L30 passa do 50 em 17–77%.

**Curva P2 de `hpMul`:** r1 1,00; r5 1,40; r10 1,90; r20 3,33; r30 5,16; r40 7,45; r50 10,32; r51 18,1; r60 20,8. `dmgMul` no r51: 17,6.

## Morte por bioma

Probabilidade de morrer no bioma, dado que chegou a ele (Danger 1).

| Cenário | Antártida/Floresta | Cidade | Ruínas |
|---|---|---|---|
| Baseline | L1 Floresta 98% | L10 100%; L20 99–100% | — |
| P2 | L1 Floresta 71–75%; L10 Floresta 0–5% | L10 25–57%; L20 9–39% | L10 60–95%; L20 43–82%; L30 20–74% |

Com P2, o pico migra para as Ruínas (bosses 45 e 50) e precisa de avaliação.

## Duração

Rounds não boss de 30 s a 275 s; bosses de 120 s a 660 s. Até o round 50: cerca de 9.900 s (2 h 45), sem contar as lojas.

## Riscos e incertezas

- O sim não modela a SDD-018 (movimento 2×): representa o 1× antigo. Com velocidade de abate ×2 (aproximada por vida comum ×0,5), P2 fica fácil: L1 mediana 24, L10 mediana 45–55. P2 precisa de recalibração depois do bot, que não foi rodado.
- Com P1 (sem a mudança de loop), o Danger 0 vira passeio (L1 mediana 48–51); revisar `DANGER[0]` se for usado.
- `bun test` e `tests/sim.test.ts` não foram rodados.

## Comandos

- `bun scripts/sim.ts 20`
- `bun scripts/sim.ts 200 --report 200`
- `bun scripts/sim.ts 200 --danger <0-5>`
- Harness de candidatos (não versionado, no scratchpad da sessão): `cand.js`, rodado da raiz com `OVR='<json>' RUNS=200 bun -e "$(cat cand.js)"`.
