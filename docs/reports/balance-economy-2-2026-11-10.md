# Balanceamento da economia, rodada 2 — sim nova (2026-11-10)

Relatório do estagiário (SDD-016 RF-08), salvo pelo orquestrador. Feito com a sim atualizada (dois relógios, peixe por abate já reduzido: comum 0,5%, elite 25% de chance de 2/4). Só análise: nada do repositório foi editado.

## Conclusão

A economia não está escassa. Até o round 20 o gasto acompanha a renda (0,85–0,97). Do 25 em diante o estoque cresce quando a prateleira esvazia, porque a sim só modela armas e não tem sumidouro de equipamento, suporte, poção ou reroll. Sem mudança de preço agora; só os dois ajustes de raridade abaixo.

## Renda × gasto por round

L10, Danger 1, 3 heróis × 30 seeds, dano de contato zerado só no scratch para ver o round 25+ (com dano de contato a run morre por volta do 20). Valores em Fish, médias condicionadas a chegar no round. "Depois" = proposta combinada.

| Round | Renda antes | Gasto antes | Estoque antes | V% antes | Gasto depois | Estoque depois | V% depois |
|---|---|---|---|---|---|---|---|
| 20 | 62 | 60 | 51 | 5% | 54 | 54 | 5% |
| 25 | 90 | 79 | 113 | 18% | 97 | 76 | 4% |
| 30 | 93 | 70 | 190 | 49% | 91 | 34 | 5% |
| 35 | 122 | 109 | 388 | 61% | 138 | 98 | 4% |
| 40 | 127 | 155 | 636 | 59% | 288 | 206 | 35% |
| 45 | 158 | 173 | 582 | 59% | 158 | 426 | 54% |
| 50 | 168 | 192 | 687 | 59% | 191 | 681 | 55% |

Renda acumulada até o 50: cerca de 4,6 mil nos dois cenários; gasto cerca de 3,9 mil.

## Curva de raridade das cartas

Com `endRound` 30 → 50 e `end` `[40, 35, 18, 7]` mantido (comum/rara/épica/lendária, %): R1 70/22/7/1; R10 ~64/24/9/2; R20 58/27/11/3; R30 52/30/14/5; R40 46/32/16/6; R50 40/35/18/7.

## Proposta

1. `src/data/cards.ts`: `RARITY_WEIGHTS.endRound` 30 → 50; `end` fica `[40, 35, 18, 7]`.
2. `src/data/economy.ts`: `SHOP.rarityFromRound[5]` 21 → 40 (a IV continua a partir do 11); `SHOP.tierWeights.perRound` = `[-1.5, 0.6, 0.7, 0.2, 0.1]` (IV 0,3 → 0,2; V 0,15 → 0,1).
3. Preços de reroll, arma, suporte e poção: sem mudança. O reroll é 0–8% do gasto (meta ≤ 15%).
4. Teto de V na campanha: 10 Núcleos de Boss (um boss a cada 5 rounds até o 50).

## Metas (`balance-goals.ts 30`)

- Baseline: #1 ok/ok/BAD (Lucia L1 mediana 10, janela 13–33); #2 BAD (L10 mediana 24/18/18; morte antes do 20 em 3/53/80%); #3 BAD (L20 mediana 27/24/20); #4, #5 e #6 ok (#6: 0,893).
- Com a proposta da loja: mesmo quadro. As metas #2 e #3 dependem de combate (dano de contato, DPS), não de economia.

## Comandos

- `bun scripts/balance-goals.ts 30`
- `bun scripts/balance-goals.ts 30 --patch <scratch>/shopboth.json`
- `bun <scratch>/econ-curve.ts <patch|-> 30 10` (cópia instrumentada da sim no scratch da sessão)

## Pendências

Sem bot. Equipamento, suporte, poção e reroll não entram na sim; é aí que o estoque tardio deveria ser gasto, então medir com `bun scripts/playtest-bot.ts` antes de mexer em preço. Amostra de 30 seeds × 3 heróis; a sim não registra prateleira vazia.
