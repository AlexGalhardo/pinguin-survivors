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
