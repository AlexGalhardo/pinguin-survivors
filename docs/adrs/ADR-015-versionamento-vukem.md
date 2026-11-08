# ADR-015 — Versionamento padrão vukem e retag do histórico

**Data** 2026-11-08 · **Status** Aceito · **Decisão de origem** B-28, B-29 · **Supera** P-03, P-46 (`0.1.0-alpha.N`)

## Contexto

Tags atuais: `v0.1.0-alpha.1…v0.1.0-alpha.2`, `v0.1.0-beta.1…v0.1.0-beta.8` (Pinguin) e `v1.0.0-alpha.3…v1.0.0-rc.1` + `pinguin-survivors-final` (Starfall, legado). Nenhum release no GitHub. O desenvolvedor quer o padrão de <https://github.com/AlexGalhardo/vukem/releases>: tag `vX.Y.Z` sem sufixo, release com o mesmo nome e corpo em grupos Keep a Changelog (`### Added`, `### Changed`, `### Fixed`…) com **escopo em negrito** e **link do commit**.

## Decisão

- **SemVer sem pré-release**: `0.0.x` = fase alpha, `0.1.x` = fase beta, **`1.0.0` = lançamento comercial**; depois `MAJOR.MINOR.PATCH` normal. `package.json` e tag sempre iguais.
- **Release = tag**: título `vX.Y.Z`; corpo gerado de `CHANGELOG.md` + `git log` (`- **escopo:** Descrição ([abc1234](link))`). Releases `0.x` marcados como **pre-release** no GitHub.
- **Retag**: as 11 tags Pinguin viram `v0.0.1…v0.0.11` nos mesmos commits; as antigas são apagadas local e remotamente; releases retroativos criados com o corpo derivado do CHANGELOG. Próxima versão de trabalho: `0.0.12`.
- Tags do Starfall (`v1.0.0-*`, `v0.1.0`, `pinguin-survivors-final`) **apagadas** local e remotamente em 2026-11-08 a pedido do desenvolvedor: o repositório fica com exatamente uma tag por release (10). Os commits continuam na branch `starfall-survivors-legacy`.
- Script `scripts/release.ts`: valida gates, bump, atualiza CHANGELOG, cria tag anotada, `gh release create`.

## Alternativas

- Continuar `0.2.0-alpha.N`: incompatível com o padrão pedido. Rejeitada.
- Manter tags antigas e misturar padrões: rejeitada.

## Consequências

- `docs/workflow.md` §6 reescrito; `CHANGELOG.md` renomeia as seções `[0.1.0-beta.N]` para `[0.0.N]`.
- Apagar tags publicadas é destrutivo: feito uma única vez, registrado aqui, com a lista de mapeamento antigo→novo no CHANGELOG.
