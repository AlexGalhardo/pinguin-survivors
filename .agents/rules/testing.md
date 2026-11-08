# Testes e verificação

- Lógica pura nova ou alterada (`src/logic/**`) tem teste `bun:test` em `tests/` espelhando o módulo. Escreva o teste antes do código quando possível.
- Rode só o que a mudança afeta durante o trabalho (`bun test tests/<arquivo>.test.ts`); a suíte inteira e `bun run build` entram nos gates de commit/push.
- Componentes React com lógica: teste de componente (`tests/ui/*.test.tsx`). Fluxos de tela: E2E Playwright (`bun run e2e`, com `bun run dev` rodando).
- Mudança visível: validar no browser com `agent-browser` usando os query params de debug e registrar screenshot/erros de console. Performance: `bun scripts/perf.ts --round 40` (≥ 58 FPS, p95 ≤ 18 ms).
- Mudança em dados de gameplay: sim (`bun scripts/sim.ts`) e, para milestones, bot (`bun scripts/playtest-bot.ts`); ver `.agents/rules/balance.md`.
- Toda tarefa do ROADMAP tem um **assert** (comando, teste ou métrica). A tarefa só é `[x]` com o assert executado e a evidência anotada na linha; a **auditoria** é um checkbox separado, feito por quem revisa.
- Nunca desative, pule ou enfraqueça um teste para "passar"; corrija a causa.
- QA cross-browser antes de release: `bun scripts/qa-browsers.ts` (Chrome, Edge, Firefox) com `vite preview --port 4173`.
