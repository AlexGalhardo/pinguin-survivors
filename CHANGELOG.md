# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Main menu with an animated DOOM-inspired key art (Jack or Bob, 50% each), hero select with portraits and unlock hints, settings, pause, achievements list and match history.
- Heroes & Potions screen: spend stat points, buy potions with fish and set up 3 FFXII-style gambits (potion + condition) that trigger automatically in runs.
- Potions: heal, mega heal, shield, rage, antidote and haste; scientist spit now poisons the hero.
- Continue: the run is saved at the start of every round and can be resumed from the main menu.
- Resolution setting (Auto native, SD, HD, Full HD, 2K, 3K, 4K); Auto renders at native Retina pixels.
- Final achievement badge art.
- Elite round warning and potion slots on the HUD.
- Curated third-party gamedev skills for AI agents working on the project.
- Blood and gibs now stay on the ground for the whole run, with blood spurts and hit-stop on big hits.
- Polar night darkness with light around the hero, fire, explosions and elites.
- 18 sound effects (weapons, gore, pickups, level up, boss roar, superpower, menus, game over).
- Two new biomes: the research station/harbor (rounds 11–20) and the ruined city (rounds 21–30), each with its own ground, props and 6–7 new zombies; the biomes loop in endless mode.
- New bosses: the Harbor Kraken (round 20: long tentacle slams, ink volleys, sailor summons) and the Abomination (round 30: frequent charges, telegraphed acid pools, rat swarms).
- Workshop: nine permanent upgrades bought with fish (max HP, damage, attack speed, armor, regen, move speed, pickup range, XP gain, luck), shared by every hero.
- Dedicated unlock screen for Bob and Lucia after the run that unlocks them.
- Elites show a health bar once damaged.
- Fullscreen toggle in the settings.
- Best round per hero shown on the hero select screen.
- Brotato-style weapons: the signature weapon is its own sprite that aims, swings, recoils or glows next to the hero.

### Changed

- Gore mode (maximum, reduced, green goo), screen shake and damage number settings now apply in game.
- First balance pass: longer invulnerability after a hit, lower contact damage, slower early spawns, more health for Bob and Lucia, faster shotgun and a piercing staff.
- Menu, round and boss music now come from the ElevenLabs music model.

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
