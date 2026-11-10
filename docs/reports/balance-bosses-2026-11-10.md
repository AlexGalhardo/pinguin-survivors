# Balanceamento dos bosses da campanha (2026-11-10)

Escopo: só análise e proposta. Nenhum arquivo de `src/` ou `scripts/` foi alterado. As proposta não estão aplicadas.

## Conclusão

- O boss do round 5 (foca-leopardo) fica entre 28 e 77 s no sim com build média, mas o sim está na escala antiga (motion = clock = 1). Se o 1× novo for metade do tempo do sim, o boss 5 morre em ~15–40 s. A meta "60–90 s" e a equivalência de dano que assumo não valem ao mesmo tempo com a curva atual: dobrar a vida base de todos os bosses (variante 1,7 + ×2) derruba Jack L20 para 22% de vitória no boss 5. Isso é decisão do desenvolvedor (ver pendências).
- O maior pico de dificuldade é o boss 25 (rainha da colmeia, abertura da 3ª bioma): 27–45% de vitória para Jack e Bob em L20/L30, 5–9% para Lucia. Causa: o salto de HP (×2 por boss) e o salto de dano no início do bioma (`cycle` +1 → dmgMul ×1,15; no round 25 o dano por golpe da rainha é ~210 contra ~116 do alce-rei no round 20).
- As derrotas não concentram nos fins de bioma (10, 20, 30, 40, 50). Concentram no boss 25 (abertura) e no 30 (colosso biomecânico, fim da 3ª bioma). Proposta: reduzir a vida das aberturas e baixar o `bossHpPerBoss` de 2 para 1,8.
- Curva atual, L40/L60: boss 45 (plagueHierophant) com 0–6% de vitória para Jack e Bob; boss 50 sem amostra suficiente. Proposta: boss 45 sobe para 20% / 59% (Jack, L40/L60) e 15% / 42% (Bob); boss 50 (abominação) fica em 10–17% (Jack) e 0–5% (Bob). Ainda baixo, com amostras de 4 a 54 corridas.
- Limitação grande: o sim não modela padrões de boss (investida, rugido, poças, rajada) nem o dano específico de cada `BOSS_HAZARD`. Por isso as tabelas por boss dependem quase só de `hp`, `damage` e `hazardEvery`. Qualquer ajuste de dano de hazard precisa de bot (`scripts/playtest-bot.ts`) antes de fechar.

## Comandos rodados

- `bun scripts/sim.ts 40`: baseline por herói (L1, 5, 10, 20, 30). Morte mediana: Jack L20 = 24, Bob L20 = 24, Lucia L20 = 20. Mortes em boss concentradas nos rounds 15–25.
- `bun scripts/balance-goals.ts 100`: #1 ok, #2 BAD (Jack: morre antes do round 12 em 9%, meta ≤ 5%; Lucia 36%), #3 BAD (mediana L20 = 20–24, meta > 30), #4 ok, #5 ok, #6 ok (gasto/ganho 0,856, reroll 0%).
- Script de scratchpad (`boss-table.ts`, em `C:\Users\aleex\AppData\Local\Temp\claude\cb62a2a10f052486\d317dfea-43f1-418d-acdf-45417bedd76f\scratchpad\boss-table.ts`): por boss, HP efetivo, alcançados, mortes, vitória e tempo de morte do boss (diferença de `seconds` entre `SIM.maxRound = b−1` e `b`), N = 60, L10/20/30.
- Script de scratchpad (`boss-variant.ts` e `boss-variant-hi.ts`, mesma pasta): variantes de `bossHpPerBoss`, multiplicador de vida das aberturas (`OPEN_MUL`) e de vida base, N = 100, seeds 100–199, L20/L30 e L40/L60. Os imports usam caminho relativo à pasta do projeto, porque o import absoluto `C:/…` criava outra instância do módulo e o patch não pegava.
- `bunx`/`bun test` e `lint:md` não rodados nesta análise (não mudei código; o `lint:md` roda abaixo, no relatório).

## Tabela por boss (curva atual, `bossHpPerBoss` 2)

HP efetivo = `hp × 2^(N/5−1)`. TTK = mediana do tempo até matar o boss, em segundos do sim (escala antiga, ver limitação). DPS efetivo = HP efetivo / TTK. Vitória = % das corridas que chegaram ao round e passaram do boss (N = 100 para vitória, N = 60 para TTK/DPS).

| Round | Boss | HP efetivo | TTK L20 Jack / Bob / Lucia (s) | DPS efetivo L20 Jack / Bob / Lucia | Vitória L20 Jack / Bob / Lucia | Vitória L30 Jack / Bob / Lucia |
|---|---|---|---|---|---|---|
| 5 | leopardSeal | 2 400 | 77 / 29 / 54 | 31 / 84 / 45 | 96% / 100% / 100% | 96% / 100% / 100% |
| 10 | polarBear | 6 000 | 67 / 33 / 63 | 90 / 185 / 95 | 100% / 100% / 97% | 100% / 100% / 98% |
| 15 | rotTreant | 12 000 | 71 / 37 / 56 | 168 / 324 / 215 | 97% / 99% / 70% | 100% / 100% / 80% |
| 20 | mooseKing | 24 000 | 59 / 39 / 49 | 407 / 615 / 490 | 85% / 86% / 65% | 100% / 99% / 66% |
| 25 | hiveQueen | 51 200 | 59 / 31 / 57 | 871 / 1 679 / 898 | 27% / 44% / 5% | 45% / 66% / 9% |
| 30 | biomechColossus | 112 000 | 53 (n=4) / — / — | 2 123 / — / — | 14% / 0% / 0% | 24% / 17% / 0% |
| 35 | drownedDiver | 211 200 | 75 (n=1) | 2 816 | 100% (n=1) / — / — | 38% / 38% / — |
| 40 | kraken | 384 000 | 92 (n=1) | 4 174 | 100% (n=1) | 100% (n=3) / 100% (n=3) / — |
| 45 | plagueHierophant | 870 400 | — | — | 0% (n=1) | 0% (n=3) / 0% (n=1) / — |
| 50 | abomination | 1 792 000 | — | — | — | — |

Observação: n pequeno a partir do 30 em L20/L30. Para 35–50, ver a tabela L40/L60 abaixo.

Vitória em L40 / L60 (N = 100), curva atual: boss 35 = 50% / 93% (Jack) e 50% / 75% (Bob); boss 40 = 75% / 97% e 67% / 90%; boss 45 = 0% / 6% e 0% / 0%; boss 50 = sem amostra em L40 e 25% (n=4) em L60 para Jack, sem amostra para Bob.

## Proposta

Estas propostas valem sob a limitação do sim (ver abaixo). Nenhuma foi aplicada.

1. `ROUNDS.scaling.bossHpPerBoss`: 2 → 1,8. Efeito: HP efetivo no round 25 cai de 51 200 para 25 194; no round 50 de 1 792 000 para ~694 000 (com a vida base atual). Acima da curva, o salto por boss passa a ser ×1,8.
2. Vida base das aberturas (`src/data/enemies.ts`): rotTreant 3 000 → 2 250; hiveQueen 3 200 → 2 400; drownedDiver 3 300 → 2 475; plagueHierophant 3 400 → 2 550. Efeito: aberturas 15, 25, 35 e 45 ficam ~25% mais fáceis; finais (10, 20, 30, 40, 50) e o leopardSeal (5) não mudam.
3. Combinando 1 e 2 (N = 100, L20/L30): boss 25 hiveQueen sobe para 85% / 83% (Jack), 91% / 96% (Bob), 60% / 81% (Lucia); boss 30 biomechColossus sobe para 60% / 67%, 31% / 64%, 0% / 10%. Lucia continua a pior, sinal de desequilíbrio de herói e não de boss.
4. `bossTimeLimit` (120) e `bossTimeStep` (60): sem mudança proposta. O sim não separa morte por dano de timeout (`diedToBoss` conta os dois), e no 1× novo o relógio é o mesmo, mas o TTK do boss cai pela metade. Com o limite de 10 min no 50, o timeout provavelmente deixa de ser o limite, mas sem bot não dá para afirmar.
5. `BOSS_HAZARD` (frações de dano 0,7–0,9, telegraph 0,9–1,1): sem mudança proposta. O sim não usa essas frações (usa `bossHazardLand` 0,1 e `bossHazardDamage` 0,8 fixos), então não há evidência para ajustar. O teste certo é o bot em Lucia e Bob nos rounds 25 e 30.
6. Vida base dos bosses novos: já coberta pelo item 2 (aberturas); os finais novos (mooseKing 3 000, biomechColossus 3 500, polarBear 3 000, kraken 3 000, abomination 3 500) não mudam.

Efeito esperado (sim, escala antiga): no boss 25, vitória em L20 sobe de 27% / 44% para 85% / 91% (Jack / Bob); no boss 30, Jack L20 de 14% para 60%. As derrotas deixam de se concentrar no boss 25 e passam a aparecer no 30 (fim da cidade) e no 45 (abertura das Ruínas); Lucia segue como exceção.

## Limitações do sim

- Escala: o sim usa `motion = clock = 1` (escala antiga, SDD-018 fora de escopo). No 1× novo o combate é 2× mais rápido por segundo de relógio. Hipótese (não verificada): para o mesmo HP e dano, a vitória fica quase igual e o TTK cai pela metade. Isto não foi testado com bot, então o TTK em segundos reais é uma estimativa.
- Padrões: o sim não modela investida, rugido, poças, rajada do kraken nem os ataques de `BOSS_HAZARD` por tipo.
- Alcance: `SIM.maxRound` = 60. Corridas de L20 morrem por volta do round 24, então boss 35–50 só aparece com L40/L60 (amostras de 2 a 100 por boss).
- Morte em boss: `diedToBoss` conta morte por dano e por timeout.
- Dano por round: o salto de dano no início de cada bioma (×1,15 do `cycle`) entra no round 25, e explica o pico de dificuldade da rainha. Não mexi no `dmgPerCycle` (fora do escopo deste pedido), mas vale checar.

## Pendências e decisões

- Decisão do desenvolvedor: escala do TTK. A meta "boss 5 em 60–90 s" depende de qual escala se usa. Se o sim for lido como o 1× novo, a meta já vale e não há mudança. Se for o 2× do sim, precisa aumentar a vida do boss 5 e reduzir o dano dele, e isso derruba Jack L20 para 22% no boss 5 (teste com 2× de vida).
- Pedir ao orquestrador: adicionar um fator `motion` ao sim (ou calibrar com o bot) antes de aprovar a proposta. Mudança de código, fora deste relatório.
- Bot (`scripts/playtest-bot.ts`) não rodado (sem browser nesta tarefa). Necessário para validar hazards e timeout.
- Lucia tem a pior vitória em todas as variantes: problema de herói ou de curva de dano, não de boss. Sinal para o balanceamento de heróis.

## Verificação

- `bun run lint:md` sobre este arquivo: ver resultado no relatório final de quem chamou.
