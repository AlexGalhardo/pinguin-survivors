# SDD-002 — Armas: 6 slots, classes e sets, tiers I–IV, fusão, arma inicial

**Versão** 1.1 · **Data** 2026-11-08 · **Status** Aprovada · **ADR** [005](../adrs/ADR-005-seis-slots-de-arma.md) · **GDD** §6, §8

> **Nota (2026-11-08)**: superada em parte pelo [ADR-017](../adrs/ADR-017-raridade-unica-afixos-e-loja.md): os tiers I–IV viram a **raridade I–V** com afixos aleatórios; compra e fusão vão só até o III, o IV cai de Elite e o V de Boss (o V reaproveita a arte e os stats do IV). A arte `weapon.<id>.t1…t4` e as 17 linhas seguem valendo.

## Requisitos

- RF-01 `Build.weapons: WeaponInstance[]` com até **6** entradas `{ id, tier: 1|2|3|4|5, affixes? }` (o `tier` é a **raridade I–V**, ADR-017); sem arma assinada nem evolução por carta.
- RF-02 `WeaponDef { id, classTag: 'melee'|'firearm'|'magic', sets: SetId[] (1–2), tiers: [T1, T2, T3, T4] }`, cada tier com `damage, cooldown, range, extra`. Preço por tier em `economy.ts`.
- RF-03 **Sets**: `blade, blunt, thrown, gun, explosive, elemental, support`. Bônus por contagem 2/4/6 em `src/data/sets.ts`, aplicado em `PlayerStats` como modificadores (ex.: `blade: +5/+12/+25% chance de sangramento`).
- RF-04 **Fusão**: `fuse(build, slotA, slotB)` (índices de slot, pois a build pode ter duas instâncias da mesma arma) só se `id` e `tier` iguais e `tier < 3` (**a arma só faz upgrade até o nível III**; IV e V só por drop); resultado tier+1 ocupa um slot, mantém os afixos e sorteia os que faltam; oferecida automaticamente na loja ao comprar a 2ª igual (confirmação).
- RF-10 **Raridade ↔ tier visual**: I a IV usam as quatro linhas de stats e a arte `weapon.<id>.t1…t4` (`weaponVisualTier`); **V usa a arte e os stats do IV** (`WEAPON_V_DAMAGE_MUL` no dano, hoje 1,0) com brilho laranja (`rarityColor(5)`), sem exigir arte nova. Os afixos da arma entram nos modificadores da build (`setBonuses`) enquanto ela está nos slots.
- RF-05 **Arma inicial**: `HeroDef.startingWeapons: WeaponId[]` (3 por herói); seleção na `HeroSelect`; desbloqueio de mais armas iniciais com Pérolas (`src/data/unlocks.ts`).
- RF-06 As antigas secundárias com comportamento de arma viram `WeaponDef` (knives, molotov, iceShards, auxPistol, fishBoomerang, mine, flameRing, lightningTotem, poisonCloud, crossbow, bladeWhirl*, droneSentinel*, grenadeBelt*;* exclusivas do herói: só aparecem na loja/inicial daquele herói).
- RF-07 Exclusivas passivas/ativas (bloodlust, counterAttack, ironSkin, butcher, hollowPoints, ricochet, runAndGun, reflex, elementalAttunement, arcaneChain, frostNova, meteorShower, arcaneBarrier, toxicBloom, seismicStomp) continuam como **cartas exclusivas** (SDD-003). Cada herói recebe 1 exclusiva nova para repor a que virou arma (propostas: Jack *Fôlego de Ferro* +regen por inimigo próximo; Bob *Recarga Rápida* +cadência após abate; Lucia *Eco Arcano* repete 1 projétil a cada N).
- RF-08 `WeaponRing` posiciona até 6 armas em anel (raio 26 u, ângulos iguais, rotação lenta); cada `WeaponView` mira e anima o alvo mais próximo no alcance; prioridade boss/elite.
- RF-09 Multiplicadores por classe do herói continuam (balancing-and-simulation.md Parte B §4).

## Especificação

- `src/data/weapons.ts` reescrito (≥ 17 linhas de arma × 4 tiers); `src/data/sets.ts`; `src/data/unlocks.ts`.
- `src/logic/build.ts`: `addWeapon`, `fuse`, `canFuse`, `setCounts`, `setBonuses`.
- `src/logic/stats.ts`: aplicar `setBonuses`.
- `src/systems/WeaponSystem.ts` + `entities/WeaponRing.ts`: loop por slot.
- Manifest: `weapon.<id>.t<n>`; placeholder por código tinge o tier (I cinza, II verde, III azul, IV dourado) até a arte chegar.
- `balancing-and-simulation.md` Parte B §6 reescrito com a tabela por tier; sim (`run-sim.ts`) e bot (`playtest-bot.ts`) atualizados para 6 slots e política de compra.

## Critérios de aceite

| # | Assert | Verificação |
|---|---|---|
| A1 | `addWeapon` recusa a 7ª arma; `fuse` só com id+tier iguais e tier < 4 | `bun test tests/build.test.ts` |
| A2 | `setBonuses` com 2/4/6 `blade` retorna os três patamares; 1 retorna nada | `tests/sets.test.ts` |
| A3 | Toda `WeaponDef` tem 4 tiers com `damage` crescente e chave no manifest | `tests/weapons-data.test.ts` |
| A4 | Cada herói tem 3 armas iniciais válidas da sua classe favorita ou neutras | `tests/heroes.test.ts` |
| A5 | Sim: Jack/Bob/Lucia L1 com 6 slots morrem entre os rounds 8 e 20 (meta balancing-and-simulation.md Parte B §9.1 #3) | `bun scripts/sim.ts 20` |
| A6 | 6 armas visíveis ao redor do herói em `?skipMenu=1&weapons=machete,knives,molotov,auxPistol,iceShards,flameRing` | agent-browser |
| A7 | `rg "signature\|evolve\|tierUp" src` retorna vazio | grep |

## Fora de escopo

Arte dos tiers (SDD-012); preços (SDD-003).
