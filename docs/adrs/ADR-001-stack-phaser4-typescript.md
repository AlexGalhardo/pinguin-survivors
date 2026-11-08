# ADR-001 — Stack: Phaser 4 + TypeScript, sem porte para Rust + Bevy

**Data** 2026-11-08 · **Status** Aceito · **Decisão de origem** B-01 ([brainstorming.md](../brainstorming.md))

## Contexto

O briefing da virada comercial mencionava "Rust + Bevy (porte do Phaser v4)" junto de Electron, Capacitor e React. O código existente tem ~14 mil linhas de TypeScript sobre Phaser 4.2, 43 suítes `bun:test`, E2E Playwright, bot de playtest e simulação headless, com um loop jogável em beta. Restam 106 dias até o Steam Next Fest (22/02/2027). O desenvolvedor confirmou que a menção a Bevy foi um erro.

## Decisão

Manter **TypeScript + Vite 8 + Phaser 4.2 + Bun** como stack do jogo. Electron (Steam) e Capacitor (Android) embrulham o mesmo build web. A UI migra para React (ADR-002). Lógica pura continua em `src/logic/` sem Phaser, testada com `bun:test`.

## Alternativas

- **Rust + Bevy**: reescrita total (engine, render, 43 suítes, bot, sim) sem ganho prático, pois dentro de Electron/Capacitor rodaria como WASM num webview. Rejeitada.
- **Godot**: perderia o pipeline web (GitHub Pages, demo em `/demo`) e o código existente. Rejeitada.

## Consequências

- Nenhuma mudança de engine; todo o esforço vai para game design (ADR-003…008) e UI (ADR-002).
- Steam e Android dependem de wrappers web (ADR-012); limites conhecidos: tamanho do instalador Electron (~100 MB) e performance do WebView Android em aparelhos fracos.
- As skills Phaser 4 em `.claude/skills/` continuam sendo a referência de API.
