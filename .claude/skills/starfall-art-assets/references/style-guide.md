# Style guide (summary of docs/art-and-assets.md)

- **Pixel art only**, hard pixels, no anti-aliasing, integer zoom in game.
- **Palette: Endesga 32** only (`src/config/palette.ts`). Named colors used for remaps:
  void `181425`, midnight `262b44`, darkSlate `3a4466`, slate `5a6988`, steel `8b9bb4`, silver `c0cbdc`, white `ffffff`,
  red `e43b44`, crimson `a22633`, magenta `ff0044`, salmon `f6757a`, orange `f77622`, amber `feae34`, yellow `fee761`,
  green `63c74d`, forest `3e8948`, pine `265c42`, deepTeal `193c3e`, blue `0099db`, cyan `2ce8f5`, plum `68386c`, orchid `b55088`.
- **Grid**: heroes/enemies/items 32×32 · bosses 64×64 · tiles 32×32 · icons 16×16 · projectiles 8–16 px.
- **View**: top-down 3/4 (slightly from above and front). Sprites face **right** (the game flips with `setFlipX`).
- **Outline**: 1 px darkest color (void) on gameplay sprites (`"outline": true` in the slice recipe).
- **Readability rules**
  - Heroes: warm/saturated, distinct silhouettes (Warrior orange/steel, Ranger green/tan, Mage purple + cyan orb).
  - Enemies: cool / purple / green / alien tones; elites are tinted by code (yellow/cyan/salmon, red for boss telegraphs).
  - **Enemy projectiles are red/orange** — nothing else in the arena may be dominantly red (floors, decorations, player shots).
  - Floor: dark and low contrast (midnight/darkSlate), must not compete with 300 enemies.
- **Theme**: retro sci-fi on a hostile alien planet; neon over dark ground; worn tech.
- **Animation**: few frames (idle 2f, walk 4f) + code juice (bob, squash, flash). Consistent cell positions across frames (no per-frame trim).
