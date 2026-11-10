# SDD-006 — Demo (web `/demo` e Steam)

**Versão** 1.0 · **Data** 2026-11-08 · **Status** Aprovada · **ADR** [013](../adrs/ADR-013-demo-rounds-1-10-jack.md) · **GDD** §22

> **Nota (2026-11-08)**: RF-04 cita a Oficina, que a [árvore de habilidades](../adrs/ADR-019-arvore-de-habilidades.md) substituiu; na demo a árvore de Jack funciona e o save da demo não migra de outras versões.

## Requisitos

- RF-01 Build com `VITE_DEMO=1` define `DEMO = { enabled: true, maxRound: 10, heroes: ['jack'], maxDifficulty: 1 }` (`src/data/demo.ts`); no build completo `enabled: false`.
- RF-02 Round 10 vencido ou perdido → estado `demoEnd` → componente `DemoEnd`: resumo da run, "Bob desbloqueado no jogo completo" com retrato, botão **Wishlist na Steam** (`Platform.openUrl(STEAM_URL)`; no Electron abre o overlay da Steam), "Jogar de novo", "Menu".
- RF-03 `HeroSelect` mostra Bob e Lucia bloqueados com "Disponível no jogo completo"; danger limitado a 0–1.
- RF-04 Oficina, gambits, conquistas e histórico funcionam; conquistas acima do round 10 ficam ocultas na demo.
- RF-05 Save compartilhado: mesmo schema e mesma chave `localStorage`/arquivo; o jogo completo lê o save da demo (web: "Importar save da demo" na primeira abertura, via export/import; Steam: import automático do arquivo da demo).
- RF-06 Rodapé mostra `DEMO` ao lado da versão; título da janela "Pinguin Survivors — Demo".
- RF-07 Nenhum conteúdo exclusivo da demo: mesmo código com gating.

## Especificação

- `src/data/demo.ts`; `src/logic/demo.ts`: `isHeroAllowed`, `isRoundAllowed`, `demoEndReason`.
- `GameScene`: ao fechar o round `maxRound`, emitir `GameEvents.demoEnd` em vez de abrir a loja.
- `scripts/build-demo.ts`: `VITE_DEMO=1 vite build --base /demo/ --outDir dist-demo`.
- E2E: `bun run e2e -- --demo`.

## Critérios de aceite

| # | Assert | Verificação |
|---|---|---|
| A1 | Build demo contém `DEMO.enabled=true`; build completo não contém a tela `DemoEnd` ativa | `bun scripts/build-demo.ts && bun run build` + grep nos bundles |
| A2 | E2E demo: `?skipMenu=1&hero=jack&round=10&seed=1&god=1` → matar boss → `DemoEnd` visível, botão wishlist com `href` da Steam | `bun run e2e -- --demo` |
| A3 | `?hero=bob` na demo cai no Jack com toast "Disponível no jogo completo" | E2E |
| A4 | Save gerado na demo importa no build completo sem erro e mantém XP do Jack | `tests/save.test.ts` fixture `save-demo.json` |
| A5 | Tempo de jogador entre 12 e 25 min, onde tempo de jogador = tempo de jogo do bot médio L1 Jack D1 (a 1x) + 45 s por loja/cartas visitada (estimativa: o bot não gasta tempo lendo telas) | log do bot (`docs/reports/demo-time-*.md`) |
