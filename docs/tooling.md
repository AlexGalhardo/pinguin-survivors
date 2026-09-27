# Ferramentas, skills e APIs

Skills em `.claude/skills/` (nível de projeto), travadas em `skills-lock.json` (restaurar: `bunx skills experimental_install`).

## Skills

| Skill | Use quando… |
|---|---|
| **Phaser 4 (28)**: `game-setup-and-config`, `scenes`, `cameras`, `sprites-and-images`, `animations`, `render-textures`, `filters-and-postfx`, `particles`, `tweens`, `groups-and-containers`, `input-keyboard-mouse-touch`, `scale-and-responsive`, `loading-assets`, `audio-and-sound`, `text-and-bitmaptext`, `graphics-and-shapes`, `geometry-and-math`, `v4-new-features`, `v3-to-v4-migration`, … | Qualquer dúvida de API do Phaser. Phaser 4 ≠ Phaser 3 |
| **`pinguin-art-assets`** | Gerar/trocar qualquer asset visual com o PixelLab (personagens, animações, tiles, objetos, VFX, UI) |
| **`pinguin-audio-assets`** | Gerar SFX, música e vozes com o ElevenLabs |
| `agent-browser` | QA visual: abrir o jogo, screenshots, teclas, console |
| `canvas-design` | Arte estática (logo, key art, mockups) |
| `graphify` | Mapa de conhecimento do código/docs |
| `find-skills` | Procurar novas skills |
| `grilling` / `grill-me` | Entrevistar o usuário sobre decisões de design (`/grill-me` é só do usuário) |

### Skills de gamedev de terceiros (curadas; ver `.claude/skills/THIRD_PARTY.md`)

Use quando a tarefa pedir; em conflito, vale o `CLAUDE.md` (Phaser **4**, Bun, `src/logic` puro, i18n, PixelLab/ElevenLabs).

| Quando | Skill |
|---|---|
| Juice, hit-stop, shake, feedback | `gd-game-feel`, `gc-design-game`, `gc-game-designer` |
| IA de inimigos, bosses, steering | `gd-game-ai`, `gd-ai-behavior-trees-utility-ai` |
| Mapa procedural, loot, seeds | `gd-procedural-gen` |
| Progressão, stats, RPG, save | `gd-rpg`, `gd-roguelike`, `gd-save-systems` |
| Câmera, input, UI/HUD, menus | `gd-camera-systems`, `gd-input-systems`, `gd-game-ui-ux` |
| Performance (300 inimigos, gore, luz) | `gd-performance-optimization`, `ccgs-perf-profile` |
| Shaders/filtros (bloom, vinheta, luz) | `gd-shader-programming` (adaptar para filtros do Phaser 4) |
| Áudio (mixagem, ducking, música adaptativa) | `gd-audio-design` |
| Direção de arte e checagem de assets | `gd-create-game-assets` |
| Balanceamento das fórmulas/dados | `ccgs-balance-check` |
| QA, testes Playwright, bugs | `gc-game-qa`, `gc-qa-game`, `ccgs-qa-plan`, `ccgs-bug-report`, `ccgs-playtest-report` |
| Revisão/melhoria do código do jogo | `gc-review-game`, `gc-improve-game`, `gc-add-feature`, `gc-game-architecture` |
| Escopo (evitar inchaço do PLAN) | `ccgs-scope-check` |
| i18n EN/PT-BR | `ccgs-localize` |
| Release e publicação | `ccgs-release-checklist`, `ccgs-launch-checklist`, `gd-itch-publish`, `gd-steam-publish`, `gc-game-deploy`, `gc-monetize-game` |
| Referência Phaser extra | `gd-phaser-core` (Phaser 4), `gc-phaser` (escrita para Phaser 3: só padrões, não APIs) |
| Protótipo rápido de mecânica | `gd-prototype-fast` |

## APIs e MCPs

| Serviço | Status | Notas |
|---|---|---|
| **PixelLab** | ✅ API v2 via `scripts/lib/pixellab.ts` (`PIXELLAB_API_TOKEN` no `.env`); MCP `pixellab` (`https://api.pixellab.ai/mcp`) no escopo de usuário | Plano Tier 2 (5.000 gerações/mês). `GET /balance` antes de lotes |
| **ElevenLabs** | ✅ chave `ELEVENLABS_API_KEY` no `.env` | SFX, música, vozes. Scripts `scripts/el-*.ts` |
| Phaser Game Agent MCP | **não usar** | Pago/nuvem |

`.env` e `TODO.md` estão no `.gitignore`. Nunca commitar chaves nem colá-las em docs.

## Bibliotecas

- Runtime: `phaser` (^4.2).
- Dev: `typescript`, `vite`, `@types/bun`, `@biomejs/biome`, `husky`, `@commitlint/*`, `sharp` (atlas/contact sheets), `playwright` (QA cross-browser).

## Scripts

| Comando | O quê |
|---|---|
| `bun scripts/pl-concepts.ts [id…]` | Gera concepts dos heróis no PixelLab + `art-src/pixellab/concepts/sheet.png` |
| `bun scripts/pack-atlas.ts` | `art-src/processed/*.png` → `public/assets/atlas.png/json` |
| `bun scripts/qa-browsers.ts` | QA do build em Chrome/Edge/Firefox (com `vite preview --port 4173` rodando; 1ª vez: `bunx playwright install firefox`) |
