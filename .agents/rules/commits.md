# Commits, versões e releases

- **Conventional Commits 1.0.0**, em inglês, imperativo, minúscula, sem ponto final, ≤ 72 caracteres: `feat(shop): add reroll price curve`. Valide com `echo "<msg>" | bunx commitlint`.
- Tipos: `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `ci`, `chore`, `style`, `revert`. `!` ou `BREAKING CHANGE:` para quebra.
- Escopos: `arena`, `weapons`, `shop`, `cards`, `economy`, `danger`, `ui`, `hud`, `i18n`, `save`, `platform`, `desktop`, `mobile`, `site`, `art`, `audio`, `balance`, `sim`, `demo`, `release`, `docs`, `deps`.
- Micro-commits: um por mudança lógica (lógica + teste juntos). Nada de "WIP".
- Gates antes de commitar: `bun run lint`, `bun run typecheck`, `bun test`. Antes de pushar: `bun run lint`, `typecheck`, `test`, `bun run build`. Nunca `--no-verify` (hooks Husky vazios por escolha do desenvolvedor).
- **Push após cada commit** para `origin/main`.
- **Versionamento padrão vukem** (ADR-015): SemVer sem sufixos; `0.0.x` alpha, `0.1.x` beta, `1.0.0` lançamento. `package.json.version` = tag sem `v`. Exatamente **uma tag por release**.
- Release só pelo script: `bun scripts/release.ts X.Y.Z` (gates, bump, CHANGELOG, commit `chore(release): X.Y.Z`, tag anotada, push, GitHub Release com grupos Keep a Changelog e links de commit; `0.x` como pre-release). Dry run: `--dry-run`.
- Branches: `main` é a principal; `legacy-voices` e `starfall-survivors-legacy` são históricas (não commitar nelas).
