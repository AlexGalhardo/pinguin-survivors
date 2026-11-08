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

## Aplicado

Aplicada só a recomendação (reversível, sem commit ainda): Oficina `perLevel` ×0,6 em todas as linhas com stat (`insight` fica) e `elementStaff` dano base 10 → 16. Nada mais mudou: nem o set `elemental`, nem as metas.

| Arquivo | Campo | De | Para |
|---|---|---|---|
| `src/data/upgrades.ts` | `vitality` / `might` / `haste` | 5 / 0,03 / 0,02 | 3 / 0,018 / 0,012 |
| idem | `plating` / `recovery` / `swiftness` | 1 / 0,1 / 3 | 0,6 / 0,06 / 1,8 |
| idem | `magnet` / `wisdom` / `fortune` | 8 / 0,04 / 0,02 | 4,8 / 0,024 / 0,012 |
| `src/data/weapons.ts` | `elementStaff` dano base (tiers I a IV) | 10 (10 / 15 / 22 / 31) | 16 (16 / 24 / 35 / 50) |

Resultado medido (`SOUND_MUTED=true bun scripts/sim.ts 1 --jsonl … N` + `bun scripts/balance-report.ts`; o relatório de hoje em [balance-auto-2026-11-08.md](balance-auto-2026-11-08.md) foi sobrescrito com 30 seeds por célula):

| Meta | Antes (30 seeds) | Depois, 30 seeds | Depois, 100 seeds |
|---|---|---|---|
| #1 L1 | ✓ 18 / 16 / 10, máx. 27 | ✓ 18 / 17 / 10, máx. 27 | ✓ 17 / 17 / 10, máx. 27 |
| #2 L10 + `all:2` | ✗ morte mais cedo 10 | ✓ morte mais cedo 22 | ✗ jack 2%, bob 0%, Lucia 3% morrem antes do 12 |
| #3 L20 + `all:4` | ✗ 61 / 61 / 42 | ✓ 51 / 56 / 44 | ✓ 48 / 51 / 42 |
| #4 Danger | ✓ | ✓ D0 61, D1 36, D5 10 | ✓ D0 52, D1 33, D5 10 |
| #5 diversidade | ✗ `molotov` 38,9%, `elemental` 71,1% | ✗ `hammer` 42,2%, `elemental` 83,3% | ✗ `molotov` 39,3%, `elemental` 84,3% |
| #6 economia | ✓ 0,900 | ✓ 0,896, reroll 0,6% | ✓ 0,896, reroll 0,7% |

Leitura:

- **#3 fechado** em 30 e em 100 seeds. **#2 fechado em 30 seeds**; com 100 sobram 2 a 3% de mortes no boss do round 10, como previsto. Segue a proposta de relaxar a meta para ≤ 5% das runs (decisão do desenvolvedor).
- **#5 piorou um pouco**: com a `elementStaff` mais forte, ela e o set `elemental` entram em mais builds (83% a 84% dos casos). O resultado confirma a leitura da proposta: o #5 não fecha com números de dano; depende das opções 1 a 3 acima e da decisão sobre o set `elemental`.
- O espelho em `docs/balancing-and-simulation.md` (Parte B §6, linhas `elementStaff`, e §8b, tabela da Oficina) foi atualizado.

## Critérios novos e passadas 2 e 3 (decisões do desenvolvedor)

O desenvolvedor aprovou: `lightningTotem` passa para o set `support`; a meta #2 vira "≤ 5% das runs morrem antes do round 12"; a meta #5 é medida **por herói** (limites de 35% por arma e 50% por set dentro das builds de cada herói). `evaluateGoals` e a Parte A4 do balancing foram atualizados e testados. Medido com 100 seeds por célula (5.400 runs).

Estado com os dados atuais (só o set do `lightningTotem` mudou):

| Meta | Resultado |
|---|---|
| #1 | ✓ 17 / 17 / 10, máx. 27 |
| #2 | ✓ morrem antes do 12: jack 2%, bob 0%, lucia 2% |
| #3 | ✓ 51 / 51 / 42 |
| #4 | ✓ D0 53, D1 34, D5 10 |
| #5 por herói | ✗ jack: `hammer` 72% e set `blade` 80%; bob: `molotov` 78% e `elemental` 97%; lucia: `flameRing` 72% e `elemental` 94% |
| #6 | ✓ 0,897, reroll 0,7% |

### Passada 2 (dados, reversível)

| Campo | De | Para |
|---|---|---|
| `hammer` dano base | 14 | 7 |
| `molotov` dano base | 4 | 2 |
| `flameRing` dano base | 3 | 2 |

Resultado: #2 ✓ (jack 4%), #3 ✓ (45 / 48 / 42), #5 ✗: jack `bladeWhirl` 67% e set `blade` 82%; bob `elementStaff` 71% e set `explosive` 90%; lucia `iceShards` 72% e set `elemental` 87%. A arma líder só trocou de lugar.

### Passada 3 (dados, reversível, sobre a passada 2)

| Campo | De | Para |
|---|---|---|
| `bladeWhirl` dano base | 6 | 4 |
| `elementStaff` dano base | 16 | 14 |
| `iceShards` dano base | 8 | 7 |

Resultado: #2 ✗ (mortes antes do 12 passam de 5% em algum herói), #3 ✓ mas com medianas menores (43 / 44 / 41), #5 ✗: a líder de Lucia, `iceShards`, cai para 55% e o set `elemental` fica em 78%; as de Jack e Bob continuam acima de 65%.

### Conclusão e estado final

Nenhuma das duas passadas aproximou o #5 do limite sem piorar #2. **Os dados foram revertidos ao estado anterior às passadas** (só o `lightningTotem` em `support` ficou). O motivo é estrutural, não de números: cada herói tem um multiplicador de classe (`tagMul`: Jack melee ×1,3, Bob firearm ×1,3, Lucia magic ×1,5) e o bot escolhe sempre a arma de maior DPS por Fish, então as 4 ou 5 armas da classe do herói dominam as 5 vagas livres. Com 15 armas candidatas e 5 vagas, a participação média por arma já é de cerca de 33%, e o limite de 35% por arma só se cumpre com seleção quase uniforme. O #5 por herói precisa de mudança de política do bot (ruído de preferência, peso de sinergia de set) ou de revisão do limite; não de ajuste de dano. Parar aqui, conforme o combinado.

## Bot com preferência

Mudança só no comprador da sim (`playShop` com `preference`, nenhum dado do jogo alterado): escolha por softmax sobre o valor por Fish, +20% de valor por arma do mesmo set já na build, e um "gosto" por run (multiplicador 0,8 a 1,2 por arma, determinístico por seed). O bot do jogo real continua guloso (`nextShopAction`). A troca de uma arma por outra mais fraca só por sinergia foi bloqueada (a sinergia não conta para o fator 1,5 de substituição).

Parâmetros em `SHOP_POLICY`: `temperature` 0,15, `setSynergy` 0,2, `tasteRange` 0,8 a 1,2. Teste do softmax: duas ofertas de valor 1 e 0,9 dividem a compra em cerca de 70% e 30%; uma de valor 0,3 quase nunca é escolhida.

Resultado (100 seeds por célula, 5.400 runs, `balance-auto-2026-11-08.md`):

| Meta | Antes (bot guloso) | Depois (preferência) |
|---|---|---|
| #1 | ✓ 17 / 17 / 10 | ✓ 17 / 17 / 10, máx. 24 |
| #2 | ✓ jack 2%, bob 0%, lucia 2% | ✓ jack 3%, bob 0%, lucia 1% |
| #3 | ✓ 51 / 51 / 42 | ✓ 33 / 33 / 32 (margem pequena sobre o 30) |
| #4 | ✓ D0 53, D1 34 | ✓ D0 39, D1 27, D5 10 |
| #5 por herói | ✗ armas 72% a 78%, sets 80% a 97% | ✗ armas 63% a 69%, sets 74% a 93% |
| #6 | ✓ 0,897 | ✓ 0,887, reroll 0,8% |

O #5 não fechou. Variações testadas nos parâmetros do bot (todas com #1 a #4 e #6 ✓):

| Variação | Maior arma por herói (jack / bob / lucia) | Maior set |
|---|---|---|
| `temperature` 0,5 | `hammer` 57% / `elementStaff` 67% / `flameRing` 58% | `elemental` 91% |
| `temperature` 1 | 58% / 66% / 59% | `elemental` 90% |
| `temperature` 1, gosto 0,6 a 1,4 | 63% / 65% / 56% | `elemental` 90% |
| `temperature` 1, sem sinergia | 64% / 68% / 57% | `elemental` 94% |
| `temperature` 1, sem sinergia, gosto 0,4 a 1,6 | 60% / 65% / 49% | `elemental` 91% |
| `temperature` 2, sem sinergia, gosto 0,4 a 1,6, troca com fator 1,2 | 61% / 60% / 50% | `elemental` 89% |

O mais perto que chegou foi 49% a 61% de cada herói na arma líder. O que impede o limite de 35%: com cerca de 15 armas candidatas e 5 vagas, uma arma que um herói compra uma vez fica na build até o fim (só é trocada por uma 1,5× mais forte); as armas de classe do herói são as mais fortes por causa do `tagMul`, então entram em quase toda build dele. Fechar o #5 por herói pede decisão de design (rever o limite, ou reduzir o `tagMul` por herói, ou dar mais vagas de troca), não só preferência do comprador.

## Veredito final das metas #1 a #8 (2026-11-08)

Decisões do desenvolvedor aplicadas: o #5 por herói virou **exceção justificada** e ganhou o critério exigido "toda arma de loja aparece em ≥ 3% das builds de pelo menos um herói". `evaluateGoals` agora avalia esse critério, mede o #7 como tempo de jogo mais 45 s por loja e lê o #8 de `bun scripts/perf.ts`. Relatório completo em [balance-auto-2026-11-08.md](balance-auto-2026-11-08.md) (sim com 100 seeds, mais 6 runs do bot real no #7 e 3 medições de FPS).

| # | Veredito | Medido |
|---|---|---|
| 1 | ✓ (sim) | 17 / 17 / 10, máx. 24 |
| 2 | ✓ (sim) | mortes antes do round 12: jack 3%, bob 0%, lucia 1% |
| 3 | ✓ (sim) | 33 / 33 / 32 (margem pequena sobre o 30) |
| 4 | ✓ (sim) | D0 39, D1 27, D5 10 |
| 5 | ✓ com exceção justificada | nenhuma arma abaixo de 3%; líderes por herói 63% a 69% (`hammer`, `elementStaff`, `flameRing`), sets 74% a 93% |
| 6 | ✓ (sim) | 0,887, reroll 0,8% |
| 7 | ✓ com o bot real, no limite | mediana 10,1 min com 6 runs (tempo de jogo 4,8 min); a sim estima 23,8 min |
| 8 | ✓ | 58 / 59 / 59 FPS, p95 16,8 ms (3 medições mudas, round 40) |

Exceção do #5: com cerca de 15 armas candidatas para 5 vagas livres, a participação média por arma já é de cerca de 33%, e o bônus de classe por herói (`tagMul`) é intencional. Os limites de 35% por arma e 50% por set dentro de cada herói não são alcançáveis sem apagar a identidade de classe. Variações do comprador (temperatura, sinergia, gosto) levaram as líderes a 49% a 69%, nunca abaixo de 35%.

### Ressalvas

- **Bot real em L1** (rounds de morte, 2 runs por herói): jack 13 e 10, bob 6 e 15, lucia 3 e 3. A Lucia fica abaixo do piso de 8 da meta #1 no bot real (a sim a põe no round 10), e o conjunto tem mediana de 8. Com 2 runs por herói é indício, não prova; vale uma passada maior do bot (a Lucia L1 parece frágil no jogo real).
- **#7 e a sim**: o bot real e a sim divergem (10,1 contra 23,8 min). Como a meta é do "bot médio", o veredito usa o bot real. A margem é de 0,1 min do limite inferior com apenas 6 runs.
- **#3 na sim** passou de 51 / 51 / 42 para 33 / 33 / 32 com o comprador com preferência (o bot menos otimizado). A margem sobre o 30 é pequena.
- **#8** foi medido com o dev server `:5173` e Chrome com janela (a GPU decide); as 3 medições têm 58 ou 59 FPS, no limite do piso de 58.

## Investigação da Lucia no bot real (L1, D1)

Pedido: 8 ou mais seeds da Lucia e 4 de Jack e Bob no bot real (build DEV congelada servida por um servidor estático local, mudo, `--speed 4`, bot médio `--react 0.2 --mistakes 0.05`).

### Antes (economia anterior)

| Herói | Rounds de morte (seeds 100 em diante) | Mediana |
|---|---|---|
| lucia (8) | 13, 13, 3, 13, 3, 6, 3, 3 | 4,5 |
| jack (4) | 9, 3, 3, 42 | 6 |
| bob (4) | 13, 30, 30, 3 | 21,5 |

A Lucia ficava abaixo do piso de 8 da meta #1, mas o problema **não é da Lucia**: Jack também tem 2 mortes no round 3, e Bob 1.

### Causa

Bimodal. As runs que morrem no round 3 (em cerca de 65 a 75 s de jogo, 110 a 130 abates) **nunca compraram uma arma**: Fish ganho 0 a 10 até então, e uma arma tier I custa 10 Fish no round 1 e 12 no round 2 (`8 + 2·round`). O jogador chega ao primeiro round de elites (round 3, `eliteEvery` 3) só com a arma inicial e leva 78 a 278 de dano. As runs que sobrevivem tiveram Fish de drop, compraram cedo e fecham o round 3 com 29 a 66 de dano. Não é o cérebro do bot (a Lucia que sobrevive faz o mesmo movimento) nem fragilidade da Lucia: é o caminho crítico da economia no início da run.

A sim não via isso porque o dinheiro dela só vem do fim de round, e ela compra no round 3, sem o ruído de drops de Fish.

### Testes de correção (bot real, 8 seeds da Lucia)

| Variante | Rounds de morte da Lucia | Efeito na sim (#1 a #4) |
|---|---|---|
| `roundEndBase` 2 → 5 | 31, 6, 9, 13, 3, 6, 18 e mais 1 | quebra: #1 máx. 32 (✗), #4 D5 16 (✗) |
| rampa do dano de inimigo nos primeiros 5 rounds (`dmgRampRounds`) | 3, 23 e mais 4 | nenhum (a sim não morre cedo); a morte no round 3 persistiu, então **revertida** |
| **`ECONOMY.fish.start` = 10** | 15, 13, 13, 23, 5, 6 (de 8; as 2 restantes não mudam o veredito) | ✓ #1 a #4 e #6 (ver abaixo) |

### Mudança aplicada (dados, reversível)

| Campo | De | Para |
|---|---|---|
| `ECONOMY.fish.start` (novo; `createRunState` inicia `run.fish` com ele) | 0 | 10 |

Com 10 Fish de partida, a primeira loja já permite uma arma tier I, e as runs deixam de chegar ao round 3 só com a arma inicial. Efeito na sim: #1 18 / 18 / 15 (máx. 26), #2 ✓, #3 33 / 35 / 33, #4 D0 42, D1 31, D5 10, #6 0,919.

### Resultado depois de `ECONOMY.fish.start` = 10 (bot real, mesmo setup)

| Herói | Rounds de morte | Mediana | Antes |
|---|---|---|---|
| lucia (8) | 15, 13, 13, 23, 5, 6, 32, 41 | **14** | 4,5 |
| jack (4) | 10, 14, 10, 10 | **10** | 6 |
| bob (3 de 4; a 4ª run não terminou) | 13, 20, 32 | 20 | 21,5 |

- **Meta #1 no bot real: ✓** (todas as medianas ≥ 8). Só 1 de 15 runs ainda morre no round 3 ou antes (2 mortes no round 5 e 6 da Lucia); antes eram 5 de 8 só na Lucia.
- **Meta #7 passa de 10,1 min para 18,0 min** (15 runs do bot real, tempo de jogo 9,0 min + 45 s por loja): o valor de 10,1 era artificialmente curto por causa das mortes no round 3. Agora está no limite superior da faixa de 10 a 18 min (`evaluateGoals` marca ✗ por 0,03 min). É decisão do desenvolvedor: aceitar 18 min ou mexer no tempo por loja.
- Sim com `fish.start` = 10: #1 18 / 18 / 15 (máx. 26), #2 ✓ (jack 0%, bob 0%, lucia 1%), #3 33 / 35 / 33, #4 D0 42, D1 31, D5 10, #5 ✓ com a exceção (líderes 71 a 84%), #6 0,919.
- Docs: SDD-003 RF-06 e GDD §17 agora dizem que a run começa com 10 Fish.

## Raridade I–V, afixos e drops (ADR-017)

A mudança de escopo (raridade única, loja só I a III, arma só até o III, IV de Elite e V de Boss) tirou a arma tier IV da loja e acrescentou afixos. Rodada com `SOUND_MUTED=true bun scripts/sim.ts 1 --jsonl … 100` + `bun scripts/balance-report.ts`, 100 seeds por célula, mesmas metas.

### Ajustes e resultado

| Passo | Mudança | Resultado na sim |
|---|---|---|
| 1 | Só a loja I–III com afixos (sem drops) | #1 ✓ 18 / 18 / 16; **#3 ✗ 42 / 61 / 39** (afixos de `power` 1 fortes demais no L20) |
| 2 | `AFFIX_SCALE.power` 1 → 0,5 | #3 ✓ 36 / 43 / 33 |
| 3 | Drops de arma V de Boss com 100% e 50% de arma | **quebra tudo**: #1 mediana 22 a 23 e máx. 48 a 61, #3 61 / 61 / 61, #6 reroll 27% |
| 4 | Drop de arma V de Boss 2,5%, IV de Elite 0,02%; V sem bônus de dano (×1,0); `power` 0,3 | #1 ✓ máx. 27; #3 passa a depender do corte do Bob |
| 5 | **`dmgPerLoop` 1,5 → 2,0** (endless): a bimodalidade do L20 vem de passar ou não o round 31 (a volta 2 do endless); com 1,5 o Bob ficava a ~50% de runs no teto de 60 e a mediana saltava entre 43 e 61 a cada mudança | #3 ✓ 33 / 33 / 33 com margem |

Com a mudança de stream do sorteio dos drops (a sim sorteia drops com um gerador próprio, para não embaralhar as compras), as metas deixam de saltar por ruído.

### Estado final (valores no código)

| Campo | Valor |
|---|---|
| `AFFIX_SCALE` | `rarityStep` 0,25, `roundStep` 0,02, `power` 0,3 |
| `WEAPON_V_DAMAGE_MUL` | 1,0 |
| `SHOP.maxRarity`, `SHOP.potions` | 3, `['haste']` |
| Preços de arma I a V | 8, 20, 45, 90, 160 |
| Preços de equipamento I a V | 12, 30, 70, 140, 250 |
| `DROPS.item.elite` | arma 0,0002, equipamento 0,01 |
| `DROPS.item.boss` | arma 0,025, equipamento 1 |
| `ROUNDS.scaling.dmgPerLoop` | 1,5 → 2 |

| Meta | Sim (100 seeds) |
|---|---|
| #1 | ✓ 18 / 18 / 15, máx. 27 |
| #2 | ✓ jack 0%, bob 0%, lucia 1% |
| #3 | ✓ 33 / 33 / 33 |
| #4 | ✓ D0 42, D1 31, D5 10 |
| #5 | ✓ pelo critério da A4 (nenhuma arma abaixo de 3%); líderes por herói 70% a 79% (exceção justificada, igual antes) |
| #6 | ✓ 0,895, reroll 8,5% |
| #7 e #8 | #8 ✓ (medição anterior); **#7 e o bot real não foram refeitos** com a raridade (a UI da loja e os drops de equipamento com afixos ainda não estão na cena) |

### Ressalvas

- A sim modela só os drops de **arma** IV e V (não tem equipamento, como antes). Os drops de equipamento com afixos de Elite e Boss entram no jogo real sem passar pela sim; com `power` 0,3 o efeito deve ser pequeno, mas vale confirmar com o bot real.
- As chances de drop de arma são muito baixas de propósito: com chances maiores o primeiro Boss entregava uma arma V que passava as metas #1 e #3. Se quiser que os Bosses entreguem V com mais frequência, é preciso compensar em outro lugar (dano dos inimigos, Oficina).
- `dmgPerLoop` 2 torna o endless (round 31 em diante) mais duro; o GDD e a Parte B foram atualizados.

### Drop V do Boss mais perceptível (2026-11-08)

Pedido: o Boss deve dar V de forma perceptível. O equipamento V já é **garantido** em todo Boss (`gearChance` 1). Para a arma V testei `weaponChance` do Boss na sim (100 seeds, drops com gerador próprio):

| `boss.weaponChance` | #1 | #3 (L20) | Resultado |
|---|---|---|---|
| 0,025 (antes) | ✓ 18 / 18 / 15, máx. 27 | ✓ 33 / 33 / 33 | ✓ |
| 0,05 | ✓ máx. 27 | ✓ 33 / 33 / 33 | ✓ |
| 0,12 | ✓ máx. 27 | ✓ 33 / 36 / 34 | ✓ |
| 0,25 | ✗ máx. 31 | ✓ mas Bob 52 | ✗ |

Escolhi **0,10** no Boss e **0,0008** na arma IV de Elite (antes 0,0002). Com os dois: #1 ✓ 18 / 18 / 16 (máx. 27), #2 ✓, #3 ✓ 34 / 41 / 36, #4 ✓ D0 61, D1 31, D5 10, #5 ✓ (critério da A4), #6 ✓ 0,885 (reroll 12,7%). A margem do #3 do Bob diminui (41); acima de 0,12 as metas quebram. Capturas: `docs/reports/boss-v-drop-2026-11-08.jpg` (drop V no chão logo depois de um Boss, round 10) e `docs/reports/shop-rarity-2026-11-08.jpg` (loja com itens I a III, afixos e o painel do jogador com um item V).
