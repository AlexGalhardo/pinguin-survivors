# CLAUDE.md

@AGENTS.md

Regras e skills vivem em `.agents/rules/` e `.agents/skills/` (provider-agnostic). O Claude Code não as carrega sozinho aqui: siga a seção "Regras" do `AGENTS.md` e leia os arquivos pelo caminho conforme a tarefa (sempre `.agents/rules/agents-workflow.md`; depois a regra da área que você vai tocar).

Notas específicas desta ferramenta:

- Com o plugin `context-mode` ativo, chamadas `Agent` (subagentes) são recusadas pelo auto mode porque um hook altera o prompt depois da revisão. Para delegar ao `senior`/`estagiario`, desative o hook do plugin ou saia do auto mode; enquanto isso, o orquestrador implementa sozinho.
- O MCP `pixellab` do usuário usa um token expirado: gere arte pela API v2 com o token do `.env` (`.agents/skills/pinguin-art-assets/SKILL.md`).
- Entrevistas e gates com o desenvolvedor: uma pergunta por vez com opções selecionáveis (`AskUserQuestion`), nunca checklists em prosa no chat.
