# UI em React + Tailwind CSS v4

- Toda a UI (HUD, menus, loja, cartas, pausa, settings, telas finais) é React 19 + TypeScript em `src/ui/`, montada em `<div id="ui">` sobre o canvas (ADR-002, SDD-004). Nada de `scene.add.text` fora do overlay de debug.
- Estado via `src/ui/store.ts` (`useSyncExternalStore`), alimentado pelo `GameScene` por `GameEvents`; comandos de volta por `GameCommands` tipados. Componentes não importam Phaser.
- Tailwind v4 com `@theme` gerado de `src/config/palette.ts` (`bun scripts/export-palette-css.ts`); nenhuma cor literal em componentes.
- Textos só via `t()` de `src/i18n/` nos 4 idiomas; `bun scripts/lint-i18n.ts` proíbe literais em JSX.
- Layout responsivo: 1920×1080, 2560×1440, 2400×1080 (celular landscape) e 1366×768; texto em `rem`/`clamp()`, sem zoom inteiro no overlay; hit targets ≥ 44 px no toque; foco visível; navegável por teclado, gamepad e toque (`src/ui/focus.ts`).
- Estilo ARPG sombrio (Diablo 4, ADR-018): painéis escuros, moldura metálica, tipografia Roboto, Noto Sans SC em ZH (sob demanda). **Siga [docs/design-system.md](../../docs/design-system.md)** (cores, tipografia, espaçamento, componentes, estados) para qualquer tela ou componente novo; a cor de raridade vem só de `rarityColor` (ADR-017).
- Todo menu, exceto o inicial, tem fundo preto ou neutro (sem key art) e cabe na tela sem rolar a página: liste longas coleções **paginadas** (a árvore de habilidades usa câmera própria). A HUD some sob qualquer tela cheia (`src/ui/overlay.ts`).
- Cada opção diz o que faz e cada compra mostra o antes → depois (`describeOffer`).
- Componente com lógica tem teste (`tests/ui/*.test.tsx`, `@testing-library/react` + `happy-dom`); fluxo tem E2E (`bun run e2e`).
- Nenhuma dependência além das listadas na SDD-004 sem aprovação.
