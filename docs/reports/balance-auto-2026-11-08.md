# Balanço automático (2026-11-08)

Gerado por `bun scripts/balance-report.ts` a partir de 1620 runs (C:/Users/aleex/AppData/Local/Temp/claude/7dd2f9fb88fe2e00/9865445d-d774-4286-b9ac-e8877d5bae2f/scratchpad/runs.jsonl). Metas da Parte A4 de [balancing-and-simulation.md](../balancing-and-simulation.md); `n/d` = sem dados para decidir, não conta como aprovado.

## Metas

| # | Perfil | Meta | Status | Medido |
|---|---|---|---|---|
| 1 | L1, D1, sem Oficina | mediana de morte entre os rounds 8 e 20; nenhum herói passa do 30 | ✓ | medianas 18 / 16 / 10, máximo 27 |
| 2 | L10, D1, Oficina all:2 | cada herói passa do boss 20 em ≥ 1 run; nenhum morre antes do 12 | ✗ | passam do 20: jack sim, bob sim, lucia sim; morte mais cedo 10 |
| 3 | L20, D1, Oficina all:4 | os 3 heróis passam do round 30 (mediana) e morrem antes do 60 | ✗ | medianas 61 / 61 / 42 |
| 4 | L10, D0 / D1 / D5 | D0 chega ≥ 5 rounds além do D1; D5 morre até o round 15 | ✓ | medianas D0 61, D1 36, D5 10 |
| 5 | L10, D1 (armas da loja, sem a inicial) | nenhuma arma em > 35% nem < 3% das builds; nenhum set em > 50% | ✗ | maior arma molotov 38.9%, menor crossbow 3.3%, nunca compradas: nenhuma; maior set elemental 71.1% |
| 6 | todas as runs com Fish | Fish gasto / ganho entre 0,85 e 1,0; reroll ≤ 15% do gasto | ✓ | gasto/ganho 0.900, reroll 0.2% do gasto |
| 7 | L1, D1, bot | run L1 mediana entre 10 e 18 min reais | n/d | sem runs de bot com tempo real |
| 8 | build real | 60 FPS médios, p95 ≤ 18 ms | n/d | medir com `bun scripts/perf.ts` |

## Round de morte por herói, nível e Danger

| Herói | Nível | Danger | Runs | Mediana | p25 | p75 | Passa do 30 |
|---|---|---|---|---|---|---|---|
| jack | 1 | 0 | 30 | 24 | 22 | 24 | 6.7% |
| jack | 1 | 1 | 30 | 18 | 12 | 19 | 0.0% |
| jack | 1 | 2 | 30 | 10 | 10 | 16 | 0.0% |
| jack | 1 | 3 | 30 | 10 | 10 | 13 | 0.0% |
| jack | 1 | 4 | 30 | 10 | 10 | 10 | 0.0% |
| jack | 1 | 5 | 30 | 10 | 10 | 10 | 0.0% |
| jack | 10 | 0 | 30 | 61 | 51 | 61 | 100.0% |
| jack | 10 | 1 | 30 | 43 | 33 | 51 | 80.0% |
| jack | 10 | 2 | 30 | 32 | 26 | 42 | 56.7% |
| jack | 10 | 3 | 30 | 27 | 21 | 33 | 30.0% |
| jack | 10 | 4 | 30 | 10 | 10 | 24 | 6.7% |
| jack | 10 | 5 | 30 | 10 | 10 | 10 | 0.0% |
| jack | 20 | 0 | 30 | 61 | 61 | 61 | 100.0% |
| jack | 20 | 1 | 30 | 61 | 51 | 61 | 100.0% |
| jack | 20 | 2 | 30 | 48 | 40 | 61 | 90.0% |
| jack | 20 | 3 | 30 | 41 | 32 | 51 | 76.7% |
| jack | 20 | 4 | 30 | 29 | 24 | 42 | 46.7% |
| jack | 20 | 5 | 30 | 24 | 10 | 27 | 13.3% |
| bob | 1 | 0 | 30 | 23 | 18 | 24 | 0.0% |
| bob | 1 | 1 | 30 | 16 | 15 | 18 | 0.0% |
| bob | 1 | 2 | 30 | 15 | 14 | 16 | 0.0% |
| bob | 1 | 3 | 30 | 13 | 10 | 15 | 0.0% |
| bob | 1 | 4 | 30 | 10 | 10 | 10 | 0.0% |
| bob | 1 | 5 | 30 | 10 | 10 | 10 | 0.0% |
| bob | 10 | 0 | 30 | 61 | 51 | 61 | 96.7% |
| bob | 10 | 1 | 30 | 42 | 33 | 61 | 76.7% |
| bob | 10 | 2 | 30 | 32 | 25 | 42 | 56.7% |
| bob | 10 | 3 | 30 | 26 | 23 | 29 | 23.3% |
| bob | 10 | 4 | 30 | 19 | 17 | 24 | 0.0% |
| bob | 10 | 5 | 30 | 14 | 10 | 18 | 0.0% |
| bob | 20 | 0 | 30 | 61 | 61 | 61 | 100.0% |
| bob | 20 | 1 | 30 | 61 | 51 | 61 | 100.0% |
| bob | 20 | 2 | 30 | 51 | 42 | 61 | 90.0% |
| bob | 20 | 3 | 30 | 36 | 30 | 50 | 73.3% |
| bob | 20 | 4 | 30 | 27 | 24 | 33 | 40.0% |
| bob | 20 | 5 | 30 | 24 | 19 | 26 | 13.3% |
| lucia | 1 | 0 | 30 | 12 | 10 | 18 | 0.0% |
| lucia | 1 | 1 | 30 | 10 | 10 | 10 | 0.0% |
| lucia | 1 | 2 | 30 | 10 | 10 | 10 | 0.0% |
| lucia | 1 | 3 | 30 | 10 | 10 | 10 | 0.0% |
| lucia | 1 | 4 | 30 | 10 | 9 | 10 | 0.0% |
| lucia | 1 | 5 | 30 | 9 | 9 | 10 | 0.0% |
| lucia | 10 | 0 | 30 | 48 | 41 | 51 | 83.3% |
| lucia | 10 | 1 | 30 | 27 | 13 | 33 | 43.3% |
| lucia | 10 | 2 | 30 | 10 | 10 | 27 | 20.0% |
| lucia | 10 | 3 | 30 | 10 | 10 | 10 | 0.0% |
| lucia | 10 | 4 | 30 | 10 | 10 | 10 | 0.0% |
| lucia | 10 | 5 | 30 | 10 | 10 | 10 | 0.0% |
| lucia | 20 | 0 | 30 | 61 | 51 | 61 | 96.7% |
| lucia | 20 | 1 | 30 | 42 | 37 | 51 | 83.3% |
| lucia | 20 | 2 | 30 | 33 | 27 | 41 | 70.0% |
| lucia | 20 | 3 | 30 | 27 | 24 | 31 | 33.3% |
| lucia | 20 | 4 | 30 | 10 | 10 | 21 | 0.0% |
| lucia | 20 | 5 | 30 | 10 | 10 | 10 | 0.0% |

## Armas nas builds finais (L10, D1, sem a arma inicial)

| Arma | Builds |
|---|---|
| molotov | 38.9% |
| hammer | 36.7% |
| flameRing | 31.1% |
| mine | 30.0% |
| knives | 25.6% |
| iceShards | 23.3% |
| machete | 23.3% |
| elementStaff | 20.0% |
| bladeWhirl | 16.7% |
| grenadeBelt | 15.6% |
| fishBoomerang | 14.4% |
| poisonCloud | 13.3% |
| droneSentinel | 12.2% |
| auxPistol | 10.0% |
| lightningTotem | 10.0% |
| doubleBarrel | 6.7% |
| crossbow | 3.3% |

| Set | Builds |
|---|---|
| elemental | 71.1% |
| blade | 54.4% |
| explosive | 50.0% |
| blunt | 36.7% |
| thrown | 30.0% |
| gun | 27.8% |
| support | 25.6% |
