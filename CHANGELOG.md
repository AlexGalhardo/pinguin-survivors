# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0-alpha.2] - 2026-09-27

### Added

- Playable horde loop with placeholder art: enemies spawn just outside the visible screen and crowd around the hero without stacking.
- Six Antarctica zombie enemies and the Zombie Polar Bear boss on round 10, with a boss health bar and a 3 minute timer.
- Purple and orange elite auras on elite rounds.
- Signature tier 1 weapons: Jack's machete arcs, Bob's double-barrel shotgun spread and Lucia's elemental staff bolts.
- Critical hits, armor, elemental resistances, dodge and parry, with floating damage numbers and blood puddles on the snow.
- HUD with health bar, kills, round number and round timer.
- Bleeding, poison, burning, ice slow and freeze, earth stun and armor shred, and energy chains, with colored damage numbers.
- Three upgrade cards to choose from after every round: 24 stat and on-hit cards, 4 secondary weapons, 18 hero-exclusive cards and signature weapon evolutions after the bosses.
- Superpowers on the Space key from hero level 5: Red Harvest (Jack), Carpet Bombing (Bob) and Elemental Cataclysm (Lucia).
- XP orbs, fish and healing meat with a pickup magnet; persistent hero levels up live during the run.
- Enemy behaviors: spitting scientists, charging walruses, exploding bloaters, and a polar bear boss that swipes, charges and summons penguins.
- Run rewards are saved when the run ends, with a game over summary, match history and live achievement unlocks.
- Bob unlocks after beating the round 10 boss and Lucia after the round 20 boss.

### Changed

- Jack's melee reach is 50% larger on every weapon tier.

## [0.1.0-alpha.1] - 2026-09-27

### Added

- Game design, balancing, architecture, art, audio and UI documentation for Pinguin Survivors: an isometric 2:1 pixel art endless roguelite with three penguin heroes (Jack, Bob and Lucia).
- Hero identity: stat profiles, damage multipliers per weapon tag, six exclusive cards per hero and a level 5 superpower for each hero.
- Isometric engine base: world-to-screen projection, 8-way facing, screen-relative movement, integer zoom by window height (1280×540 logical on 2560×1080) and an infinite procedural map in chunks.
- Placeholder art drawn by code for tiles, decorations, shadows, the achievement badge and the heroes in 8 directions.
- English and Brazilian Portuguese texts, with the Pixelify Sans pixel font.
- TAB toggles the game speed between 1x and 2x.
- Build version (SemVer) centered in the HUD footer.
- 131 global achievements shared by all heroes, 1 achievement point each, and the ledger for a future extras shop.
- "Achievement unlocked" banner at the top center of the screen, with its own badge and sound effect.
- Local save with tolerant parsing and migrations, a snapshot to continue a run, the last 20 runs history and JSON export/import.
- PixelLab pipeline (API client, hero concepts, single images) and ElevenLabs pipeline (API client, sound effects).
- Approved concepts for Jack, Bob and Lucia in 8 rotations.
- Debug query parameters: `skipMenu`, `hero`, `round`, `seed`, `tier`, `god` and `debug`.

### Changed

- Project renamed to Pinguin Survivors; versioning starts at `0.1.0-alpha`.

### Removed

- The previous game (Starfall Survivors) and its tooling: Retro Diffusion scripts, jsfxr sounds, top-down arena and code-drawn key art. Its full history lives in the `starfall-survivors-legacy` branch.

[Unreleased]: https://github.com/AlexGalhardo/pinguin-survivors/compare/v0.1.0-alpha.2...HEAD
[0.1.0-alpha.2]: https://github.com/AlexGalhardo/pinguin-survivors/compare/v0.1.0-alpha.1...v0.1.0-alpha.2
[0.1.0-alpha.1]: https://github.com/AlexGalhardo/pinguin-survivors/releases/tag/v0.1.0-alpha.1
