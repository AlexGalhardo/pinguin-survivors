# SDD-007 — Ports: Electron (Steam/Windows) e Capacitor (Android), camada `Platform`

**Versão** 1.0 · **Data** 2026-11-08 · **Status** Aprovada · **ADR** [011](../adrs/ADR-011-preco-e-integracoes-steam.md), [012](../adrs/ADR-012-electron-windows-capacitor-landscape.md)

## Requisitos

- RF-01 Interface `Platform` em `src/core/platform/index.ts`: `kind: 'web'|'electron'|'capacitor'`, `save.load/save/exportFile/importFile`, `achievements.unlock(id)`, `leaderboards.submit(board, score)`, `fullscreen.toggle()`, `openUrl(url)`, `tier: 'low'|'mid'|'high'` (orçamento de efeitos), `isDemo`.
- RF-02 `web`: localStorage + download/upload de `.json`; conquistas/leaderboards no-op; `openUrl` = `window.open`.
- RF-03 `electron` (`apps/desktop/`): Electron estável fixo; janela fullscreen sem moldura (F11 alterna), `contextIsolation`, `preload.ts` expõe `window.platform`; `steamworks.js` para init com `steam_appid.txt`, conquistas (mapa `src/data/steam-achievements.ts` id interno → API name), leaderboards `hero_<id>_danger_<d>`, Steam Cloud por arquivo `save.json` na pasta de dados do usuário (Cloud auto-sync configurado no Steamworks), overlay para `openUrl` da loja. Empacotamento `electron-builder` (NSIS não assinado para Steam; Steam cuida do instalador), build de **demo** e **completo** por `VITE_DEMO`.
- RF-04 `capacitor` (`apps/mobile/`): Capacitor estável fixo, Android `minSdk 26`, `sensorLandscape`, `Preferences` para save, `@capacitor/app` para pausa em background, fullscreen imersivo, safe areas (`env(safe-area-inset-*)`), joystick virtual + botões de superpoder/pausa/2× na HUD quando `kind === 'capacitor'`; premium (sem ads/IAP).
- RF-05 Performance mobile: `tier` por `navigator.hardwareConcurrency`/`deviceMemory`; `low` limita decalques a 1.000, desliga luzes dinâmicas e bloom, reduz partículas 50%.
- RF-06 Pipelines CI: `desktop.yml` (Windows build + artefato zip), `android.yml` (AAB assinado com secrets do repo). Sem publicar automaticamente.
- RF-07 Nenhum import de `electron`, `steamworks.js` ou `@capacitor/*` no código do jogo (`src/`), só em `apps/*` e via `window.platform`.

## Especificação

- Estrutura: `apps/desktop/{package.json, main.ts, preload.ts, electron-builder.yml}`, `apps/mobile/{package.json, capacitor.config.ts, android/}`. Raiz continua o jogo; `bun run build` gera `dist/` consumido pelos dois.
- Scripts raiz: `build:desktop`, `build:android`, `build:demo`.
- Save: `Platform.save` é a única porta de persistência (`src/core/storage.ts` passa a delegar).

## Critérios de aceite

| # | Assert | Verificação |
|---|---|---|
| A1 | `rg -n "from 'electron'\|steamworks\|@capacitor" src` retorna vazio | grep |
| A2 | `bun run build:desktop` gera `apps/desktop/dist/*.exe` (demo e completo) em CI Windows | artefato do workflow |
| A3 | Executável abre em fullscreen 1920×1080, roda a run, conquista de teste dispara no overlay da Steam (modo dev com `steam_appid.txt`) | QA manual registrado no ROADMAP |
| A4 | `bun run build:android` gera AAB; app abre em landscape num aparelho de 6,7", joystick funcional, 55+ FPS no round 10 com `tier` detectado | QA manual + log de FPS |
| A5 | `Platform` web: export/import roundtrip preserva o save (teste) | `bun test tests/platform-web.test.ts` |
| A6 | Save escrito no Electron aparece em outro PC via Steam Cloud | QA manual com 2 máquinas (pendência do desenvolvedor) |

## Fora de escopo

Linux/macOS, iOS, IAP, anúncios, leaderboards server-side.
