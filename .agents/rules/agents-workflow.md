# Fluxo de trabalho dos agentes

- Fonte da verdade do trabalho: `ROADMAP.md` (marcos, tarefas com responsável, DoD, assert e auditoria). `PLAN.md` é histórico e não está versionado.
- Ordem de leitura por sessão: `AGENTS.md` → `ROADMAP.md` (marco atual) → SDD da frente em `docs/sdds/` → docs citados por ela (`docs/gdd.md`, `docs/architecture.md`, `docs/visual.md`, `docs/audio.md`, `docs/balancing-and-simulation.md`).
- Nenhuma implementação sem SDD em "Aprovada". Spec mudou → edite a SDD primeiro; decisão arquitetural → novo ADR em `docs/adrs/`; decisão de produto → registre em `docs/brainstorming.md` ou ADR.
- Uma tarefa por vez, na ordem do marco. Ao terminar: rode o **assert** da tarefa, anote a evidência na linha, marque `[x]`; a auditoria tem checkbox próprio e é feita por quem revisa, não por quem implementou.
- Papéis: orquestrador planeja, delega, **revisa todo diff**, corrige e faz push/release; `senior` implementa; `estagiario` faz i18n, testes, relatórios e pesquisa. Relatório de agente é alegação: confira antes de marcar.
- Gates que exigem o desenvolvedor humano (🛑): aprovar concepts de arte, gastar > 200 gerações PixelLab ou > 2.000 créditos ElevenLabs, apagar/retaguear tags, publicar em loja, mudar escopo.
- Valide no browser toda mudança visível (`agent-browser`, `?skipMenu=1&hero=jack&round=5&seed=1&debug=1`) em 1920×1080; UI também em 2400×1080.
- Skills em `.agents/skills/` (Phaser 4, `pinguin-art-assets`, `pinguin-audio-assets`, `agent-browser`, gamedev de terceiros `gd-*`/`gc-*`/`ccgs-*`). Em conflito, `AGENTS.md` e `docs/` vencem.
- Detalhes: `docs/workflow.md`.
