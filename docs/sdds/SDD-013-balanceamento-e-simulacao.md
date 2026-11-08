# SDD-013 — Ferramentas de balanceamento: simulação, bot e telemetria pós-1.0

**Versão** 1.0 · **Data** 2026-11-08 · **Status** Aprovada · **Metodologia e números** [../balancing-and-simulation.md](../balancing-and-simulation.md)

## Requisitos

- RF-01 **Sim headless** (`src/logic/sim/run-sim.ts`) atualizada para o design 1.0: 6 slots, loja com política de compra/fusão (`shop-policy.ts`), cartas de stat (`card-policy.ts`), Fish/Pérolas, danger 0–5, arena (densidade por área), sem arma assinada. Determinística por seed.
- RF-02 **Bot** (`scripts/playtest-bot.ts`) no jogo real: flags `--danger`, `--weapons`, `--shop-policy`, `--pearls`; joga a loja via `GameCommands` (React) e as cartas de level-up; exporta `JSONL` por run (round de morte, DPS, Fish gasto, armas finais, tempo real).
- RF-03 **Relatório**: `bun scripts/balance-report.ts <jsonl>` gera `docs/reports/balance-<data>.md` com tabelas herói × level × danger (mediana de round, p25/p75), DPS por arma, taxa de compra por arma/item, e compara com as metas de `balancing-and-simulation.md` §Metas, marcando ✓/✗.
- RF-04 **Gate de CI leve**: `bun test tests/sim.test.ts` roda a sim em 3 heróis × L1/L10 × 2 seeds e falha se a mediana sair da faixa de metas (tolerância ±2 rounds) — protege contra mudanças de dados que quebrem a curva.
- RF-05 **Telemetria pós-1.0 (opt-in)**: evento local `runEnd` `{ version, hero, danger, level, round, weapons, cause, durationS, platform }` gravado em `save.telemetry[]` (últimos 200); exportável pelo jogador; sem envio automático na 1.0 (sem servidor, sem PII). Steam leaderboards fornecem distribuição de melhor round.
- RF-06 Cadência pós-1.0: patch de balanceamento no máximo a cada 2 semanas, cada um com relatório antes/depois e nota no CHANGELOG (`### Changed` → "Balance:").

## Critérios de aceite

| # | Assert | Verificação |
|---|---|---|
| A1 | `bun scripts/sim.ts 20` roda em < 60 s e imprime a tabela herói × level × danger | tempo e saída |
| A2 | `tests/sim.test.ts` determinístico: duas execuções com a mesma seed, mesmo resultado | teste |
| A3 | `balance-report.ts` gera o markdown com todas as metas marcadas ✓/✗ | arquivo em `docs/reports/` |
| A4 | Bot L1 danger 1, 2 seeds por herói: mediana de morte entre rounds 8 e 20 | relatório |
| A5 | `save.telemetry` limitado a 200 entradas e exportado no `.json` | `tests/save.test.ts` |
