# Phaser 4 (mundo do jogo)

- **Phaser 4.2.x, não 3.** A API mudou (render, filtros, DynamicTexture, input). Antes de copiar exemplo da web, confira a skill correspondente em `.agents/skills/` (`game-setup-and-config`, `scenes`, `cameras`, `sprites-and-images`, `animations`, `render-textures`, `filters-and-postfx`, `particles`, `tweens`, `input-keyboard-mouse-touch`, `scale-and-responsive`, `loading-assets`, `audio-and-sound`, `v3-to-v4-migration`, `v4-new-features`…). A skill `gc-phaser` é Phaser 3: só padrões, nunca APIs.
- Phaser renderiza **só o mundo** (`src/world`, `src/entities`, `src/systems`, `src/scenes/BootScene`, `src/scenes/GameScene`). Toda UI é React (`.agents/rules/react-ui.md`).
- **Sem Arcade/Matter Physics**: simulação própria em mundo cartesiano com `SpatialGrid`; colisões por círculos em unidades de mundo.
- **Câmera top-down 2D** (ADR-003): `screenX = x`, `screenY = y`, depth por `y`. Arena quadrada `min(10 + (N−1), 40)` tiles de 64 px, centrada, com bordas sólidas. Nada de projeção isométrica.
- Tela: `scale.mode = NONE`, zoom inteiro pela altura 540 (`src/core/display.ts`), `pixelArt: true`, `roundPixels`. Spawn fora da área visível real quando a arena for maior que a tela.
- **Object pooling** para inimigos (máx. 300), projéteis, pickups, gibs, números e decalques. Nada de `new` por frame. Meta: 60 FPS com 300 inimigos + 2.000 decalques (`bun scripts/perf.ts`).
- Animação por código das armas (`src/logic/weapon-anim.ts`, números em `src/data/weapon-anim.ts`) e dos inimigos (`fly`, `attack`, `walk` escolhidos pelo comportamento em `Enemy.ts`): ajustes de feel vão em `src/data`, nunca como número solto na entidade.
- Eventos tipados entre mundo e UI (`src/core/events.ts`); `RunState` serializável. O `GameScene` orquestra os systems em ordem fixa por frame.
- Texturas, animações e sons só pelas chaves de `src/art/manifest.ts`; placeholders por código e arte final usam a mesma chave.
- Detalhes: `docs/architecture.md` §3, §7, §8.
