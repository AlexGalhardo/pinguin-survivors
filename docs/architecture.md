# Arquitetura técnica — Pinguin Survivors

> **Versão** 2.2 · **Data** 2026-11-08 · Alvo da 1.0 (top-down, React, ports). Onde o código atual ainda diverge do alvo, as SDDs em [sdds/](sdds/README.md) descrevem a migração e o [ROADMAP.md](../ROADMAP.md) a agenda. Decisões: [adrs/](adrs/README.md).

## Índice

1. [Stack](#1-stack)
2. [Visão geral em camadas](#2-visão-geral-em-camadas)
3. [Mundo: simulação, arena e render](#3-mundo-simulação-arena-e-render)
4. [UI: React sobre o canvas](#4-ui-react-sobre-o-canvas)
5. [Estrutura de pastas](#5-estrutura-de-pastas)
6. [Princípios](#6-princípios)
7. [Tela, resolução e zoom](#7-tela-resolução-e-zoom)
8. [Gore, luz e performance](#8-gore-luz-e-performance)
9. [Persistência e plataforma](#9-persistência-e-plataforma)
10. [Builds: jogo, demo, desktop, mobile, site](#10-builds-jogo-demo-desktop-mobile-site)
11. [Debug](#11-debug)

## 1. Stack

| Camada | Escolha | Nota |
|---|---|---|
| Linguagem | **TypeScript** strict | |
| Bundler | **Vite 8** | multi-target por env (`VITE_DEMO`) |
| Engine do mundo | **Phaser 4.2.x** (WebGL) | só mundo, entidades, VFX, câmera, áudio. **Phaser 4 ≠ 3**: skills em `.agents/skills/` |
| UI | **React 19 + Tailwind CSS v4** | overlay DOM; todas as telas (ADR-002) |
| Física | nenhuma engine: simulação própria + `SpatialGrid` | testável em TS puro |
| Runtime/testes | **Bun 1.4.x**, `bun:test`, Playwright (E2E, bot, QA) | |
| Desktop | **Electron** (estável fixo) + `steamworks.js` | Windows primeiro (ADR-012) |
| Mobile | **Capacitor** (estável fixo), Android | landscape only |
| Site | **Astro 7.4.x** estático em `site/` | GitHub Pages (ADR-014) |
| Arte / áudio | PixelLab API v2 · ElevenLabs | [visual.md](visual.md) · [audio.md](audio.md) |
| Lint/format | Biome v2 (TAB 4) | |

## 2. Visão geral em camadas

```
┌──────────────────────── React (src/ui) ────────────────────────┐
│ Hud · MainMenu · HeroSelect · Shop · LevelUpCards · Pause · …  │  lê store ← GameEvents
│                 store (useSyncExternalStore) · commands        │  envia GameCommands →
├──────────────────────── Phaser (src/scenes, world, …) ─────────┤
│ BootScene (assets) · GameScene (orquestra os systems)          │
│ systems: Enemy · Weapon · Secondary · Combat · Area · Hostile  │
│          Superpower · Pickup · Fx · targeting · ProjectilePool │
│ world: Arena (chão, borda, props, GoreLayer) · Lighting        │
│ entities: Hero · Enemy · WeaponRing/WeaponView                 │
├──────────────────────── Lógica pura (src/logic) ───────────────┤
│ arena · spawn · steering · stats · combat · status · build     │
│ weapons · projection · run-state (endRound/leaveShop/finishRun)│
│ shop · cards · economy · round · difficulty(danger) · save     │
│ progression · potions · superpower · achievements · sim/       │
├──────────────────────── Dados / i18n / arte ───────────────────┤
│ src/data/*.ts (números) · src/i18n (4 idiomas) · art/manifest  │
├──────────────────────── Plataforma (src/core/platform) ────────┤
│ platform(): window.platform (ponte) → electron · capacitor;    │
│ senão web. save, achievements, leaderboards, fullscreen, openUrl│
│ tier (low/mid/high, detectTier)                                │
└────────────────────────────────────────────────────────────────┘
```

## 3. Mundo: simulação, arena e render

- **Coordenadas**: mundo cartesiano em unidades (1 u = 1 px lógico); `screenX = x`, `screenY = y`; depth por `y`. `z` só para arcos de gibs/projéteis (offset visual).
- **Arena** (ADR-003, SDD-001): quadrado `side(N) = min(10 + (N−1), 40)` tiles de 64 u, centrado na origem; `arenaBounds(N)`; crescimento centrado a cada round; bordas sólidas; spawn em anel interno; câmera com lerp clampada (centrada quando a arena cabe na tela).
- **Entidades** pooled: inimigos (máx. 300), projéteis, pickups, gibs, números, decalques. Nada de `new` por frame.
- **Colisão**: círculos em espaço de mundo via `SpatialGrid` recentralizado no herói; props sólidos como círculos; voadores ignoram props mas respeitam a borda.
- **Direções**: 8 (5 geradas + 3 espelhadas) pelo vetor de movimento; sem rotação de input.
- **Systems** (orquestrados pelo `GameScene`, ordem fixa por frame): input → movimento/steering → armas (6 slots, `WeaponSystem`; secundárias em `SecondarySystem`; alvo em `systems/targeting.ts`) → projéteis/áreas/hostis → combate/status → pickups → round/loja/level-up → FX → save.
- **Fim de round** (`src/logic/run-state.ts`): `endRound` paga Fish e Pérolas do round e vai para `cards` (se houver level-up pendente) ou direto para `shop`; `resolveLevelUp` abre a loja quando as cartas acabam; `leaveShop` devolve à fase `round` e a `GameScene` cresce a arena, inicia o round N+1 e salva (autosave). `finishRun` converte Fish em Pérolas (`floor(fish / SHOP.fishToPearls)`) e soma no save.
- **Danger 0–5** (`src/logic/difficulty.ts`): modificadores por nível (`dangerMods`), ondas extras (`extraWaves`), desbloqueio por herói (`unlockDanger`) e melhor round por dificuldade (`recordBestRound`).
- **Eventos tipados** (`src/core/events.ts`): `GameEvents` (mundo → UI) e `GameCommands` (UI → mundo); `RunState` serializável.

## 4. UI: React sobre o canvas

- `index.html`: `<canvas>` + `<div id="ui">` (`position: fixed; inset: 0; pointer-events: none`); painéis abertos ativam `pointer-events`.
- `src/ui/store.ts`: snapshot imutável do que a UI precisa (HP, XP, Fish, round, timer, boss, build, loja, cartas pendentes, settings); `GameScene` publica por evento.
- Pontes de dados: `src/ui/hud-bridge.ts` (`HudSnapshot`, publicado a cada `HUD_INTERVAL_MS` = 100 ms) e `src/ui/shop-bridge.ts` (`ShopView`) levam o estado do mundo para a UI; `src/ui/commands.ts` envia `GameCommands` de volta.
- Componentes em `src/ui/components/`: `Hud`, `Shop`, `ShopHost` (monta a loja), `LevelUpCards`, `Pause`, `GameOver`, `Unlock`, `Toast`, `Btn`, além das telas de menu (`MainMenu`, `HeroSelect`, `Settings`, `Controls`, `Lists`). `src/ui/App.tsx` monta `Hud` e `ShopHost`; `Router.tsx` escolhe as telas.
- Foco e input de menus no React (`src/ui/focus.tsx`, `focus-nav.ts`): teclado, gamepad (via `GameInput` em modo menu), toque; o `GameInput` do mundo é desligado enquanto um painel modal está aberto.
- Telas de menu ainda em Phaser (`src/scenes/*Scene.ts`) convivem com a UI React; helpers Phaser da UI em `src/scenes/ui-phaser/` ficam até o T3.7.
- Tailwind v4 com `@theme` gerado de `palette.ts` (`bun scripts/export-palette-css.ts`); tipografia Rubik/Pixelify Sans/Noto Sans SC; sem zoom inteiro no overlay.

## 5. Estrutura de pastas

```
src/
  main.ts                   # Phaser.Game + createRoot(App)
  config/                   # constants (LOGICAL_H=540, TILE=64…), game-config, palette
  core/                     # audio, music, display, events, input, gamepad, storage, context, feel,
                            # synthetic-keys, viewport · platform/ (bridge, web, electron, capacitor, types)
  data/                     # heroes enemies bosses weapons sets secondaries superpowers unlocks
                            # cards economy rounds difficulty(danger) potions upgrades achievements
                            # arena obstacles combat display equipment sfx
  i18n/                     # ui/cards/achievements/gear/shop/weapons × en, pt-BR, es, zh-CN
  logic/                    # puro + testado (ver §2) · sim/ (run-sim, card-policy, shop-policy)
  world/                    # Arena, GoreLayer, Lighting
  entities/                 # Hero, Enemy, WeaponRing, WeaponView
  systems/                  # Enemy, Weapon, Secondary, Combat, Area, Hostile, Superpower, Pickup, Fx,
                            # ProjectilePool, targeting
  scenes/                   # GameScene e cenas de menu/telas Phaser (legado até o T3.7); ui-phaser/
  ui/                       # App, Router, store, commands, *-bridge (hud, shop), focus(.tsx, -nav),
                            # components/ (Hud, Shop, ShopHost, LevelUpCards, Pause, GameOver, Unlock…),
                            # palette.css, theme.css
  art/                      # manifest (contrato), atlas, anim-atlas, weapon-art, placeholders
  debug/                    # params (flags de URL)
apps/
  desktop/                  # Electron (main, preload, electron-builder)
  mobile/                   # Capacitor (android/)
site/                       # Astro 7.4 (landing) + public/demo (gerado)
scripts/                    # pl-*, el-*, pack-*, sim, playtest-bot, balance-report, perf, e2e,
                            # qa-browsers, release, release-backfill, build-demo, build-site
tests/                      # *.test.ts espelhando src/logic; ui/*.test.tsx
docs/                       # gdd, visual, audio, architecture, workflow, balancing-and-simulation,
                            # web-research, brainstorming, site, adrs/, sdds/, reports/
```

## 6. Princípios

1. Lógica pura separada de Phaser e React, testada com `bun:test`.
2. Data-driven: números em `src/data`, espelhados em `balancing-and-simulation.md` Parte B.
3. Contrato de assets: chave estável no `manifest.ts`; placeholders por código e arte final usam a mesma chave.
4. Pooling de tudo que nasce e morre em massa.
5. RNG com seed em todo sorteio e na geração da arena (`?seed=` reproduz a run).
6. Eventos tipados entre mundo e UI; `RunState` serializável; `SaveData` versionado com migração.
7. Nenhum import de plataforma (`electron`, `@capacitor/*`, `steamworks.js`) em `src/`; só `window.platform`.

## 7. Tela, resolução e zoom

- Canvas com `scale.mode = NONE` controlado por `src/core/display.ts`: renderiza na resolução escolhida (Auto = pixels nativos, ou SD/HD/FHD/2K/3K/4K) e estica para a janela.
- **Zoom inteiro pela altura 540**: 1920×1080 → ×2 (960×540 lógicos); 2560×1440 → ×2 (1280×720); 2400×1080 landscape → ×2 (1200×540); 3840×2160 → ×4; 1366×768 → ×1.
- Spawn em anel interno de 1 tile junto à borda; posições fora do retângulo visível da câmera + 48 px quando existirem; caso contrário, qualquer ponto do anel com telegraph de 0,5 s (SDD-001 RF-04).
- Overlay React independente do zoom do canvas (texto nítido em qualquer resolução).

## 8. Gore, luz e performance

- Decalques carimbados na `DynamicTexture` da arena (teto 4.000; ao passar do teto sai o mais antigo, `src/world/Arena.ts`), recarimbados ao crescer; gore reduzido/gosma por settings.
- Luz: `DynamicTexture` de escuridão do tamanho da tela com luzes em ERASE (herói, tiros, fogo, elites, boss, superpoder); vinheta; bloom opcional (desligado por padrão, P-65).
- Orçamento: 60 FPS com 300 inimigos + 2.000 decalques + luzes em 1920×1080 na arena 40×40 (`bun scripts/perf.ts --round 40`, SDD-001 RF-10); o `Platform.tier` já existe (`detectTier`), mas a redução por tier (decalques, luzes, bloom, partículas) ainda não está ligada ao código: fica com a SDD-007.

## 9. Persistência e plataforma

- `SaveData` v2 (SDD-005) via `Platform.save`; `src/core/storage.ts` delega para `platform()`. Web = `localStorage` + export/import de `.json`; Electron e Capacitor entram pela ponte `window.platform` (`createElectronPlatform`, `createCapacitorPlatform`); o campo `cloud` da ponte indica que a loja sincroniza o save sozinha (`Platform.cloud`).
- Autosave no início de cada round (`GameScene`, P-43) e ao sair da loja; `Continue` no menu.
- Conquistas e leaderboards pela `Platform`; na web são no-op (`achievements.unlock() {}`).

## 10. Builds: jogo, demo, desktop, mobile, site

| Build | Comando | Saída | Usa |
|---|---|---|---|
| Jogo completo (web interno) | `bun run build` | `dist/` | Electron e Capacitor |
| Demo web | `bun run build:demo` (`VITE_DEMO=1`, `base /demo/`) | `dist-demo/` | copiado para `site/public/demo/` |
| Desktop | `bun run build:desktop` | `apps/desktop/dist/*.exe` (completo e demo) | Steam |
| Android | `bun run build:android` | AAB | Google Play |
| Site | `bun scripts/build-site.ts` | `site/dist/` | GitHub Pages |

## 11. Debug

`?skipMenu=1&hero=jack&round=5&seed=1&tier=2&danger=2&weapons=machete,knives&arena=12&god=1&debug=1` (flags lidas por `parseDebugParams` em `src/debug/params.ts`: `hero`, `round`, `seed`, `tier`, `danger`, `weapon`, `weapons`, `arena`, `god`, `debug`, `skipMenu`, `uiHud`). `window.__GAME__` só no dev. Overlay com FPS, contagem de entidades, placeholders em uso.

**Testes sem som**: `SOUND_MUTED=true` silencia `src/core/audio.ts` e `src/core/music.ts` (lido por `import.meta.env`). Os scripts Playwright (`perf`, `playtest-bot`, `qa-browsers`, `e2e`) abrem o Chrome com `--mute-audio`.
