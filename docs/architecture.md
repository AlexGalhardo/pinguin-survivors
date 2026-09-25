# Arquitetura técnica

## Stack

| Camada | Escolha | Por quê |
|---|---|---|
| Linguagem | **TypeScript** (strict) | Tipos em dados de balanceamento/cartas; agentes erram menos |
| Bundler / dev server | **Vite** | HMR rápido, build estático |
| Engine | **Phaser 4.2.x** | Render WebGL, cenas, input, áudio, tweens, partículas. **Atenção: é Phaser 4, não 3.** Exemplos antigos da internet (v3) podem quebrar; consulte as skills `v3-to-v4-migration` e `v4-new-features` |
| Física | **Arcade Physics** | Leve para centenas de corpos (círculos/AABB). Matter.js é pesado demais para hordas |
| Runtime / pacotes | **Bun 1.4.2** (`bun.lock`) | Rápido; roda TS nativo; test runner embutido |
| Testes | **`bun:test`** (lógica pura) + **agent-browser** (smoke/E2E visual) | |
| SFX | **jsfxr** (Web Audio, procedural) | Zero arquivos de áudio no Alpha |
| Persistência | `localStorage` (wrapper com try/catch + versão de schema) | |
| Lint/format | **Biome v2** (TAB, largura 4) | Uma ferramenta rápida no lugar de ESLint + Prettier |
| Versionamento | git + GitHub (`origin/main`), Conventional Commits, SemVer, Husky | Ver [git-and-versioning.md](git-and-versioning.md) |

Scripts npm: `dev`, `build`, `preview`, `test`, `test:watch`, `typecheck`, `lint`, `format`, `format:check`, `check`, `check:fix`.

## Estrutura de pastas (alvo)

```
index.html               # <div id="game">, CSS: margin 0, overflow hidden, 100vw/100dvh
src/
  main.ts                # new Phaser.Game(config)
  config/
    game-config.ts       # renderer, scale, physics, pixelArt, scene list
    constants.ts         # LOGICAL_W=480, LOGICAL_H=270, ARENA_W=960, ARENA_H=540, TILE=32
    palette.ts           # Endesga 32 como constantes nomeadas
    strings.ts           # todos os textos da UI (inglês), centralizados
  logic/                 # TS PURO, sem import de Phaser → 100% testável no `bun:test`
    rng.ts               # RNG com seed (mulberry32)
    scaling.ts           # hpMul/dmgMul/spdMul/duração/spawnRate
    stats.ts             # modelo de stats, aplicação de modificadores, fórmulas de combate
    rarity.ts            # sorteio de raridade (onda + Luck)
    cards.ts             # geração das 3 cartas (regras de slots/revive/nível máx.)
    shop.ts              # geração da loja, preços, re-roll
    economy.ts
    sim/                 # simulação headless de runs para balanceamento
  data/                  # definições data-driven (tipadas)
    characters.ts  enemies.ts  weapons.ts  abilities.ts  cards.ts  items.ts
  scenes/
    BootScene.ts         # configura escala/zoom, gera texturas placeholder e fonte bitmap
    PreloadScene.ts      # (1.0) carrega atlas/áudio reais
    MainMenuScene.ts  CharacterSelectScene.ts
    GameScene.ts         # arena, entidades, sistemas
    HudScene.ts          # roda em paralelo com GameScene
    CardPickScene.ts  ShopScene.ts  PauseScene.ts  GameOverScene.ts  SettingsScene.ts
  entities/              # Player, Enemy, Projectile, Pickup (Phaser + Arcade body)
  systems/               # classes que o GameScene orquestra
    WaveSystem  SpawnSystem  WeaponSystem  AbilitySystem  CombatSystem
    PickupSystem  StatsSystem  AudioSystem  SaveSystem  FxSystem (juice)
  ui/                    # componentes pixel art desenhados por código
    PixelPanel  PixelButton  CardView  Bar  IconFactory  BitmapFontFactory
  art/
    placeholders/        # geradores canvas de texturas (Alpha/Beta)
    manifest.ts          # CONTRATO de chaves de textura/animação/som (ver abaixo)
  debug/                 # window.__GAME__, query params, overlay de FPS/contagem
public/assets/           # (1.0) atlas PNG+JSON, áudio final
scripts/                 # (1.0) pipeline de assets (pixelize, atlas pack)
tests/                   # *.test.ts do `bun:test` (root em `bunfig.toml`) (espelha src/logic)
```

## Princípios

1. **Lógica pura separada de Phaser.** Tudo o que é regra (fórmulas, sorteios, stats, loja) mora em `src/logic` sem importar Phaser, e é testado no `bun:test`. Cenas e sistemas só chamam essa lógica.
2. **Data-driven.** Números nunca ficam espalhados pelo código: ficam em `src/data/*.ts` e são espelhados em `docs/balancing.md`.
3. **Contrato de assets (`art/manifest.ts`).** Cada sprite, animação e som tem uma **chave estável** (ex.: `enemy.chaser`, `player.warrior.walk`, `sfx.hit`). No Alpha, `art/placeholders` gera texturas por canvas com essas chaves. No 1.0, o `PreloadScene` carrega o atlas real com **as mesmas chaves**, e nenhuma cena muda.
4. **Object pooling** para inimigos, projéteis, pickups, números de dano e partículas (Phaser Groups com `maxSize` e `getFirstDead`). Nada de `new` por frame.
5. **RNG com seed** em tudo que é sorteio de gameplay (spawn, cartas, loja, crit), para reproduzir bugs (`?seed=123`).
6. **Eventos tipados** entre cenas (Game ↔ HUD ↔ CardPick ↔ Shop) via `this.game.events` com nomes definidos num enum; sem acoplamento direto entre cenas.
7. **Estado da run** num objeto único serializável (`RunState`: personagem, onda, stats, habilidades, itens, ouro, revive, estatísticas).

## Tela cheia + pixel perfect (requisito: ocupar todo o viewport sem scroll)

- CSS: `html, body { margin:0; height:100%; overflow:hidden; background:#000 }`, `canvas { image-rendering: pixelated; display:block }`.
- Phaser: `scale.mode = Phaser.Scale.RESIZE`, `pixelArt: true`, `roundPixels: true`, `antialias: false`.
- Zoom inteiro: `zoom = max(1, floor(min(innerWidth / 480, innerHeight / 270)))`, aplicado às câmeras (Game e HUD) em cada evento `resize`. Assim 1920×1080 → zoom 4 (vê 480×270). Telas "entre" zooms mostram um pouco mais de arena, sem borrar.
- A HUD e os menus são desenhados em coordenadas lógicas e ancorados às bordas visíveis (recalculados no resize).
- Skill de referência: `scale-and-responsive`.

## Loop de uma onda (GameScene)

```
update(dt):
  input → Player.move
  SpawnSystem.tick (telegraph → spawn via pool)
  Enemy AI (seek / keep-distance / charge)
  WeaponSystem + AbilitySystem (auto-target: inimigo mais próximo; spatial hash se necessário)
  Arcade overlaps: projectile×enemy, enemy×player, pickup×player-magnet
  CombatSystem aplica dano (logic/stats) → FxSystem (flash, número, shake) → AudioSystem
  WaveSystem: timer → ao zerar: purge, coletar ouro, emitir WAVE_END → CardPick → Shop → WAVE_START
```

## Performance (meta: 60 FPS, 300 inimigos + 500 projéteis, notebook médio no Chrome)

- Pooling; corpos circulares; desligar `collideWorldBounds` de projéteis e matá-los fora da arena.
- Mira: busca do mais próximo em uma **grade espacial** simples (células de 64 px) quando houver mais de 150 inimigos.
- Números de dano: BitmapText em pool; limitar a ~60 simultâneos.
- Overlay de debug (`?debug=1`): FPS, contagem de inimigos/projéteis, corpos da física.

## Debug e testabilidade (importante para agentes)

- Query params: `?seed=123&char=mage&wave=10&god=1&debug=1&skipMenu=1`.
- `window.__GAME__` (só no dev): `{ state: RunState, scene, spawn(type,n), giveCard(id), setWave(n) }`. Permite que o `agent-browser` monte cenários e tire screenshots.
- Logs de erro sem tratamento viram falha no smoke test do agent-browser.
