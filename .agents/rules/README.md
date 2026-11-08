# Regras do projeto (provider-agnostic)

Regras curtas que qualquer agente de código (Claude Code, Codex, Cursor, Gemini, Copilot…) deve seguir neste repositório. Elas apontam para a documentação em `docs/`, que é a fonte de verdade; nada aqui duplica números ou specs.
Nenhuma ferramenta carrega esta pasta sozinha: o `AGENTS.md` da raiz manda ler os arquivos por caminho conforme a tarefa.

| Regra | Quando ler |
|---|---|
| [agents-workflow.md](agents-workflow.md) | sempre: protocolo de sessão, papéis, ROADMAP, SDD antes do código |
| [commits.md](commits.md) | antes de commitar, versionar ou publicar release |
| [changelog.md](changelog.md) | ao registrar uma mudança relevante |
| [typescript.md](typescript.md) | ao escrever qualquer código |
| [phaser4.md](phaser4.md) | ao tocar o mundo do jogo (`src/world`, `entities`, `systems`, `scenes`) |
| [react-ui.md](react-ui.md) | ao tocar a UI (`src/ui`) |
| [game-data-and-i18n.md](game-data-and-i18n.md) | ao mexer em números, textos, cores ou chaves de assets |
| [testing.md](testing.md) | ao criar ou alterar lógica, componentes ou fluxos |
| [assets.md](assets.md) | ao gerar arte (PixelLab) ou áudio (ElevenLabs) |
| [balance.md](balance.md) | ao mudar qualquer número de gameplay |
| [secrets.md](secrets.md) | ao lidar com `.env`, tokens, prints e logs |
| [markdown-docs.md](markdown-docs.md) | ao escrever ou mover documentação |
