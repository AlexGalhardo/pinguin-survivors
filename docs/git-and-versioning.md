# Git, commits e versionamento

Remoto: `origin` → `git@github.com:AlexGalhardo/pinguin-survivors.git` · branch principal: **`main`** (Pinguin Survivors).
Branch **`starfall-survivors-legacy`**: histórico completo do jogo anterior (Starfall Survivors, até `v1.0.0-rc.1`). Não commitar nela.

## Conventional Commits 1.0.0 (obrigatório)

Especificação: <https://www.conventionalcommits.org/en/v1.0.0/>. Config do commitlint em `commitlint.config.js` (`@commitlint/config-conventional`). Os hooks estão vazios por escolha do usuário, então valide você mesmo: `echo "<msg>" | bunx commitlint`.

```
<type>(<scope opcional>)<! opcional>: <descrição>

[corpo opcional]

[rodapé(s) opcional(is)]
```

- **Descrição** em inglês, no imperativo, começando com letra minúscula, sem ponto final, com até ~72 caracteres. Ex.: `feat(combat): add energy blade arc attack`.
- **Tipos**: `feat` (nova funcionalidade → MINOR) · `fix` (correção → PATCH) · `docs` · `style` (formatação) · `refactor` · `perf` · `test` · `build` (deps, Vite, Biome, Husky) · `ci` · `chore` · `revert`.
- **Breaking change**: `!` depois do tipo/escopo **e/ou** o rodapé `BREAKING CHANGE: <descrição>` → MAJOR.
- **Escopos sugeridos**: `core`, `config`, `iso`, `world`, `gore`, `light`, `scene`, `hero`, `enemy`, `boss`, `combat`, `weapons`, `round`, `cards`, `potions`, `progression`, `meta`, `hud`, `ui`, `i18n`, `audio`, `art`, `save`, `debug`, `balance`, `plan`, `deps`, `release`.
- **Micro-commits**: um commit por mudança lógica (ex.: lógica + teste juntos, ou config de uma ferramenta). Nada de commit "WIP" gigante.

## SemVer 2.0.0 (obrigatório)

Especificação: <https://semver.org/lang/pt-BR/>. A versão fica em `package.json` e cada versão publicada ganha uma **tag git anotada** `vX.Y.Z[-pre]`.

**API pública declarada** (exigência do SemVer): o **formato dos dados salvos** (localStorage) e a **jogabilidade oferecida** (personagens, modos e conteúdo existentes).

| Momento | Versão | Regra |
|---|---|---|
| Refundação (fase 0) | `0.1.0-alpha.1` | Primeira versão do Pinguin Survivors (o Starfall vive na branch legacy) |
| Fases 1–2 (ALPHA) | `0.1.0-alpha.N` | N sobe (+1) a cada seção do PLAN concluída |
| Fases 3–6 (BETA) | `0.1.0-beta.N` | N sobe a cada seção concluída |
| Release candidate | `1.0.0-rc.N` | Congelamento, só correções |
| Lançamento | `1.0.0` | Primeira versão estável do Pinguin Survivors |
| Depois do 1.0 | `MAJOR.MINOR.PATCH` | MAJOR: save incompatível sem migração, ou remoção de conteúdo/modo · MINOR: conteúdo ou funcionalidade nova compatível · PATCH: correções e ajustes de balanceamento |

Precedência válida: `0.1.0-alpha.1 < … < 0.1.0-beta.1 < … < 1.0.0-rc.1 < 1.0.0`.
Uma versão publicada **nunca** é alterada. Qualquer mudança gera uma nova versão.

## Gates (Husky)

Os arquivos `.husky/*` estão **vazios por escolha do usuário** (commit `5b8f23a`). Não os restaure sem pedido. Rode os gates manualmente:

| Momento | Comandos |
|---|---|
| Antes de commitar | `bun run check` → `bun run typecheck` → `bun test` |
| Antes de pushar | `bunx biome ci .` → `bun run typecheck` → `bun test` → `bun run build` |

Nunca use `--no-verify`. Se um gate falhar, corrija a causa.

## CHANGELOG.md (Keep a Changelog 1.1.0)

`CHANGELOG.md` na raiz segue **estritamente** <https://keepachangelog.com/en/1.1.0/>: seção `[Unreleased]` no topo; uma seção por versão (`## [X.Y.Z] - AAAA-MM-DD`, mais nova primeiro); grupos só `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`; frases para humanos (em inglês), sem hashes de commit; links de comparação no fim. Registre mudanças relevantes em `[Unreleased]` durante o trabalho e mova-as para a nova versão no commit `chore(release)`.

## Push

**Push para o `origin/main` logo após cada commit** (pedido do usuário, P-48), depois de rodar os gates.

## Fluxo ao concluir uma seção do PLAN (0.1, 1.1, 1.2, …)

1. Micro-commits durante o trabalho (`feat(...)`, `test(...)`, `build(...)`…).
2. Marcar `[x]` no PLAN.md → `docs(plan): complete <seção>`.
3. Subir a versão no `package.json` (`bun pm version <versão> --no-git-tag-version` ou manualmente) conforme a tabela acima e mover `[Unreleased]` do `CHANGELOG.md` para `## [<versão>] - <data>` (+ links) → `chore(release): <versão>` + `git tag -a v<versão> -m "<versão>"`.
4. `git push origin main --follow-tags`.

## Estilo de código

- **Biome v2** é o linter e o formatter (sem ESLint e sem Prettier). Config em `biome.json`.
- Indentação com **TAB**, largura **4** (`.editorconfig` + Biome), LF, UTF-8. Exceção: YAML usa espaços, porque a especificação proíbe tabs.
- `bun run check` (verifica) · `bun run check:fix` (corrige/formata).

## Trabalho paralelo e branch `dev` (P-58)

- Frentes: `wt/balance`, `wt/assets` (worktrees) e `wt/systems` (checkout principal). Ninguém faz checkout de `dev` nem de `main` nos worktrees.
- Integração em `dev`, sempre fast-forward: `git fetch origin && git rebase origin/dev` → gates completos (`bunx biome ci .`, `bun run typecheck`, `bun test`, `bun run build`) → `git push origin HEAD:dev` (se recusar por não ser fast-forward, rebase de novo e repita).
- Posse de arquivos para evitar conflitos: balance = `src/data/`, `src/logic/sim/`, `scripts/sim.ts`, `scripts/playtest-bot.ts`, `docs/balancing.md`; assets = `art-src/`, `public/assets/`, `scripts/pl-*`/`pack-*`, `docs/art-prompts.md`, `docs/art-and-assets.md`, entradas novas em `src/art/manifest.ts`; systems = o resto. Arquivos compartilhados (`PLAN.md`, `CHANGELOG.md`, `docs/decisions.md`) só recebem edições pequenas e localizadas; em conflito, mantenha as duas versões.
- Promoção `dev` → `main` (linha principal): gates completos em `dev` → `git push origin origin/dev:main` (fast-forward) com as tags de release.
