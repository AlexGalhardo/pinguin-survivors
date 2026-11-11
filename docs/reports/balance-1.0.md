# Balance 1.0 — linha de base da campanha de 50 rounds (2026-11-11)

Passada 0 da tarefa F7.2 do ROADMAP: só medição, nenhum número alterado.

- **Comandos:** `bun scripts/sim.ts 100` e `bun scripts/sim.ts 20 --report 100` (dificuldade Normal, velocidade 1×).
- **Código medido:** `main` em 2026-11-11, depois das classes (SDD-024); todas as runs na classe base.

## Round de morte por herói e nível (100 runs)

| Herói | Nível 1 | Nível 5 | Nível 10 | Nível 20 | Nível 30 |
|---|---|---|---|---|---|
| Jack (média / mediana) | 10,4 / 9 | 16,7 / 18 | 18,6 / 18 | 21,3 / 18 | 26,5 / 24 |
| Bob | 11,7 / 12 | 15,4 / 18 | 16,4 / 18 | 19,4 / 18 | 24,9 / 24 |
| Lucia | 9,0 / 9 | 14,7 / 18 | 16,1 / 18 | 18,8 / 18 | 20,0 / 18 |

Passam do round 50: 0% em quase todas as células (Bob nível 30: 3%).

## Metas (A4, janelas propostas para 50 rounds em `GOAL_ROUNDS`)

| Meta | Alvo proposto | Medido | Situação |
|---|---|---|---|
| #1 Jogador novo (nível 1) | mediana entre 13 e 33, ninguém passa do 50 | 9 / 12 / 5 (Jack / Bob / Lucia), máximo 24 | abaixo da janela |
| #2 Nível 10 com árvore | passa do boss do round 35 | mediana 18 | não fecha |
| #3 Nível 20 ou mais | só morre no endless (51+) | mediana 18 a 24 | não fecha |
| #5 Variedade de builds | nenhuma arma em mais de 35% das builds finais, por herói | 5 armas acima de 35% no agregado (flameRing 47,7%) | medir por herói |
| #6 Economia | gasto / ganho perto de 0,9; reroll baixo | 0,876; reroll 1,8% | ok |

## Leitura

- A campanha de 50 rounds **não é vencível no modelo** nem no nível 30: as mortes se concentram nos rounds 18 e 24.
- O relatório de [2026-11-10](balance-progression-2-2026-11-10.md) já concluía que nenhuma variante fechava as metas e que a proposta W4 não era robusta a ±50% nas constantes da sim (`SIM.eliteHit`, `SIM.bossLand`). Depois dele a vida dos bosses virou tabela (`BOSS_HP`) e a dificuldade virou Fácil/Normal/Difícil, mas a curva dos rounds comuns (`scaling.hpPerRound`, `dmgPerRound`, ciclos de 10 rounds) é a mesma.
- A Lucia é a mais fraca em todos os níveis (nível 30: 20,0 contra 26,5 do Jack).

## O que falta para fechar a F7.2

1. **Calibrar a sim contra o bot real** nos rounds 11 a 30 (`bun scripts/playtest-bot.ts`, 3 seeds por herói, nível 10 e 20): a sim joga sem desviar e pode estar superestimando o dano dos elites. Sem isso, qualquer corte na curva é chute.
2. Decidir a **curva dos rounds 11 a 50** (a proposta W4 baixa `dmgPerRound` de 0,26 para 0,18 e `dmgPerCycle` de 1,15 para 1,12) e reexecutar este relatório.
3. Medir a meta #5 por herói, como a Parte A4 descreve.

Esta decisão muda a dificuldade do jogo inteiro, então fica registrada como aberta para o desenvolvedor em vez de aplicada às cegas.
