# SDD-005 — Danger 0–5 e save schema v2

**Versão** 1.0 · **Data** 2026-11-08 · **Status** Aprovada · **ADR** [008](../adrs/ADR-008-danger-0-5-e-endless.md), [007](../adrs/ADR-007-fish-na-run-perolas-meta.md) · **GDD** §16, §18

## Requisitos

- RF-01 `DANGER[0..5]`: `{ hp, dmg, speed, drops, extraWaves }` = D0 `{0.8, 0.8, 0.95, 0.9, 0}`, D1 `{1, 1, 1, 1, 0}`, D2 `{1.15, 1.1, 1.02, 1.1, 1}`, D3 `{1.3, 1.2, 1.05, 1.2, 1}`, D4 `{1.5, 1.35, 1.08, 1.35, 3}`, D5 `{1.75, 1.5, 1.12, 1.5, 3}` (valores iniciais a calibrar; espelho em balancing).
- RF-02 Waves extras: rounds sorteados (seed) entre 4 e 19 que recebem `elite` (×3 de elites) ou `horde` (×2 spawn); avisados na loja do round anterior a partir do D2.
- RF-03 Desbloqueio: vencer o boss do round 20 no danger D marca `progress.hero[h].dangerUnlocked = max(atual, D+1)`.
- RF-04 `HeroSelect` mostra danger selecionável até o desbloqueado e melhor round por danger.
- RF-05 **Save v2**: `SAVE_VERSION = 2`; campos novos `pearls`, `progress.hero[h].dangerUnlocked`, `progress.hero[h].bestRoundByDanger[6]`, `unlocks.startingWeapons`, `settings.locale ∈ en|pt-BR|es|zh-CN`; removidos `fish`, `difficulty`, `settings.voice*`, `activeRun` (incompatível: descartado com aviso).
- RF-06 Migração v1→v2 idempotente; `activeRun` v1 descartado; `difficulty` → `dangerUnlocked = 1` para todos.
- RF-07 Export/import `.json` continua; Electron grava também em arquivo para Steam Cloud (SDD-007).

## Especificação

- `src/data/difficulty.ts` reescrito; `src/logic/difficulty.ts`: `dangerMods(d)`, `extraWaves(seed, d)`.
- `src/logic/save.ts`: `migrate(v1) → v2`, defaults v2.
- Bot/sim: flag `--danger`.

## Critérios de aceite

| # | Assert | Verificação |
|---|---|---|
| A1 | `extraWaves(seed, 0\|1)` vazio; `(…, 2\|3)` 1 round; `(…, 4\|5)` 3 rounds distintos em [4, 19] | `bun test tests/difficulty.test.ts` |
| A2 | Save v1 real (fixture `tests/fixtures/save-v1.json`) migra sem lançar e sem perder heróis, XP, conquistas | `tests/save.test.ts` |
| A3 | Migrar duas vezes dá o mesmo objeto | teste |
| A4 | Vencer boss 20 no D1 em run simulada libera D2 só para aquele herói | `tests/progression.test.ts` |
| A5 | Bot L10 no D5 morre antes do round 20; no D0 passa do 20 | `bun scripts/playtest-bot.ts --danger 0,5` |
