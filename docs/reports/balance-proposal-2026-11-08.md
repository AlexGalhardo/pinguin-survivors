# Proposta de balanceamento para #2, #3 e #5 (2026-11-08)

Preparação do T7.11. **Nada foi aplicado**: este documento só propõe números (de → para) com o resultado medido na sim. Base: `bun scripts/sim.ts 1 --jsonl <arquivo> 30` mais `bun scripts/balance-report.ts` (relatório em [balance-auto-2026-11-08.md](balance-auto-2026-11-08.md)). Os testes de hipótese abaixo usaram um script descartável que sobrescreve os dados em memória e reroda as metas com as mesmas seeds (100 a 129, e 100 a 199 onde indicado). O set `elemental` fica fora: depende do desenvolvedor.

## Diagnóstico

| Meta | Sintoma (30 seeds, estado atual) | Causa medida |
|---|---|---|
| #2 L10 + Oficina `all:2` | morte mais cedo no round 10 | só a Lucia morre cedo: 11 de 30 runs caem no boss do round 10. Jack e Bob morrem no round 24 ou depois. Com 100 seeds são 27 de 100 na Lucia e 2 de 100 no Jack |
| #3 L20 + Oficina `all:4` | medianas 61 / 61 / 42 (teto 60) | a Oficina cheia soma demais: com `all:4` jack e bob batem o limite de 60 rounds |
| #5 diversidade | `molotov` 38,9%, `hammer` 36,7%, set `elemental` 71,1% | o bot escolhe por DPS de multidão; qualquer arma no topo do DPS passa de 35% das builds |

Detalhe do #2: a Lucia morre no boss do round 10 mesmo no L1 (mediana de morte 10). O dano das armas mágicas contra alvo único é baixo (`elementStaff` ≈ 21 de DPS com `tagMul` 1; `machete` ≈ 20, mas com `tagMul` melee 1,3 no Jack). Crescimento por nível não resolve: `LEVEL_GROWTH.lucia` `maxHp` 1,5 → 5 ou `tagMul.magic` 0,006 → 0,02 deixam 7 a 10 de 30 runs morrendo no round 10.

## Mudanças propostas

| # | Arquivo | Campo | De | Para | Motivo |
|---|---|---|---|---|---|
| #3 | `src/data/upgrades.ts` | `perLevel` de `vitality` | 5 | 3 | Oficina cheia forte demais no L20; ×0,6 em todas as linhas com stat |
| #3 | idem | `might` | 0,03 | 0,018 | idem |
| #3 | idem | `haste` | 0,02 | 0,012 | idem |
| #3 | idem | `plating` | 1 | 0,6 | idem |
| #3 | idem | `recovery` | 0,1 | 0,06 | idem |
| #3 | idem | `swiftness` | 3 | 1,8 | idem |
| #3 | idem | `magnet` | 8 | 4,8 | idem (não afeta combate; pode ficar de fora) |
| #3 | idem | `wisdom` | 0,04 | 0,024 | idem |
| #3 | idem | `fortune` | 0,02 | 0,012 | idem |
| #3 | idem | `insight` | 1 | 1 | sem mudança (é contagem, não bônus) |
| #2 | `src/data/weapons.ts` | `elementStaff` dano base | 10 | 16 | a arma inicial da Lucia é o único dano de alvo único dela; sem isso ela não vence o boss 10 |
| #5 | idem | `hammer` | 14 | 10 | equalizar o DPS de multidão do tier I |
| #5 | idem | `knives` | 13 | 19 | idem |
| #5 | idem | `fishBoomerang` | 13 | 15 | idem |
| #5 | idem | `bladeWhirl` | 6 | 5 | idem |
| #5 | idem | `auxPistol` | 9 | 10 | idem |
| #5 | idem | `crossbow` | 20 | 24 | idem |
| #5 | idem | `molotov` | 4 | 3 | arma mais comprada (38,9%) |
| #5 | idem | `mine` | 24 | 23 | idem |
| #5 | idem | `grenadeBelt` | 33 | 36 | idem |
| #5 | idem | `flameRing` | 3 | 2 | inteiro baixo é grosseiro: preferir subir o `cooldown` em vez do dano |
| #5 | idem | `lightningTotem` | 16 | 19 | idem |
| #5 | idem | `iceShards` | 8 | 9 | idem |
| #5 | idem | `poisonCloud` | 6 | 7 | idem |
| #5 | idem | `machete`, `doubleBarrel`, `droneSentinel` | 9 / 7 / 6 | 9 / 7 / 6 | sem mudança: são armas iniciais ou já estão na mediana (mexer nelas quebra a meta #1) |

O bloco #5 é a equalização do DPS de multidão de tier I até a mediana (expoente 0,7 do fator), poupando as 3 armas iniciais. Os danos dos tiers II a IV derivam de `TIER_SCALE`, então mudam junto. **Se aplicar, a tabela da Parte B §6 do balancing precisa ser regerada.**

## Resultado medido

100 seeds por célula, valores com os arredondamentos reais (cada dano base inteiro, tiers recalculados).

| Cenário | #1 L1 (medianas / máx.) | #2 | #3 (medianas L20) | #5 maior arma | #6 |
|---|---|---|---|---|---|
| estado atual | ✓ 17 / 16 / 10, máx. 27 | ✗ Lucia 27% morre antes do 12 | ✗ 52 / 61 / 42 | `molotov` 38,3% | ✓ 0,902 |
| só Oficina ×0,6 (30 seeds) | ✓ | ✗ | ✓ 51 / 53 / 37 | `molotov` 36,7% | ✓ |
| Oficina ×0,6 + `elementStaff` 16 (30 seeds) | ✓ 18 / 16 / 10, máx. 27 | ✓ morte mais cedo 18 | ✓ 51 / 57 / 47 | `molotov` 41,1% | ✓ |
| pacote completo da tabela (100 seeds) | ✓ 17 / 17 / 10, máx. 27 | ✗ jack 2% e Lucia 3% morrem antes do 12 | ✓ 51 / 51 / 42 | `iceShards` 40,7%, menor `doubleBarrel` 8,3% | ✓ 0,902 |

Leitura:

- **#3 resolvido** pela Oficina ×0,6. É a mudança mais segura: a Oficina não entra no perfil L1 da meta #1 (que fica inalterada em todos os cenários).
- **#2 quase resolvido**: `elementStaff` 10 → 16 derruba as mortes antes do 12 da Lucia de 27% para cerca de 3% (cálculo com 100 seeds). Os 2 a 3% restantes são o próprio boss do round 10 (variância de seed, também aparece no Jack). Como "nenhum morre antes do 12" é estrito demais para uma sim estocástica, proponho **relaxar a meta para ≤ 5% das runs** (decisão do desenvolvedor).
  - Efeito colateral: `elementStaff` fica mais forte também nas builds de Jack e Bob (qualquer herói pode comprá-la). Se isso incomodar, a alternativa é torná-la exclusiva da Lucia (decisão de design).
  - Mais que 16 não ajuda: com 18 o #3 volta a falhar (bob 61) e a arma passa de 43% das builds.
- **#5 não fecha só com números**: cada ajuste de dano tira uma arma do topo e põe outra (`molotov` → `flameRing` → `elementStaff` → `iceShards` → `knives`), sempre entre 33% e 45%. Os valores 8,3% de mínimo e 40,7% de máximo mostram que o achatamento ajudou a cauda, mas o topo continua. A causa é a política do bot: escolhe sempre a arma de maior DPS por Fish entre as 4 ofertas, então a arma de maior DPS do momento domina. Não é bug de dados.

## Decisões e opções para o #5

1. **Medir por herói em vez de agrupado**: a meta A4 diz "100 runs/herói". Agrupado, as armas exclusivas e os starters distorcem. Opção barata: o `balance-report.ts` avaliar por herói (cada herói tem 5 armas de loja candidatas fora o starter, então 35% por arma é só 1,75× a média).
2. **Ruído na política do bot**: hoje o bot é determinístico por DPS. Um jogador real escolhe por sinergia e tem preferências. Adicionar um fator aleatório (por seed) no `offerValue`, ou pesar mais o set da build, espalharia as compras sem mexer nos dados. É mudança de `SHOP_POLICY`, não do jogo.
3. **Relaxar o limite de 35% para 40%**, já que 6 slots sobre cerca de 16 armas dão média de 31% por arma por construção (sem a inicial: 5 slots sobre 16, ≈ 31%).
4. **Set `elemental`** (71% a 83%): fora do escopo, depende do desenvolvedor. Todas as armas mágicas são `elemental`, então toda build da Lucia entra nele por definição.

Minha recomendação: aplicar **Oficina ×0,6 + `elementStaff` 16** (resolve #3 e quase todo o #2) e tratar o #5 pelas opções 1 e 2, sem mexer mais nos danos das armas de loja (a equalização completa não fecha a meta e deixa o pacote mais frágil: com arredondamento, pequenas diferenças trocam a arma líder).

## Riscos

- Tudo medido na sim, que reage pouco ao dano das armas (ver [balance-2026-11-08.md](balance-2026-11-08.md)). O bot real precisa confirmar `elementStaff` e a Oficina antes de fechar.
- Com 30 seeds, os valores de #3 e #5 oscilam entre rodadas; só os resultados com 100 seeds devem decidir.
- Mexer na Oficina muda a progressão do jogador novo (vê-se menos poder por Pérola gasta); conferir a economia em Pérolas (SDD-003 RF-07) antes de aplicar.
