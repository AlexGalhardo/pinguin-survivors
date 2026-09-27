# Pinguin Survivors — CLAUDE.md

Endless roguelite frenético em **pixel art 2.5D isométrica 2:1** (layout Diablo 2, clima escuro Diablo 4), inspirado em Brotato. Três pinguins sobreviventes de um apocalipse zumbi: Jack (melee), Bob (fogo), Lucia (magia) — cada um com perfil de stats, 6 cartas exclusivas e um superpoder (level 5, Espaço). Gore nível DOOM.
Stack: TypeScript + Vite + **Phaser 4.2.x** (sem Arcade: simulação própria em mundo cartesiano + projeção iso) sobre **Bun 1.4.2** (testes `bun:test`). Arte **PixelLab**, áudio **ElevenLabs**. UI **EN + PT-BR**; docs em PT-BR.
O jogo anterior (Starfall Survivors) vive na branch `starfall-survivors-legacy` — não use nada de lá sem pedido.

## Comece aqui (toda sessão)

1. Leia **[PLAN.md](PLAN.md)**: fases, microtarefas `[ ]`/`[x]`/`[~]`, changelog e pendências do usuário. É a fonte da verdade.
2. Siga o protocolo em [docs/agent-workflow.md](docs/agent-workflow.md).
3. Consulte o doc relevante antes de codar:
   - Design → [docs/game-design.md](docs/game-design.md) · Números → [docs/balancing.md](docs/balancing.md)
   - Arquitetura, projeção iso, pastas → [docs/architecture.md](docs/architecture.md)
   - Arte (PixelLab) → [docs/art-and-assets.md](docs/art-and-assets.md) · prompts → [docs/art-prompts.md](docs/art-prompts.md)
   - Áudio (ElevenLabs) → [docs/audio.md](docs/audio.md) · UI/HUD → [docs/ui-hud.md](docs/ui-hud.md)
   - Decisões do usuário → [docs/decisions.md](docs/decisions.md) · Ferramentas → [docs/tooling.md](docs/tooling.md)
   - Commits, versões, branches → [docs/git-and-versioning.md](docs/git-and-versioning.md)

## Comandos

```
bun install        # dependências (Bun no lugar de npm/node)
bun run dev        # servidor Vite
bun run build      # build de produção (dist/)
bun test           # bun:test (lógica pura)
bun run typecheck  # tsc --noEmit
bun run check      # Biome (lint + format); check:fix corrige
bun scripts/pl-concepts.ts           # concepts de heróis no PixelLab (+ sheet.png)
bun scripts/pack-atlas.ts            # art-src/processed → public/assets/atlas
bun scripts/qa-browsers.ts           # QA do build (com `vite preview --port 4173` rodando)
```

## Regras essenciais

- **Phaser 4, não 3.** Use as skills Phaser em `.claude/skills/` antes de confiar em exemplos da web.
- **Simulação em mundo cartesiano, render em iso** (`screenX = x−y`, `screenY = (x+y)/2 − z`, depth `x+y`). Nada de Arcade Physics.
- Lógica pura (fórmulas, sorteios, stats, rounds, cartas, poções, progressão, chunks, iso) em `src/logic/`, sem importar Phaser, com teste `bun:test`.
- Números de gameplay só em `src/data/` (espelhados em docs/balancing.md). Textos só em `src/i18n/` (**EN e PT-BR sempre juntos**). Cores em `src/config/palette.ts`.
- Toda textura/animação/som tem chave em `src/art/manifest.ts`; placeholders por código e assets finais usam a mesma chave.
- Tela cheia sem scroll, **zoom inteiro pela altura** (altura lógica 540; 2560×1080 → ×2), `pixelArt: true`.
- Object pooling para inimigos, projéteis, pickups, gibs, decalques e números. Meta: 60 FPS com 300 inimigos + 2.000 decalques.
- Verifique mudanças visíveis com **agent-browser** (`?skipMenu=1&hero=jack&round=5&seed=1&debug=1`).
- **Assets só no fim da Fase 7 (P-57):** até lá, nada de gerar arte/áudio novos; sistemas usam placeholders por código com as chaves do manifest.
- **Arte: PixelLab** (skill `pinguin-art-assets`). Todo personagem novo passa por **concept → aprovação do usuário → animação**. Vista `low top-down`, 8 direções (**5 geradas + 3 espelhadas**); animações **`template`** (1 geração/direção). **Ataques estilo Brotato (P-56):** herói animado **sem arma**; a arma é um sprite separado animado por código, e cada tier é só uma nova imagem de arma. Registre prompts em docs/art-prompts.md. `GET /balance` antes de lotes.
- **Áudio: ElevenLabs** (skill `pinguin-audio-assets`).
- Chaves (`PIXELLAB_API_TOKEN`, `ELEVENLABS_API_KEY`) **só no `.env`**; `TODO.md` é local (gitignored).
- Ao terminar: marque o checklist no PLAN.md e adicione 1–3 linhas no Changelog; decisão nova → docs/decisions.md.
- **Conventional Commits 1.0.0** e **SemVer 2.0.0** (`0.1.0-alpha.N`). Micro-commits; ao concluir cada seção: `docs(plan)` → `chore(release): X` + tag → `git push origin main --follow-tags`. Os hooks Husky estão vazios por escolha do usuário: rode `check`/`typecheck`/`test` (e `build` antes de push) à mão. Nunca `--no-verify`.
- **Push após cada commit** (depois dos gates). **`CHANGELOG.md`** na raiz no padrão **Keep a Changelog 1.1.0** (registre em `[Unreleased]`; mova para a versão no release).
- **Bun** no lugar de npm/node. Estilo **Biome v2**, TAB largura 4.

## Skills úteis

Phaser 4 (28, ex.: `render-textures`, `filters-and-postfx`, `cameras`, `animations`, `scale-and-responsive`), `pinguin-art-assets`, `pinguin-audio-assets`, `agent-browser` (QA), `canvas-design`, `graphify`, `find-skills`, `grilling` (entrevistar o usuário).
**Gamedev de terceiros (40, curadas):** `gd-*` (game feel, IA, procedural, RPG/roguelike, save, câmera, input, UI, performance, shaders, áudio, assets, itch/Steam), `gc-*` (design, arquitetura, QA Playwright, review, deploy) e `ccgs-*` (balanceamento, playtest, perf, QA, release, localização). **Use-as quando a tarefa bater** — tabela "quando usar" em [docs/tooling.md](docs/tooling.md); origem e ajustes em `.claude/skills/THIRD_PARTY.md`. Em conflito, este CLAUDE.md vence (ex.: `gc-phaser` é Phaser 3).
