# Balanço automático (2026-11-08)

Gerado por `bun scripts/balance-report.ts` a partir de 5406 runs (C:/Users/aleex/AppData/Local/Temp/claude/7dd2f9fb88fe2e00/9865445d-d774-4286-b9ac-e8877d5bae2f/scratchpad/f.jsonl, C:/Users/aleex/AppData/Local/Temp/claude/7dd2f9fb88fe2e00/9865445d-d774-4286-b9ac-e8877d5bae2f/scratchpad/l1bot.jsonl). Metas da Parte A4 de [balancing-and-simulation.md](../balancing-and-simulation.md); `n/d` = sem dados para decidir, não conta como aprovado.

## Metas

| # | Perfil | Meta | Status | Medido |
|---|---|---|---|---|
| 1 | L1, D1, sem Oficina | mediana de morte entre os rounds 8 e 20; nenhum herói passa do 30 | ✓ | medianas 17 / 17 / 10, máximo 24 |
| 2 | L10, D1, Oficina all:2 | cada herói passa do boss 20 em ≥ 1 run; ≤ 5% das runs morrem antes do round 12 | ✓ | passam do 20: jack sim, bob sim, lucia sim; morrem antes do 12: jack 3.0%, bob 0.0%, lucia 1.0% |
| 3 | L20, D1, Oficina all:4 | os 3 heróis passam do round 30 (mediana) e morrem antes do 60 | ✓ | medianas 33 / 33 / 32 |
| 4 | L10, D0 / D1 / D5 | D0 chega ≥ 5 rounds além do D1; D5 morre até o round 15 | ✓ | medianas D0 39, D1 27, D5 10 |
| 5 | L10, D1, por herói (armas da loja, sem a inicial) | toda arma de loja aparece em ≥ 3% das builds de pelo menos um herói (limites de 35% por arma e 50% por set por herói: exceção justificada, valores medidos abaixo) | ✓ | jack: arma hammer 63.0%, set blade 74.0%; bob: arma elementStaff 69.0%, set elemental 93.0%; lucia: arma flameRing 67.0%, set elemental 90.0%; abaixo de 3% em todos os heróis: nenhuma |
| 6 | todas as runs com Fish | Fish gasto / ganho entre 0,85 e 1,0; reroll ≤ 15% do gasto | ✓ | gasto/ganho 0.887, reroll 0.8% do gasto |
| 7 | L1, D1, bot do jogo real | run L1 mediana entre 10 e 18 min (tempo de jogo + 45 s por loja) | ✓ | mediana 10.1 min (tempo de jogo 4.8 min, 6 runs) |
| 8 | build real, `bun scripts/perf.ts --round 40` | ≥ 58 FPS médios e p95 ≤ 18 ms com 300 inimigos e 2.000 decalques (1920×1080, round 40) | ✓ | 3 medições: FPS médio mínimo 58, p95 máximo 16.8 ms |

## Round de morte por herói, nível e Danger

| Herói | Nível | Danger | Runs | Mediana | p25 | p75 | Passa do 30 |
|---|---|---|---|---|---|---|---|
| jack | 1 | 0 | 100 | 23 | 21 | 24 | 1.0% |
| jack | 1 | 1 | 102 | 17 | 10 | 19 | 0.0% |
| jack | 1 | 2 | 100 | 10 | 10 | 16 | 0.0% |
| jack | 1 | 3 | 100 | 10 | 10 | 14 | 0.0% |
| jack | 1 | 4 | 100 | 10 | 10 | 10 | 0.0% |
| jack | 1 | 5 | 100 | 10 | 10 | 10 | 0.0% |
| jack | 10 | 0 | 100 | 42 | 32 | 61 | 88.0% |
| jack | 10 | 1 | 100 | 27 | 24 | 32 | 41.0% |
| jack | 10 | 2 | 100 | 24 | 23 | 27 | 22.0% |
| jack | 10 | 3 | 100 | 24 | 10 | 24 | 9.0% |
| jack | 10 | 4 | 100 | 10 | 10 | 20 | 4.0% |
| jack | 10 | 5 | 100 | 10 | 10 | 10 | 0.0% |
| jack | 20 | 0 | 100 | 61 | 39 | 61 | 99.0% |
| jack | 20 | 1 | 100 | 33 | 31 | 61 | 76.0% |
| jack | 20 | 2 | 100 | 30 | 26 | 33 | 50.0% |
| jack | 20 | 3 | 100 | 26 | 24 | 31 | 27.0% |
| jack | 20 | 4 | 100 | 24 | 10 | 26 | 9.0% |
| jack | 20 | 5 | 100 | 10 | 10 | 23 | 3.0% |
| bob | 1 | 0 | 100 | 22 | 18 | 24 | 2.0% |
| bob | 1 | 1 | 102 | 17 | 15 | 19 | 0.0% |
| bob | 1 | 2 | 100 | 15 | 14 | 17 | 0.0% |
| bob | 1 | 3 | 100 | 14 | 10 | 15 | 0.0% |
| bob | 1 | 4 | 100 | 10 | 10 | 12 | 0.0% |
| bob | 1 | 5 | 100 | 10 | 10 | 10 | 0.0% |
| bob | 10 | 0 | 100 | 45 | 33 | 61 | 88.0% |
| bob | 10 | 1 | 100 | 30 | 24 | 33 | 50.0% |
| bob | 10 | 2 | 100 | 25 | 23 | 28 | 20.0% |
| bob | 10 | 3 | 100 | 23 | 21 | 25 | 10.0% |
| bob | 10 | 4 | 100 | 17 | 15 | 22 | 0.0% |
| bob | 10 | 5 | 100 | 14 | 10 | 17 | 0.0% |
| bob | 20 | 0 | 100 | 61 | 61 | 61 | 99.0% |
| bob | 20 | 1 | 100 | 33 | 31 | 61 | 76.0% |
| bob | 20 | 2 | 100 | 30 | 26 | 33 | 50.0% |
| bob | 20 | 3 | 100 | 26 | 24 | 31 | 29.0% |
| bob | 20 | 4 | 100 | 24 | 19 | 25 | 9.0% |
| bob | 20 | 5 | 100 | 19 | 16 | 23 | 0.0% |
| lucia | 1 | 0 | 100 | 18 | 16 | 22 | 0.0% |
| lucia | 1 | 1 | 102 | 10 | 10 | 16 | 0.0% |
| lucia | 1 | 2 | 100 | 10 | 10 | 13 | 0.0% |
| lucia | 1 | 3 | 100 | 10 | 10 | 10 | 0.0% |
| lucia | 1 | 4 | 100 | 10 | 10 | 10 | 0.0% |
| lucia | 1 | 5 | 100 | 10 | 9 | 10 | 0.0% |
| lucia | 10 | 0 | 100 | 33 | 31 | 61 | 79.0% |
| lucia | 10 | 1 | 100 | 27 | 24 | 31 | 37.0% |
| lucia | 10 | 2 | 100 | 24 | 15 | 27 | 12.0% |
| lucia | 10 | 3 | 100 | 13 | 10 | 23 | 5.0% |
| lucia | 10 | 4 | 100 | 10 | 10 | 12 | 0.0% |
| lucia | 10 | 5 | 100 | 10 | 10 | 10 | 0.0% |
| lucia | 20 | 0 | 100 | 61 | 35 | 61 | 94.0% |
| lucia | 20 | 1 | 100 | 32 | 27 | 36 | 64.0% |
| lucia | 20 | 2 | 100 | 27 | 24 | 31 | 40.0% |
| lucia | 20 | 3 | 100 | 24 | 23 | 27 | 20.0% |
| lucia | 20 | 4 | 100 | 17 | 10 | 24 | 4.0% |
| lucia | 20 | 5 | 100 | 10 | 10 | 16 | 0.0% |

## Armas nas builds finais (L10, D1, sem a arma inicial)

| Arma | Builds |
|---|---|
| flameRing | 41.7% |
| molotov | 39.3% |
| elementStaff | 37.3% |
| hammer | 35.7% |
| iceShards | 29.7% |
| mine | 24.7% |
| knives | 23.7% |
| bladeWhirl | 19.7% |
| machete | 19.3% |
| poisonCloud | 17.3% |
| crossbow | 15.3% |
| auxPistol | 13.7% |
| doubleBarrel | 13.0% |
| fishBoomerang | 12.0% |
| droneSentinel | 12.0% |
| grenadeBelt | 10.3% |
| lightningTotem | 9.7% |

| Set | Builds |
|---|---|
| elemental | 84.7% |
| explosive | 53.3% |
| blade | 50.7% |
| gun | 40.7% |
| blunt | 35.7% |
| support | 35.7% |
| thrown | 31.0% |
