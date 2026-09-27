---
name: pinguin-art-assets
description: Use when creating, regenerating, animating or replacing any visual asset of Pinguin Survivors (hero Jack/Bob/Lucia and weapon tiers, zombie enemy, boss, isometric tile, decoration, projectile, VFX, blood/gibs, UI, icon) with PixelLab (API v2 or the `pixellab` MCP), or when touching art-src/pixellab, scripts/pl-*.ts, scripts/lib/pixellab.ts, pack-atlas or the atlas. Keeps every asset on the same style, size, view, direction set and key contract.
---

# Pinguin Survivors — art assets with PixelLab

Read `docs/art-and-assets.md` first (style, sizes, keys, budget). Every generation is logged automatically in `art-src/pixellab/log.jsonl`; summarize it in `docs/art-prompts.md`.

## Hard rules

1. **View** `low top-down`, **8 directions**, transparent background, **single color black outline** for characters.
2. **Sizes**: hero canvas 96 (≈64 px tall), common enemy 64, boss 128–192, iso tile 64×32. Never change a size without updating `docs/decisions.md` (P-05).
3. **Animations ≥ 12 frames** (`frame_count` 12 or 16; must be even). Hero: idle, walk, attack, hurt, death. Enemy: walk, attack, death. Boss: idle, walk, attack, special, death.
4. **Approval gates**: a new character (hero, enemy or boss) is generated as a concept (rotations only), shown to the user (contact sheet), and **only animated after approval**. Record the approved `character_id` in `docs/art-prompts.md`.
5. **Weapon tiers**: the signature weapon is part of the hero sprite. T2/T3 come from the approved T1 character via `POST /create-character-state` (same identity, new weapon), never from scratch.
6. **Style prompt suffix** (keep identical across assets): `cute but battle-worn, scars and bandages, dirty worn gear, zombie apocalypse survivor, isometric action RPG like Diablo 2, readable silhouette` for heroes; zombies use `pale greenish rotting skin/feathers, red wounds, glowing eyes, isometric action RPG like Diablo 2`.
7. **Budget**: call `GET /balance` before any batch; pilot 1 direction first; estimate cost in the log. Do not start batches > 200 generations without telling the user.
8. Never commit tokens. `PIXELLAB_API_TOKEN` lives only in `.env`.

## How to call PixelLab

- Scripts (preferred, reproducible): `scripts/lib/pixellab.ts` has `api`, `waitJob`, `getCharacter`, `download`, `logGeneration`, `getBalance`. Add new generators as `scripts/pl-<kind>.ts` following `scripts/pl-concepts.ts` (idempotent: skip when `meta.json` exists).
- MCP (`pixellab`, user scope) is fine for exploration; still download results into `art-src/pixellab/` and log them.
- Async pattern: POST → `background_job_id` → poll `GET /background-jobs/{id}` every 5 s → `GET /characters/{id}` (rotation URLs) or `/characters/{id}/zip` (animations).
- Key endpoints: `/create-character-v3` (cheap, ~3 gen at 96 px), `/create-character-pro` (20–40 gen, higher quality), `/create-character-state`, `/characters/animations` (`mode: v3`, `frame_count`, `directions`, one job per direction), `/create-isometric-tile`, `/create-tiles-pro`, `/map-objects`, `/create-1-direction-object` + `/objects/{id}/animations` (VFX), `/create-ui-asset`. Full schema: `https://api.pixellab.ai/v2/openapi.json`.

## Into the game

1. Raw downloads: `art-src/pixellab/<kind>/<id>/…` (versioned; small PNGs).
2. Normalize to the key contract in `art-src/processed/<key>.png` (frame names `<key>.<anim>.<dir>.<nn>`, dir ∈ s, se, e, ne, n, nw, w, sw).
3. `bun scripts/pack-atlas.ts` → `public/assets/atlas*.png/json`.
4. Register the key in `src/art/manifest.ts`; the placeholder for that key stops being used automatically.
5. Check in the browser with `agent-browser` (`?skipMenu=1&hero=<id>&debug=1`), 1280×540 logical at zoom 2.
