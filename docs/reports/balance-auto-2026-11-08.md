# Balanço automático (2026-11-08)

Gerado por `bun scripts/balance-report.ts` a partir de 5400 runs (C:/Users/aleex/AppData/Local/Temp/claude/7dd2f9fb88fe2e00/9865445d-d774-4286-b9ac-e8877d5bae2f/scratchpad/final.jsonl). Metas da Parte A4 de [balancing-and-simulation.md](../balancing-and-simulation.md); `n/d` = sem dados para decidir, não conta como aprovado.

## Metas

| # | Perfil | Meta | Status | Medido |
|---|---|---|---|---|
| 1 | L1, D1, sem Oficina | mediana de morte entre os rounds 8 e 20; nenhum herói passa do 30 | ✓ | medianas 17 / 17 / 10, máximo 27 |
| 2 | L10, D1, Oficina all:2 | cada herói passa do boss 20 em ≥ 1 run; ≤ 5% das runs morrem antes do round 12 | ✓ | passam do 20: jack sim, bob sim, lucia sim; morrem antes do 12: jack 2.0%, bob 0.0%, lucia 2.0% |
| 3 | L20, D1, Oficina all:4 | os 3 heróis passam do round 30 (mediana) e morrem antes do 60 | ✓ | medianas 51 / 51 / 42 |
| 4 | L10, D0 / D1 / D5 | D0 chega ≥ 5 rounds além do D1; D5 morre até o round 15 | ✓ | medianas D0 53, D1 34, D5 10 |
| 5 | L10, D1, por herói (armas da loja, sem a inicial) | por herói: nenhuma arma em > 35% nem set em > 50% das builds; nenhuma arma abaixo de 3% ou nunca comprada (geral) | ✗ | jack: arma hammer 72.0%, set blade 80.0%; bob: arma molotov 78.0%, set elemental 97.0%; lucia: arma flameRing 72.0%, set elemental 94.0%; menor arma geral lightningTotem 6.3%, nunca compradas: nenhuma |
| 6 | todas as runs com Fish | Fish gasto / ganho entre 0,85 e 1,0; reroll ≤ 15% do gasto | ✓ | gasto/ganho 0.897, reroll 0.7% do gasto |
| 7 | L1, D1, bot | run L1 mediana entre 10 e 18 min reais | n/d | sem runs de bot com tempo real |
| 8 | build real | 60 FPS médios, p95 ≤ 18 ms | n/d | medir com `bun scripts/perf.ts` |

## Round de morte por herói, nível e Danger

| Herói | Nível | Danger | Runs | Mediana | p25 | p75 | Passa do 30 |
|---|---|---|---|---|---|---|---|
| jack | 1 | 0 | 100 | 24 | 21 | 25 | 7.0% |
| jack | 1 | 1 | 100 | 17 | 10 | 20 | 0.0% |
| jack | 1 | 2 | 100 | 10 | 10 | 16 | 0.0% |
| jack | 1 | 3 | 100 | 10 | 10 | 14 | 0.0% |
| jack | 1 | 4 | 100 | 10 | 10 | 10 | 0.0% |
| jack | 1 | 5 | 100 | 10 | 10 | 10 | 0.0% |
| jack | 10 | 0 | 100 | 54 | 44 | 61 | 96.0% |
| jack | 10 | 1 | 100 | 33 | 27 | 51 | 64.0% |
| jack | 10 | 2 | 100 | 27 | 24 | 35 | 39.0% |
| jack | 10 | 3 | 100 | 24 | 10 | 27 | 19.0% |
| jack | 10 | 4 | 100 | 10 | 10 | 22 | 5.0% |
| jack | 10 | 5 | 100 | 10 | 10 | 10 | 0.0% |
| jack | 20 | 0 | 100 | 61 | 54 | 61 | 99.0% |
| jack | 20 | 1 | 100 | 51 | 38 | 61 | 93.0% |
| jack | 20 | 2 | 100 | 37 | 29 | 51 | 70.0% |
| jack | 20 | 3 | 100 | 31 | 26 | 41 | 50.0% |
| jack | 20 | 4 | 100 | 26 | 10 | 30 | 25.0% |
| jack | 20 | 5 | 100 | 10 | 10 | 24 | 6.0% |
| bob | 1 | 0 | 100 | 23 | 18 | 24 | 5.0% |
| bob | 1 | 1 | 100 | 17 | 16 | 20 | 0.0% |
| bob | 1 | 2 | 100 | 15 | 14 | 17 | 0.0% |
| bob | 1 | 3 | 100 | 14 | 10 | 15 | 0.0% |
| bob | 1 | 4 | 100 | 10 | 10 | 11 | 0.0% |
| bob | 1 | 5 | 100 | 10 | 10 | 10 | 0.0% |
| bob | 10 | 0 | 100 | 61 | 51 | 61 | 98.0% |
| bob | 10 | 1 | 100 | 41 | 27 | 51 | 65.0% |
| bob | 10 | 2 | 100 | 28 | 24 | 42 | 47.0% |
| bob | 10 | 3 | 100 | 24 | 19 | 29 | 23.0% |
| bob | 10 | 4 | 100 | 17 | 15 | 24 | 4.0% |
| bob | 10 | 5 | 100 | 12 | 10 | 17 | 0.0% |
| bob | 20 | 0 | 100 | 61 | 61 | 61 | 100.0% |
| bob | 20 | 1 | 100 | 51 | 42 | 61 | 92.0% |
| bob | 20 | 2 | 100 | 42 | 28 | 51 | 72.0% |
| bob | 20 | 3 | 100 | 32 | 26 | 42 | 54.0% |
| bob | 20 | 4 | 100 | 25 | 19 | 31 | 26.0% |
| bob | 20 | 5 | 100 | 19 | 16 | 24 | 4.0% |
| lucia | 1 | 0 | 100 | 18 | 17 | 24 | 1.0% |
| lucia | 1 | 1 | 100 | 10 | 10 | 16 | 0.0% |
| lucia | 1 | 2 | 100 | 10 | 10 | 13 | 0.0% |
| lucia | 1 | 3 | 100 | 10 | 10 | 10 | 0.0% |
| lucia | 1 | 4 | 100 | 10 | 10 | 10 | 0.0% |
| lucia | 1 | 5 | 100 | 10 | 9 | 10 | 0.0% |
| lucia | 10 | 0 | 100 | 51 | 41 | 61 | 94.0% |
| lucia | 10 | 1 | 100 | 33 | 27 | 42 | 61.0% |
| lucia | 10 | 2 | 100 | 25 | 16 | 31 | 31.0% |
| lucia | 10 | 3 | 100 | 16 | 10 | 24 | 8.0% |
| lucia | 10 | 4 | 100 | 10 | 10 | 12 | 3.0% |
| lucia | 10 | 5 | 100 | 10 | 10 | 10 | 0.0% |
| lucia | 20 | 0 | 100 | 61 | 51 | 61 | 99.0% |
| lucia | 20 | 1 | 100 | 42 | 33 | 51 | 87.0% |
| lucia | 20 | 2 | 100 | 33 | 27 | 42 | 65.0% |
| lucia | 20 | 3 | 100 | 27 | 24 | 33 | 39.0% |
| lucia | 20 | 4 | 100 | 18 | 10 | 26 | 11.0% |
| lucia | 20 | 5 | 100 | 10 | 10 | 17 | 2.0% |

## Armas nas builds finais (L10, D1, sem a arma inicial)

| Arma | Builds |
|---|---|
| molotov | 43.0% |
| hammer | 38.7% |
| flameRing | 38.0% |
| elementStaff | 36.7% |
| iceShards | 36.7% |
| mine | 27.0% |
| knives | 26.3% |
| bladeWhirl | 18.7% |
| machete | 18.3% |
| poisonCloud | 15.0% |
| fishBoomerang | 13.0% |
| grenadeBelt | 13.0% |
| auxPistol | 10.3% |
| droneSentinel | 10.3% |
| doubleBarrel | 7.3% |
| crossbow | 7.0% |
| lightningTotem | 6.3% |

| Set | Builds |
|---|---|
| elemental | 85.0% |
| explosive | 51.3% |
| blade | 50.3% |
| blunt | 38.7% |
| thrown | 32.3% |
| support | 29.3% |
| gun | 27.0% |
