# SDD-001 — Arena quadrada top-down

**Versão** 1.0 · **Data** 2026-11-08 · **Status** Aprovada · **ADR** [003](../adrs/ADR-003-topdown-arena-quadrada.md) · **GDD** §4

## Contexto

O mundo atual é isométrico 2:1 e infinito em chunks. A 1.0 usa câmera top-down 2D e arena quadrada fechada que cresce 1 tile de lado por round.

## Requisitos

- RF-01 `side(N) = min(10 + (N−1), 40)` tiles; `TILE = 64` u = 64 px. Arena centrada na origem do mundo; `bounds(N)` retorna `{minX, minY, maxX, maxY}`.
- RF-02 Ao trocar de round, a arena cresce **centrada**; herói, pickups e decalques mantêm coordenadas de mundo.
- RF-03 Herói, inimigos (terrestres e voadores) e projéteis são **clampados/colidem** com as bordas; projéteis somem na borda.
- RF-04 Spawn em anel interno de 1 tile junto à borda; posições fora do retângulo visível da câmera + 48 px quando existirem; caso contrário, qualquer ponto do anel com telegraph de 0,5 s (`fx.spawnMark`).
- RF-05 Câmera segue o herói com lerp 0,12 e é clampada à arena; arena menor que a viewport fica centrada; zoom inteiro pela altura 540 mantido.
- RF-06 Depth por `y`; sem rotação de input; 8 direções pelo vetor de movimento.
- RF-07 Chão: tiles 64×64 por bioma, variantes por RNG(seed, tx, ty); borda com cantos; props sólidos (círculos) por RNG, densidade por bioma, nunca a < 2 tiles do spawn do herói.
- RF-08 Decalques de sangue persistentes na run: lista `{x, y, frame, rot, tint}` com teto 4.000; render por `DynamicTexture` do tamanho da arena, recarimbada ao crescer; respeita gore reduzido/gosma.
- RF-09 Remover `src/logic/iso.ts`, `src/logic/chunks.ts`, `src/world/ChunkManager.ts`, `scripts/pack-iso-tile.ts`, testes `iso.test.ts`, `chunks.test.ts` e chaves `tile.*` iso do manifest.
- RF-10 60 FPS com 300 inimigos + 2.000 decalques + luzes a 1920×1080 na arena 40×40.

## Especificação

- `src/logic/arena.ts` (puro): `arenaSide(round)`, `arenaBounds(round)`, `clampToArena(p, r, bounds)`, `spawnRing(bounds, visible, rng, n)`, `propLayout(seed, biome, bounds)`.
- `src/data/arena.ts`: `ARENA = { tile: 64, startSide: 10, growth: 1, maxSide: 40, spawnTelegraph: 0.5, decalCap: 4000 }`.
- `src/world/Arena.ts` (Phaser): desenha chão e borda numa `DynamicTexture` por bioma, mantém `GoreLayer` (decalques), reposiciona props; `grow(round)`.
- `src/logic/spawn.ts`: substituir perímetro da câmera por `spawnRing`.
- `src/systems/*`: trocar `worldToScreen` por identidade; `Hero`/`Enemy` depth = `y`.
- `src/debug/params.ts`: `?arena=NN` força o lado para QA.

## Critérios de aceite (asserts)

| # | Assert | Como verificar |
|---|---|---|
| A1 | `arenaSide(1) === 10`, `arenaSide(31) === 40`, `arenaSide(99) === 40` | `bun test tests/arena.test.ts` |
| A2 | 1.000 pontos de `spawnRing` estão a ≤ 64 u da borda e dentro dos bounds; nenhum dentro do retângulo visível quando ele cabe | teste de propriedade em `tests/arena.test.ts` |
| A3 | Herói com input constante contra a borda por 5 s fica com `x ∈ bounds` | teste do `clampToArena` + E2E `?arena=10` |
| A4 | Nenhum arquivo importa `iso.ts`/`chunks.ts` | `rg -n "logic/iso\|logic/chunks\|ChunkManager" src tests` retorna vazio |
| A5 | `bun scripts/perf.ts --round 40` ≥ 58 FPS médio, p95 ≤ 18 ms em 1920×1080 | saída do script |
| A6 | Screenshot `?skipMenu=1&hero=jack&round=1&seed=1&debug=1` mostra arena 10×10 inteira centrada, sem scroll | agent-browser |
| A7 | Decalques sobrevivem à troca de round (contagem antes = depois) | teste de `GoreLayer.grow` com 500 decalques |

## Plano de testes

Unitários (`arena.test.ts`, `spawn.test.ts` atualizado), E2E (`scripts/e2e.ts`: round 1 → round 2 com crescimento), perf (`scripts/perf.ts`), QA visual nos 3 biomas.

## Fora de escopo

Tilesets finais (SDD-012); pathfinding; obstáculos complexos.
