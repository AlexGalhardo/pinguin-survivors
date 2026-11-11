# Testes e verificação

- Lógica pura nova ou alterada (`src/logic/**`) tem teste `bun:test` em `tests/` espelhando o módulo. Escreva o teste antes do código quando possível.
- Rode só o que a mudança afeta durante o trabalho (`bun test tests/<arquivo>.test.ts`); a suíte inteira e `bun run build` entram nos gates de commit/push.
- **Tudo sem som**: testes, E2E, sim, perf e bot rodam silenciosos (`SOUND_MUTED=true`, `--mute-audio`). Rode `bun test tests/ui` isolado quando a suíte inteira mistura ambientes de DOM. `bun run e2e -- --demo` cobre a build da demo.
- Componentes React com lógica: teste de componente (`tests/ui/*.test.tsx`). Fluxos de tela: E2E Playwright (`bun run e2e`, com `bun run dev` rodando).
- Mudança visível: `bun scripts/qa-menus.ts <dir>` (menus, loja e pausa em 1280×720, 1280×800, 1920×1080, 2560×1080 e 2560×1440) e `bun scripts/qa-mobile.ts <dir>` (celular paisagem) têm que terminar com `issues` vazio; confira também as capturas que eles gravam. Para uma tela só, `agent-browser` ou Playwright com os query params de debug. Performance: `bun scripts/perf.ts --round 40` (≥ 58 FPS, p95 ≤ 18 ms).
- Mudança em dados de gameplay: sim (`bun scripts/sim.ts`) e, para milestones, bot (`bun scripts/playtest-bot.ts`); ver `.agents/rules/balance.md`.
- Toda tarefa do ROADMAP tem um **assert** (comando, teste ou métrica). A tarefa só é `[x]` com o assert executado e a evidência anotada na linha; a **auditoria** é um checkbox por fase, feito depois de todas as tarefas livres da fase.
- Nunca desative, pule ou enfraqueça um teste para "passar"; corrija a causa.
- QA cross-browser antes de release: `bun scripts/qa-browsers.ts` (Chrome, Edge, Firefox) com `bun run dev` na porta 5173; o build de produção não expõe `window.__GAME__`, que o script usa. O Firefox do Playwright precisa estar instalado (`bunx playwright install firefox`).
- Os scripts de QA e o E2E partem do save de `scripts/lib/seed-save.ts`: um slot que já jogou (Jack nível 3, Pérolas, onboarding visto). Um save novo esconde a árvore e a tela de heróis (SDD-022); para testar o primeiro contato, semeie `newSlot()` puro.
- `bun run e2e -- --demo` sobe o próprio dev server com `VITE_DEMO=1`, cache do Vite separado (`node_modules/.vite-demo`) e porta 5199; se a porta for de outro processo, use `E2E_DEMO_PORT=<porta>`.
- Um comando de gate só conta se o seguinte depender dele: encadeie com `&&`, não com `;` (um `lint` vermelho seguido de push já aconteceu).
