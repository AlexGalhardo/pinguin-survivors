# Contributing to Pinguin Survivors

Thank you for considering a contribution. Pinguin Survivors is a TypeScript game on [Phaser 4](https://phaser.io) with a React + Tailwind UI, built and tested with [Bun](https://bun.sh). The desktop (Electron) and Android (Capacitor) ports and the static site (Astro) live in `apps/` and `site/` once they land (see [ROADMAP.md](ROADMAP.md)).

## Before you start

- Read the decisions in [docs/adrs/](docs/adrs/README.md), the interview that produced them in [docs/brainstorming.md](docs/brainstorming.md) and the spec of the area you want to touch in [docs/sdds/](docs/sdds/README.md). Decisions are final until they are edited: change the ADR first, then the SDD, then the code.
- For anything bigger than a small fix, open an issue first so the approach can be agreed.
- Phaser facts come from the **Phaser 4** API (`.agents/skills/` holds the reference notes); most examples on the web are Phaser 3 and differ.
- Game assets are proprietary ([LICENSE.md](LICENSE.md)); pull requests must not add third-party art or audio.

## Local setup

1. Install [Bun](https://bun.sh) 1.4 or newer.
2. `bun install`.
3. Copy [.env.example](.env.example) to `.env`. The PixelLab and ElevenLabs keys are only needed to generate assets; the game runs without them.
4. `bun run dev` and open the URL Vite prints. Debug parameters: `?skipMenu=1&hero=jack&round=5&seed=1&debug=1`.

## Making a change

- Write the test first and keep the change focused on one concern.
- Pure logic (formulas, rolls, stats, rounds, cards, shop, save, arena) lives in `src/logic/`, imports neither Phaser nor React, and is covered by `bun:test` in `tests/`.
- Gameplay numbers live only in `src/data/` and are mirrored in [docs/balancing-and-simulation.md](docs/balancing-and-simulation.md) Part B; update both in the same commit.
- UI strings live only in `src/i18n/` and the four languages (`en`, `pt-BR`, `es`, `zh-CN`) stay in sync (`bun test tests/i18n.test.ts`). Colors live in `src/config/palette.ts`; asset keys in `src/art/manifest.ts`.
- TypeScript strict, no `any` (use `unknown` and narrowing), explicit return types on exported functions.
- No new dependency without prior agreement; versions are pinned exactly to the latest stable release.
- Update the relevant SDD, `CHANGELOG.md` (under `[Unreleased]`) and the documentation in the same change when behaviour, commands or conventions change.

## Checks

Run the checks that cover your change before you push:

| Command | What it checks |
| --- | --- |
| `bun run lint` | Biome lint and format (tabs, width 4) |
| `bun run typecheck` | `tsc --noEmit` |
| `bun test` | unit tests (`bun test tests/<file>.test.ts` for one file) |
| `bun run build` | production build |
| `bun run e2e` | Playwright flow (menu → run → shop → death), with `bun run dev` running |
| `bun scripts/perf.ts --round 40` | 60 FPS budget with 300 enemies and 2,000 decals |

CI runs `lint`, `typecheck`, `test` and `build` on every pull request ([ci.yml](.github/workflows/ci.yml)).

## Commits and pull requests

- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) in English, imperative, lower-case, no trailing period: `feat(shop): add reroll price curve`. Validate with `echo "<msg>" | bunx commitlint`.
- Types: `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `ci`, `chore`, `style`, `revert`. Scopes: `arena`, `weapons`, `shop`, `cards`, `economy`, `danger`, `ui`, `hud`, `i18n`, `save`, `platform`, `desktop`, `mobile`, `site`, `art`, `audio`, `balance`, `sim`, `demo`, `release`, `docs`, `deps`.
- One logical change per commit; branch from `main`; open the pull request against `main` with green checks.
- Releases are cut by the maintainer with `bun scripts/release.ts X.Y.Z` (SemVer, GitHub release in the Keep a Changelog format).

## Code of conduct and security

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md). Report vulnerabilities through the [security policy](SECURITY.md), never in a public issue.
