# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Level-up offers 4 cards (stats, exclusive actives and passives only), a new `harvesting` stat that multiplies end-of-round Fish, and the Workshop upgrade Insight (one card reroll per run) (SDD-003 RF-05, RF-08).
- Danger 0–5 rules (SDD-005): HP/damage/speed/drop modifiers, seeded extra waves from Danger 2, per-hero unlock by beating the round-20 boss, best round per Danger in the save and `--danger N` in the simulation.

## [0.0.12] - 2026-11-08

### Added

- Save v2 (SDD-005): `SAVE_VERSION = 2`, `pearls` and per-hero `dangerUnlocked`; v1 saves migrate idempotently and drop the in-progress run.
- Pure arena logic (`src/logic/arena.ts`, `src/data/arena.ts`): side per round, centered bounds, clamp, inner spawn ring and prop layout (SDD-001).
- 1.0 weapon lines (`src/data/weapon-lines.ts`): 17 weapons in four tiers, including the new `hammer` (melee/blunt), starting weapons per hero and Pearl unlocks (`src/data/unlocks.ts`), tier tint tokens.
- Pure end-of-round shop (`src/logic/shop.ts`, `SHOP` in `src/data/economy.ts`): weighted offers, locks, growing reroll price, tier prices and sell value (SDD-003).
- `bun run lint:i18n` (`scripts/lint-i18n.ts`): fails on visible text literals in `src/ui/**/*.tsx` JSX (SDD-004 A5).
- Six weapon slots in `src/logic/build.ts` (`addWeapon`, `canFuse`, `fuse`, `setCounts`, `setBonuses`), set bonuses at 2/4/6 in `src/data/sets.ts` and `applyModifiers` in `src/logic/stats.ts` (SDD-002).
- Starting weapons per hero (`HeroDef.startingWeapons`) and three new exclusive passives: Iron Breath (Jack), Quick Reload (Bob) and Arcane Echo (Lucia); their in-game effects land with the weapon-slot integration.
- React 19 + Tailwind CSS v4 overlay infrastructure (SDD-004): `#ui` over the canvas, `src/ui/App.tsx`, a UI store on `useSyncExternalStore`, typed UI→game commands and CSS color tokens generated from `palette.ts` (`scripts/export-palette-css.ts`).
- Simulation with six weapon slots, run Fish, an end-of-round shop played by `src/logic/sim/shop-policy.ts` (buy by value per Fish, fuse, replace, lock, reroll) and Pearls at the end of the run (SDD-013).
- Enemies spawn on the inner ring of the arena; spawns inside the camera view show a 0.5 s `fx.spawnMark` first, and the camera follows the hero with a frame-rate-independent lerp, clamped to the walls and centered on axes where the arena is smaller than the view (SDD-001 RF-04, RF-05).
- `GoreLayer`: persistent blood decals in world coordinates (cap 4,000) re-stamped when the arena grows (SDD-001 RF-08).
- UI focus manager for keyboard, gamepad and touch (`FocusScope`, `useFocusable`, spatial navigation) and an accessible toast queue (SDD-004).
- Six weapon slots in game (SDD-002): each slot runs its weapon line at its tier on a ring around the hero, targeting bosses and elites first; set bonuses and the passives Iron Breath, Quick Reload and Arcane Echo apply; `?weapons=id[:tier],…` forces a loadout.
- React HUD behind `?uiHud=1` (HP, XP, Fish, round timer, boss bar, six weapon slots by tier, gear, gambits, super, FPS).
- Shared prompt templates for PixelLab and ElevenLabs assets (`.agents/skills/pinguin-*-assets/prompts.md`).

### Fixed

- The v1→v2 save migration carries the old Fish over as Pearls 1:1 (SDD-003 RF-07) instead of resetting them.

### Changed

- The world is top-down in a square arena (ADR-003, SDD-001): `src/logic/projection.ts` replaces the isometric projection (depth by `y`, input without rotation), `src/world/Arena.ts` replaces the chunk streamer with a 64-px tile floor, walls, solid props and centered growth per round, and heroes, enemies and projectiles stay inside the walls. `?arena=NN` forces the arena side for QA.
- `VoiceLimiter` renamed to `SfxLimiter` (`src/logic/sfx-limiter.ts`) and the per-key `voices` field of `src/data/sfx.ts` to `polyphony`; `menu.subtitle` renamed to `menu.tagline`.
- `docs/balancing-and-simulation.md` Part B tags the numbers the square arena affects with `[1.0: revisar]`; SDD-001 A6 now matches the 540-unit logical height.
- The signature weapon, weapon evolution by card and the weapon/evolution cards (`card.weapon.*` → `card.active.*` for the four exclusive actives); achievements `evolveT2/evolveT3/heroT3` become `fuse/weaponT4/heroT4`.
- Blade Whirl, Grenade Belt and Drone Sentinel left the card pool: they are weapon lines in 1.0 (SDD-002 RF-06).
- Phaser UI helpers moved from `src/ui/` to `src/scenes/ui-phaser/` so `src/ui/` holds only React.
- Balance, first pass of the 1.0 design (`docs/reports/balance-2026-11-08.md`): enemy damage per round 0.08 → 0.26 and tier I weapon damage evened out by crowd DPS.
- `scripts/perf.ts` takes `--round`, `--seconds`, `--width`, `--height` and `--base` (1920×1080 by default); every browser script runs with `--mute-audio` and tests use `SOUND_MUTED=true`.

### Removed

- Isometric projection and infinite chunks: `src/logic/iso.ts`, `src/logic/chunks.ts`, `src/world/ChunkManager.ts`, `scripts/pack-iso-tile.ts` and the isometric `tile.*` atlas frames.
- Hero voices and subtitles (ADR-009, SDD-010): `vo.*` audio, `src/core/voice.ts`, `src/data/voice.ts`, `src/logic/voice.ts`, the voice i18n tables, `scripts/el-voice.ts`, the ElevenLabs voice designs, the voice volume and subtitle settings and the HUD subtitle. The voiced build lives on the `legacy-voices` branch.

## [0.0.11] - 2026-11-08

### Added

- Market research on arena survivors, the Steam Next Fest of February 2027 and monetization (`docs/web-research.md`).
- Developer interview of 2026-11-08 with the decisions for the commercial 1.0 (`docs/brainstorming.md`), Architecture Decision Records ADR-001…015 (`docs/adrs/`) and implementation specs SDD-001…013 with verifiable acceptance criteria (`docs/sdds/`).
- Game Design Document (`docs/gdd.md`), Art Bible (`docs/visual.md`), sound direction (`docs/audio.md`), balancing and simulation playbook (`docs/balancing-and-simulation.md`), agent/git workflow (`docs/workflow.md`) and the commercial site spec (`docs/site.md`).
- Branch `legacy-voices` with the isometric build and the hero voices before their removal.
- `ROADMAP.md` with dated milestones up to the 1.0 launch, one owner, DoD, assert and audit checkbox per task, asset budget, risks and the developer's pending items.
- Open source project files: root `README.md`, `LICENSE.md` (MIT for the code, assets all rights reserved), `CONTRIBUTING.md`, `.github/SECURITY.md`, `.github/CODE_OF_CONDUCT.md`, a CI workflow (`lint`, `typecheck`, `test`, `build`) and Dependabot.
- Release tooling in the vukem style: `scripts/release.ts`, `scripts/release-backfill.ts` and `scripts/lib/release-notes.ts`.
- Provider-agnostic agent setup: `.claude/` renamed to `.agents/` with twelve short rules in `.agents/rules/` (workflow, commits, changelog, TypeScript, Phaser 4, React UI, game data and i18n, testing, assets, balance, secrets, docs); `CLAUDE.md` now points to `AGENTS.md`.
- markdownlint configuration and the `bun run lint:md` script.

### Changed

- Documentation consolidated into a few files under `docs/`; `CLAUDE.md`, `AGENTS.md` and the art/audio skills now describe the top-down, React and Steam/Android direction. `PLAN.md` is frozen as history.
- Git remote renamed to `AlexGalhardo/pinguin-survivors`.
- Versioning now follows the vukem scheme (`0.0.x` alpha, `0.1.x` beta, `1.0.0` launch, no pre-release suffixes). The eleven historical tags were re-tagged on the same commits and published as GitHub pre-releases; the sections below were renamed accordingly:

  | Old tag | New tag | Commit |
  |---|---|---|
  | `v0.1.0-alpha.1` | `v0.0.1` | `c959037` |
  | `v0.1.0-alpha.2` | `v0.0.2` | `f9a61e1` |
  | `v0.1.0-beta.1` | `v0.0.3` | `5ebbc69` |
  | `v0.1.0-beta.2` | `v0.0.4` | `1d8395c` |
  | `v0.1.0-beta.3` | `v0.0.5` | `9bd73b2` |
  | `v0.1.0-beta.4` | `v0.0.6` | `25da38b` |
  | `v0.1.0-beta.5` | `v0.0.7` | `f452e90` |
  | `v0.1.0-beta.6` | `v0.0.8` | `ba28401` |
  | `v0.1.0-beta.7` | `v0.0.9` | `3e1de88` |
  | `v0.1.0-beta.8` | `v0.0.10` | `3cd5c15` |

### Removed

- The Starfall Survivors tags (`v1.0.0-alpha.2…v1.0.0-rc.1`, `v0.1.0`, `pinguin-survivors-final`) were deleted from the repository so that there is exactly one tag per release; their commits stay on the `starfall-survivors-legacy` branch.
- `PLAN.md` is no longer tracked (it stays in the git history and locally as the frozen plan of the isometric prototype).
- Eighteen third-party or meta skills that do not fit the 1.0 direction (Phaser 3 guide, physics, itch.io, monetization, duplicates); reasons in `.agents/skills/THIRD_PARTY.md`.
- Legacy docs merged elsewhere: `game-design.md`, `ui-hud.md`, `art-and-assets.md`, `art-prompts.md`, `game-market.md`, `tooling.md`, `agent-workflow.md`, `git-and-versioning.md`, `balancing.md`, `decisions.md` (now `docs/adrs/ADR-000-decisoes-anteriores.md`).

## [0.0.10] - 2026-09-27

Playtest build **playdev-7** (end of the day's session).

### Changed

- Balance: softer station biome (enemies 1–2 less damage, 5–10% less HP), sturdier Bob (120 HP, 6 armor, +1 damage per shotgun pellet) and a gentler kraken (less damage, slower swipes, 5-shot ink volley).

## [0.0.9] - 2026-09-27

Playtest build **playdev-6**.

### Added

- Equipment: helmets, armor, legs, rings and amulets (10 of each: 3 common, 4 rare, 3 legendary) dropped by zombies (commons), elites (rares) and bosses (legendaries); they blink on the ground until you step on them.
- Health packs dropped by enemies: +25% (most common), +50% or +75% of max HP.
- Brotato-style pause screen: your stats, weapons and cards, and the equipment slots and bag, where items can be worn or taken off.
- Secondary weapons now float around the hero (up to 4 weapons with the signature one), each aiming at the nearest enemy in its range.
- Zombies and bosses without a drawn walk now waddle procedurally instead of gliding rigidly.

### Changed

- Each superpower cast makes the next one cost 5 more kills (100, 105, 110…); the HUD shows the current cost.
- The main menu title sits top-left above the menu; the subtitle is gone.
- Ring of Fire hits harder and more often (8 damage every 0.4 s); damage ticks under 1 no longer spam "0" numbers.

## [0.0.8] - 2026-09-27

Playtest build **playdev-5**.

### Fixed

- Bosses and big zombies no longer turn into white silhouettes: bloom is now opt-in (off by default; it also cost a lot of FPS), hit flashes are rate-limited and attack warnings tint the art red instead of hiding it.

## [0.0.7] - 2026-09-27

Playtest build **playdev-4**.

### Added

- Walking animation for Jack, Bob and Lucia in all 8 directions (8 frames each), without weapons in hand (the weapon is its own sprite); walking seals and sailor and gull zombie art.
- Jack gets a clean weaponless base with breathing idle and hit reaction; the polar bear boss walks; fuel bloater and sea lion zombie art.
- Final art for the narwhal, walrus, pigeon, riot cop, citizen and soldier zombies.
- Final art for the kraken and abomination bosses and the brute and acid bloater zombies; the medic zombie walks.
- The three heroes now have breathing idle, hit reaction and death animations in 8 directions; the sailor and sea lion zombies walk.
- Walking animations for the fuel bloater, walrus, narwhal, citizen, riot cop and soldier zombies.
- Sprites for every secondary weapon (shown around the hero like the signature weapon), the first card icons, and walking rats, brutes and acid bloaters.
- First equipment icons (seven helmets). Still pending: kraken and abomination walks, flying zombies, enemy attacks, superpower animations and effects, the remaining card, potion and gear icons, health packs and UI frames.

## [0.0.6] - 2026-09-27

Playtest build **playdev-3**.

### Fixed

- The hero no longer keeps walking after picking a card (keys released while the game was paused stayed pressed).
- "Play again" after a game over no longer crashes the new run.
- The game over screen now has a real menu (play again / main menu), since Esc is taken by the browser in fullscreen; Backspace also leaves the other menus.
- The main menu no longer blinks (removed the lava glow pulse).

### Changed

- New Brotato-style HUD: big HP and XP bars with the numbers inside, fish counter with an icon, large round and timer, a permanent TAB speed hint (top right) and an FPS counter (bottom left).
- Bigger, redesigned upgrade cards with a rarity band, bold names and readable descriptions.
- Readable text everywhere: a clean UI font rendered at the real screen resolution, bigger menu text, pixel font kept for titles.
- Jack's melee reaches about 40% farther with wider arcs, and swings only at enemies in reach.
- Smaller, flatter contact shadow under the hero.

- The signature weapon now aims at bosses and elites in range before the rest of the horde.
- The hero recovers 25% of max HP at the end of every round.

## [0.0.5] - 2026-09-27

Playtest build **playdev-2**.

### Changed

- Balance: the endless mode gets harder every full tour of the three biomes (enemy HP ×1.6 and damage ×1.5 every 30 rounds), boss rounds spawn half the horde, the jump into biomes 2–3 is softer and the kraken and abomination have less HP (docs/balancing.md §10.1).

### Added

- Recorded hero voices in English and Portuguese: one designed voice per penguin, 84 lines matching the subtitles.
- Extra takes of the most repeated sounds (hits, shots, splats, zombie deaths, swings), rotated at random.
- Late-game music track from round 21 onwards.
- Headless run sim with secondaries, superpowers, elites, biomes, rotating bosses and workshop upgrades, calibrated against the playtest bot; the bot now plays with a per-frame dodging brain, fights bosses at weapon range, picks cards like the sim and takes level, stat points, potions and upgrades through the save.

## [0.0.4] - 2026-09-27

Playtest build **playdev-1** (the nickname is shown next to the version in the footer).

### Added

- Playtest build nickname next to the version in the menu and HUD footer.
- Difficulty levels picked on the hero select: easy (zombies deal, have, move and drop 25% less), normal and hard (25% more).
- Extras shop: spend achievement points on ten small permanent bonuses for every penguin (max HP, regen, armor, critical chance and damage, dodge, parry, attack speed, damage, move speed), up to level 10 each.
- Final art (PixelLab): the 9 signature weapons and the auxiliary pistol, XP gems, fish and meat pickups, and the orb, spit, molotov, grenade and meteor projectiles, packed into group atlases that replace the code placeholders key by key.
- Final art for the heroes without weapons (Jack, Bob, Lucia; Bob breathing idle) and for seven zombies and the polar bear boss, facing their movement direction in 8 directions (5 drawn + 3 mirrored); animations fill in as they are generated.
- Seamless PixelLab ground and props for the three biomes (snow, steel deck, cracked asphalt; ice crystals, barrels, wrecked cars…), plus walking animations for Bob and three zombies.

## [0.0.3] - 2026-09-27

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
- End-to-end test of the whole flow (menu, run, cards, death, history) with `bun run e2e`.
- Controls screen to rebind the gameplay keys; full gamepad mapping (Triangle/Y superpower, Square/X or View speed, L1/R1 page lists) and a floating touch joystick.
- Accessibility: damage number size and reduced flashes.
- Bloom glow (toggle in the settings), light around magic bolts and a zoom punch on boss arrival, boss hits and boss deaths.
- Lucia's fire bolts now splash fire damage around the target.
- Hero voice lines with subtitles (run start, level up, low HP, potion, boss, superpower, death), two lines per event for each penguin; subtitles can be turned off in the settings.
- Rocks, crates and rubble are now light solid obstacles: the hero and walking zombies slide around them.
- Six new secondary weapons: fish boomerang, proximity mines, ring of fire, lightning totem, poison cloud and a piercing crossbow.
- Three new on-hit cards: chance to burn, chill and chain lightning.
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

## [0.0.2] - 2026-09-27

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

## [0.0.1] - 2026-09-27

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

[Unreleased]: https://github.com/AlexGalhardo/pinguin-survivors/compare/v0.0.12...HEAD
[0.0.12]: https://github.com/AlexGalhardo/pinguin-survivors/compare/v0.0.11...v0.0.12
[0.0.11]: https://github.com/AlexGalhardo/pinguin-survivors/releases/tag/v0.0.11
[0.0.10]: https://github.com/AlexGalhardo/pinguin-survivors/compare/v0.0.9...v0.0.10
[0.0.9]: https://github.com/AlexGalhardo/pinguin-survivors/compare/v0.0.8...v0.0.9
[0.0.8]: https://github.com/AlexGalhardo/pinguin-survivors/compare/v0.0.7...v0.0.8
[0.0.7]: https://github.com/AlexGalhardo/pinguin-survivors/compare/v0.0.6...v0.0.7
[0.0.6]: https://github.com/AlexGalhardo/pinguin-survivors/compare/v0.0.5...v0.0.6
[0.0.5]: https://github.com/AlexGalhardo/pinguin-survivors/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/AlexGalhardo/pinguin-survivors/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/AlexGalhardo/pinguin-survivors/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/AlexGalhardo/pinguin-survivors/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/AlexGalhardo/pinguin-survivors/releases/tag/v0.0.1
