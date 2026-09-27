# Git, commits e versionamento

Remoto: `origin` → `git@github.com:AlexGalhardo/starfall-survivors-game.git` · branch principal: **`main`**.

## Conventional Commits 1.0.0 (obrigatório)

Especificação: <https://www.conventionalcommits.org/en/v1.0.0/>. Validado pelo hook `commit-msg` (commitlint + `@commitlint/config-conventional`). Um commit fora do padrão é **rejeitado**.

```
<type>(<scope opcional>)<! opcional>: <descrição>

[corpo opcional]

[rodapé(s) opcional(is)]
```

- **Descrição** em inglês, no imperativo, começando com letra minúscula, sem ponto final, com até ~72 caracteres. Ex.: `feat(combat): add energy blade arc attack`.
- **Tipos**: `feat` (nova funcionalidade → MINOR) · `fix` (correção → PATCH) · `docs` · `style` (formatação) · `refactor` · `perf` · `test` · `build` (deps, Vite, Biome, Husky) · `ci` · `chore` · `revert`.
- **Breaking change**: `!` depois do tipo/escopo **e/ou** o rodapé `BREAKING CHANGE: <descrição>` → MAJOR.
- **Escopos sugeridos**: `core`, `config`, `scene`, `player`, `enemy`, `combat`, `wave`, `cards`, `abilities`, `items`, `economy`, `hud`, `ui`, `audio`, `art`, `save`, `debug`, `balance`, `plan`, `deps`, `release`.
- **Micro-commits**: um commit por mudança lógica (ex.: lógica + teste juntos, ou config de uma ferramenta). Nada de commit "WIP" gigante.

## SemVer 2.0.0 (obrigatório)

Especificação: <https://semver.org/lang/pt-BR/>. A versão fica em `package.json` e cada versão publicada ganha uma **tag git anotada** `vX.Y.Z[-pre]`.

**API pública declarada** (exigência do SemVer): o **formato dos dados salvos** (localStorage) e a **jogabilidade oferecida** (personagens, modos e conteúdo existentes).

| Momento | Versão | Regra |
|---|---|---|
| Fase 0 (setup) concluída | `0.1.0` | Desenvolvimento inicial (0.y.z) |
| Fase 1 — ALPHA | `1.0.0-alpha.N` | N sobe (+1) a cada seção do PLAN concluída (1.1, 1.2, …) |
| Fase 2 — BETA | `1.0.0-beta.N` | N sobe a cada seção concluída |
| Release candidate (opcional) | `1.0.0-rc.N` | Congelamento de funcionalidades, só correções |
| Lançamento | `1.0.0` | Primeira versão estável |
| Depois do 1.0 | `MAJOR.MINOR.PATCH` | MAJOR: save incompatível sem migração, ou remoção de conteúdo/modo · MINOR: conteúdo ou funcionalidade nova compatível · PATCH: correções e ajustes de balanceamento |

Precedência válida: `0.1.0 < 1.0.0-alpha.1 < … < 1.0.0-beta.1 < … < 1.0.0-rc.1 < 1.0.0`.
Uma versão publicada **nunca** é alterada. Qualquer mudança gera uma nova versão.

## Hooks (Husky)

| Hook | O que roda | Objetivo |
|---|---|---|
| `pre-commit` | `bunx biome check --staged` (lint + format + imports) → `bun run typecheck` → `bun test` | Nada entra quebrado ou sem formatação |
| `commit-msg` | `bunx commitlint --edit` | Mensagem em Conventional Commits |
| `pre-push` | `bunx biome ci .` → `bun run typecheck` → `bun test` → `bun run build` | O que vai para o `main` compila, passa nos testes e gera build |

Nunca use `--no-verify`. Se um hook falhar, corrija a causa.

## Fluxo ao concluir uma seção do PLAN (0.2, 1.1, 1.2, …)

1. Micro-commits durante o trabalho (`feat(...)`, `test(...)`, `build(...)`…).
2. Marcar `[x]` no PLAN.md + linha no Changelog → `docs(plan): complete <seção>`.
3. Subir a versão no `package.json` (`bun pm version <versão> --no-git-tag-version` ou manualmente) conforme a tabela acima → `chore(release): <versão>` + `git tag -a v<versão> -m "<versão>"`.
4. `git push origin main --follow-tags`.

## Estilo de código

- **Biome v2** é o linter e o formatter (sem ESLint e sem Prettier). Config em `biome.json`.
- Indentação com **TAB**, largura **4** (`.editorconfig` + Biome), LF, UTF-8. Exceção: YAML usa espaços, porque a especificação proíbe tabs.
- `bun run check` (verifica) · `bun run check:fix` (corrige/formata).
