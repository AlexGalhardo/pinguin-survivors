# ADR-017 — Raridade única I–V, afixos aleatórios e escopo da loja

**Data** 2026-11-08 · **Status** Aceito · **Decisão de origem** feedback do desenvolvedor (mudança de escopo) · **Supera em parte** ADR-005 (tiers I–IV), ADR-006 (conteúdo da loja)

## Contexto

Armas tinham tiers I–IV com fusão até o IV e equipamentos tinham raridades comum, rara e lendária com stats fixos. A loja vendia armas, equipamentos e todas as poções. O desenvolvedor pediu uma escala única e legível para armas e equipamentos, itens com variação (como em ARPGs) e menus didáticos que expliquem exatamente o que cada compra faz.

## Decisão

- **Raridade única I–V** para armas e equipamentos: **I branco** (0 afixos), **II azul** (1), **III verde** (2), **IV roxo** (3), **V laranja** (4). Uma única fonte de cores: `rarityColor(r)` em `src/config/palette.ts`.
- **Afixos** são bônus de stat sorteados por seed (`src/data/affixes.ts`, `src/logic/affixes.ts`), sem repetir o mesmo stat no mesmo item. Valor = `base × power × (1 + 0,25·(raridade−1)) × (1 + 0,02·round)`; escopo `weapon` ou `gear`.
- **A loja vende só armas, equipamentos e poções de velocidade** (`haste`), e **só raridades I, II e III**. As outras poções saem da loja. As ofertas já vêm com os afixos sorteados, para a UI mostrar exatamente o que se compra.
- **IV só cai de inimigos Elite e V só de Bosses** (armas ou equipamentos, drop no chão, coletado como os itens atuais). Chances em `DROPS.item` (`src/data/equipment.ts`).
- **Arma: compra e fusão sobem só até o nível III.** IV e V só por drop. Fusão de duas armas iguais de mesma raridade < III vira a raridade seguinte e rola os afixos que faltam (o que já tinha é mantido).
- **Mapeamento com o que já existe** (sem arte nova agora): I a IV usam as linhas de stats e a arte `weapon.<id>.t1…t4`; **V reaproveita a arte e os stats do IV** (com `WEAPON_V_DAMAGE_MUL` no dano, hoje 1,0) e ganha brilho laranja. Equipamentos: o catálogo atual vira a base (comum, rara e lendária = I, II e III na loja; IV e V sorteiam entre as bases lendárias) e os afixos somam por cima.
- **Migração**: itens antigos (`common`, `rare`, `legendary`, sem afixos) leem-se como I, II e III (`normalizeGear`, `LEGACY_GEAR_RARITY`); itens sem sorteio contam como a raridade do catálogo.
- `describeOffer(...)` (`src/logic/shop-describe.ts`) é a função pura que a UI usa para explicar a compra: nova arma no slot X (e a fusão que dá para fazer em seguida), fusão II→III com a quantidade de afixos novos, barra cheia, equipar ou mochila, e os stats antes→depois.

## Alternativas

- Manter tiers I–IV de armas e raridades de equipamento separadas: duas escalas de cor para o jogador aprender. Rejeitada.
- Fusão até o V: o V seria comprável, sem sentido de jackpot. Rejeitada pelo desenvolvedor.
- Afixos fixos por item (como antes): sem variação de loot. Rejeitada.

## Consequências

- Balanceamento refeito (sim e relatório em `docs/reports/balance-proposal-2026-11-08.md`): chances de drop de arma IV e V calibradas baixas; `dmgPerLoop` do endless 1,5 → 2,0 para manter a meta #3 estável.
- Save e snapshots de run: `RunGear.rolls` guarda raridade e afixos por id; `WeaponInstance.affixes` guarda os afixos de cada arma. Sem `SAVE_VERSION` novo (campos opcionais).
- UI atual continua funcionando (ids e tiers 1 a 3 iguais); a UI nova (cores por raridade, descrição da compra, nomes dos afixos) vem depois.
- Pendente na cena: soltar e coletar drops de arma e equipamento com afixos (`rollItemDrops`), mostrar a raridade I–V e os afixos nas telas.
