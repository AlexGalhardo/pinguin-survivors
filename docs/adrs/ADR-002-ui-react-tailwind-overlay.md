# ADR-002 — Toda a UI em React + TypeScript + Tailwind CSS v4 como overlay DOM

**Data** 2026-11-08 · **Status** Aceito · **Decisão de origem** B-02, B-13

## Contexto

HUD, menus, cartas, pausa e configurações hoje são cenas Phaser (`HudScene`, `MainMenuScene`, `SettingsScene`, …) com texto renderizado via patch `installCrispText` (P-64). A nova loja estilo ARPG (paper doll, 4 ofertas, lojista) e os layouts responsivos para 1920×1080, 2560×1440 e celulares de 6,7"/6,8" em landscape exigem layout flexível, tipografia nítida e acessibilidade que o Phaser entrega mal.

## Decisão

**Toda a UI** (HUD, menu principal, seleção de herói, loja, cartas de level-up, pausa, configurações, conquistas, histórico, game over, tela final da demo) vira **componentes React 19 + TypeScript** estilizados com **Tailwind CSS v4**, montados num `<div id="ui">` sobre o `<canvas>` do Phaser. O Phaser mantém apenas `BootScene` e `GameScene` (mundo, entidades, VFX, câmera). A ponte é o `GameEvents` tipado já existente (`src/core/events.ts`) mais um store leve de estado da run (`src/ui/store.ts`) que o React lê e o `GameScene` escreve. Textos continuam em `src/i18n/`.

## Alternativas

- **Só HUD e loja em React**, menus em Phaser: dois stacks de UI, dois sistemas de foco/gamepad e duas tipografias. Rejeitada.
- **Phaser DOM Elements**: acopla o DOM ao ciclo de cena do Phaser e não resolve o layout. Rejeitada.
- **Tailwind v3**: v4 é a versão estável atual, com configuração CSS-first; não há motivo para a anterior.

## Consequências

- Novas dependências: `react`, `react-dom`, `tailwindcss`, `@tailwindcss/vite` (versões estáveis fixas; ver SDD-004).
- Input de menus (teclado, gamepad, toque) passa a ser tratado no React com um gerenciador de foco próprio; o `GameInput` do Phaser só atua durante o round.
- `scale`/zoom: o canvas continua com zoom inteiro pela altura 540; o overlay usa `rem` e `clamp()` e **não** o zoom inteiro, para texto sempre nítido.
- Testes: componentes puros testados com `bun:test` + `@testing-library/react` quando houver lógica; E2E Playwright cobre os fluxos.
- As cenas Phaser de UI são removidas ao fim da migração (SDD-004); a `version-footer` vira componente.
