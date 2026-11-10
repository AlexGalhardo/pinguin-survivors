# Skills de terceiros

Cópias curadas (só `SKILL.md` + referências, **sem** hooks, settings, agentes ou projetos de exemplo), com prefixo da origem, nota de projeto no topo e entrada no `skills-lock.json`. Instaladas em 2026-09-27; **auditadas em 2026-11-08** para a direção da 1.0 (top-down, React, Steam/Android): o que não serve ao ROADMAP foi removido.

| Prefixo | Repositório | Commit | Licença | Mantidas |
|---|---|---|---|---|
| (sem prefixo) | [phaserjs/phaser](https://github.com/phaserjs/phaser) `skills/` | ver `skills-lock.json` | MIT | 26 skills Phaser 4 (removidas `physics-arcade`, `physics-matter`) |
| `gd-` | [gamedev-skills/awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills) | `d4b0e35` | Apache-2.0 | 14: `gd-audio-design`, `gd-camera-systems`, `gd-create-game-assets`, `gd-game-ai`, `gd-game-feel`, `gd-game-ui-ux`, `gd-input-systems`, `gd-performance-optimization`, `gd-phaser-core`, `gd-procedural-gen`, `gd-roguelike`, `gd-rpg`, `gd-save-systems`, `gd-shader-programming`, `gd-steam-publish` |
| `gc-` | [PlayableIntelligence/game-creator](https://github.com/PlayableIntelligence/game-creator) | `4e64b83` | MIT | 3: `gc-game-designer`, `gc-game-qa`, `gc-review-game` |
| `ccgs-` | [Donchitos/Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) | `7ed2c3e` | MIT | 9: `ccgs-balance-check`, `ccgs-bug-report`, `ccgs-launch-checklist`, `ccgs-localize`, `ccgs-perf-profile`, `ccgs-playtest-report`, `ccgs-qa-plan`, `ccgs-release-checklist`, `ccgs-scope-check` |

Outras skills do projeto (próprias): `pinguin-art-assets`, `pinguin-audio-assets`, `pinguin-ui-hud` (menus e HUD no Estilo D), `agent-browser` (vercel-labs), `graphify`, `grilling`.

## Removidas em 2026-11-08 (e por quê)

| Skill | Motivo |
|---|---|
| `physics-arcade`, `physics-matter`, `gd-physics-tuning` | O jogo não usa engine de física (simulação própria, ADR-003). |
| `gc-phaser` | Escrita para Phaser 3; risco de API errada. `gd-phaser-core` e as skills oficiais cobrem Phaser 4. |
| `gd-itch-publish`, `gc-game-deploy`, `gc-monetize-game` | Distribuição decidida: Steam + Google Play premium, site no GitHub Pages (ADR-011/014, SDD-007/008). |
| `gd-level-design`, `gd-prototype-fast`, `gc-game-architecture`, `gc-add-feature`, `gc-improve-game`, `gc-design-game` | Genéricas ou duplicadas; o fluxo aqui é ADR → SDD → ROADMAP (`docs/architecture.md`, `docs/gdd.md`). |
| `gd-ai-behavior-trees-utility-ai` | Duplicava `gd-game-ai`; a IA dos inimigos é por perfil simples em `src/logic/enemy-ai.ts`. |
| `gc-qa-game` | Duplicava `gc-game-qa`. |
| `canvas-design` | Arte é PixelLab; key art e capsules seguem `docs/visual.md`. |
| `find-skills`, `grill-me` | Meta-skills; `grilling` já cobre a entrevista. |

Ajustes locais nas mantidas: prefixo; nota de projeto no topo apontando para `docs/`; nas `ccgs-*`, removidas a injeção de config via `yaml-helper.sh` e a permissão de Bash para ele, e a nota explica que `.claude/docs/*`, `project.yaml` e agentes do CCGS não existem aqui (relatórios em `docs/reports/`). Para trazer outra skill: copie a pasta, aplique o mesmo prefixo/nota, registre no `skills-lock.json` e aqui.
