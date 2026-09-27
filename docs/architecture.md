# Arquitetura técnica

## Stack

| Camada | Escolha | Por quê |
|---|---|---|
| Linguagem | **TypeScript** strict | Dados tipados; agentes erram menos |
| Bundler / dev | **Vite 8** | HMR, build estático |
| Engine | **Phaser 4.2.x** (WebGL) | Cenas, input, áudio, tweens, partículas, filtros (bloom/glow), DynamicTexture. **É Phaser 4, não 3** — consulte `.claude/skills/` |
| Física | **Nenhuma engine**: simulação própria em espaço de mundo + `SpatialGrid` | Iso + 300 corpos; tudo testável em TS puro (P-35) |
| Runtime / pacotes | **Bun 1.4.2** | Test runner, scripts TS nativos |
| Testes | **`bun:test`** (lógica pura) + **agent-browser** / Playwright (visual) | |
| Arte | **PixelLab API v2** (`scripts/lib/pixellab.ts`) → `art-src/pixellab/` → atlas | Ver [art-and-assets.md](art-and-assets.md) |
| Áudio | **ElevenLabs** (SFX, música, vozes) → `public/assets/audio/` | Ver [audio.md](audio.md) |
| Persistência | `localStorage` (try/catch + versão de schema + migração) | |
| Lint/format | **Biome v2** (TAB, largura 4) | |

## Projeção isométrica (o coração do jogo)

Toda a simulação acontece num **plano cartesiano de mundo** (x, y, e um `z` de altura para gibs/projéteis). A tela é só uma projeção 2:1:

```
screenX = (x − y)            // 1 u de mundo = 1 px lateral
screenY = (x + y) / 2 − z    // metade no eixo vertical (dimétrico 2:1)
depth   = x + y              // ordenação: mais "abaixo" na tela = na frente
```

- Tile iso 64×32 px ⇔ quadrado de **32×32 u** no mundo.
- Input WASD é rotacionado 45° (`W` = norte da tela = −x −y no mundo) em `src/logic/iso.ts`.
- A direção do sprite (8 dir) sai do vetor de movimento/mira **em espaço de tela**.
- Distâncias, raios, colisões e alcance são sempre em unidades de mundo (círculos). Um círculo de mundo aparece como elipse 2:1 na tela (sombras e auras são desenhadas assim).

## Estrutura de pastas (alvo)

```
src/
  main.ts                 # new Phaser.Game(config)
  config/                 # game-config, constants (LOGICAL_H=540, TILE_W=64, TILE_H=32…), palette
  i18n/                   # en.ts, pt-BR.ts, t(key, vars) — nenhum texto de UI fora daqui
  logic/                  # TS PURO, sem Phaser, 100% testado
    rng.ts spatial-grid.ts geometry.ts gamepad.ts key-claim.ts voice-limiter.ts  (herdados)
    iso.ts                # projeção, direção 8-way, rotação do input
    chunks.ts             # coordenadas de chunk, geração procedural por seed
    round.ts              # duração, boss, elites, estados do round
    scaling.ts            # hpMul/dmgMul/spawnRate por round e ciclo
    stats.ts combat.ts    # modelo de stats, fórmulas (crit, armadura, dodge, parry, DoTs, elementos)
    progression.ts        # XP, level 1–100, pontos, crescimento por classe
    cards.ts              # sorteio das 3 cartas (raridade, slots, evolução)
    potions.ts            # gambits: avaliação de condições
    save.ts               # schema, migração, defaults
    sim/                  # simulação headless de runs para balanceamento
  data/                   # números e definições (espelhados em docs/balancing.md)
    heroes.ts enemies.ts bosses.ts weapons.ts cards.ts potions.ts biomes.ts rounds.ts
  world/                  # render do mundo (Phaser)
    IsoWorld.ts           # câmera, projeção, camadas, depth
    ChunkManager.ts       # chunks visíveis, pool de chunks, decoração
    GoreLayer.ts          # decalques de sangue persistentes por chunk (DynamicTexture)
    Lighting.ts           # escuridão + luzes (máscara aditiva), vinheta
  entities/               # Hero, Enemy, Projectile, Pickup, Gib — views pooled sobre estado de mundo
  systems/                # orquestrados pelo GameScene
    InputSystem MovementSystem SpawnSystem EnemyAiSystem WeaponSystem CombatSystem
    StatusSystem (DoTs) PickupSystem RoundSystem PotionSystem FxSystem AudioSystem SaveSystem
  scenes/                 # Boot, Preload, MainMenu, HeroSelect, Hero (pontos/poções), Game, Hud, CardPick, Pause, GameOver, Settings
  ui/                     # componentes (painel, botão, carta, barra) + fonte
  art/manifest.ts         # CONTRATO de chaves de textura/animação/som
  debug/                  # query params, window.__GAME__ (dev), overlay
scripts/
  lib/pixellab.ts         # cliente PixelLab (token em .env)
  pl-concepts.ts          # concepts dos heróis (8 rotações) + contact sheet
  pl-*.ts                 # (futuro) animações, inimigos, tiles, objetos
  el-*.ts                 # (futuro) ElevenLabs: sfx, música, vozes
  pack-atlas.ts lib/shelf-pack.ts  # empacota art-src/processed → public/assets/atlas*
  qa-browsers.ts          # QA do build em Chrome/Edge/Firefox (Playwright)
art-src/pixellab/         # saídas brutas do PixelLab + log.jsonl (versionado, exceto raw/)
tests/                    # *.test.ts (bun:test), espelha src/logic
```

## Princípios

1. **Lógica pura separada de Phaser** (`src/logic`), testada com `bun:test`. Entidades Phaser só leem o estado de mundo e desenham.
2. **Data-driven**: números em `src/data`, espelhados em `docs/balancing.md`.
3. **Contrato de assets** (`art/manifest.ts`): chave estável por textura/animação/som. Placeholders gerados por código e arte final usam a mesma chave. Formato das chaves de animação: `hero.jack.t1.walk` (+ direção como sufixo de frame `.se.07`).
4. **Pooling** de tudo que nasce e morre em massa: inimigos, projéteis, pickups, números de dano, gibs, partículas. Nada de `new` por frame.
5. **RNG com seed** em tudo que é sorteio de gameplay e na geração de chunks (`?seed=123` reproduz a run e o mapa).
6. **Eventos tipados** entre cenas (Game ↔ Hud ↔ CardPick) via event bus com enum.
7. **Estado da run** num objeto serializável (`RunState`); **progresso persistente** (`SaveData`: heróis, levels, pontos, Fish, poções, desbloqueios, settings).

## Tela cheia + pixel perfect

- CSS: sem margem, `overflow: hidden`, `image-rendering: pixelated`.
- Phaser: `scale.mode = RESIZE`, `pixelArt: true`, `roundPixels: true`.
- **Zoom inteiro pela altura**: `zoom = max(1, floor(innerHeight / 540))`; a largura lógica é `innerWidth / zoom` (ultrawide vê mais mapa nas laterais). 2560×1080 → zoom 2 (1280×540 lógicos) · 1920×1080 → 2 (960×540) · 3840×2160 → 4 · 2560×1440 → 2 (1280×720) · 1366×768 → 1.
- Spawns acontecem fora da área visível **real** (largura variável), para ultrawide não ver inimigos surgindo.

## Mundo infinito e gore

- Chunk = 16×16 tiles (512×512 u; 1024×512 px na tela). Mantém ativos os chunks que tocam a câmera + margem de 1; o resto volta ao pool.
- Chão desenhado por chunk; decoração posicionada por RNG(seed, cx, cy).
- **Sangue persistente**: cada chunk guarda a lista de decalques (posição, frame, rotação). Chunk visível = DynamicTexture própria onde os decalques são carimbados. Ao sair e voltar, os decalques são recarimbados. Teto por chunk (os mais antigos se fundem numa "mancha base").

## Iluminação (clima Diablo 4)

- Camada de escuridão (DynamicTexture do tamanho da tela) preenchida com a cor da noite; luzes são sprites radiais **apagados/somados** na máscara a cada frame (tiros, magias, auras de elite, tochas).
- Vinheta + bloom (filtros do Phaser 4) nos projéteis/magias.
- Validar custo no spike (fase 1). Alternativa: Lighting component do Phaser 4 (sem normal maps).

## Debug (query params)

`?skipMenu=1&hero=jack&round=5&seed=1&debug=1&god=1&tier=2`. `window.__GAME__` só no dev.
