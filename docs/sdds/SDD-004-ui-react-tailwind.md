# SDD-004 — UI em React + TypeScript + Tailwind CSS v4

**Versão** 1.0 · **Data** 2026-11-08 · **Status** Aprovada · **ADR** [002](../adrs/ADR-002-ui-react-tailwind-overlay.md) · **GDD** §21 · **Art Bible** §7

## Requisitos

- RF-01 `index.html` contém `<canvas>` (Phaser) e `<div id="ui">` (React) sobrepostos; o overlay é `pointer-events: none` por padrão e `auto` só nos painéis abertos.
- RF-02 Componentes: `Hud`, `MainMenu`, `HeroSelect`, `HeroScreen` (pontos, gambits, Oficina), `Shop`, `LevelUpCards`, `Pause`, `Settings`, `Controls`, `Achievements`, `Extras`, `History`, `GameOver`, `Unlock`, `DemoEnd`, `VersionFooter`, `Toast`.
- RF-03 Estado: store leve (`src/ui/store.ts`, `useSyncExternalStore`) alimentado pelo `GameScene` via `GameEvents`; comandos do React ao jogo por `GameCommands` tipados (iniciar run, escolher carta, comprar, fechar loja, pausar).
- RF-04 Input: gerenciador de foco próprio (teclado, gamepad via `GameInput`, toque); foco visível; hit targets ≥ 44 px no toque; `Esc`/`B` volta.
- RF-05 Layout responsivo com Tailwind v4 (`@theme` com tokens de `palette.ts`); texto em `rem`/`clamp()`; sem zoom inteiro no overlay; testado em 1920×1080, 2560×1440, 2400×1080 e 1366×768.
- RF-06 Tipografia: Rubik (corpo), Pixelify Sans (títulos), Noto Sans SC (ZH, carregada sob demanda).
- RF-07 `Shop`: grid 2 colunas (paper doll + stats | lojista + 4 ofertas), rodapé fixo; no celular, colunas viram abas.
- RF-08 Remover cenas Phaser de UI ao fim da migração; `HudScene` substituída; `installCrispText` removido.
- RF-09 Textos só via `t()` de `src/i18n/`; nenhuma string literal visível em componentes (lint custom).

## Especificação

- Dependências (estáveis, fixas no `package.json`, sem `^`): `react`, `react-dom`, `tailwindcss`, `@tailwindcss/vite`, `@types/react`, `@types/react-dom`; dev: `@testing-library/react`, `happy-dom`. Versões exatas confirmadas na instalação.
- `src/ui/App.tsx`, `src/ui/store.ts`, `src/ui/commands.ts`, `src/ui/focus.ts`, `src/ui/components/*`, `src/ui/theme.css`.
- `vite.config.ts`: plugin Tailwind; `index.html` com `<div id="ui">`.
- Phaser: `src/main.ts` cria o jogo e monta o React; `GameScene` só emite eventos.

## Critérios de aceite

| # | Assert | Verificação |
|---|---|---|
| A1 | `rg -n "Phaser" src/ui` retorna vazio | grep |
| A2 | `rg -n "scene.add.text\|add.bitmapText" src/scenes src/systems` só no overlay de debug | grep |
| A3 | Teste de componente: `Shop` renderiza 4 ofertas, desabilita compra sem Fish, chama `commands.buy` | `bun test tests/ui/shop.test.tsx` |
| A4 | E2E: menu → seleção → run → level-up → loja → pausa → settings → game over, zero erros de console, em 1920×1080 e 2400×1080 | `bun run e2e` |
| A5 | Nenhuma string literal com letras em JSX fora de `t()` | `bun scripts/lint-i18n.ts` |
| A6 | Lighthouse acessibilidade ≥ 90 na `MainMenu` | chrome-devtools |
| A7 | Screenshot do `Shop` nas 4 resoluções sem overflow/scroll | agent-browser |

## Fora de escopo

Site (SDD-008); conteúdo das telas (GDD).
