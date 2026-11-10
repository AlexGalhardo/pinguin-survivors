# ADR-025 — Três dificuldades (Fácil, Normal, Difícil) no lugar do Danger 0–5 e teto de 2 minutos nos rounds comuns

**Data** 2026-11-10 · **Status** Aceito (desenvolvedor, 2026-11-10, no chat) · **Supera parcialmente** [ADR-008](ADR-008-danger-0-5-e-endless.md) (a parte do Danger 0–5; o endless sem vitória continua) · **SDD** [019](../sdds/SDD-019-dificuldade-e-teto-de-round.md)

## Contexto

O Danger 0–5 virou seis botões que quase ninguém distingue (fatores de 1,15 a 1,75) e o nome "Danger" não é claro. O desenvolvedor pediu "Dificuldade" com Fácil 0,5×, Normal 1× e Difícil 2×. Pediu também um teto de 2 minutos nos rounds comuns: a duração linear (30 s + 5 s por round) chegava a 4 minutos no round 50.

## Decisão

- **Dificuldade** com 3 níveis que substituem o Danger: Fácil ×0,5, Normal ×1, Difícil ×2 em **vida e dano** dos inimigos (inclui bosses). Velocidade e drops ficam em 1 e não há waves extras de elite/horda.
- Desbloqueio por herói: Fácil e Normal desde o início; **Difícil** libera ao vencer o boss do round 20 no Normal (a regra de ADR-008 com menos degraus).
- Conquistas de Danger viram conquistas de Normal e Difícil (tabela na SDD-019).
- Round comum dura `min(120, 30 + 5·(N−1))` s (`ROUNDS.roundMax`); chefes seguem `120 + 60/boss`, teto 600 s.
- Saves existentes migram sem perda: Danger 0 → Fácil, 1 → Normal, 2–5 → Difícil.

## Alternativas

- Manter o Danger 0–5 e só renomear: não atende o pedido de fatores 0,5/1/2.
- Fatores de velocidade, drops e waves extras por nível: rejeitado pelo desenvolvedor (só vida e dano).

## Consequências

- `src/data/difficulty.ts` e a lógica de desbloqueio encolhem; as waves extras e os fatores de velocidade/drops ficam como ganchos neutros (código a remover numa limpeza futura).
- A meta de balanceamento #4 passa a comparar Fácil, Normal e Difícil; Difícil dobra vida e dano e provavelmente exige nova passada de balanceamento.
- O teto de 120 s reduz o tempo dos rounds comuns a partir do round 19 (menos dinheiro e XP por round): requer passada de economia.
- Telemetria, leaderboards e conquistas Steam trocam `danger` por `difficulty`.

## Status

Aceito.
