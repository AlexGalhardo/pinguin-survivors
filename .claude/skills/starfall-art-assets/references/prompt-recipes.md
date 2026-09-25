# Prompt recipes (Retro Diffusion API v2)

Prices measured on 2026-09-25 (confirm with `--check`). Prompt = short concrete subject; RD expands it.

| Asset | Style | Size | Flags | Price | Prompt pattern | Notes |
|---|---|---|---|---|---|---|
| Hero (4-dir sheet) | `rd_animation__small_sprites` | 32 | `--palette --sheet` | $0.07 | `sci-fi <class> in <main colors> <armor/robe>, <signature weapon/prop>, <head detail>` | 160×128 sheet, 5×4 cells: row 0 front, 1 side, 2 back, 3 extras (col 4 = knocked down). idle = r0 c0–1, walk = r1 c0,1,0,2 |
| Hero 48 px walk+idle | `rd_animation__four_angle_walking_idle` | 48 | `--palette --sheet` | $0.07 | same | Only if heroes move to 48 px (not the current grid) |
| Enemy | `rd_plus__topdown_item` | 32 | `--palette --no-bg` | $0.025 | `<size> <color> alien <creature> with <1–2 features>` | No outline → `"outline": true` |
| Enemy (alt., stronger outlines) | `rd_plus__classic` / `rd_mini__classic` | 32 | `--palette --no-bg` | ~$0.025 | same | Try when topdown_item comes out too soft |
| Boss | `rd_plus__low_res` | 64 | `--palette --no-bg` | $0.03 | `giant <color> alien <creature> with <features>, top-down 3/4 view, video game boss` | |
| Floor tile | `rd_tile__single_tile` | 32 | `--palette --n 2` | $0.025/img | `dark navy sci-fi metal floor plate ..., low contrast` | Remap reds and brighten/darken with `"replace"` |
| Full tileset | `rd_tile__tileset` | 32 | `--palette` | $0.10 | `<ground> to <wall/edge>` | Wang tileset; would need Arena changes |
| Decoration | `rd_tile__tile_object` | 16–32 | `--palette --no-bg` | ~$0.025 | `alien crystal cluster`, `broken vent` | Keys `deco.*` |
| Pickup / small item | `rd_mini__topdown_item` / `rd_plus__topdown_item` | 16–32 | `--palette --no-bg` | ~$0.02 | `glowing gold coin`, `medkit with green cross` | |
| Skill icon | `rd_plus__skill_icon` | 32 → 16 | `--palette` | ~$0.025 | `<ability> icon, <element> glow` | Downscale with `pixelize.ts ... 16` |
| Item sheet (many icons) | `rd_pro__inventory_items` | 256 | `--palette` | $0.18 | list the items | One call → grid of items; slice with `rd-slice.ts` cells |
| UI panel/buttons | `rd_pro__ui_panel` | 256 | `--palette` | $0.18 | `sci-fi dark navy panel, buttons, cyan trim` | Must be sliced into 9-slice parts (`UI_SLICE`) |
| VFX animation | `rd_animation__vfx` | 24–96 | `--palette --sheet` | $0.07 | `cyan plasma explosion` | Keys `fx.*` |
| Animate existing sprite | `rd_advanced_animation__walking` / `__idle` / `__attack` | 32–256 | `--input <png> --sheet` | $0.14 | `a <subject> walking` | Keeps the exact character; best for polishing heroes |
| Logo / title | `rd_pro__typography` | 64–256 | | $0.18 | `STARFALL SURVIVORS logo, neon sci-fi` | Or compose with the `canvas-design` skill |

Seeds: heroes 1xx, enemies 2xx, tiles 3xx, UI 4xx, icons 5xx, VFX 6xx (keep the ranges to find things in the log).
