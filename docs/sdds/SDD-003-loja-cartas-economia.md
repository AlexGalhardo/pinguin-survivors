# SDD-003 — Loja do fim de round, cartas de level-up e economia Fish/Pérolas

**Versão** 1.0 · **Data** 2026-11-08 · **Status** Aprovada · **ADR** [006](../adrs/ADR-006-loja-fim-de-round-e-cartas-no-level-up.md), [007](../adrs/ADR-007-fish-na-run-perolas-meta.md) · **GDD** §9, §10, §17

> **Nota (2026-11-08)**: superada em parte pelo [ADR-017](../adrs/ADR-017-raridade-unica-afixos-e-loja.md) (a loja vende só armas, equipamentos e poções de velocidade nas raridades I a III, com afixos já sorteados e a compra descrita por `describeOffer`) e pelo [ADR-018](../adrs/ADR-018-linguagem-visual-diablo-4-e-menus-neutros.md) (Loja e Pausa estilo Diablo 4). Os pontos de stat e a Oficina citados aqui foram substituídos pela árvore ([ADR-019](../adrs/ADR-019-arvore-de-habilidades.md)).

## Requisitos

- RF-01 Fim do round (timer ou boss morto) → coleta total de pickups → cura 25% → **estado `shop`** (tempo pausado) → "Próximo round" → autosave → round N+1.
- RF-02 Loja: `offers: Offer[4]` (arma ou item), `locks: boolean[4]`, `rerolls: number`. `rerollPrice(round, rerolls) = base(round) + step(round)·rerolls`; `base(round) = 3 + round`, `step = 1 + floor(round/5)`. Locks persistem entre lojas; oferta travada não é rerolada.
- RF-03 Preço de arma por tier: `price(tier, round) = [8, 20, 45, 90][tier-1] + 2·round`; item por tier idem ×0,8; equipamento por raridade `[12, 30, 70]` + 2·round. Venda de arma devolve 50%.
- RF-04 Sorteio de ofertas ponderado por tier (probabilidade por round como as raridades de carta), sorte e +15% de peso para sets já presentes na build.
- RF-05 **Level-up**: fila `pendingLevelUps`; cada um abre 4 cartas (stats e exclusivas, nunca armas/itens); 1 reroll de carta por run comprado com Pérolas na Oficina (upgrade novo `insight`). Cartas se resolvem antes da loja se o level subiu no fim do round.
- RF-06 **Fish**: `RunState.fish` começa a run com `ECONOMY.fish.start` (10, o bastante para uma arma tier I na 1ª loja; sem isso o bot real morria no round 3 sem ter comprado nada) e não passa de uma run para outra; drop 5% comuns, elite 3/6, fim de round `(2 + floor(N/2)) · (1 + harvesting)`, boss `25·(1+ciclo)`. Ao fim da run, `pearls += floor(fish / 10)`.
- RF-07 **Pérolas**: `SaveData.pearls`; ganho por round concluído `1 + floor(N/5)`, boss `+25`, conquista `+5`; gasto em Oficina, gambits, desbloqueios de arma inicial. Migração: `pearls = fish` antigo (1:1).
- RF-08 Stat `harvesting` (novo, base 0) nas cartas e itens.
- RF-10 **Raridade e afixos na loja** (ADR-017): `Offer { kind, id, tier, price, affixes? }` com `tier` = raridade I a III (`SHOP.maxRarity` 3); IV e V não aparecem na loja (drops). Cada oferta de arma ou equipamento já traz os afixos sorteados (`AFFIX_COUNT`: I 0, II 1, III 2), para a UI mostrar o que se compra. A loja vende só **armas, equipamentos e poções de velocidade** (`SHOP.potions = ['haste']`).
- RF-11 **`describeOffer(offer, { build, gear, stats })`** (`src/logic/shop-describe.ts`, pura) devolve o resultado exato da compra: arma → nova arma no slot X (e a fusão possível em seguida) ou, com a barra cheia, fusão `fromRarity → toRarity` com a quantidade de afixos novos, ou barra cheia; equipamento → equipa na hora no slot, vendendo o item que estava lá (`replace`, SDD-014 RF-30); poção → estoque; mais `statChanges` antes→depois (afixos e bônus de set).
- RF-12 **Drops IV e V**: `rollItemDrops(rng, kind, { round, hero })` — só Elite dá IV e só Boss dá V, arma e equipamento com chances próprias (`DROPS.item`); drop no chão coletado como os itens atuais; arma exclusiva de outro herói não cai. A cena solta e coleta esses drops (`GameScene.onKill`): equipamento vai à mochila ou é vestido se o slot está livre, com a raridade e os afixos sorteados; arma entra num slot livre e, **com a barra cheia, é vendida na hora pelo valor de venda (Fish)** (regra mais simples, sem fusão porque IV e V não fundem). Comprar uma cópia igual com a barra cheia funde direto na arma que já se tem (`mergeInto`), mantendo os afixos e sorteando os que faltam; a fusão manual usa a mesma regra (`fuse` com sorteio). Todo Boss dá 1 equipamento V garantido e arma V com chance própria.
- RF-13 **Contrato de dados para as telas** (`src/ui/shop-bridge.ts`, `hud-bridge.ts`, `player-bridge.ts`): por oferta `rarity`, `affixes`, `weapon`/`baseStats` e `description` (de `describeOffer`); painel do jogador (`PlayerPanelView`: stats, armas e equipamentos com raridade e afixos, mochila); `HudWeapon.rarity` por slot.
- RF-09 Poções de run à venda na loja a partir do round 5 (consumidas pelo gambit "início do round").

## Especificação

- `src/data/economy.ts`: `SHOP = { offers: 4, rerollBase, rerollStep, pricesByTier, sellRatio: 0.5, setBias: 0.15, fishToPearls: 10 }`, `PEARLS = {...}`.
- `src/logic/shop.ts` (puro): `rollOffers(rng, round, build, luck, locks, prev)`, `rerollPrice`, `buy`, `sell`, `lock`.
- `src/logic/run-state.ts`: `fish`, `shop`, `pendingLevelUps`.
- `src/logic/cards.ts`: remover armas/evolução; 4 opções.
- `src/logic/save.ts`: `pearls`, migração v1→v2 (SDD-005).
- UI: componentes `Shop` e `LevelUpCards` (SDD-004); eventos `GameEvents.shopOpen/shopClose/levelUp`.
- Sim e bot: política de compra (`src/logic/sim/shop-policy.ts`): comprar a arma de maior DPS/preço, fundir quando possível, 1 reroll se sobrar > 2× o preço médio.

## Critérios de aceite

| # | Assert | Verificação |
|---|---|---|
| A1 | `rollOffers` sempre devolve 4 ofertas distintas, respeita locks e nunca oferece arma exclusiva de outro herói | `bun test tests/shop.test.ts` (propriedade, 1.000 seeds) |
| A2 | `rerollPrice(1,0)=4`, `rerollPrice(1,1)=5`, `rerollPrice(10,2)=19` | teste |
| A3 | Fluxo E2E: round 1 termina → loja abre → compra → reroll → lock → próximo round; Fish debitado corretamente | `bun run e2e` cenário `shop` |
| A4 | Save v1 com `fish: 120` migra para `pearls: 120`, `fish` ausente | `tests/save.test.ts` |
| A5 | Bot médio L1: morte mediana entre rounds 8 e 20 com a política de compra | `bun scripts/playtest-bot.ts --levels 1 --runs 2` |
| A6 | Nenhuma carta de level-up contém `kind: 'weapon'\|'evolve'` | `tests/cards.test.ts` |
| A7 | Raridade e loja: ofertas só I a III, afixos por raridade sem repetir stat, só `haste` entre as poções, `describeOffer` cobre nova arma, fusão, barra cheia, equipar, mochila e poção | `bun test tests/rarity.test.ts` |

## Fora de escopo

Lojista animado (SDD-012); layout visual (SDD-004).
