# Balanceamento da economia — campanha de 50 rounds (2026-11-10)

Relatório do estagiário (SDD-016 RF-08), salvo pelo orquestrador. Só análise: nenhum código ou dado foi alterado. Scripts de análise usados (fora do repositório): `econ.ts` e `income-model.ts` no scratchpad da sessão.

## Conclusão

A economia atual infla. A renda acumulada até o round 50 é de cerca de 18,6 mil Fish (modelo analítico), contra cerca de 1,5 mil de fim de round e boss. O maior peso é o peixe por abate (5% dos comuns; elite roxo 3, laranja 6), e os elites crescem com a taxa de spawn (até 25/s).

## Propostas

1. **Peixe por abate:** comum 5% → 0,5%; elite roxo 3 → 2 e laranja 6 → 4, com 25% de chance por elite morta. Renda acumulada até o 50: 18,6 mil → 4,0 mil. Alternativa sem chance (comum 1%, roxo 1, laranja 2): 6,5 mil. A chance por elite é mecânica nova e depende do desenvolvedor.
2. **Cartas (`cards.ts`):** `RARITY_WEIGHTS.endRound` 30 → 50. Curva comum/rara/épica/lendária: R20 58/27/11/3 (hoje 50/31/14/5); R30 52/30/14/5 (hoje 40/35/18/7); R40 46/32/16/6; R50 40/35/18/7.
3. **Loja:** `SHOP.rarityFromRound[5]` 21 → 40; `tierWeights.perRound` IV 0,3 → 0,2 e V 0,15 → 0,1. A IV continua a partir do round 11; a V fica com 0% na loja até o 39 (hoje 5–7% desde o 21). Build com V: R40 9% (hoje 23%), R50 45% (hoje 52%). Teto de V na campanha: 10 Núcleos de Boss (1 por boss), ou seja, no máximo 10 compras de V.
4. **Preços** de reroll, suporte, poção e armas: sem mudança, porque não há medida que justifique. Equipamento, suporte e poção não entram no sim; decidir depois de medir com o bot.
5. **Ímã (raio 560):** não muda a renda total, já que o fim de round coleta tudo; afeta só tempo e bot.
6. **Vida dos elites:** o código tem roxo ×4 e laranja ×6, que é o pedido do desenvolvedor (dobrar a vida atual, 2× e 3×). A doc de balanceamento Parte B §1 estava desatualizada.

## Renda × gasto por round

Renda analítica com 77% dos spawns mortos; gasto = só armas no sim, L10, sobreviventes. Valores em Fish.

| Round | Renda atual | Renda A | Renda B' | Gasto em armas (sim) |
|---|---|---|---|---|
| 1 | 4 | 2 | 2 | 0 |
| 5 | 38 | 31 | 30 | 33 |
| 10 | 55 | 37 | 34 | 33 |
| 20 | 128 | 75 | 69 | 61 |
| 30 | 225 | 119 | 105 | 84 |
| 40 | 345 | 167 | 144 | 106 |
| 50 | 470 | 216 | 184 | 92 |

## Curva de raridade e build

- **Loja hoje** (`rollOffers` real, sem filtro de evolução): R1 I52/II33/III15; R10 I47/II34/III19; R20 I31/II34/III23/IV11; R30 I20/II36/III26/IV12/V6; R50 I10/II35/III34/IV14/V7. Com a proposta, a V zera até o 39 (R40: I11/II40/III33/IV11/V5).
- **Build (L10, hoje):** tier médio R10 1,43; R20 2,38; R30 3,33; R40 4,10; R50 4,49. Barra cheia (6 slots) na mediana dos rounds 11–13. A build "fecha" (média III+) por volta do round 26, com ou sem a proposta.

## Inflação e escassez

Hoje o gasto em armas é cerca de 6% da renda até o 50 (1,2 mil de 18,6 mil), o que gera acúmulo. Com B', cerca de 30%; o resto precisa de sumidouro (equipamento, suporte, poção, reroll), ainda não medido. Escassez tardia: com build em V, a loja fica vazia quando não há candidato.

## Limitações do sim

- Com dano de contato ligado, L10 sobrevive 43% até o 20 e cerca de 1% até o 25: não valida os rounds 26–50.
- Com dano de contato zerado (só no scratch, `DANGER[1].dmg = 0`): 98% até o 40 e 67% no 50; as mortes são timeout de boss. O gargalo tardio é o DPS contra boss, não a economia.
- A renda do sim é fim de round + boss; sem peixe por abate, sem harvesting, sem gear, poção, suporte ou reroll separados.
- `SIM.maxRound` = 60 e as metas #1–#3 ainda usam 30/60.
- O sim roda na escala de tempo antiga (antes dos dois relógios da SDD-018).

## Comandos

- `bun scripts/sim.ts 30` (2,9 s): L10 medianas Jack 20, Bob 20, Lucia 15; `past30` em L30: Jack 10%, Bob 3%, Lucia 0%.
- `econ.ts 10 30` (atual), `nodmg` e `PROPOSAL=1`: 3 execuções de 30 seeds × 3 heróis, rounds 1–50.
- `income-model.ts` (k = 0,77): renda acumulada 18.574 / 6.477 / 3.976.

## Pendências

Gasto de gear, suporte, poção e reroll; bot até o 50 (não rodado); fração de abates (77% vem do sim); a chance de 25% por elite é proposta; prateleira medida sem filtro de evolução.
