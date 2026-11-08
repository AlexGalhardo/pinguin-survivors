# Balanceamento

- Metodologia, metas e fórmulas: `docs/balancing-and-simulation.md` (Parte A método, Parte B números, Parte C histórico). Ferramentas: `docs/sdds/SDD-013-balanceamento-e-simulacao.md`.
- Toda mudança de número segue o checklist da Parte A8: hipótese escrita → sim A/B com as mesmas seeds → bot nos perfis afetados (2 seeds, bot médio) → `src/data/*` e Parte B no mesmo commit → gates → CHANGELOG `### Changed` "Balance: …" → relatório em `docs/reports/balance-<data>.md`.
- Metas fixas (Parte A4): jogador novo (L1, Danger 1) morre entre os rounds 8 e 20; L10 + Oficina passa do boss 20; L20 passa do 30 e morre antes do 60; nenhuma arma em > 35% ou < 3% das builds; Fish gasto/ganho entre 0,85 e 1,0; 60 FPS.
- Orçamento por milestone: no máximo 3 passadas de bot (~1 h cada). Não fechou → registre a exceção e siga.
- Sim (`bun scripts/sim.ts`) é apoio para comparar variantes; o bot (`bun scripts/playtest-bot.ts`) aprova milestones. Build DEV congelado (`vite build --mode development` + `vite preview`), no máximo 2 Chromes em paralelo.
- `tests/sim.test.ts` é gate: protege a curva contra mudanças de dados acidentais.
- Pós-1.0: patch de balanceamento no máximo a cada 2 semanas; hotfix só para exploits; mudanças de dados nunca invalidam saves.
