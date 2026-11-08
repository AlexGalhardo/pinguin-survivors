# SDD-011 — Versionamento padrão vukem, retag e releases no GitHub

**Versão** 1.1 · **Data** 2026-11-08 · **Status** Aprovada · **ADR** [015](../adrs/ADR-015-versionamento-vukem.md) · **Processo** [../workflow.md](../workflow.md)

## Requisitos

- RF-01 Versões SemVer **sem pré-release**: `0.0.x` (alpha), `0.1.x` (beta), `1.0.0` (lançamento), depois `MAJOR.MINOR.PATCH`. `package.json.version` = tag sem `v`.
- RF-02 Release GitHub por tag: título `vX.Y.Z`, corpo com grupos Keep a Changelog na ordem `Added, Changed, Deprecated, Removed, Fixed, Security`; cada linha `- **escopo:** Descrição ([abc1234](https://github.com/AlexGalhardo/pinguin-survivors/commit/<sha>))`; sem seção vazia. Releases `0.0.x` e `0.1.x` com `--prerelease`; a partir de `0.2.0` (decisão do desenvolvedor, 2026-11-08) as releases saem como **Latest** (`bun scripts/release.ts X.Y.Z --stable`).
- RF-03 `CHANGELOG.md` (Keep a Changelog 1.1.0) continua a fonte do texto; as linhas do release vêm do CHANGELOG quando existirem e do `git log --format` entre tags para o link do commit (escopo = escopo do Conventional Commit; linha sem escopo usa `**repo:**`).
- RF-04 **Retag único** (destrutivo, registrado): mapear `v0.1.0-alpha.1→v0.0.1`, `v0.1.0-alpha.2→v0.0.2`, `v0.1.0-beta.1…8→v0.0.3…v0.0.10`; a 11ª (`v0.0.11`) só se existir um commit de release não tagueado entre `beta.8` e `HEAD` (hoje não: `6980b99` é chore). Logo: **10 releases retroativos** `v0.0.1…v0.0.10`; a versão de trabalho passa a `0.0.11`. Apagar as tags antigas local e no origin após criar as novas. Tags do Starfall (`v1.0.0-*`, `v0.1.0`, `pinguin-survivors-final`) também apagadas (pedido do desenvolvedor em 2026-11-08): exatamente uma tag por release.
- RF-05 `scripts/release.ts <version>`: valida árvore limpa e gates (`lint`, `typecheck`, `test`, `build`), atualiza `package.json`, move `[Unreleased]` para `[X.Y.Z] - data` com links de comparação, commit `chore(release): X.Y.Z`, tag anotada `vX.Y.Z`, `git push --follow-tags`, `gh release create` com o corpo gerado (`--prerelease` se `< 1.0.0`).
- RF-06 `scripts/release-backfill.ts`: gera os releases retroativos a partir do CHANGELOG renomeado e das novas tags (idempotente: pula release existente).

## Critérios de aceite

| # | Assert | Verificação |
|---|---|---|
| A1 | `git tag -l 'v0.1.0-*'` vazio local e em `git ls-remote --tags origin`; `git tag -l 'v0.0.*'` lista 10 tags apontando para os mesmos SHAs das antigas (tabela no CHANGELOG) | shell |
| A2 | `gh release list` mostra `v0.0.1…v0.0.10` como Pre-release, títulos iguais às tags | gh |
| A3 | Corpo de `v0.0.10` começa com `### Changed` e cada linha tem link de commit válido (HTTP 200) | `gh release view v0.0.10` |
| A4 | `package.json.version === '0.0.11'` e `CHANGELOG.md` tem `## [Unreleased]` seguido de `## [0.0.10] - 2026-09-27` | arquivos |
| A5 | `bun scripts/release.ts --dry-run 0.0.12` imprime o corpo e não altera nada | script |
