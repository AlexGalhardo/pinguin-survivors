# AGENTS.md — Pinguin Survivors

Instruções para qualquer agente de código (Claude Code, Codex, Cursor, Gemini, etc.).

**Projeto:** endless roguelite para browser em **pixel art 2.5D isométrica 2:1** (layout Diablo 2, clima Diablo 4), inspirado em Brotato. Jack (melee), Bob (fogo) e Lucia (magia) — os 3 últimos pinguins de um apocalipse zumbi, cada um com perfil de stats, 6 cartas exclusivas e superpoder próprio (game-design §5). Rounds cronometrados → 3 cartas → próximo round; boss a cada 10; level 1–100 persistente; gore estilo DOOM.
**Stack:** TypeScript · Vite · Phaser 4.2.x (sem engine de física; simulação em mundo cartesiano + projeção iso) · **Bun 1.4.2** (`bun:test`). Arte **PixelLab**, áudio **ElevenLabs**. UI EN + PT-BR; docs em PT-BR.
**Legado:** o jogo anterior (Starfall Survivors) está na branch `starfall-survivors-legacy`.

## Fonte da verdade

- **[PLAN.md](PLAN.md)**: fases 0–7, microtarefas com checklist, changelog, pendências do usuário. Leia primeiro, sempre.
- **[docs/README.md](docs/README.md)**: índice da documentação.

| Preciso de… | Leia |
|---|---|
| Como trabalhar numa sessão | [docs/agent-workflow.md](docs/agent-workflow.md) |
| Regras do jogo, heróis, cartas, poções, inimigos | [docs/game-design.md](docs/game-design.md) |
| Fórmulas e números | [docs/balancing.md](docs/balancing.md) |
| Projeção iso, pastas, padrões, gore, luz | [docs/architecture.md](docs/architecture.md) |
| Arte e pipeline PixelLab | [docs/art-and-assets.md](docs/art-and-assets.md) · [docs/art-prompts.md](docs/art-prompts.md) · skill `.claude/skills/pinguin-art-assets` |
| Áudio e pipeline ElevenLabs | [docs/audio.md](docs/audio.md) · skill `.claude/skills/pinguin-audio-assets` |
| Telas e HUD | [docs/ui-hud.md](docs/ui-hud.md) |
| Por que algo foi decidido | [docs/decisions.md](docs/decisions.md) |
| Skills, APIs, libs, scripts | [docs/tooling.md](docs/tooling.md) |
| Commits, SemVer, branches | [docs/git-and-versioning.md](docs/git-and-versioning.md) |
| Onde publicar | [docs/game-market.md](docs/game-market.md) |

## Comandos

`bun install` · `bun run dev` · `bun run build` · `bun test` · `bun run typecheck` · `bun run check` (Biome) · `bun scripts/pl-concepts.ts` (PixelLab) · `bun scripts/pack-atlas.ts` · `bun scripts/qa-browsers.ts`. Use Bun, não npm/node.

## Regras

1. Microtarefas na ordem do PLAN.md. Ao concluir: `[x]` + 1–3 linhas no Changelog. Bloqueado: `[~]` + motivo.
2. Phaser **4** (API diferente do v3). Skills de referência em `.claude/skills/`.
3. Mundo simulado em coordenadas cartesianas; a tela é projeção iso 2:1 (`docs/architecture.md`). Sem Arcade Physics.
4. Regras em `src/logic/` (TS puro, testado); números em `src/data/`; textos em `src/i18n/` (EN + PT-BR juntos); cores em `src/config/palette.ts`; chaves de assets em `src/art/manifest.ts`.
5. Arte só pelo PixelLab, com **aprovação do usuário do concept antes de animar**; 8 direções; ≥ 12 frames; prompts em `docs/art-prompts.md`. Áudio pelo ElevenLabs.
6. Tela cheia sem scroll, zoom inteiro pela altura (540 lógicos). Pooling. Meta: 60 FPS com 300 inimigos.
7. Valide visualmente no browser (agent-browser) com os query params de debug.
8. Segredos só no `.env`. `TODO.md` é local e ignorado pelo git.
9. Conventional Commits 1.0.0 + SemVer 2.0.0; gates manuais (hooks Husky vazios por escolha do usuário); nunca `--no-verify`.
