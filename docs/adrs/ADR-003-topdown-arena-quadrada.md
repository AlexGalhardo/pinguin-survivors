# ADR-003 — Câmera top-down 2D e arena quadrada que cresce por round

**Data** 2026-11-08 · **Status** Aceito · **Decisão de origem** B-03, B-04, B-05 · **Supera** P-04, P-06 (parcial), P-11, P-35 (parcial)

## Contexto

O jogo foi construído em projeção isométrica 2:1 com mundo infinito em chunks (`iso.ts`, `chunks.ts`, `ChunkManager`). O desenvolvedor quer a leitura direta de um top-down 2D estilo Brotato e uma arena fechada que cresce a cada round, mais fácil de balancear (spawn nas bordas, densidade previsível) e de renderizar no celular.

## Decisão

1. **Câmera top-down 2D**: `screenX = x`, `screenY = y`, depth por `y`. A simulação continua em mundo cartesiano; só a projeção muda.
2. **Arena quadrada**: `side(N) = min(10 + (N − 1), 40)` tiles; tile de **64 px** (= 64 unidades de mundo). Round 1 = 640×640 u; teto 40×40 = 2.560×2.560 u a partir do round 31.
3. **Bordas sólidas** com parede visível (sprite de borda por bioma). Herói e inimigos terrestres colidem com a borda; voadores também (não há fora da arena).
4. **Spawn** em pontos aleatórios num anel interno de 1 tile junto à borda, fora da área visível quando a arena for maior que a tela; quando a arena couber na tela, spawn na borda mesmo visível, com telegraph de 0,5 s.
5. **Câmera** segue o herói com lerp e é **clampada** aos limites da arena; se a arena couber na tela, fica centrada.
6. `src/logic/iso.ts`, `src/logic/chunks.ts`, `src/world/ChunkManager.ts` e testes correspondentes são **removidos**; entra `src/logic/arena.ts` (+ testes) e `src/world/Arena.ts`.
7. Sprites continuam em 8 direções pela direção do movimento (sem rotação de 45° do input).

## Alternativas

- Tile 32 px: arena de round 1 com 320 px, pequena demais para 300 inimigos. Rejeitada.
- Sem teto: a partir de ~50×50 o tempo de caminhada entre bordas e a dispersão dos inimigos quebram o ritmo. Rejeitada.
- Manter chunks infinitos com câmera top-down: perde o controle de densidade que a arena dá. Rejeitada.

## Consequências

- Decalques de sangue persistentes passam para uma `DynamicTexture` do tamanho da arena (máx. 2.560² px; no round 1, 640²), recriada quando a arena cresce (recarimbo dos decalques guardados em lista).
- `spawn.ts`, `steering.ts`, `obstacles.ts` perdem a dependência de iso; obstáculos sólidos viram props da arena.
- Performance: alvo mantido, 60 FPS com 300 inimigos + 2.000 decalques em 1920×1080; medir com `scripts/perf.ts` na arena 40×40.
- Assets de chão: tiles top-down 64×64 por bioma (ADR-004) substituem os tiles iso 64×32.
- Docs/testes de iso ficam na branch `legacy-voices`.
