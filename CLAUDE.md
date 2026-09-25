# Starfall Survivors — CLAUDE.md

Browser game 2D, top-down arena shooter roguelite (Brotato + Vampire Survivors), pixel art 32px, tema sci-fi.
Stack: TypeScript + Vite + **Phaser 4.2.x** (Arcade Physics) + jsfxr, rodando em **Bun 1.4.2** (testes com `bun:test`). UI do jogo em **inglês**; docs em PT-BR.

## Comece aqui (toda sessão)

1. Leia **[PLAN.md](PLAN.md)**: fases, microtarefas `[ ]`/`[x]`/`[~]` e changelog. É a fonte da verdade do que fazer.
2. Siga o protocolo em [docs/agent-workflow.md](docs/agent-workflow.md).
3. Consulte o doc relevante antes de codar:
   - Design do jogo → [docs/game-design.md](docs/game-design.md)
   - Números e fórmulas → [docs/balancing.md](docs/balancing.md)
   - Arquitetura e pastas → [docs/architecture.md](docs/architecture.md)
   - Arte e assets → [docs/art-and-assets.md](docs/art-and-assets.md) · histórico de prompts → [docs/art-prompts.md](docs/art-prompts.md)
   - Plataformas de publicação → [docs/game-market.md](docs/game-market.md)
   - Áudio → [docs/audio.md](docs/audio.md) · UI/HUD → [docs/ui-hud.md](docs/ui-hud.md)
   - Decisões do usuário → [docs/decisions.md](docs/decisions.md) · Ferramentas → [docs/tooling.md](docs/tooling.md)
   - Commits, versões e hooks → [docs/git-and-versioning.md](docs/git-and-versioning.md)

## Comandos

```
bun install        # dependências (Bun no lugar de npm/node)
bun run dev        # servidor Vite (via Bun)
bun run build      # build de produção (dist/)
bun test           # bun:test (lógica pura)
bun run typecheck  # tsc --noEmit
bun run check      # Biome (lint + format); check:fix corrige
bun scripts/qa-browsers.ts  # QA do build (Chrome/Edge/Firefox) com `vite preview --port 4173` rodando
```

## Regras essenciais

- **Phaser 4, não 3.** Use as skills Phaser em `.claude/skills/` antes de confiar em exemplos da web.
- Lógica pura (fórmulas, sorteios, stats, loja) em `src/logic/`, sem importar Phaser, e com teste `bun:test`.
- Números de gameplay só em `src/data/` (espelhados em docs/balancing.md). Textos em `src/config/strings.ts`. Cores em `src/config/palette.ts` (Endesga 32).
- Toda textura/som tem chave em `src/art/manifest.ts`. Placeholders (código/canvas) e assets finais usam a mesma chave.
- Tela cheia sem scroll, zoom inteiro, `pixelArt: true`. Nada de escala fracionária.
- Object pooling para inimigos, projéteis, pickups e números de dano. Meta: 60 FPS com 300 inimigos.
- Verifique mudanças visíveis com a skill **agent-browser** (`?skipMenu=1&char=warrior&wave=5&seed=1&debug=1`).
- Ao terminar: marque o checklist no PLAN.md e adicione 1–3 linhas curtas no Changelog.
- Não use o Phaser MCP (Game Agent). Arte por IA: **Retro Diffusion** é a ferramenta padrão (`scripts/rd-generate.ts` → `rd-slice.ts` → `pack-atlas.ts`); siga a skill **`starfall-art-assets`** e registre todo prompt em [docs/art-prompts.md](docs/art-prompts.md). Higgsfield adiado.
- **Conventional Commits 1.0.0** e **SemVer 2.0.0** obrigatórios. Micro-commits; ao concluir cada seção do PLAN:
  `docs(plan)` → `chore(release): X.Y.Z` + tag → `git push origin main --follow-tags`. Nunca `--no-verify`.
- **Bun** no lugar de npm/node (`bun`, `bunx`); node/npm só se uma ferramenta não suportar Bun.
- Estilo: **Biome v2**, TAB com largura 4 (.editorconfig). Sem ESLint/Prettier.

## Skills úteis

Phaser 4 (28, ex.: `physics-arcade`, `scenes`, `scale-and-responsive`, `particles`), `agent-browser` (QA),
`starfall-art-assets` (gerar/trocar arte com IA), `canvas-design` (key art/logo), `graphify` (mapa do código), `find-skills`, `grilling` (entrevistar o usuário).
