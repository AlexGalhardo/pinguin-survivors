---
name: starfall-art-assets
description: Use when creating, regenerating or replacing any visual asset of Starfall Survivors (hero, enemy, boss, tile, projectile, effect, pickup, UI element, icon, logo) with AI tools (Retro Diffusion API/MCP, PixelLab, Scenario, pixel-mcp/Aseprite) or when touching art-src/, scripts/rd-*.ts, pack-atlas or the atlas. Keeps every asset on the same style, palette, grid and key contract.
---

# Starfall Survivors — AI art assets

Every visual asset must look like it belongs to the same game. Follow this flow; do not improvise a new pipeline.

## 1. Before generating

1. Read `docs/art-prompts.md` (what worked, costs, seeds) and `references/style-guide.md` (rules).
2. Find the **manifest key** of the asset: `src/art/manifest.ts` (`TEX`), sheets in `src/art/placeholders/sheets.ts` (`SHEETS`), icons are `icon.<id>` (16×16). The final asset MUST use the same key as the placeholder. Never add a texture without a key.
3. Check the budget: `bun scripts/rd-generate.ts --key x --style <style> --size <n> --check` (free). Tell the user the cost of a batch before spending more than ~US$0.50.

## 2. Generate (Retro Diffusion = default tool)

```bash
bun scripts/rd-generate.ts --key <manifest.key> --style <prompt_style> --size <px> [--height <px>] \
  --palette [--no-bg] [--sheet] [--n 4] --seed <int> --prompt "<subject>"
```

- Always `--palette` (Endesga 32). Always a `--seed` (reproducibility). Needs `RETRO_DIFFUSION_API_KEY` in `.env` (Bun loads it).
- Pick the style from `references/prompt-recipes.md` (hero / enemy / boss / tile / icon / UI / VFX).
- Output: `art-src/rd/<key>/<timestamp>_<i>.png` + one line in `art-src/rd-log.jsonl`.
- Prefer `--n 2..4` on cheap styles and pick the best candidate instead of re-rolling one by one.

Other tools: see `references/tools-setup.md` (RD MCP, PixelLab MCP, Scenario MCP, pixel-mcp + Aseprite). Whatever the tool, save the raw PNG under `art-src/rd/<key>/` and log it in `docs/art-prompts.md`.

## 3. Review (mandatory, visual)

Upscale ×4–8 with nearest-neighbor (sharp) and look at it with the Read tool. Reject if: wrong perspective (must be top-down 3/4), unreadable at 1×, red/orange dominant on non-enemy-shot assets, soft/anti-aliased edges, subject cut by the canvas, off-style compared with `art-src/processed/`.

## 4. Process → atlas

1. Add a recipe to `art-src/rd-slices.json`:
   - single sprite: `{"out": "<key>", "src": "<raw.png>", "cell": [32,32], "frames": [[0,0]], "anchor": true, "outline": true, "size": 32}`
   - animated sheet strip (`<key>.idle` 2f, `<key>.walk` 4f): `frames` as `[col,row]` cells; `"flip": true` if the source faces left (the game assumes sprites face **right**).
   - recolor: `"replace": {"e43b44": "3a4466"}` (hex after Endesga quantization).
2. `bun scripts/rd-slice.ts [key]` → `art-src/processed/<key>.png` (quantized to Endesga 32, hard alpha, orphans removed).
   Big "pixel-style" images that are NOT on the grid (Higgsfield, Scenario renders) go through `bun scripts/pixelize.ts <in.png> <key> <size>` instead.
3. `bun scripts/pack-atlas.ts` → `public/assets/atlas.{png,json}`. Restart `bun run dev` if the atlas did not exist before (Vite reads `__HAS_ATLAS__` at startup).
4. Verify in game with agent-browser: `?skipMenu=1&char=<class>&wave=<n>&seed=1&god=1&unlockAll=1` (wave 10 shows boss 1, wave 16 shows most enemies). Screenshot and check readability against the floor and 300 enemies.

## 5. Document (never skip)

- Append a row per generation to `docs/art-prompts.md` (key, style, size, seed, cost, prompt, result ✅/❌ and why).
- Update the "still placeholder" list there and the checklist in `PLAN.md` §3.2.
- Commit raw + processed + atlas + log: `feat(art): ...` (Conventional Commits).

## Red flags

- Generating without `--palette` or without a seed.
- Using a new texture key or changing a sprite size (32 px gameplay, 64 px bosses, 16 px icons, 32 px tiles).
- Red/orange projectiles or floors that are not enemy shots (red = enemy danger).
- Skipping the in-game screenshot.
