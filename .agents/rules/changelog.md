# CHANGELOG

- `CHANGELOG.md` na raiz segue **Keep a Changelog 1.1.0**: `## [Unreleased]` no topo; uma seção `## [X.Y.Z] - AAAA-MM-DD` por versão, mais nova primeiro; grupos só `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`; links de comparação no fim.
- Frases para humanos, em inglês, descrevendo o efeito para o jogador ou para quem desenvolve; sem hashes de commit no CHANGELOG (os links de commit ficam no corpo do GitHub Release).
- Registre em `[Unreleased]` no mesmo commit da mudança relevante (feature, correção visível, balanceamento, remoção, mudança de convenção). Ajustes internos triviais não entram.
- Balanceamento: linha em `### Changed` começando com "Balance:" e apontando o relatório em `docs/reports/`.
- O script `bun scripts/release.ts` move `[Unreleased]` para a versão e atualiza os links; não faça isso à mão.
- Uma versão publicada nunca é editada; correção vira nova versão.
