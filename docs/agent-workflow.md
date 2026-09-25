# Workflow para agentes

## Protocolo de sessão

1. Ler `CLAUDE.md`/`AGENTS.md` → **`PLAN.md`** (fase atual e próxima microtarefa `[ ]`) → os docs relevantes em `docs/`.
2. Pegar **uma** microtarefa (ou um grupo pequeno e coeso) da fase atual, na ordem. Não pular fases sem pedido do usuário.
3. Implementar seguindo `architecture.md` (lógica pura em `src/logic`, números em `src/data`).
4. **Verificar** antes de marcar como feito:
   - `bun run check`, `bun run typecheck` e `bun test` passam (os hooks Husky também rodam isso).
   - Mudou algo visível? Rodar `bun run dev` e validar com a skill **agent-browser** (screenshot + console sem erros). Usar os query params de debug (`?skipMenu=1&char=...&wave=...&seed=...`).
5. Atualizar o **`PLAN.md`**: `[x]` feito · `[~]` incompleto ou bloqueado (dizer o motivo em uma linha) · `[ ]` pendente.
6. Adicionar **1–3 linhas curtas** no **Changelog** do fim do `PLAN.md` (data + o que mudou).
7. Se mudou números, atualizar `docs/balancing.md`. Se tomou uma decisão de design, registrar em `docs/decisions.md`.
8. **Micro-commits em Conventional Commits** durante o trabalho. Ao fechar cada **seção** do PLAN (0.2, 1.1, …): `docs(plan)` → bump SemVer + `chore(release): X.Y.Z` + tag → `git push origin main --follow-tags`. Detalhes em [git-and-versioning.md](git-and-versioning.md). O usuário autorizou os commits e pushes desse fluxo.

## Convenções de código

- **Bun** é o runtime e o gerenciador de pacotes (`bun add`, `bun run`, `bunx`). node/npm só quando uma ferramenta não suportar Bun (registrar o motivo).
- TypeScript strict; nada de `any` sem comentário justificando.
- Formatação e lint: **Biome v2**, TAB com largura 4 (`bun run check:fix`). Sem ESLint e sem Prettier.
- Nomes em inglês; arquivos em `PascalCase.ts` para classes/cenas e `kebab-case.ts` para módulos.
- Nenhum número mágico de gameplay fora de `src/data` ou `src/config/constants.ts`.
- Nenhum texto de UI fora de `src/config/strings.ts`.
- Nenhuma cor fora de `src/config/palette.ts`.
- Nenhuma textura, animação ou som sem chave registrada em `src/art/manifest.ts`.
- Phaser **4**: confira a API nas skills (`.claude/skills/<nome>/SKILL.md`) antes de copiar exemplos da web.

## Definição de pronto (DoD) de uma microtarefa

- Funciona no Chrome em tela cheia, sem scroll, sem erros no console.
- Lógica nova coberta por teste `bun:test` (quando for lógica pura).
- PLAN.md e Changelog atualizados; commits em Conventional Commits; hooks passando (sem `--no-verify`).

## Prompts prontos

- **Continuar o desenvolvimento**: "Leia CLAUDE.md e PLAN.md. Execute a próxima microtarefa pendente da fase atual, verifique com testes e agent-browser, e atualize o PLAN.md e o changelog."
- **Balancear**: "Rode a simulação headless (`src/logic/sim`) para as 3 classes nas ondas 1–40 e compare com as metas de `docs/balancing.md` §10. Proponha ajustes."
- **QA visual**: "Use agent-browser para abrir o jogo com `?skipMenu=1&char=mage&wave=10&debug=1`, jogar 30 s pressionando WASD e reportar FPS, erros e screenshots."
- **Gerar asset (1.0)**: ver o template em `docs/art-and-assets.md`.
