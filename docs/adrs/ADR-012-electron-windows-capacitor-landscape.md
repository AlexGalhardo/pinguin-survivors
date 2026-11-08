# ADR-012 — Electron (Windows primeiro) e Capacitor (landscape only)

**Data** 2026-11-08 · **Status** Aceito · **Decisão de origem** B-24, B-25

## Contexto

O jogo é um build web (Vite). Steam exige executável; Android exige APK/AAB. Telas-alvo: 1920×1080 e 2560×1440 no desktop; 6,7"/6,8" no celular.

## Decisão

- **Electron** (versão estável fixa) para Steam, **Windows x64 primeiro**; Linux/macOS depois da 1.0. Pasta `apps/desktop/` com `main.ts` (janela sem moldura, fullscreen por padrão, `steamworks.js`), `preload.ts` (ponte `window.platform`) e `electron-builder`.
- **Capacitor** (versão estável fixa) para Android, pasta `apps/mobile/`; **landscape only** (`android:screenOrientation="sensorLandscape"`), joystick virtual flutuante (já previsto no `GameInput`), botão de superpoder na tela, safe areas.
- Interface única `Platform` (`src/core/platform/`) com implementações `web`, `electron`, `capacitor`: save (localStorage / arquivo+Cloud / Preferences), conquistas, leaderboards, fullscreen, abrir URL.

## Alternativas

- Windows + Linux na demo: Steam Deck roda o build Windows via Proton. Rejeitada por QA.
- Portrait no celular: dois layouts de HUD. Rejeitada.
- Tauri em vez de Electron: `steamworks.js` e o ecossistema de Steam são mais maduros no Electron. Rejeitada.

## Consequências

- Monorepo leve: raiz continua o jogo web; `apps/desktop` e `apps/mobile` consomem `dist/`.
- CI gera o build Windows (electron-builder) e o AAB (Gradle) em workflows separados.
- Performance no WebView Android: medir em aparelho médio; limitar decalques e luzes por `Platform.tier`.
