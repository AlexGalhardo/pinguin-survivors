# SDD-017 — Round 1 de 30 s, clima por bioma, fogueiras e iluminação

**Versão** 1.0 · **Data** 2026-11-10 · **Status** Aprovada (2026-11-10, pedido explícito do desenvolvedor no chat) · **Depende de** SDD-012, SDD-016

## Requisitos

- **RF-01 Round 1 de 30 s.** `ROUNDS.firstDuration` passa de 20 para 30 s; `durationStep` (5 s) não muda. A fórmula `firstDuration + durationStep·(N−1)` desloca todos os rounds normais em +10 s (boss não muda).
- **RF-02 Clima por bioma.** Um efeito leve de partículas Phaser 4 por bioma, dados em `AMBIENT` (`src/data/ambient.ts`): neve na Antártida, vento (folhas e poeira em diagonal) na Floresta, esporos verdes na Cidade, chuva na Estação, brasas e cinzas nas Ruínas. Texturas minúsculas geradas em código (sem PixelLab).
- **RF-03 Camadas.** O clima fica acima dos personagens e abaixo dos números/overlays do `FxSystem`; partículas pequenas e com alfa baixo, para não esconder as marcas vermelhas (`PALETTE.hazard`) nem os elites. Nada sobre a UI React.
- **RF-04 Orçamento.** Um único emitter por bioma com teto de partículas vivas (`AMBIENT[b].count`) multiplicado por `TierBudget.ambientScale` (low 0,4 · mid 0,75 · high 1). O emitter é recriado só na troca de bioma. 60 FPS com 300 inimigos.
- **RF-05 Fogueiras.** Algumas por arena (`ceil(lado / 8)` tiles, mínimo 2), props animados sem colisão (chama de 4 quadros trocados por código) com luz quente pulsante e brasas. Posições determinísticas pela seed (`campfireSpots`, lógica pura em `src/logic/ambient.ts`), nunca perto do herói, das bordas e dos obstáculos, e estáveis quando a arena cresce.
- **RF-06 Iluminação.** Tinta e escuridão por bioma (`LIGHTING`, a escuridão nunca passa de 0,66), vinheta nas bordas, halo suave maior ao redor do herói, luz de fogueiras e de drops de raridade alta. Brilho aditivo (`fx.glow`) nas fogueiras.
- **RF-07 Acessibilidade e tiers.** `reducedFlashes` desliga o pulso das fogueiras (luz estável). Tier `low`: clima a 40%, sem camada de escuridão, sem brilho aditivo (a chama continua); a vinheta é uma imagem só e fica em todos os tiers.

## Fora de escopo

Arte PixelLab nova, colisão das fogueiras, postFX/shaders (a luz continua sendo a camada de escuridão com ERASE, sem filtro de WebGL), som das fogueiras.

## Asserts

- `bun test tests/ambient.test.ts tests/round.test.ts`: efeito certo por bioma, contagem por tier, fogueiras determinísticas, dentro da arena e longe dos obstáculos, flicker estável com `reducedFlashes`.
- `bun run typecheck`, `bunx biome check`, `bun scripts/perf.ts` (≥ 60 FPS com 300 inimigos).
- Browser (1920×1080, `?skipMenu=1&hero=jack&round=N&seed=1&debug=1&god=1`, rounds 1, 12, 22, 32, 42): efeito, fogueira e luz visíveis; marcas vermelhas legíveis.
