# Balanço automático (2026-11-08)

Gerado por `bun scripts/balance-report.ts` a partir de 5400 runs (C:/Users/aleex/AppData/Local/Temp/claude/7dd2f9fb88fe2e00/9865445d-d774-4286-b9ac-e8877d5bae2f/scratchpad/sim-tree.jsonl). Metas da Parte A4 de [balancing-and-simulation.md](../balancing-and-simulation.md); `n/d` = sem dados para decidir, não conta como aprovado.

## Metas

| # | Perfil | Meta | Status | Medido |
|---|---|---|---|---|
| 1 | L1, D1, sem Oficina | mediana de morte entre os rounds 8 e 20; nenhum herói passa do 30 | ✓ | medianas 18 / 18 / 17, máximo 27 |
| 2 | L10, D1, árvore automática | cada herói passa do boss 20 em ≥ 1 run; ≤ 5% das runs morrem antes do round 12 | ✓ | passam do 20: jack sim, bob sim, lucia sim; morrem antes do 12: jack 0.0%, bob 0.0%, lucia 4.0% |
| 3 | L20, D1, árvore automática | os 3 heróis passam do round 30 (mediana) e morrem antes do 60 | ✓ | medianas 33 / 33 / 32 |
| 4 | L10, D0 / D1 / D5 | D0 chega ≥ 5 rounds além do D1; D5 morre até o round 15 | ✓ | medianas D0 58, D1 31, D5 10 |
| 5 | L10, D1, por herói (armas da loja, sem a inicial) | toda arma de loja aparece em ≥ 3% das builds de pelo menos um herói (limites de 35% por arma e 50% por set por herói: exceção justificada, valores medidos abaixo) | ✓ | jack: arma hammer 78.0%, set blunt 78.0%; bob: arma elementStaff 74.0%, set elemental 95.0%; lucia: arma flameRing 76.0%, set elemental 94.0%; abaixo de 3% em todos os heróis: nenhuma |
| 6 | todas as runs com Fish | Fish gasto / ganho entre 0,85 e 1,0; reroll ≤ 15% do gasto | ✓ | gasto/ganho 0.888, reroll 11.7% do gasto |
| 7 | L1, D1, sim | run L1 mediana entre 10 e 18 min (tempo de jogo + 45 s por loja) | ✗ | mediana 27.3 min (tempo de jogo 14.6 min, 300 runs) |
| 8 | build real, `bun scripts/perf.ts --round 40` | ≥ 58 FPS médios e p95 ≤ 18 ms com 300 inimigos e 2.000 decalques (1920×1080, round 40) | n/d | sem medição (rodar `bun scripts/perf.ts`) |

## Round de morte por herói, nível e Danger

| Herói | Nível | Danger | Runs | Mediana | p25 | p75 | Passa do 30 |
|---|---|---|---|---|---|---|---|
| jack | 1 | 0 | 100 | 24 | 22 | 25 | 4.0% |
| jack | 1 | 1 | 100 | 18 | 17 | 22 | 0.0% |
| jack | 1 | 2 | 100 | 17 | 15 | 18 | 0.0% |
| jack | 1 | 3 | 100 | 15 | 10 | 17 | 0.0% |
| jack | 1 | 4 | 100 | 10 | 10 | 12 | 0.0% |
| jack | 1 | 5 | 100 | 10 | 10 | 10 | 0.0% |
| jack | 10 | 0 | 100 | 46 | 33 | 61 | 96.0% |
| jack | 10 | 1 | 100 | 31 | 27 | 33 | 71.0% |
| jack | 10 | 2 | 100 | 31 | 25 | 31 | 50.0% |
| jack | 10 | 3 | 100 | 26 | 24 | 28 | 19.0% |
| jack | 10 | 4 | 100 | 22 | 10 | 24 | 6.0% |
| jack | 10 | 5 | 100 | 10 | 10 | 22 | 0.0% |
| jack | 20 | 0 | 100 | 61 | 36 | 61 | 100.0% |
| jack | 20 | 1 | 100 | 33 | 32 | 39 | 91.0% |
| jack | 20 | 2 | 100 | 32 | 31 | 33 | 77.0% |
| jack | 20 | 3 | 100 | 31 | 26 | 32 | 58.0% |
| jack | 20 | 4 | 100 | 26 | 24 | 31 | 26.0% |
| jack | 20 | 5 | 100 | 24 | 16 | 25 | 5.0% |
| bob | 1 | 0 | 100 | 23 | 22 | 24 | 3.0% |
| bob | 1 | 1 | 100 | 18 | 17 | 22 | 0.0% |
| bob | 1 | 2 | 100 | 16 | 15 | 18 | 0.0% |
| bob | 1 | 3 | 100 | 15 | 14 | 17 | 0.0% |
| bob | 1 | 4 | 100 | 12 | 10 | 15 | 0.0% |
| bob | 1 | 5 | 100 | 10 | 10 | 10 | 0.0% |
| bob | 10 | 0 | 100 | 61 | 33 | 61 | 96.0% |
| bob | 10 | 1 | 100 | 32 | 30 | 44 | 74.0% |
| bob | 10 | 2 | 100 | 27 | 24 | 32 | 49.0% |
| bob | 10 | 3 | 100 | 25 | 23 | 28 | 24.0% |
| bob | 10 | 4 | 100 | 18 | 15 | 23 | 3.0% |
| bob | 10 | 5 | 100 | 15 | 10 | 18 | 1.0% |
| bob | 20 | 0 | 100 | 61 | 55 | 61 | 98.0% |
| bob | 20 | 1 | 100 | 33 | 31 | 61 | 86.0% |
| bob | 20 | 2 | 100 | 32 | 29 | 37 | 73.0% |
| bob | 20 | 3 | 100 | 29 | 24 | 32 | 49.0% |
| bob | 20 | 4 | 100 | 24 | 18 | 27 | 17.0% |
| bob | 20 | 5 | 100 | 18 | 16 | 23 | 4.0% |
| lucia | 1 | 0 | 100 | 22 | 18 | 24 | 7.0% |
| lucia | 1 | 1 | 100 | 17 | 15 | 20 | 0.0% |
| lucia | 1 | 2 | 100 | 13 | 10 | 15 | 0.0% |
| lucia | 1 | 3 | 100 | 10 | 10 | 13 | 0.0% |
| lucia | 1 | 4 | 100 | 10 | 10 | 10 | 0.0% |
| lucia | 1 | 5 | 100 | 10 | 10 | 10 | 0.0% |
| lucia | 10 | 0 | 100 | 41 | 31 | 61 | 86.0% |
| lucia | 10 | 1 | 100 | 29 | 24 | 32 | 49.0% |
| lucia | 10 | 2 | 100 | 24 | 19 | 31 | 31.0% |
| lucia | 10 | 3 | 100 | 18 | 10 | 24 | 8.0% |
| lucia | 10 | 4 | 100 | 10 | 10 | 10 | 2.0% |
| lucia | 10 | 5 | 100 | 10 | 10 | 10 | 1.0% |
| lucia | 20 | 0 | 100 | 61 | 32 | 61 | 92.0% |
| lucia | 20 | 1 | 100 | 32 | 27 | 39 | 66.0% |
| lucia | 20 | 2 | 100 | 27 | 24 | 32 | 46.0% |
| lucia | 20 | 3 | 100 | 24 | 22 | 30 | 25.0% |
| lucia | 20 | 4 | 100 | 18 | 10 | 23 | 4.0% |
| lucia | 20 | 5 | 100 | 10 | 10 | 15 | 2.0% |

## Armas nas builds finais (L10, D1, sem a arma inicial)

| Arma | Builds |
|---|---|
| hammer | 41.7% |
| elementStaff | 37.0% |
| flameRing | 36.3% |
| molotov | 32.7% |
| iceShards | 25.3% |
| mine | 23.7% |
| knives | 20.3% |
| fishBoomerang | 19.0% |
| bladeWhirl | 18.7% |
| machete | 18.7% |
| poisonCloud | 13.0% |
| grenadeBelt | 12.3% |
| droneSentinel | 10.7% |
| auxPistol | 8.0% |
| crossbow | 7.3% |
| lightningTotem | 6.7% |
| doubleBarrel | 5.7% |

| Set | Builds |
|---|---|
| elemental | 80.3% |
| blade | 47.3% |
| explosive | 45.3% |
| blunt | 41.7% |
| thrown | 36.0% |
| support | 27.0% |
| gun | 25.7% |
