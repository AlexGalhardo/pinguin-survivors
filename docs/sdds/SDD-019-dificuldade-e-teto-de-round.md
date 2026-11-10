# SDD-019 — Dificuldade (Fácil, Normal, Difícil) e teto de duração do round comum

**Versão** 1.0 · **Data** 2026-11-10 · **Status** Aprovada (2026-11-10, desenvolvedor no chat) · **Depende de** SDD-005, SDD-006 · **ADR** [025](../adrs/ADR-025-tres-dificuldades-e-teto-de-round.md)

## Requisitos

- **RF-01 Níveis.** `DIFFICULTY_LEVELS = [0, 1, 2]` (Fácil, Normal, Difícil). `DIFFICULTY[d] = { hp, dmg, speed, drops, extraWaves }`: Fácil `{0.5, 0.5, 1, 1, 0}`, Normal `{1, 1, 1, 1, 0}`, Difícil `{2, 2, 1, 1, 0}`. HP e dano valem também para bosses; seleção padrão é Normal.
- **RF-02 Desbloqueio.** `progress.hero[h].difficultyUnlocked` (1–3): 1 = Fácil e Normal; vencer o boss do round 20 no Normal passa a 2 (Difícil selecionável); vencer no Difícil passa a 3. Só o herói da run é afetado.
- **RF-03 Teto do round comum.** `roundDuration(n) = min(ROUNDS.roundMax, 30 + 5·(n−1))` com `roundMax = 120`; o teto é atingido no round 19. Rounds de boss não mudam (`120 + 60/boss`, máx. 600 s).
- **RF-04 Save.** Sem bump de versão (`SAVE_VERSION` 3). O load lê os campos antigos: `bestRoundByDanger[6]` vira `bestRoundByDifficulty[3]` (Fácil = D0, Normal = D1, Difícil = máximo de D2–D5); `dangerUnlocked` 1–6 vira `difficultyUnlocked` `min(3, v)` (1 → 1, 2 → 2, 3+ → 3). Idempotente: o formato novo é lido como está. Snapshot de run sem `difficulty` volta ao Normal.
- **RF-05 Conquistas.** Famílias `difficultyWin` (por herói) e `difficultyAll` (todos os heróis) com tiers 1 = Normal (`difficultyUnlocked ≥ 2`) e 2 = Difícil (`≥ 3`). Remapeamento:

| Antes | Depois |
|---|---|
| `dangerWin.<hero>.1` | `difficultyWin.<hero>.1` (Normal) |
| `dangerWin.<hero>.2` a `.5` | `difficultyWin.<hero>.2` (Difícil) |
| `dangerAll.1` | `difficultyAll.1` (Normal) |
| `dangerAll.2` a `.5` | `difficultyAll.2` (Difícil) |

Conquistas já desbloqueadas migram no load (`migrateDangerAchievements`): mesma tabela, sem duplicar, mantendo a data mais antiga; os ids fundidos saem de `spent` para os pontos disponíveis não mudarem. A demo (Fácil e Normal) esconde as conquistas de dificuldade, como antes.

- **RF-06 UI.** HeroSelect mostra "Dificuldade: Fácil/Normal/Difícil · melhor round N" e a folha com só HP e dano; textos `difficulty.*` nos quatro idiomas (Fácil/Normal/Difícil, Easy/Normal/Hard, Fácil/Normal/Difícil, 简单/普通/困难).
- **RF-07 Ferramentas.** `--danger` vira `--difficulty 0|1|2` (sim, bot); `?danger=` vira `?difficulty=`; meta #4 do balance-report: Fácil chega ≥ `dangerGap` rounds além do Normal e Difícil morre até `d5Max`.

## Critérios de aceite

| # | Assert | Verificação |
|---|---|---|
| A1 | Rounds comuns 19+ duram 120 s; 1 dura 30 s; bosses inalterados | `bun test tests/round.test.ts` |
| A2 | Fatores 0,5 / 1 / 2 | `bun test tests/difficulty.test.ts` |
| A3 | Save com `bestRoundByDanger` de 6 posições e `dangerUnlocked` 1..6 migra e é idempotente | `bun test tests/save.test.ts` |
| A4 | Toda conquista de dificuldade é alcançável com `difficultyUnlocked ≤ 3` | `bun test tests/achievements.test.ts` |
