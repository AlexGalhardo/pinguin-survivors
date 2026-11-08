# Documentação em Markdown

- Documentação em **português do Brasil**, termos técnicos em inglês quando forem o padrão. Arquivos voltados à comunidade open source (`README.md`, `CONTRIBUTING.md`, `LICENSE.md`, `.github/*.md`, `CHANGELOG.md`) em inglês.
- Poucos arquivos, centralizados em `docs/`: `gdd.md`, `visual.md`, `audio.md`, `architecture.md`, `workflow.md`, `balancing-and-simulation.md`, `web-research.md`, `brainstorming.md`, `site.md`, `adrs/`, `sdds/`, `reports/`. Não crie doc novo se o assunto couber em um existente; ao criar, adicione ao `docs/README.md`.
- Todo doc tem **versão, data e índice** no topo e referencia os outros em vez de duplicar conteúdo.
- ADR: Contexto → Decisão → Alternativas → Consequências → Status; nunca editado após aceito (supera-se com um novo). SDD: requisitos, especificação, **critérios de aceite verificáveis**, plano de testes, fora de escopo, dependências.
- Afirmações de pesquisa com fonte (URL + data de acesso); o que não foi verificado é marcado **HIPÓTESE**.
- Ao remover ou mover um doc, atualize todos os links (`rg -n "<nome>.md"`) e registre no CHANGELOG.
- Lint: `.markdownlint.jsonc` na raiz (`bun run lint:md`). Tabelas com cabeçalho; sem HTML além do permitido no README.
