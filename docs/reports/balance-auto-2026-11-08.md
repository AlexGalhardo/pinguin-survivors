# Balanço automático (2026-11-08)

Gerado por `bun scripts/balance-report.ts` a partir de 5416 runs (C:/Users/aleex/AppData/Local/Temp/claude/7dd2f9fb88fe2e00/9865445d-d774-4286-b9ac-e8877d5bae2f/scratchpad/fin3.jsonl, C:/Users/aleex/AppData/Local/Temp/claude/7dd2f9fb88fe2e00/9865445d-d774-4286-b9ac-e8877d5bae2f/scratchpad/lu7.jsonl, C:/Users/aleex/AppData/Local/Temp/claude/7dd2f9fb88fe2e00/9865445d-d774-4286-b9ac-e8877d5bae2f/scratchpad/ja7.jsonl). Metas da Parte A4 de [balancing-and-simulation.md](../balancing-and-simulation.md); `n/d` = sem dados para decidir, não conta como aprovado.

## Metas

| # | Perfil | Meta | Status | Medido |
|---|---|---|---|---|
| 1 | L1, D1, sem Oficina | mediana de morte entre os rounds 8 e 20; nenhum herói passa do 30 | ✓ | medianas 18 / 18 / 16, máximo 27 |
| 2 | L10, D1, Oficina all:2 | cada herói passa do boss 20 em ≥ 1 run; ≤ 5% das runs morrem antes do round 12 | ✓ | passam do 20: jack sim, bob sim, lucia sim; morrem antes do 12: jack 0.0%, bob 0.0%, lucia 1.0% |
| 3 | L20, D1, Oficina all:4 | os 3 heróis passam do round 30 (mediana) e morrem antes do 60 | ✓ | medianas 34 / 41 / 36 |
| 4 | L10, D0 / D1 / D5 | D0 chega ≥ 5 rounds além do D1; D5 morre até o round 15 | ✓ | medianas D0 61, D1 31, D5 10 |
| 5 | L10, D1, por herói (armas da loja, sem a inicial) | toda arma de loja aparece em ≥ 3% das builds de pelo menos um herói (limites de 35% por arma e 50% por set por herói: exceção justificada, valores medidos abaixo) | ✓ | jack: arma hammer 79.0%, set blunt 79.0%; bob: arma elementStaff 79.0%, set elemental 97.0%; lucia: arma flameRing 65.0%, set elemental 89.0%; abaixo de 3% em todos os heróis: nenhuma |
| 6 | todas as runs com Fish | Fish gasto / ganho entre 0,85 e 1,0; reroll ≤ 15% do gasto | ✓ | gasto/ganho 0.885, reroll 12.7% do gasto |
| 7 | L1, D1, bot do jogo real | run L1 mediana entre 10 e 18 min (tempo de jogo + 45 s por loja) | ✗ | mediana 18.8 min (tempo de jogo 9.4 min, 16 runs) |
| 8 | build real, `bun scripts/perf.ts --round 40` | ≥ 58 FPS médios e p95 ≤ 18 ms com 300 inimigos e 2.000 decalques (1920×1080, round 40) | ✓ | 3 medições: FPS médio mínimo 58, p95 máximo 16.8 ms |

## Round de morte por herói, nível e Danger

| Herói | Nível | Danger | Runs | Mediana | p25 | p75 | Passa do 30 |
|---|---|---|---|---|---|---|---|
| jack | 1 | 0 | 100 | 24 | 22 | 25 | 4.0% |
| jack | 1 | 1 | 104 | 18 | 17 | 22 | 0.0% |
| jack | 1 | 2 | 100 | 17 | 15 | 18 | 0.0% |
| jack | 1 | 3 | 100 | 15 | 10 | 17 | 0.0% |
| jack | 1 | 4 | 100 | 10 | 10 | 12 | 0.0% |
| jack | 1 | 5 | 100 | 10 | 10 | 10 | 0.0% |
| jack | 10 | 0 | 100 | 61 | 33 | 61 | 99.0% |
| jack | 10 | 1 | 100 | 32 | 28 | 33 | 74.0% |
| jack | 10 | 2 | 100 | 31 | 25 | 31 | 52.0% |
| jack | 10 | 3 | 100 | 26 | 24 | 28 | 23.0% |
| jack | 10 | 4 | 100 | 21 | 10 | 24 | 7.0% |
| jack | 10 | 5 | 100 | 10 | 10 | 19 | 1.0% |
| jack | 20 | 0 | 100 | 61 | 45 | 61 | 100.0% |
| jack | 20 | 1 | 100 | 34 | 32 | 52 | 93.0% |
| jack | 20 | 2 | 100 | 32 | 31 | 33 | 80.0% |
| jack | 20 | 3 | 100 | 31 | 27 | 32 | 62.0% |
| jack | 20 | 4 | 100 | 26 | 24 | 29 | 22.0% |
| jack | 20 | 5 | 100 | 24 | 18 | 25 | 5.0% |
| bob | 1 | 0 | 100 | 23 | 22 | 24 | 3.0% |
| bob | 1 | 1 | 104 | 18 | 17 | 22 | 1.0% |
| bob | 1 | 2 | 100 | 16 | 15 | 18 | 0.0% |
| bob | 1 | 3 | 100 | 15 | 14 | 17 | 0.0% |
| bob | 1 | 4 | 100 | 12 | 10 | 15 | 0.0% |
| bob | 1 | 5 | 100 | 10 | 10 | 10 | 0.0% |
| bob | 10 | 0 | 100 | 61 | 35 | 61 | 96.0% |
| bob | 10 | 1 | 100 | 32 | 31 | 42 | 75.0% |
| bob | 10 | 2 | 100 | 31 | 26 | 32 | 59.0% |
| bob | 10 | 3 | 100 | 26 | 24 | 31 | 32.0% |
| bob | 10 | 4 | 100 | 22 | 17 | 24 | 6.0% |
| bob | 10 | 5 | 100 | 16 | 14 | 22 | 2.0% |
| bob | 20 | 0 | 100 | 61 | 61 | 61 | 100.0% |
| bob | 20 | 1 | 100 | 41 | 33 | 61 | 92.0% |
| bob | 20 | 2 | 100 | 33 | 31 | 49 | 82.0% |
| bob | 20 | 3 | 100 | 31 | 26 | 33 | 65.0% |
| bob | 20 | 4 | 100 | 27 | 24 | 31 | 29.0% |
| bob | 20 | 5 | 100 | 24 | 18 | 24 | 8.0% |
| lucia | 1 | 0 | 100 | 22 | 18 | 24 | 7.0% |
| lucia | 1 | 1 | 108 | 16 | 10 | 18 | 1.9% |
| lucia | 1 | 2 | 100 | 10 | 10 | 15 | 0.0% |
| lucia | 1 | 3 | 100 | 10 | 10 | 10 | 0.0% |
| lucia | 1 | 4 | 100 | 10 | 10 | 10 | 0.0% |
| lucia | 1 | 5 | 100 | 10 | 9 | 10 | 0.0% |
| lucia | 10 | 0 | 100 | 61 | 32 | 61 | 88.0% |
| lucia | 10 | 1 | 100 | 31 | 27 | 36 | 66.0% |
| lucia | 10 | 2 | 100 | 27 | 24 | 31 | 42.0% |
| lucia | 10 | 3 | 100 | 22 | 10 | 25 | 18.0% |
| lucia | 10 | 4 | 100 | 10 | 10 | 18 | 3.0% |
| lucia | 10 | 5 | 100 | 10 | 10 | 10 | 1.0% |
| lucia | 20 | 0 | 100 | 61 | 42 | 61 | 99.0% |
| lucia | 20 | 1 | 100 | 36 | 31 | 61 | 85.0% |
| lucia | 20 | 2 | 100 | 31 | 27 | 36 | 69.0% |
| lucia | 20 | 3 | 100 | 30 | 24 | 31 | 50.0% |
| lucia | 20 | 4 | 100 | 24 | 18 | 27 | 22.0% |
| lucia | 20 | 5 | 100 | 16 | 10 | 22 | 4.0% |

## Armas nas builds finais (L10, D1, sem a arma inicial)

| Arma | Builds |
|---|---|
| hammer | 40.0% |
| elementStaff | 38.0% |
| flameRing | 33.0% |
| molotov | 31.3% |
| iceShards | 30.0% |
| mine | 23.7% |
| knives | 21.0% |
| machete | 19.7% |
| bladeWhirl | 17.3% |
| fishBoomerang | 15.7% |
| poisonCloud | 12.0% |
| grenadeBelt | 10.3% |
| droneSentinel | 9.7% |
| auxPistol | 9.0% |
| lightningTotem | 8.3% |
| crossbow | 6.3% |
| doubleBarrel | 4.3% |

| Set | Builds |
|---|---|
| elemental | 78.7% |
| blade | 49.0% |
| explosive | 43.3% |
| blunt | 40.0% |
| thrown | 32.7% |
| support | 26.3% |
| gun | 24.0% |
