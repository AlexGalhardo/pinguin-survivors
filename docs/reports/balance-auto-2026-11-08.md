# Balanço automático (2026-11-08)

Gerado por `bun scripts/balance-report.ts` a partir de 5415 runs (C:/Users/aleex/AppData/Local/Temp/claude/7dd2f9fb88fe2e00/9865445d-d774-4286-b9ac-e8877d5bae2f/scratchpad/fin.jsonl, C:/Users/aleex/AppData/Local/Temp/claude/7dd2f9fb88fe2e00/9865445d-d774-4286-b9ac-e8877d5bae2f/scratchpad/lu7.jsonl, C:/Users/aleex/AppData/Local/Temp/claude/7dd2f9fb88fe2e00/9865445d-d774-4286-b9ac-e8877d5bae2f/scratchpad/ja7.jsonl). Metas da Parte A4 de [balancing-and-simulation.md](../balancing-and-simulation.md); `n/d` = sem dados para decidir, não conta como aprovado.

## Metas

| # | Perfil | Meta | Status | Medido |
|---|---|---|---|---|
| 1 | L1, D1, sem Oficina | mediana de morte entre os rounds 8 e 20; nenhum herói passa do 30 | ✓ | medianas 18 / 18 / 15, máximo 26 |
| 2 | L10, D1, Oficina all:2 | cada herói passa do boss 20 em ≥ 1 run; ≤ 5% das runs morrem antes do round 12 | ✓ | passam do 20: jack sim, bob sim, lucia sim; morrem antes do 12: jack 0.0%, bob 0.0%, lucia 1.0% |
| 3 | L20, D1, Oficina all:4 | os 3 heróis passam do round 30 (mediana) e morrem antes do 60 | ✓ | medianas 33 / 35 / 33 |
| 4 | L10, D0 / D1 / D5 | D0 chega ≥ 5 rounds além do D1; D5 morre até o round 15 | ✓ | medianas D0 42, D1 31, D5 10 |
| 5 | L10, D1, por herói (armas da loja, sem a inicial) | toda arma de loja aparece em ≥ 3% das builds de pelo menos um herói (limites de 35% por arma e 50% por set por herói: exceção justificada, valores medidos abaixo) | ✓ | jack: arma hammer 71.0%, set blade 76.0%; bob: arma elementStaff 72.0%, set elemental 93.0%; lucia: arma flameRing 84.0%, set elemental 95.0%; abaixo de 3% em todos os heróis: nenhuma |
| 6 | todas as runs com Fish | Fish gasto / ganho entre 0,85 e 1,0; reroll ≤ 15% do gasto | ✓ | gasto/ganho 0.919, reroll 0.5% do gasto |
| 7 | L1, D1, bot do jogo real | run L1 mediana entre 10 e 18 min (tempo de jogo + 45 s por loja) | ✗ | mediana 18.0 min (tempo de jogo 9.0 min, 15 runs) |
| 8 | build real, `bun scripts/perf.ts --round 40` | ≥ 58 FPS médios e p95 ≤ 18 ms com 300 inimigos e 2.000 decalques (1920×1080, round 40) | ✓ | 3 medições: FPS médio mínimo 58, p95 máximo 16.8 ms |

## Round de morte por herói, nível e Danger

| Herói | Nível | Danger | Runs | Mediana | p25 | p75 | Passa do 30 |
|---|---|---|---|---|---|---|---|
| jack | 1 | 0 | 100 | 23 | 22 | 24 | 1.0% |
| jack | 1 | 1 | 104 | 18 | 17 | 22 | 0.0% |
| jack | 1 | 2 | 100 | 16 | 14 | 18 | 0.0% |
| jack | 1 | 3 | 100 | 14 | 10 | 16 | 0.0% |
| jack | 1 | 4 | 100 | 10 | 10 | 10 | 0.0% |
| jack | 1 | 5 | 100 | 10 | 10 | 10 | 0.0% |
| jack | 10 | 0 | 100 | 41 | 33 | 61 | 89.0% |
| jack | 10 | 1 | 100 | 31 | 26 | 32 | 54.0% |
| jack | 10 | 2 | 100 | 26 | 24 | 31 | 26.0% |
| jack | 10 | 3 | 100 | 24 | 22 | 26 | 10.0% |
| jack | 10 | 4 | 100 | 21 | 10 | 24 | 4.0% |
| jack | 10 | 5 | 100 | 10 | 10 | 18 | 1.0% |
| jack | 20 | 0 | 100 | 61 | 57 | 61 | 99.0% |
| jack | 20 | 1 | 100 | 33 | 31 | 54 | 80.0% |
| jack | 20 | 2 | 100 | 32 | 27 | 33 | 64.0% |
| jack | 20 | 3 | 100 | 27 | 25 | 31 | 34.0% |
| jack | 20 | 4 | 100 | 24 | 23 | 27 | 10.0% |
| jack | 20 | 5 | 100 | 22 | 17 | 24 | 3.0% |
| bob | 1 | 0 | 100 | 23 | 19 | 24 | 2.0% |
| bob | 1 | 1 | 103 | 18 | 16 | 22 | 1.0% |
| bob | 1 | 2 | 100 | 16 | 15 | 18 | 0.0% |
| bob | 1 | 3 | 100 | 15 | 14 | 16 | 0.0% |
| bob | 1 | 4 | 100 | 12 | 10 | 14 | 0.0% |
| bob | 1 | 5 | 100 | 10 | 10 | 10 | 0.0% |
| bob | 10 | 0 | 100 | 61 | 33 | 61 | 96.0% |
| bob | 10 | 1 | 100 | 31 | 25 | 33 | 53.0% |
| bob | 10 | 2 | 100 | 27 | 24 | 31 | 31.0% |
| bob | 10 | 3 | 100 | 24 | 22 | 27 | 13.0% |
| bob | 10 | 4 | 100 | 21 | 17 | 24 | 2.0% |
| bob | 10 | 5 | 100 | 16 | 12 | 18 | 0.0% |
| bob | 20 | 0 | 100 | 61 | 61 | 61 | 100.0% |
| bob | 20 | 1 | 100 | 35 | 32 | 61 | 81.0% |
| bob | 20 | 2 | 100 | 32 | 27 | 36 | 59.0% |
| bob | 20 | 3 | 100 | 27 | 24 | 32 | 39.0% |
| bob | 20 | 4 | 100 | 24 | 23 | 27 | 14.0% |
| bob | 20 | 5 | 100 | 22 | 18 | 24 | 1.0% |
| lucia | 1 | 0 | 100 | 21 | 18 | 23 | 0.0% |
| lucia | 1 | 1 | 108 | 15 | 10 | 18 | 1.9% |
| lucia | 1 | 2 | 100 | 10 | 10 | 15 | 0.0% |
| lucia | 1 | 3 | 100 | 10 | 10 | 10 | 0.0% |
| lucia | 1 | 4 | 100 | 10 | 10 | 10 | 0.0% |
| lucia | 1 | 5 | 100 | 10 | 9 | 10 | 0.0% |
| lucia | 10 | 0 | 100 | 39 | 31 | 61 | 82.0% |
| lucia | 10 | 1 | 100 | 27 | 24 | 33 | 46.0% |
| lucia | 10 | 2 | 100 | 26 | 23 | 30 | 25.0% |
| lucia | 10 | 3 | 100 | 22 | 16 | 24 | 10.0% |
| lucia | 10 | 4 | 100 | 10 | 10 | 16 | 0.0% |
| lucia | 10 | 5 | 100 | 10 | 10 | 10 | 0.0% |
| lucia | 20 | 0 | 100 | 61 | 39 | 61 | 96.0% |
| lucia | 20 | 1 | 100 | 33 | 31 | 42 | 75.0% |
| lucia | 20 | 2 | 100 | 31 | 26 | 33 | 52.0% |
| lucia | 20 | 3 | 100 | 27 | 24 | 31 | 27.0% |
| lucia | 20 | 4 | 100 | 23 | 18 | 24 | 9.0% |
| lucia | 20 | 5 | 100 | 16 | 10 | 22 | 0.0% |

## Armas nas builds finais (L10, D1, sem a arma inicial)

| Arma | Builds |
|---|---|
| flameRing | 45.3% |
| elementStaff | 39.0% |
| hammer | 37.3% |
| molotov | 36.0% |
| iceShards | 32.3% |
| mine | 30.0% |
| knives | 20.7% |
| bladeWhirl | 19.3% |
| machete | 19.0% |
| poisonCloud | 16.3% |
| auxPistol | 15.0% |
| fishBoomerang | 14.7% |
| grenadeBelt | 14.0% |
| crossbow | 13.0% |
| droneSentinel | 12.3% |
| doubleBarrel | 8.3% |
| lightningTotem | 8.3% |

| Set | Builds |
|---|---|
| elemental | 84.0% |
| explosive | 55.3% |
| blade | 49.3% |
| blunt | 37.3% |
| gun | 37.0% |
| support | 32.7% |
| thrown | 31.3% |
