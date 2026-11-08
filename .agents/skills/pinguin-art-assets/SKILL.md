---
name: pinguin-art-assets
description: Use when creating, regenerating, animating or replacing any visual asset of Pinguin Survivors (hero Jack/Bob/Lucia, zombie enemy, boss, merchant NPC, weapon tier image, top-down tile or border, prop, projectile, VFX, blood/gibs, UI icon, Steam capsule) with PixelLab API v2, or when touching art-src/pixellab, scripts/pl-*.ts, scripts/lib/pixellab.ts, pack-* scripts or the atlases. Keeps every asset on the same style, size, view, direction set and key contract.
---

# Pinguin Survivors — art assets with PixelLab

Read `docs/visual.md` first (Art Bible: style, sizes, keys, budget, production log) and `docs/sdds/SDD-012-arte-topdown-e-vfx.md` (what is pending and its budget). Every generation is logged in `art-src/pixellab/log.jsonl`; summarize each batch in `docs/visual.md` §13.

Antes de gerar, monte o prompt por [prompts.md](prompts.md) (base fixa, blocos por tipo, parâmetros da API, checklist e exemplos).

## Hard rules

1. **Camera is top-down 2D** (ADR-003). Sprites use view `low top-down` (3/4), **8 directions in the engine** (5 generated: s, se, e, ne, n; 3 mirrored). Ground is a **top-down 64×64 tileset** per biome plus borders; props are `high top-down`.
2. **Reuse first** (ADR-004): heroes and the 19 enemies already generated stay. Regenerate only what the visual QA (contact sheet on the top-down camera) marks as wrong, after the developer approves the list.
3. **New characters** (merchant NPC, future heroes/enemies): concept in **4 directions** (s, e, n generated; w mirrored) → **developer approval** (contact sheet via `bun scripts/pack-sheet.ts`) → `template` animations: **8 frames for heroes**, **6 frames for enemies** (`walking-8-frames`/`walk-6-frames`, `breathing-idle`, `taking-punch`, `falling-back-death`). Record the approved `character_id` in `docs/visual.md` §13.
4. **Heroes are animated without weapons** (P-56). Weapons are single images (`create-image-pixflux`, transparent, pointing right, grip on the left) with **4 tiers** per weapon line (`weapon.<id>.t1…t4`, growing size/detail/glow). Up to 6 weapons orbit the hero and are animated in code.
5. Sizes: hero canvas 96 (~88 px tall), common enemy 64–80, boss 160, NPC 96, tile 64×64, prop 32–64, icon 32×32, projectile 16–32. Never change a size without an ADR.
6. Outline: single color black 1 px on characters, weapons and props; none on tiles. Style suffixes in `docs/visual.md` §3 (use them verbatim).
7. **Budget**: `GET /balance` before any batch; pilot 1 direction/1 tile first; batches > 200 generations or any character regeneration need the developer's OK. Record the balance after each batch in `docs/visual.md` §10.
8. **Token**: API v2 with `PIXELLAB_API_TOKEN` from `.env` (`scripts/lib/pixellab.ts`). The user-scoped `pixellab` MCP uses an expired token: do not rely on it for generation. Never commit or print tokens.

9. **Never delete or replace existing art** (permanent developer rule): redesigns and alternatives go to `art-src/pixellab/anim-v2/` unlinked from the game; new animations (`fly` for flyers, `attack` for ranged, charger and boss enemies, `idle` for NPCs such as `npc.merchant`) are added as extra animations in the same atlas (`enemy.<id>`, `npc.<id>`) without touching `walk`. Characters made by another token cannot be re-animated through the API (404): use `/animate-with-text-v3` with the existing rotation as first frame (`scripts/pl-fly.ts <id> --anim fly|attack`). Before closing a batch run `git status --short | grep '^ D'` (must be empty) and `bun scripts/pack-atlas.ts --check`; `bun scripts/pack-heroes.ts` rewrites a whole atlas, so compare the old frames pixel by pixel when repacking a legacy one.
10. Weapon art has 4 lines per weapon (`weapon.<id>.t1…t4`, used by rarity I–IV; V reuses IV, ADR-017); a weapon or icon used by the game is never a placeholder (`tests/art-coverage.test.ts`).

## How to call PixelLab

- Scripts (reproducible): `scripts/lib/pixellab.ts` (`api`, `waitJob`, `getCharacter`, `download`, `logGeneration`, `getBalance`); generators `scripts/pl-*.ts` are idempotent (skip when output exists): `pl-batch.ts` (pixflux image batches from JSON with `--max` cap), `pl-fx.ts` (192 px VFX loops), `pl-fly.ts` (`fly`/`attack` from a still rotation), `pl-merchant.ts` (NPC concept), `pl-tiles.ts`, `pl-aliens.ts`, `pl-animate.ts`.
- Async: POST → `background_job_id` → poll `GET /background-jobs/{id}` every 5 s → fetch result (`/characters/{id}`, `/characters/{id}/zip`, image URL).
- Endpoints: `/create-character-v3` (~3 gen at 96 px, 5 at 160), `/create-character-state` (~30), `/characters/animations` (`mode: template`, 1 gen/direction), `/create-image-pixflux` (~1), `/create-topdown-tileset` or `/create-tiles-pro` with `view: top-down` (25–40 per batch), `/create-1-direction-object` + `/objects/{id}/animations` (VFX), `/generate-image-v2` (key art, 30). Schema: `https://api.pixellab.ai/v2/openapi.json`.

## Into the game

1. Raw downloads → `art-src/pixellab/<kind>/<id>/…` (versioned, small PNGs; `raw/` is gitignored).
2. Pick variants in `art-src/selection.json` → `bun scripts/pack-process.ts` → `bun scripts/pack-atlas.ts` / `bun scripts/pack-heroes.ts hero.<id>` → `public/assets/atlas/*`, `public/assets/heroes/*`. Tiles: `bun scripts/pack-tiles.ts` (top-down; the old `pack-iso-tile.ts` is removed with SDD-001).
3. Register the key in `src/art/manifest.ts` (contract in `docs/visual.md` §9); the code placeholder for that key stops automatically. `bun scripts/pack-atlas.ts --check` must report no missing files.
4. QA in the browser with `agent-browser`: `?skipMenu=1&hero=<id>&round=1&seed=1&debug=1` at 1920×1080 (zoom ×2); the debug overlay lists placeholders still in use.
