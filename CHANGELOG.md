# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **art:** The station (rounds 31-40) and ruins (rounds 41-50) biomes have their own ground and walls: riveted steel deck with rusty gratings, and dark stone slabs with lava cracks. They used the flat code placeholder before.
- **game:** Hero classes (SDD-024): each penguin has four ways to play, unlocked at hero levels 1, 5, 10 and 20. The first is the hero as before; the others trade a gain for a cost (Jack: Berserker, Butcher, Bulwark; Bob: Pyro, Sharpshooter, Scavenger; Lucia: Stormcaller, Frostweaver, Glass Cannon). Picked on the hero select screen; the demo plays the base class only. `bun scripts/sim.ts --classes` compares each one with its base class.
- **hud:** With a gamepad in use the key hints name the pad buttons ("SUPER MAGIC · Y", "X · speed") instead of SPACE and TAB, and switch back on the first key press. The menus are checked at 1280x800 (Steam Deck).
- **ui:** The pause sheet shows the hero being played, and the shop header draws Elite Marks and Boss Cores with their own icons.
- **arena:** The biome ground now continues, dimmed, outside the arena walls (SDD-023): a small arena is no longer framed by black bars, which took over a third of a 2560x1440 or ultrawide screen in the first rounds.
- **ui:** Step-by-step onboarding (SDD-022): the skill tree shows once a hero has a point to spend, the hero and potion screen after the first run, and the Marks and Cores counter once the run has one; each is announced once with a toast. The first run shows three one-line hints in the HUD: how to move, that the weapons attack on their own, and the Super Magic when it is charged.

### Changed

- **game:** The game is now called **Penguin Survivors** (ADR-028): title in the 4 languages, page title, the Windows executable (`Penguin Survivors.exe`), the Android app name and application id (`xyz.lekzera.penguinsurvivors`), the release file names, the site and the docs. Saves, storage keys and the repository URL keep the old spelling.
- **ui:** UI polish pass (SDD-021). Hero stats are drawn everywhere with their pixel icon, a capitalized label and the value (`StatLine`): the shop strip, the pause sheet and the hero select.
- **ui:** Run summary shows one labeled number per block (kills, time, damage, XP, Fish, levels, Pearls) instead of two sentences, and quitting from the pause menu reads "RUN ENDED" instead of "YOU DIED".
- **ui:** Pause sheet shows HP, armor and damage as three headline blocks and lines up equipment and weapon slots on one grid with column titles.
- **ui:** Hero select lists the stats in one column, gives difficulty and starting weapon their own section with what each choice changes, and moves the Super Magic under the hero.
- **ui:** Hero screen rows put the Pearl price at the right edge on one line and the gambit slots get a title and their explanation.
- **ui:** Skill tree nodes show the icon of the stat they grant instead of two letters; locked nodes are gray.
- **hud:** Boss name sits over its bar on one line and the bar shows the health share; empty bar tracks (XP, Super Magic) stay visible; the FPS counter only shows in development builds or with `?debug=1`.
- **shop:** Offers spread over the column, the gear comparison puts "FOR SALE" and "EQUIPPED" on each card's type line with the stat changes in two columns, and free equipment slots share one line.
- **site:** Landing and press kit describe the three difficulties instead of Danger 0-5, in the 4 languages.

### Fixed

- **shop:** On a 360 px tall phone (2400x1080 at DPR 3) the fourth offer ran under the action bar; the merchant line now stays on one line and the footer never wraps there.
- **shop:** With a worn item compared, the before and after list ran over the stat strip at 1920x1080.
- **i18n:** Skill tree point texts no longer read "Cost: 1 points" (reworded in EN, PT-BR and ES).
- **qa:** `scripts/qa-mobile.ts` timed out before the shop (it used round 5, a boss round since 0.7.1) and `scripts/qa-menus.ts` looked for the match history inside the hero screen; both reach every screen again and report no issues.
- **shop:** On phones the buy and lock buttons are narrower, so the offer name is no longer cut to "Ring ...".
- **release:** A version in the changelog no longer repeats a group (`### Fixed` twice): `scripts/release.ts` merges the hand-written entries with the commit lines.

## [0.10.1] - 2026-11-10

### Fixed

- **audio:** Music no longer stacks: fades ran as tweens of the scene that started them, so going back to the menu or restarting a run killed the fade-out and the old track kept looping under the new one (two round themes at once, a round theme under the shop). Fades now run on the game clock and any other live music track is faded out when a new one starts.
- **audio:** Stop music tracks from stacking after a scene restart ([b97d8eb](https://github.com/AlexGalhardo/pinguin-survivors/commit/b97d8eb))

### Maintenance

- **release:** Mark 0.10.0 as the current release ([6a71b6a](https://github.com/AlexGalhardo/pinguin-survivors/commit/6a71b6a))

## [0.10.0] - 2026-11-10

### Changed

- **ui:** Flat UI (ADR-027, SDD-020, design system v2.1): no shadows, glows, chamfered or worn card frames; every group of buttons or content is delimited by one 1 px `border-line` and every `Btn` has one style per function (primary, secondary, danger) on all screens. Focus uses a `crit` border, band and diamond instead of a glow. The main menu groups its entries with that thin border.
- **ui:** Main menu loses the subtitle (`menu.tagline`) and the pearls and achievement points footer (`menu.wallet`), in the 4 languages.
- **game:** Difficulty replaces Danger 0-5 (ADR-025, SDD-019): Easy x0.5, Normal x1 and Hard x2 on enemy HP and damage (bosses included); speed, drops and extra waves are neutral. Hard unlocks per hero by beating the round 20 boss on Normal. Saves migrate (Danger 0 to Easy, 1 to Normal, 2-5 to Hard; best rounds collapse the same way). Achievements `dangerWin`/`dangerAll` became `difficultyWin`/`difficultyAll` (Normal, Hard; 178 to 166 achievements). `--danger` became `--difficulty` in the sim and the bot, `?danger=` became `?difficulty=`, and balance goal #4 compares Easy, Normal and Hard.
- **game:** Normal (non-boss) rounds last at most 2 minutes: `min(120, 30 + 5 * (N - 1))` (`ROUNDS.roundMax`), reached at round 19. Boss rounds are unchanged.

### Added

- **ui:** Show the skill tree as a grid of squares ([85bb715](https://github.com/AlexGalhardo/pinguin-survivors/commit/85bb715))
- **ui:** Flatten every menu and group controls with thin borders ([8e39cd7](https://github.com/AlexGalhardo/pinguin-survivors/commit/8e39cd7))
- **arena:** Add easy, normal and hard difficulty, cap rounds at 2 minutes and play each boss's theme ([13e25b1](https://github.com/AlexGalhardo/pinguin-survivors/commit/13e25b1))
- **audio:** Compose ten boss themes, nine round themes and a shop theme ([3f7e6c7](https://github.com/AlexGalhardo/pinguin-survivors/commit/3f7e6c7))

### Maintenance

- **release:** Mark 0.9.0 as the current release ([d3a8d2c](https://github.com/AlexGalhardo/pinguin-survivors/commit/d3a8d2c))

## [0.9.0] - 2026-11-10

### Added

- **game:** Ambient weather per biome with Phaser 4 particles: snow (Antarctica), wind-blown leaves and dust (forest), green spores (city), rain (station) and embers and ash (ruins); capped per tier (low 40%).
- **game:** Animated campfires scattered through each arena (seeded, no collision) with a pulsing warm light, additive glow and rising embers; the pulse is steady with reduced flashes.
- **docs:** SDD-017 (round 1 at 30 s, ambient weather, campfires and lighting).
- **game:** Five new bosses (Leopard Seal Matriarch, Rotten Treant, Hive Queen, Drowned Diver, Plague Hierophant) with names and descriptions in the 4 languages; sprite scale entries are provisional until the art lands.
- **game:** Bosses telegraph four area attacks with red marks on the ground before they hurt: a rain of circles, expanding rings with a safe gap, beams in two volleys and a checkerboard floor (SDD-016).
- **game:** Elites draw one of five red-mark area attacks at spawn (seeded) and use it every 6 s when the hero is within reach: nova, frontal cone, rotating cross, stomp trail and cage; at most 4 elite attacks on screen (SDD-016 RF-09).
- **docs:** SDD-016, ADR-023 and roadmap tasks T7.16–T7.19; GDD and balancing docs updated for the 50-round campaign.
- **balance:** Set each boss's health from a per-boss table ([b298ef6](https://github.com/AlexGalhardo/pinguin-survivors/commit/b298ef6))
- **sim:** Teach the bot to dodge red marks and add normal-round damage to the sim ([bbce6a1](https://github.com/AlexGalhardo/pinguin-survivors/commit/bbce6a1))
- **sim:** Simulate the two clocks, area attacks and 50-round goals ([f28a496](https://github.com/AlexGalhardo/pinguin-survivors/commit/f28a496))
- **balance:** Cut fish per kill and cap the boss timer at 10 minutes ([4c77e35](https://github.com/AlexGalhardo/pinguin-survivors/commit/4c77e35))
- **art:** Animate the plague hierophant boss ([728228f](https://github.com/AlexGalhardo/pinguin-survivors/commit/728228f))
- **art:** Animate the hive queen and drowned diver bosses ([89ead7d](https://github.com/AlexGalhardo/pinguin-survivors/commit/89ead7d))
- **ui:** Split the shop right column into your gear and details ([dce7b57](https://github.com/AlexGalhardo/pinguin-survivors/commit/dce7b57))
- **art:** Animate the leopard seal and rotten treant bosses ([5b71f24](https://github.com/AlexGalhardo/pinguin-survivors/commit/5b71f24))
- **hud:** Show toasts on the right side between the fps and speed labels ([d0504ba](https://github.com/AlexGalhardo/pinguin-survivors/commit/d0504ba))
- **arena:** Run game speed on two clocks, 1x to 2x ([28aa4a8](https://github.com/AlexGalhardo/pinguin-survivors/commit/28aa4a8))
- **arena:** Add biome weather, campfires and per-biome lighting ([9089e34](https://github.com/AlexGalhardo/pinguin-survivors/commit/9089e34))
- **art:** Give jack's super a ring of spinning blades ([c422f35](https://github.com/AlexGalhardo/pinguin-survivors/commit/c422f35))
- **balance:** Start the first round at 30 seconds ([470e37d](https://github.com/AlexGalhardo/pinguin-survivors/commit/470e37d))
- **arena:** Give each elite one of five telegraphed area attacks ([8e8df07](https://github.com/AlexGalhardo/pinguin-survivors/commit/8e8df07))
- **balance:** Double elite health and size ([3bab43b](https://github.com/AlexGalhardo/pinguin-survivors/commit/3bab43b))
- **art:** Draw the forest trees at twice their size ([a142d23](https://github.com/AlexGalhardo/pinguin-survivors/commit/a142d23))
- **art:** Animate the abomination boss ([5d5b5c4](https://github.com/AlexGalhardo/pinguin-survivors/commit/5d5b5c4))
- **art:** Animate the harbor kraken without the baked ground patch ([aadc3d6](https://github.com/AlexGalhardo/pinguin-survivors/commit/aadc3d6))
- **shop:** Spell out support upgrades as upgrade to level N ([b427d4e](https://github.com/AlexGalhardo/pinguin-survivors/commit/b427d4e))
- **shop:** Label support offers as new or as their next level ([77f3a0d](https://github.com/AlexGalhardo/pinguin-survivors/commit/77f3a0d))
- **arena:** Telegraph boss area attacks with red ground marks ([31b1ac0](https://github.com/AlexGalhardo/pinguin-survivors/commit/31b1ac0))
- **arena:** Run the campaign over five biomes with ten bosses ([96ea58b](https://github.com/AlexGalhardo/pinguin-survivors/commit/96ea58b))

### Changed

- **game:** Boss HP comes from an explicit per-boss table (`BOSS_HP`, SDD-016 RF-10: 3000, 4000, 5500, 7500, 10000, 12500, 17000, 22000, 27000, 33000 for rounds 5-50, provisional) instead of doubling per boss (boss 50 was about 1.2M). Endless bosses multiply their table value by `endlessBossStep` 1.2 per boss after round 50. `scaling.bossHpPerBoss` removed.
- **sim:** Normal rounds now take damage below the safe crowd: `SIM.touchPerEnemy` (contact per enemy alive) and `SIM.shotLand` (ranged shots), fit to the playtest bot at a third of its value; the boss superpower damage uses `SIM.superBossShare` (Jack and Lucia 1, Bob 0.25, from SuperpowerSystem) instead of a fixed 0.5. L1 median 18 to 9-10, L10 24 to 18; see docs A2b.
- **bot:** The playtest bot dodges the red marks of bosses and elites (`safePoint` in `src/logic/hazard-escape.ts`, `--ignore-marks` for the old behavior) and logs `damageBySource` per round.
- **sim:** The headless sim models the two clocks (SDD-018): combat terms run `m = motion / clock = 2` times faster per round second, spawn budget, boss time limit and red marks follow the round clock (`--speed 1|1.5|2` only changes wall seconds). Boss red marks use the real `BOSS_HAZARD` damage and a landing chance (`SIM.hazardHit`); swipes, charges, volleys, acid pools and roars come from the boss profile; elite red marks are a separate damage term instead of a contact multiplier. Fish per kill (`ECONOMY.fishDrop`) now enters the income. Boss time-outs are counted apart from deaths by damage (`SimResult.cause`), `SIM.maxRound` is 70, `past30` became `past50`, and the balance-goal windows for 50 rounds are a proposal (`GOAL_ROUNDS`).
- **game:** Fish per kill cut: common enemies drop 1 Fish with 0.5% chance (was 5%); elites drop Fish only 25% of the time (was guaranteed), 2 for purple and 4 for orange (was 3 and 6). Boss and end-of-round Fish are unchanged (`ECONOMY.fishDrop`, `rollFishDrop`). Bosses no longer roll the common drop.
- **game:** Boss time limit is capped at 10 minutes (`ROUNDS.bossTimeMax` 600 s): bosses 45, 50 and the whole endless use 600 s.
- **ui:** Shop right column split in two (wireframe 2.12): on the left "YOUR EQUIPMENT" (weapon rows with rarity and SELL/FUSE beside the picked one, five equipment rows, support items and potion, all focusable) and on the right "DETAILS" in a fixed spot (card of the focused item or offer, what buying does, the stat changes in green/red, and the hero stats as a compact two-column grid at the bottom). Offer rows no longer cut text with an ellipsis; phone landscape keeps its compact layout.
- **game:** Magnetic now has a clear effect: extra pull radius 120/200/300/420/560 and pull speed x1.5/1.9/2.4/3/3.8 by level. Equipment and potion drops are pulled in by the pickup range too, and at the end of a round everything left on the ground (XP, Fish, gear, potions) flies to the hero before the cards or shop open. Fish on the ground are drawn at twice the size. Achievement and equipment toasts moved to the right edge, between the FPS meter and the speed hint.
- **game:** The first round lasts 30 s instead of 20 s (`ROUNDS.firstDuration`; later normal rounds keep the +5 s step, so each is 10 s longer).
- **game:** Darkness layer per biome: its own night tint and strength (never above 0.66), a screen-edge vignette, a soft wider halo around the hero and a light on rarity III+ drops (SDD-017).
- **game:** Game speed is now 1x / 1.5x / 2x (default 1x). Movement and attacks run at twice the speed factor (the new 1x moves like the old 2x, the new 2x like the old 4x) while the round timer, the boss time limit, the spawn budget and the red boss/elite marks follow the plain factor, so a 30 s round lasts 30 s at 1x and 15 s at 2x with the same enemy count (SDD-018, ADR-024). Saved 3x/4x become 2x. Balance impact (more combat per round second) still needs a balance pass.
- **game:** Elites have double HP (purple 2→4, orange 3→6) and double size (scale 1.25→2.5, 1.4→2.8); the hit radius grows with the sprite (SDD-016 RF-09).
- **art:** Forest (biome 2) trees, the pine and the dry tree, are drawn at twice their size: packed 2x with nearest-neighbor in the `forest` atlas, and their collision circle doubles (`decoRadiusMul`); logs and rocks are unchanged.
- **game:** The campaign now has 50 rounds and 5 biomes (research station 31–40 and ruined city 41–50 are no longer endless-only); the endless starts at round 51 and each loop is 50 rounds (ADR-023, SDD-016).
- **game:** A distinct boss every 5 rounds up to 50 (ten in total); from round 51 the boss is random among the ten.

### Fixed

- **arena:** Make the magnet felt and collect leftovers at round end ([30560ca](https://github.com/AlexGalhardo/pinguin-survivors/commit/30560ca))
- **arena:** Make boss area marks read as danger on dark floors ([37875af](https://github.com/AlexGalhardo/pinguin-survivors/commit/37875af))
- **shop:** Drop locked support offers that can no longer be bought ([d902807](https://github.com/AlexGalhardo/pinguin-survivors/commit/d902807))

### Maintenance

- **balance:** Add progression report 2 on the updated sim ([dd07d6f](https://github.com/AlexGalhardo/pinguin-survivors/commit/dd07d6f))
- **docs:** Bring docs and site copy up to the current game ([324bbcd](https://github.com/AlexGalhardo/pinguin-survivors/commit/324bbcd))
- **docs:** Describe the 50-round campaign in agents and add economy report 2 ([1501d79](https://github.com/AlexGalhardo/pinguin-survivors/commit/1501d79))
- **balance:** Report boss, progression and economy balance for 50 rounds ([19bf9a3](https://github.com/AlexGalhardo/pinguin-survivors/commit/19bf9a3))
- **art:** Catch neon green and cyan bursts in boss frame cleanup ([77a1b17](https://github.com/AlexGalhardo/pinguin-survivors/commit/77a1b17))
- **art:** Pick clean boss frames from raw text animations ([4b998d2](https://github.com/AlexGalhardo/pinguin-survivors/commit/4b998d2))
- **art:** Format the kraken-b atlas json ([396debf](https://github.com/AlexGalhardo/pinguin-survivors/commit/396debf))
- **docs:** Specify ten bosses, five campaign biomes and area attacks ([c8330e4](https://github.com/AlexGalhardo/pinguin-survivors/commit/c8330e4))

## [0.8.0] - 2026-11-10

### Added

- **ui:** Style D foundations: type scale, 4 px spacing and elevation tokens, the `d-*` utilities (vignette, glow, filet, chamfer, worn border, focus) and the new `Ornament`, `Vignette` and `MenuList` components.
- **ui:** Level-up cards can be picked with keys 1–4 and rerolled with R.
- **ui:** The game over and demo end screens ignore input for half a second after opening, so a key mashed in combat does not confirm them.
- **ui:** Restyle the HUD and touch controls in Style D with a fixed top stack ([915500a](https://github.com/AlexGalhardo/pinguin-survivors/commit/915500a))
- **ui:** Restyle the demo end screen in Style D with an input grace window ([92a7b2c](https://github.com/AlexGalhardo/pinguin-survivors/commit/92a7b2c))
- **ui:** Restyle the controls in Style D ([a72ecef](https://github.com/AlexGalhardo/pinguin-survivors/commit/a72ecef))
- **ui:** Restyle the unlock screen in Style D ([e993d56](https://github.com/AlexGalhardo/pinguin-survivors/commit/e993d56))
- **ui:** Restyle the skill tree detail as a corner tooltip in Style D ([a30cec8](https://github.com/AlexGalhardo/pinguin-survivors/commit/a30cec8))
- **ui:** Restyle the game over screen in Style D with an input grace window ([359a778](https://github.com/AlexGalhardo/pinguin-survivors/commit/359a778))
- **ui:** Restyle achievements, extras and history in Style D with paged lists ([d71cb2a](https://github.com/AlexGalhardo/pinguin-survivors/commit/d71cb2a))
- **ui:** Restyle the level-up cards in Style D with 1-4 hotkeys ([fe1acba](https://github.com/AlexGalhardo/pinguin-survivors/commit/fe1acba))
- **ui:** Restyle the settings in Style D with tabs and one hint line ([b2bcc53](https://github.com/AlexGalhardo/pinguin-survivors/commit/b2bcc53))
- **ui:** Restyle the pause screen in Style D ([6879063](https://github.com/AlexGalhardo/pinguin-survivors/commit/6879063))
- **ui:** Restyle the heroes and potions screen in Style D ([488201c](https://github.com/AlexGalhardo/pinguin-survivors/commit/488201c))
- **ui:** Restyle the shop to fit 1080p, 720p and phone in Style D ([103b731](https://github.com/AlexGalhardo/pinguin-survivors/commit/103b731))
- **ui:** Restyle the hero select in Style D ([ba3d985](https://github.com/AlexGalhardo/pinguin-survivors/commit/ba3d985))
- **ui:** Restyle the save slots in Style D ([ef79a7e](https://github.com/AlexGalhardo/pinguin-survivors/commit/ef79a7e))
- **ui:** Restyle the main menu in Style D ([1bc445f](https://github.com/AlexGalhardo/pinguin-survivors/commit/1bc445f))
- **ui:** Load Cinzel 700 and 900 for titles (T3.14) ([eadde2e](https://github.com/AlexGalhardo/pinguin-survivors/commit/eadde2e))
- **ui:** Finish Style D primitives base (T3.13) ([64e2ec0](https://github.com/AlexGalhardo/pinguin-survivors/commit/64e2ec0))
- **ui:** Restyle Btn, MenuScreen, AdjustRow and Toast in Style D ([e547c25](https://github.com/AlexGalhardo/pinguin-survivors/commit/e547c25))
- **ui:** Restyle Panel, Heading, ItemCard and rows in Style D ([4f4e97a](https://github.com/AlexGalhardo/pinguin-survivors/commit/4f4e97a))
- **ui:** Add d-pad, d-cta and d-danger utilities ([8e62c05](https://github.com/AlexGalhardo/pinguin-survivors/commit/8e62c05))
- **ui:** Add MenuList for focus-by-diamond option lists ([855bd3a](https://github.com/AlexGalhardo/pinguin-survivors/commit/855bd3a))
- **ui:** Add Ornament and Vignette primitives ([fd03192](https://github.com/AlexGalhardo/pinguin-survivors/commit/fd03192))
- **ui:** Add Style D tokens and d-* utilities to the theme ([b6650b4](https://github.com/AlexGalhardo/pinguin-survivors/commit/b6650b4))

### Changed

- **ui:** Screen and item titles use the Cinzel font (700 and 900); Chinese titles keep falling back to Noto Sans SC.
- **ui:** `Panel`, `Heading`, `ItemCard`, `StatRow`, `Hint`, `Bar`, `Btn`, `MenuScreen`, `AdjustRow`, `SlotIcon` and `Toast` now look like the Diablo 4 organic style (text buttons with a diamond focus, borderless surfaces, glow and vignette behind menus, top-center toasts).
- **ui:** Every menu and the HUD now use the organic Diablo 4 look (Style D): content floats over a dark vignette instead of web-style cards, option lists highlight with a gold diamond, secondary text is at least 22 px at 1080p and panels keep tight padding.
- **ui:** The shop and the pause screen fit 1080p, ultrawide, 720p and phones without clipping; on phones, tapping a slot opens a sell/fuse bar.
- **ui:** Settings are split into tabs with one hint line; achievements, extras and history are paged lists (PageUp/PageDown or L1/R1 jump a page); the match history shows an outcome seal.
- **ui:** The skill tree detail is a tooltip anchored to the node with the mouse and fixed in a corner with keyboard, gamepad or touch, so it never hides neighbouring nodes.
- **ui:** The HUD stacks round, timer, elite banner and boss bar at the top centre and shows at most two gambits on phones.
- **docs:** The UI direction is now the organic Diablo 4 style (Style D): wireframes of every screen, design system v2, ADR-022, SDD-015, roadmap tasks T3.13–T3.18 and the `pinguin-ui-hud` skill for menus and HUD.

### Fixed

- **release:** Write the generated notes into the changelog section ([638f371](https://github.com/AlexGalhardo/pinguin-survivors/commit/638f371))

### Maintenance

- **roadmap:** Close T3.15-T3.18 with the Style D evidence ([08a3b20](https://github.com/AlexGalhardo/pinguin-survivors/commit/08a3b20))
- **repo:** Keep the exported wireframe SVGs out of Biome ([41eccf5](https://github.com/AlexGalhardo/pinguin-survivors/commit/41eccf5))
- **skills:** Add the pinguin-ui-hud skill and point the UI rules at Style D ([58929dc](https://github.com/AlexGalhardo/pinguin-survivors/commit/58929dc))
- **sdd:** Approve SDD-015 and plan tasks T3.13-T3.18 for the Style D UI ([4226e4c](https://github.com/AlexGalhardo/pinguin-survivors/commit/4226e4c))
- **adr:** Accept ADR-022, the organic Diablo 4 UI with Cinzel titles ([bdd8146](https://github.com/AlexGalhardo/pinguin-survivors/commit/bdd8146))
- **design:** Rewrite the design system for the organic Diablo 4 style ([5190dd4](https://github.com/AlexGalhardo/pinguin-survivors/commit/5190dd4))
- **wireframes:** Add the four-style wireframes and the Style D screen specs ([4249f9f](https://github.com/AlexGalhardo/pinguin-survivors/commit/4249f9f))
- **repo:** Run the browser e2e on pull requests ([51e928c](https://github.com/AlexGalhardo/pinguin-survivors/commit/51e928c))
- **repo:** Move the code of conduct and security policy to the repository root ([e18d6d3](https://github.com/AlexGalhardo/pinguin-survivors/commit/e18d6d3))
- **changelog:** Backfill the notes of 0.6.0 to 0.7.2 ([cd254e7](https://github.com/AlexGalhardo/pinguin-survivors/commit/cd254e7))

## [0.7.2] - 2026-11-09

### Changed

- **boss:** Boss HP doubles with every boss ([37a35c2](https://github.com/AlexGalhardo/pinguin-survivors/commit/37a35c2))

### Maintenance

- **rounds:** Boss HP doubles with every boss ([7b0cb02](https://github.com/AlexGalhardo/pinguin-survivors/commit/7b0cb02))

## [0.7.1] - 2026-11-09

### Added

- **rounds:** Boss every 5 rounds and longer rounds with no cap ([0fd87d4](https://github.com/AlexGalhardo/pinguin-survivors/commit/0fd87d4))

### Maintenance

- **rounds:** Specify longer rounds and a boss every 5 rounds ([5ff5caa](https://github.com/AlexGalhardo/pinguin-survivors/commit/5ff5caa))

## [0.7.0] - 2026-11-09

### Added

- **sim:** Balance-goals takes --seed, patches LEVEL_GROWTH and reads tails as 1% ([470832e](https://github.com/AlexGalhardo/pinguin-survivors/commit/470832e))
- **sim:** Balance-goals script measures goals 1-6 with in-memory patches ([2f228b9](https://github.com/AlexGalhardo/pinguin-survivors/commit/2f228b9))
- **sim:** Model the evolution shop, Elite Marks and Boss Cores ([c223f4d](https://github.com/AlexGalhardo/pinguin-survivors/commit/c223f4d))

### Changed

- **rounds:** Steeper enemy scaling per 10-round cycle ([6699904](https://github.com/AlexGalhardo/pinguin-survivors/commit/6699904))
- **shop:** Rarity IV from round 11 and V from round 21 ([7292aba](https://github.com/AlexGalhardo/pinguin-survivors/commit/7292aba))
- **danger:** Danger 5 enemies hit a little harder ([0374392](https://github.com/AlexGalhardo/pinguin-survivors/commit/0374392))
- **lucia:** Sturdier base and faster level growth ([c79c713](https://github.com/AlexGalhardo/pinguin-survivors/commit/c79c713))
- **endless:** Steeper endless loops so L20 builds stop before round 60 ([35e9df1](https://github.com/AlexGalhardo/pinguin-survivors/commit/35e9df1))

### Fixed

- **assets:** Bust the HTTP cache of game assets on every build ([2743c82](https://github.com/AlexGalhardo/pinguin-survivors/commit/2743c82))
- **bot:** Price the +1 potion button with the pure helper ([e26a67c](https://github.com/AlexGalhardo/pinguin-survivors/commit/e26a67c))

### Maintenance

- **balance:** Record the evolution-shop balance pass and the sim/bot gap ([3c36716](https://github.com/AlexGalhardo/pinguin-survivors/commit/3c36716))

## [0.6.0] - 2026-11-09

### Added

- **shop:** Evolution shop with rarities I-V, Elite Marks and Boss Cores ([6da3574](https://github.com/AlexGalhardo/pinguin-survivors/commit/6da3574))
- **potion:** Rounds start with empty potions, refilled by kills ([a6b1b64](https://github.com/AlexGalhardo/pinguin-survivors/commit/a6b1b64))

### Fixed

- **release:** List every micro-commit in the release notes ([ebbe998](https://github.com/AlexGalhardo/pinguin-survivors/commit/ebbe998))

### Maintenance

- **potion:** Say potions refill by kills within the round ([f9360ee](https://github.com/AlexGalhardo/pinguin-survivors/commit/f9360ee))
- **shop:** Specify the evolution shop with rarities I-V and materials (ADR-021) ([46e08ae](https://github.com/AlexGalhardo/pinguin-survivors/commit/46e08ae))
- **roadmap:** Close T5.7 with the GitHub Pages deploy ([fb9b8a7](https://github.com/AlexGalhardo/pinguin-survivors/commit/fb9b8a7))
- **changelog:** List every 0.5.0 micro-commit ([c40d919](https://github.com/AlexGalhardo/pinguin-survivors/commit/c40d919))

## [0.5.0] - 2026-11-08

### Added

- **tree:** Edit the skill tree from the pause and the shop ([46b2d1b](https://github.com/AlexGalhardo/pinguin-survivors/commit/46b2d1b))
- **art:** The Moose King boss gets its own animated art ([0a00ba1](https://github.com/AlexGalhardo/pinguin-survivors/commit/0a00ba1))
- **tree:** Show ranks on the tree screen and refund one rank at a time ([e9598fb](https://github.com/AlexGalhardo/pinguin-survivors/commit/e9598fb))
- **ui:** Phone landscape layout and touch gestures for the skill tree ([ecbf75c](https://github.com/AlexGalhardo/pinguin-survivors/commit/ecbf75c))
- **shop:** Gear equips on purchase and there is no bag ([0596892](https://github.com/AlexGalhardo/pinguin-survivors/commit/0596892))
- **tree:** Ranked passive nodes that take up to 5 points ([0add8d6](https://github.com/AlexGalhardo/pinguin-survivors/commit/0add8d6))
- **shop:** Healing potions refill at every round start ([db6bcea](https://github.com/AlexGalhardo/pinguin-survivors/commit/db6bcea))

### Changed

- **danger:** Make Danger 0 an easy mode with half enemy HP and damage ([ae9a84b](https://github.com/AlexGalhardo/pinguin-survivors/commit/ae9a84b))

### Fixed

- **art:** Give the Moose King boss a sprite until its own art lands ([57a3442](https://github.com/AlexGalhardo/pinguin-survivors/commit/57a3442))

### Maintenance

- **site:** Host the full game at /play/ next to the demo ([89b7ff2](https://github.com/AlexGalhardo/pinguin-survivors/commit/89b7ff2))
- **repo:** Record ranked tree nodes, the in-run tree and this round of tasks ([4dd6338](https://github.com/AlexGalhardo/pinguin-survivors/commit/4dd6338))
- **art:** Keep the new kraken and abomination candidates for review ([c1c0a4a](https://github.com/AlexGalhardo/pinguin-survivors/commit/c1c0a4a))
- **platform:** Check that unlocked achievements reach the platform ([9faaaff](https://github.com/AlexGalhardo/pinguin-survivors/commit/9faaaff))
- **sim:** Let the playtest bot buy healing potions and the Magnetic ([01139b2](https://github.com/AlexGalhardo/pinguin-survivors/commit/01139b2))
- **desktop:** Smoke the exe from a fresh profile through the save slots ([8067717](https://github.com/AlexGalhardo/pinguin-survivors/commit/8067717))
- **repo:** Keep the local wireframe prompts file out of git ([682ee98](https://github.com/AlexGalhardo/pinguin-survivors/commit/682ee98))
- **marketing:** Add the Steam page texts in four languages (T5.8) ([368c9c7](https://github.com/AlexGalhardo/pinguin-survivors/commit/368c9c7))
- **marketing:** Add the trailer script draft (T9.3) ([9dcc2f9](https://github.com/AlexGalhardo/pinguin-survivors/commit/9dcc2f9))
- **balance:** Turn the developer's playtest feedback into 7 hypotheses ([778a8c5](https://github.com/AlexGalhardo/pinguin-survivors/commit/778a8c5))
- **release:** Require micro-commits and releases that list each commit ([a4ccff5](https://github.com/AlexGalhardo/pinguin-survivors/commit/a4ccff5))

## [0.4.0] - 2026-11-08

## [0.3.0] - 2026-11-08

## [0.2.0] - 2026-11-08

### Added

- Animated original aliens (six enemies and the Biomechanical Colossus boss) in the destroyed city, and a top-down Antarctica tileset with borders replacing the checkerboard floor; the forest crow is tinted lighter for readability.

- Platform polish: runs pause when the window or app loses focus (Steam overlay, alt-tab, Android background); a Quit button on desktop and mobile; Android back maps to Esc; compact React layout for phone landscape (844×390 and up) with touch controls hidden under full-screen overlays; the desktop shell remembers window size and fullscreen; `scripts/qa-mobile.ts` and `scripts/smoke-desktop.ts`.

- Forest and destroyed-city art (PixelLab, 87 generations): seamless 64×64 floor tiles, borders and four solid props each; concepts for the six original aliens and the Biomechanical Colossus await approval before animation.

- Forest and city music with music per biome (endless follows the drawn biome), eight weapon SFX, boss roars and boss-down, and UI hover/confirm/back sounds (ElevenLabs, normalized), plus kraken ink, abomination acid, Pearls earned, Danger unlocked, equip and demo end.

- The React UI draws atlas art: weapon tiers in the HUD, shop and pause, gear and item icons, card icons, Fish and Pearl coins and Danger icons, with the old text as fallback.

- Forest (rounds 11–20) and destroyed city (21–30) biomes with their enemies and bosses (Moose King, Biomechanical Colossus), six original aliens including a cloaked stalker, code placeholders for floors and props; endless rounds draw biomes and enemies from every set, legacy ones included.
- The simulation's buyer models a player (softmax choice, set synergy, per-run taste); balance goals #1–#8 pass, with #5 per hero as a documented exception.

- Art (PixelLab, 126 generations): weapon tiers II–IV for the nine demo weapon lines, four top-down Antarctica props, 51 icons (stat cards, Jack's exclusives, items, coins, Danger), Jack's Crimson Harvest super VFX and a new top-down Jack with idle, walk, hurt and death in all directions.
- Sprite scale table (`src/data/sprite-scale.ts`) that evens out hero, enemy and boss sizes against the 64-unit tile, Brotato-style (`docs/reports/proportions-2026-11-08.md`).

- Site press kit at `/press/` in four languages and a `SITE_RELEASED` build flag that turns the Wishlist CTA into Buy; the site uses Roboto.

- Extra starting weapons bought with Pearls per hero in the Workshop (SDD-002 RF-05): saved in `unlocks.startingWeapons`, offered in the hero select, announced by an Unlock screen; hidden in the demo.
- Shop sound effects (open, buy, reroll, lock, fuse, out of Fish), element hit sounds (fire, ice, earth, lightning, freeze) and the shop music (ElevenLabs, loudness-normalized).

### Changed

- `scripts/release.ts --stable` publishes a 0.x release as the repository's Latest instead of a pre-release; releases from 0.2.0 on use it (SDD-011 1.1).

- Runs start with 10 Fish so the first shop can sell a tier I weapon: early deaths in round 3 came from runs that never bought a weapon. Balance 1.0 closes with goals #1–#8 met or justified.

- Balance goals: #2 allows up to 5% of runs to die before round 12 and #5 is measured per hero; the Lightning Totem moves to the support set; the demo length counts 45 s per shop/cards screen.

- Design (ADR-016): biome 2 becomes a forest (rounds 11–20) and biome 3 a destroyed city with an original alien faction (rounds 21–30); from round 31 the endless mode draws biomes and enemies from every set, including the legacy station and ruins.

- Effects follow the platform performance tier (SDD-007): low caps decals at 1,000, turns off dynamic lights and bloom and halves particles; mid sits between; `?tier=low|mid|high` forces it for QA.

- Every game text uses Roboto (no pixel font) for readability; Pixelify Sans and Rubik are removed.

### Fixed

- The menu controller test mocks `exportTelemetry`, so `tests/ui` passes on its own.

## [0.1.0] - 2026-11-08

## [0.0.13] - 2026-11-08

### Added

- Android shell (`apps/mobile/`, Capacitor 8.6.0, SDD-007 RF-04): landscape immersive WebView, `window.platform` bridge over Preferences, safe areas, on-screen joystick and buttons (`TouchControls`, `?touch=1` to preview), and a manual `android.yml` workflow that builds the AAB.

- The React menus draw the Jack or Bob key art behind them (integer pixel scale, darkened for readability).
- Earned achievements are reported to the platform (Steam on desktop, no-op on the web); the demo hides achievements and heroes outside its scope and logs a demo win as `demoWin`.

- Windows desktop shell (`apps/desktop/`, SDD-007): Electron 45.2.3 with a frameless fullscreen window, `window.platform` bridge (atomic `save.json`, export dialog, Steam overlay links), steamworks.js 0.4.0 when an App ID exists, `bun run build:desktop[:demo]` and a manual `desktop.yml` workflow.

- Demo rules in game: Jack only, rounds 1–10, Danger up to 1, and the DemoEnd screen with the wishlist button; `bun run e2e -- --demo`.
- Local telemetry toggle and JSONL export in Settings; set and tier IV progress recorded after every build change.

- 47 new achievements (178 total) for Danger wins, set completion, fusions and tier IV loadouts, and round 60, in four languages; `src/data/steam-achievements.ts` maps every achievement to a Steam API name.

- Static commercial site in Astro 7.4.7 (`site/`, SDD-008): landing in four languages with SEO, hreflang, sitemap and the playable demo under `/demo/`; `scripts/build-site.ts` builds it, and `.github/workflows/pages.yml` deploys only when run manually.

- Balance tooling (SDD-013): `scripts/balance-report.ts` turns sim/bot JSONL into a goals #1–#8 report, `sim.ts --jsonl` covers hero × level × Danger, local opt-in telemetry (`src/logic/telemetry.ts`), and the playtest bot plays the shop step by step with the sim's policy.

- In-run React screens behind `?reactUi=1`: level-up cards with card reroll, pause with settings, unlocks and game over with Pearls earned; shop gear and potions are bought through `purchase`, and shop potions are drunk at the next round start. `bun run e2e -- --react` walks the whole React flow.

- The merchant talks in a speech bubble (open, buy, out of Fish, reroll, fuse, leave) in four languages; the shop layout fits 1366×768 up to 2560×1440.
- `DemoEnd` screen with a Steam wishlist button (URL placeholder until the app id exists).

- Spanish and Simplified Chinese (SDD-009): full tables, `bun scripts/i18n-check.ts`, a glossary, the Noto Sans SC font loaded only for Chinese, and both languages in the settings.
- The React shop shows gear (rarity color) and potion offers.

- Danger 0–5 in game: modifiers per Danger, extra elite/horde waves with a banner and a shop warning, next Danger unlocked per hero by the round-20 boss, best round per Danger; Danger and starting weapon chosen in the hero select; `?danger=` and `?weapon=` for QA.
- Shop offers mix weapons, gear and (from round 5) run potions; `purchase` applies each kind.
- Demo build (`bun run build:demo`): Jack, rounds 1–10, Danger up to 1, with a bundle check; demo saves import into the full game.
- React menus wired to the save behind `?reactUi=1` (main menu, hero select, hero screen and Workshop, settings, controls, achievements, extras, history).

- `Platform` layer (SDD-007): web implementation (localStorage, `.json` export/import, performance tier) and a `window.platform` bridge for the Electron and Capacitor shells; `src/core/storage.ts` delegates to it.

- End-of-round flow in game (SDD-003): round end → queued level-up cards → React shop (buy by slot, reroll, lock, sell, fuse) → next round with autosave; Fish turn into Pearls at the end of the run, and the Workshop, potions and menu wallet spend Pearls.

- Level-up offers 4 cards (stats, exclusive actives and passives only), a new `harvesting` stat that multiplies end-of-round Fish, and the Workshop upgrade Insight (one card reroll per run) (SDD-003 RF-05, RF-08).
- Danger 0–5 rules (SDD-005): HP/damage/speed/drop modifiers, seeded extra waves from Danger 2, per-hero unlock by beating the round-20 boss, best round per Danger in the save and `--danger N` in the simulation.

### Changed

- `scripts/qa-browsers.ts` walks the React flow in Chrome, Edge and Firefox (muted) and writes a report with errors, 4xx/5xx and FPS per browser.

- Balance pass for 1.0: every Workshop upgrade gives ×0.6 per level (Insight unchanged) and the Element Staff base damage rises 10 → 16 (`docs/reports/balance-proposal-2026-11-08.md`).

### Removed

- Every Phaser UI scene (menus, hero select, hero/Workshop, settings, controls, achievements, extras, history, card pick, pause, game over, unlock), `src/scenes/ui-phaser/` and `installCrispText`: the UI is React only; `?reactUi` and `?uiHud` are gone.

- The old difficulty setting (`settings.difficulty`, `DIFFICULTIES`, `difficultyMods`), replaced by Danger.

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

[Unreleased]: https://github.com/AlexGalhardo/pinguin-survivors/compare/v0.10.1...HEAD
[0.10.1]: https://github.com/AlexGalhardo/pinguin-survivors/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/AlexGalhardo/pinguin-survivors/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/AlexGalhardo/pinguin-survivors/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/AlexGalhardo/pinguin-survivors/compare/v0.7.2...v0.8.0
[0.7.2]: https://github.com/AlexGalhardo/pinguin-survivors/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/AlexGalhardo/pinguin-survivors/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/AlexGalhardo/pinguin-survivors/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/AlexGalhardo/pinguin-survivors/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/AlexGalhardo/pinguin-survivors/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/AlexGalhardo/pinguin-survivors/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/AlexGalhardo/pinguin-survivors/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/AlexGalhardo/pinguin-survivors/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/AlexGalhardo/pinguin-survivors/compare/v0.0.13...v0.1.0
[0.0.13]: https://github.com/AlexGalhardo/pinguin-survivors/compare/v0.0.12...v0.0.13
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
