# Balanço automático (2026-11-08)

Gerado por `bun scripts/balance-report.ts` a partir de 1620 runs (C:/Users/aleex/AppData/Local/Temp/claude/7dd2f9fb88fe2e00/9865445d-d774-4286-b9ac-e8877d5bae2f/scratchpad/applied.jsonl). Metas da Parte A4 de [balancing-and-simulation.md](../balancing-and-simulation.md); `n/d` = sem dados para decidir, não conta como aprovado.

## Metas

| # | Perfil | Meta | Status | Medido |
|---|---|---|---|---|
| 1 | L1, D1, sem Oficina | mediana de morte entre os rounds 8 e 20; nenhum herói passa do 30 | ✓ | medianas 18 / 17 / 10, máximo 27 |
| 2 | L10, D1, Oficina all:2 | cada herói passa do boss 20 em ≥ 1 run; nenhum morre antes do 12 | ✓ | passam do 20: jack sim, bob sim, lucia sim; morte mais cedo 22 |
| 3 | L20, D1, Oficina all:4 | os 3 heróis passam do round 30 (mediana) e morrem antes do 60 | ✓ | medianas 51 / 56 / 44 |
| 4 | L10, D0 / D1 / D5 | D0 chega ≥ 5 rounds além do D1; D5 morre até o round 15 | ✓ | medianas D0 61, D1 36, D5 10 |
| 5 | L10, D1 (armas da loja, sem a inicial) | nenhuma arma em > 35% nem < 3% das builds; nenhum set em > 50% | ✗ | maior arma hammer 42.2%, menor doubleBarrel 7.8%, nunca compradas: nenhuma; maior set elemental 83.3% |
| 6 | todas as runs com Fish | Fish gasto / ganho entre 0,85 e 1,0; reroll ≤ 15% do gasto | ✓ | gasto/ganho 0.896, reroll 0.6% do gasto |
| 7 | L1, D1, bot | run L1 mediana entre 10 e 18 min reais | n/d | sem runs de bot com tempo real |
| 8 | build real | 60 FPS médios, p95 ≤ 18 ms | n/d | medir com `bun scripts/perf.ts` |

## Round de morte por herói, nível e Danger

| Herói | Nível | Danger | Runs | Mediana | p25 | p75 | Passa do 30 |
|---|---|---|---|---|---|---|---|
| jack | 1 | 0 | 30 | 24 | 22 | 25 | 3.3% |
| jack | 1 | 1 | 30 | 18 | 12 | 21 | 0.0% |
| jack | 1 | 2 | 30 | 10 | 10 | 16 | 0.0% |
| jack | 1 | 3 | 30 | 10 | 10 | 14 | 0.0% |
| jack | 1 | 4 | 30 | 10 | 10 | 10 | 0.0% |
| jack | 1 | 5 | 30 | 10 | 10 | 10 | 0.0% |
| jack | 10 | 0 | 30 | 61 | 47 | 61 | 96.7% |
| jack | 10 | 1 | 30 | 39 | 28 | 50 | 70.0% |
| jack | 10 | 2 | 30 | 28 | 25 | 40 | 46.7% |
| jack | 10 | 3 | 30 | 25 | 10 | 29 | 16.7% |
| jack | 10 | 4 | 30 | 10 | 10 | 23 | 3.3% |
| jack | 10 | 5 | 30 | 10 | 10 | 10 | 0.0% |
| jack | 20 | 0 | 30 | 61 | 54 | 61 | 100.0% |
| jack | 20 | 1 | 30 | 51 | 42 | 61 | 96.7% |
| jack | 20 | 2 | 30 | 43 | 33 | 59 | 80.0% |
| jack | 20 | 3 | 30 | 33 | 27 | 43 | 60.0% |
| jack | 20 | 4 | 30 | 26 | 19 | 33 | 30.0% |
| jack | 20 | 5 | 30 | 10 | 10 | 25 | 3.3% |
| bob | 1 | 0 | 30 | 24 | 18 | 24 | 0.0% |
| bob | 1 | 1 | 30 | 17 | 15 | 18 | 0.0% |
| bob | 1 | 2 | 30 | 15 | 14 | 16 | 0.0% |
| bob | 1 | 3 | 30 | 14 | 11 | 15 | 0.0% |
| bob | 1 | 4 | 30 | 10 | 10 | 11 | 0.0% |
| bob | 1 | 5 | 30 | 10 | 10 | 10 | 0.0% |
| bob | 10 | 0 | 30 | 61 | 52 | 61 | 100.0% |
| bob | 10 | 1 | 30 | 37 | 27 | 59 | 70.0% |
| bob | 10 | 2 | 30 | 31 | 24 | 34 | 53.3% |
| bob | 10 | 3 | 30 | 24 | 20 | 28 | 16.7% |
| bob | 10 | 4 | 30 | 17 | 14 | 23 | 6.7% |
| bob | 10 | 5 | 30 | 14 | 10 | 17 | 0.0% |
| bob | 20 | 0 | 30 | 61 | 61 | 61 | 100.0% |
| bob | 20 | 1 | 30 | 56 | 51 | 61 | 90.0% |
| bob | 20 | 2 | 30 | 44 | 32 | 61 | 76.7% |
| bob | 20 | 3 | 30 | 33 | 26 | 41 | 63.3% |
| bob | 20 | 4 | 30 | 26 | 19 | 28 | 16.7% |
| bob | 20 | 5 | 30 | 18 | 16 | 24 | 6.7% |
| lucia | 1 | 0 | 30 | 19 | 16 | 24 | 0.0% |
| lucia | 1 | 1 | 30 | 10 | 10 | 15 | 0.0% |
| lucia | 1 | 2 | 30 | 10 | 10 | 10 | 0.0% |
| lucia | 1 | 3 | 30 | 10 | 10 | 10 | 0.0% |
| lucia | 1 | 4 | 30 | 10 | 10 | 10 | 0.0% |
| lucia | 1 | 5 | 30 | 10 | 9 | 10 | 0.0% |
| lucia | 10 | 0 | 30 | 56 | 41 | 61 | 90.0% |
| lucia | 10 | 1 | 30 | 34 | 26 | 42 | 60.0% |
| lucia | 10 | 2 | 30 | 24 | 10 | 27 | 23.3% |
| lucia | 10 | 3 | 30 | 10 | 10 | 24 | 3.3% |
| lucia | 10 | 4 | 30 | 10 | 10 | 10 | 0.0% |
| lucia | 10 | 5 | 30 | 10 | 10 | 10 | 0.0% |
| lucia | 20 | 0 | 30 | 61 | 53 | 61 | 96.7% |
| lucia | 20 | 1 | 30 | 44 | 41 | 51 | 83.3% |
| lucia | 20 | 2 | 30 | 35 | 27 | 42 | 60.0% |
| lucia | 20 | 3 | 30 | 27 | 24 | 33 | 40.0% |
| lucia | 20 | 4 | 30 | 16 | 10 | 24 | 13.3% |
| lucia | 20 | 5 | 30 | 10 | 10 | 10 | 0.0% |

## Armas nas builds finais (L10, D1, sem a arma inicial)

| Arma | Builds |
|---|---|
| hammer | 42.2% |
| molotov | 40.0% |
| elementStaff | 35.6% |
| flameRing | 34.4% |
| iceShards | 33.3% |
| mine | 27.8% |
| knives | 23.3% |
| machete | 23.3% |
| bladeWhirl | 18.9% |
| fishBoomerang | 17.8% |
| poisonCloud | 15.6% |
| droneSentinel | 13.3% |
| auxPistol | 12.2% |
| lightningTotem | 11.1% |
| grenadeBelt | 8.9% |
| doubleBarrel | 7.8% |
| crossbow | 7.8% |

| Set | Builds |
|---|---|
| elemental | 83.3% |
| blade | 53.3% |
| explosive | 53.3% |
| blunt | 42.2% |
| gun | 32.2% |
| thrown | 30.0% |
| support | 28.9% |
