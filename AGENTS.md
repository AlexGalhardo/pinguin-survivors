# AGENTS.md — Starfall Survivors

Instruções para qualquer agente de código (Claude Code, Codex, Cursor, Gemini, etc.).

**Projeto:** jogo 2D para browser, top-down arena shooter roguelite (inspirado em Brotato e Vampire Survivors).
Pixel art 32px, tema sci-fi retrô, tela cheia. Ondas infinitas → 3 cartas de upgrade → loja → próxima onda.
**Stack:** TypeScript · Vite · Phaser 4.2.x (Arcade Physics) · jsfxr · **Bun 1.4.2** (runtime/pacotes, testes `bun:test`). UI em inglês; docs em PT-BR.

## Fonte da verdade

- **[PLAN.md](PLAN.md)**: fases (Alpha → Beta → 1.0), microtarefas com checklist e changelog. Leia primeiro, sempre.
- **[docs/README.md](docs/README.md)**: índice da documentação.

| Preciso de… | Leia |
|---|---|
| Como trabalhar numa sessão | [docs/agent-workflow.md](docs/agent-workflow.md) |
| Regras do jogo, classes, cartas, inimigos | [docs/game-design.md](docs/game-design.md) |
| Fórmulas e números | [docs/balancing.md](docs/balancing.md) |
| Estrutura do código e padrões | [docs/architecture.md](docs/architecture.md) |
| Pixel art, paleta, pipeline Higgsfield | [docs/art-and-assets.md](docs/art-and-assets.md) |
| Sons | [docs/audio.md](docs/audio.md) |
| Telas e HUD | [docs/ui-hud.md](docs/ui-hud.md) |
| Por que algo foi decidido | [docs/decisions.md](docs/decisions.md) |
| Skills, MCPs, libs | [docs/tooling.md](docs/tooling.md) · [docs/research.md](docs/research.md) |
| Commits, SemVer, hooks, push | [docs/git-and-versioning.md](docs/git-and-versioning.md) |

## Comandos

`bun install` · `bun run dev` · `bun run build` · `bun test` · `bun run typecheck` · `bun run check` (Biome). Use Bun, não npm/node (exceto se a ferramenta não suportar Bun).

## Regras

1. Faça microtarefas na ordem do PLAN.md. Ao concluir: `[x]` + 1–3 linhas no Changelog. Bloqueado: `[~]` + motivo.
2. Phaser **4** (a API mudou em relação ao v3). Skills de referência em `.claude/skills/`.
3. Regras de jogo em `src/logic/` (TS puro, testado); números em `src/data/`; textos em `src/config/strings.ts`;
   cores em `src/config/palette.ts`; chaves de assets em `src/art/manifest.ts`.
4. Alpha/Beta: arte 100% gerada por código (canvas). Assets finais (Higgsfield) só no 1.0, com as mesmas chaves.
5. Tela cheia sem scroll, zoom inteiro, pixel-perfect. Pooling de objetos. Meta: 60 FPS com 300 inimigos.
6. Valide visualmente no browser (agent-browser) com os query params de debug descritos em architecture.md.
7. Mudou um número? Atualize docs/balancing.md. Tomou uma decisão de design? Registre em docs/decisions.md.
8. Commits em **Conventional Commits 1.0.0** (commitlint bloqueia fora do padrão); versões em **SemVer 2.0.0**.
9. Micro-commits; ao fechar cada seção do PLAN: `docs(plan)` → `chore(release): X.Y.Z` + tag → push para `main`.
10. Código formatado pelo **Biome v2** com TAB de largura 4. Hooks Husky nunca são pulados (`--no-verify` proibido).
