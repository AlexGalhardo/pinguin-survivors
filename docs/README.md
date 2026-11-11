# Documentação — Penguin Survivors

Índice. O plano de execução é o [`../ROADMAP.md`](../ROADMAP.md) (o `PLAN.md` na raiz é histórico). Cada documento tem versão, data e índice próprios e referencia os outros em vez de duplicar.

| Doc | Conteúdo |
|---|---|
| [gdd.md](gdd.md) | **Game Design Document**: pitch, loop, arena, heróis, armas (6 slots), loja, cartas, economia, danger, inimigos, UI, demo |
| [visual.md](visual.md) | **Art Bible**: direção de arte, escala, personagens, armas, arena, VFX, UI, pipeline PixelLab, chaves, orçamento, registro de produção |
| [design-system.md](design-system.md) | **Design system da UI v2 (Estilo D, Diablo 4 orgânico)**: tokens de cor, tipografia, espaçamento, elevação e ornamentos; componentes, estados, responsividade, movimento e `@theme` do Tailwind |
| [wireframes/](wireframes/README.md) | Wireframes das 16 telas nos estilos A–D (`.fig` do OpenPencil) e especificação de implementação de cada tela no Estilo D, com SVGs em `wireframes/d4/` |
| [audio.md](audio.md) | **Direção de Som**: direção, engenharia, catálogo e prompts de SFX e música, pendências, orçamento ElevenLabs |
| [architecture.md](architecture.md) | Stack, camadas, mundo/arena, React sobre o canvas, pastas, princípios, tela/zoom, performance, persistência, builds, debug |
| [balancing-and-simulation.md](balancing-and-simulation.md) | Metodologia de balanceamento (dev e pós-1.0), números e fórmulas (espelho de `src/data`), histórico de calibração |
| [workflow.md](workflow.md) | Protocolo de sessão, papéis dos agentes, convenções, DoD, git, versionamento padrão vukem, gates, ferramentas, comandos |
| [web-research.md](web-research.md) | Pesquisa de mercado: Brotato, Vampire Survivors, Arms of God e outros; mecânicas; Next Fest; monetização; portais web |
| [research/poe2-passive-tree.md](research/poe2-passive-tree.md) | Pesquisa: árvore de passivas do PoE2 (pontos, nós, respec, weapon set) e o que aplicar numa árvore pequena com 3 heróis |
| [brainstorming.md](brainstorming.md) | Entrevista de 2026-11-08: decisões B-01…B-31, descartes, pendências do desenvolvedor, impacto, riscos |
| [site.md](site.md) | Site comercial: objetivo, mensagem, estrutura da landing, copy, demo, trailer, SEO, hospedagem, checklist |
| [marketing/trailer-script.md](marketing/trailer-script.md) | Roteiro do trailer (≤ 2 min): beats, planos com URLs de debug, textos EN e música |
| [marketing/steam-page.md](marketing/steam-page.md) | Página da Steam: descrição curta e longa, features, tags e requisitos (TBD) nos 4 idiomas |
| [adrs/](adrs/README.md) | Architecture Decision Records (ADR-000 histórico, ADR-001…024) |
| [sdds/](sdds/README.md) | Specs de implementação (SDD-001…018) com critérios de aceite verificáveis |
| `reports/` | Relatórios de balanceamento, QA e playtest gerados pelos scripts e pelas skills `ccgs-*` |
