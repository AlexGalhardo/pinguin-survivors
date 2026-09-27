# Workflow para agentes

## Protocolo de sessão

1. Ler `CLAUDE.md`/`AGENTS.md` → **`PLAN.md`** (fase atual e próxima microtarefa `[ ]`) → os docs relevantes em `docs/`.
2. Pegar **uma** microtarefa (ou um grupo pequeno e coeso) da fase atual, na ordem. Não pular fases sem pedido do usuário.
3. Implementar seguindo `architecture.md` (lógica pura em `src/logic`, números em `src/data`).
4. **Verificar** antes de marcar como feito:
   - `bun run check`, `bun run typecheck` e `bun test` passam (os hooks Husky estão vazios por escolha do usuário — rode os gates à mão antes de commitar; `bun run build` antes de pushar).
   - Mudou algo visível? Rodar `bun run dev` e validar com a skill **agent-browser** (screenshot + console sem erros). Usar os query params de debug (`?skipMenu=1&hero=jack&round=5&seed=1&debug=1`).
5. Atualizar o **`PLAN.md`**: `[x]` feito · `[~]` incompleto ou bloqueado (dizer o motivo em uma linha) · `[ ]` pendente.
6. Registrar mudanças relevantes em `[Unreleased]` do **`CHANGELOG.md`** (Keep a Changelog 1.1.0).
7. Se mudou números, atualizar `docs/balancing.md`. Se tomou uma decisão de design, registrar em `docs/decisions.md`.
8. **Micro-commits em Conventional Commits** durante o trabalho. Ao fechar cada **seção** do PLAN (0.1, 1.1, …): `docs(plan)` → bump SemVer + `chore(release): X.Y.Z` + tag → `git push origin main --follow-tags`. Detalhes em [git-and-versioning.md](git-and-versioning.md). O usuário autorizou os commits e pushes desse fluxo.

## Convenções de código

- **Bun** é o runtime e o gerenciador de pacotes (`bun add`, `bun run`, `bunx`). node/npm só quando uma ferramenta não suportar Bun (registrar o motivo).
- TypeScript strict; nada de `any` sem comentário justificando.
- Formatação e lint: **Biome v2**, TAB com largura 4 (`bun run check:fix`). Sem ESLint e sem Prettier.
- Nomes em inglês; arquivos em `PascalCase.ts` para classes/cenas e `kebab-case.ts` para módulos.
- Nenhum número mágico de gameplay fora de `src/data` ou `src/config/constants.ts`.
- Nenhum texto de UI fora de `src/i18n/` (EN + PT-BR, sempre os dois).
- Nenhuma cor fora de `src/config/palette.ts`.
- Nenhuma textura, animação ou som sem chave registrada em `src/art/manifest.ts`.
- Phaser **4**: confira a API nas skills (`.claude/skills/<nome>/SKILL.md`) antes de copiar exemplos da web.

## Definição de pronto (DoD) de uma microtarefa

- Funciona no Chrome em tela cheia, sem scroll, sem erros no console.
- Lógica nova coberta por teste `bun:test` (quando for lógica pura).
- PLAN.md e CHANGELOG.md atualizados; commits em Conventional Commits; gates passando (sem `--no-verify`).
- Asset novo: chave no manifest, prompt registrado em `docs/art-prompts.md` (ou log do ElevenLabs).

## Prompts prontos

- **Continuar o desenvolvimento**: "Leia CLAUDE.md e PLAN.md. Execute a próxima microtarefa pendente, verifique com testes e agent-browser, e atualize o PLAN.md e o changelog."
- **Balancear**: "Rode a simulação headless (`src/logic/sim`) para os 3 heróis nos rounds 1–30 e compare com as metas de `docs/balancing.md` §9."
- **QA visual**: "Use agent-browser em `?skipMenu=1&hero=bob&round=10&seed=1&debug=1`, jogue 30 s com WASD e reporte FPS, erros e screenshots."
- **Gerar asset**: "Siga a skill `pinguin-art-assets` para gerar <asset>; confira `GET /balance` antes."
