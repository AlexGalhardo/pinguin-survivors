<div align="center">

<h1><strong>Pinguin Survivors</strong></h1>

[![CI](https://github.com/AlexGalhardo/pinguin-survivors/actions/workflows/ci.yml/badge.svg)](https://github.com/AlexGalhardo/pinguin-survivors/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.md)
[![Phaser 4](https://img.shields.io/badge/phaser-4.2-8e44ad)](package.json)
[![Bun](https://img.shields.io/badge/bun-1.4-f472b6?logo=bun&logoColor=white)](package.json)
<a href="https://github.com/AlexGalhardo/pinguin-survivors/releases"><img src="https://img.shields.io/github/v/release/AlexGalhardo/pinguin-survivors?include_prereleases&label=version" alt="Version"></a>

<h3><strong>Three penguins. Three hundred zombies a round. Blood on the snow.</strong></h3>

</div>

## Introduction

Pinguin Survivors is a Brotato-style arena survivor roguelite in pixel art. Jack (melee), Bob (firearms) and Lucia (magic) are the last three penguins of a zombie apocalypse in Antarctica. Rounds are timed, up to six weapons fire on their own, a shop opens after every round, a boss shows up every ten rounds, and hero progress (level 1–100) never resets.

The game is built with [Phaser 4](https://phaser.io), TypeScript, Vite, React and Tailwind CSS, and runs on Bun. It ships on Steam (Windows, via Electron) and Google Play (Android, via Capacitor), with a browser demo. Art is generated with [PixelLab](https://pixellab.ai) and audio with [ElevenLabs](https://elevenlabs.io).

## Summary

- [Introduction](#introduction)
- [Play](#play)
- [Features](#features)
- [Getting started](#getting-started)
- [Documentation](#documentation)
- [Stability](#stability)
- [Contributing](#contributing)
- [Code of conduct](#code-of-conduct)
- [Security vulnerabilities](#security-vulnerabilities)
- [License](#license)

## Play

- **Demo (browser)**: rounds 1–10 with Jack, coming with the site at `https://alexgalhardo.github.io/pinguin-survivors/demo/` ([ROADMAP](ROADMAP.md) M5).
- **Steam**: demo at the Steam Next Fest of February 22 – March 1, 2027; full release 1.0 afterwards.
- **Google Play**: Android premium after the Steam release.

## Features

- Timed rounds (20 s → 60 s), elites every third round, a boss every tenth round, endless mode.
- Six weapon slots, weapon classes and set bonuses, one I–V rarity scale (white to orange) with random affixes and fusion, a starting weapon per hero. Weapons visibly strike their target (lunge, recoil, throw, plant, cast).
- Shop after every round in a Diablo 4 style (merchant NPC, four offers that say exactly what each purchase changes, reroll, lock, weapons, equipment and speed potions) with an in-run currency (Fish) and a persistent one (Pearls).
- Stat cards on level-up, six exclusive cards per hero, a superpower unlocked at level 5.
- Danger 0–5 per hero, 131 achievements, a passive skill tree per hero (Path of Exile 2 style, replaces the old workshop and stat points), FFXII-style potion gambits, game speed 1× to 4×.
- DOOM-grade gore with a toggle, dynamic lights, hit-stop and screen shake.
- English, Brazilian Portuguese, Spanish and Simplified Chinese.

## Getting started

Requirements: [Bun](https://bun.sh) 1.4 or newer.

```bash
bun install
bun run dev              # Vite dev server
bun run build            # typecheck + production build (dist/)
bun run build:demo       # web demo (VITE_DEMO=1, base /demo/, dist-demo/)
bun run build:desktop    # Electron build for Windows (apps/desktop/dist/full/)
bun run build:desktop:demo  # Electron demo build (apps/desktop/dist/demo/)
bun test                 # bun:test (pure logic)
bun run typecheck        # bun check (TypeScript)
bun run lint             # Biome lint + format
bun run lint:md          # markdownlint on the docs
bun run lint:i18n        # no literal text in the React UI (use t())
bun scripts/i18n-check.ts   # key and placeholder parity across languages
bun scripts/build-site.ts   # demo + Astro site (site/dist/)
bun scripts/balance-report.ts   # balance report from playtest logs
bun run e2e              # Playwright end-to-end (with `bun run dev` running)
```

Tests, sims and bot runs are silent: start the dev server with `SOUND_MUTED=true`.

Debug query parameters: `?skipMenu=1&hero=jack&round=5&seed=1&debug=1`. Copy [.env.example](.env.example) to `.env` for the asset pipelines (PixelLab and ElevenLabs keys are only needed to generate assets).

## Documentation

Everything lives in [docs/](docs/README.md): the [Game Design Document](docs/gdd.md), the [Art Bible](docs/visual.md), the [sound direction](docs/audio.md), the [architecture](docs/architecture.md), the [balancing and simulation playbook](docs/balancing-and-simulation.md), the [agent and git workflow](docs/workflow.md), [market research](docs/web-research.md), the [commercial site spec](docs/site.md), [Architecture Decision Records](docs/adrs/README.md) and [implementation specs](docs/sdds/README.md). The work plan is [ROADMAP.md](ROADMAP.md).

## Stability

Pinguin Survivors follows [Semantic Versioning](https://semver.org) and tags releases as `vX.Y.Z` on `main`: `0.0.x` while the game is in alpha, `0.1.x` from the public demo until launch, and `1.0.0` for the commercial release ([ADR-015](docs/adrs/ADR-015-versionamento-vukem.md)). Changes are listed in [CHANGELOG.md](CHANGELOG.md), which follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Each milestone ships as one release; from `0.2.0` on, releases are marked as Latest (`bun scripts/release.ts X.Y.Z --stable`). Every release carries the Windows builds (full and demo, as zip files) and the Android debug APK.

## Contributing

Thank you for considering a contribution.

- Read the decisions in [docs/adrs/](docs/adrs/README.md) and the specs in [docs/sdds/](docs/sdds/README.md) before changing behaviour. Decisions are final until they are edited: change the ADR first, then the SDD, then the code.
- Write the test first. Run `bun run lint`, `bun run typecheck` and the tests that cover your change.
- Gameplay numbers live in `src/data/`, texts in `src/i18n/` (all four languages together), colors in `src/config/palette.ts`, asset keys in `src/art/manifest.ts`.
- Update the relevant SDD, `CHANGELOG.md` (under `[Unreleased]`) and the documentation in the same change.

The full guide (setup, checks, commit style) is in [CONTRIBUTING.md](CONTRIBUTING.md).

### Pull requests

1. Create a branch from `main`.
2. Make one logical change per commit.
3. Open a pull request against `main` with green checks.

### Commits

Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) in English: `type(scope): description`. Types: `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `ci`, `chore`, `style`, `revert`. Scopes: `arena`, `weapons`, `shop`, `cards`, `economy`, `danger`, `ui`, `hud`, `i18n`, `save`, `platform`, `desktop`, `mobile`, `site`, `art`, `audio`, `balance`, `sim`, `demo`, `release`, `docs`, `deps`.

## Code of conduct

To keep the community welcoming to everyone, please review and follow the [Code of Conduct](.github/CODE_OF_CONDUCT.md).

## Security vulnerabilities

If you discover a security vulnerability, please follow the [security policy](.github/SECURITY.md) instead of opening a public issue.

## License

The source code of Pinguin Survivors is open source software released under the [MIT license](LICENSE.md). The game assets (art, audio, key art, names and story) are **not** covered by the MIT license and remain all rights reserved; see [LICENSE.md](LICENSE.md) for the details.
