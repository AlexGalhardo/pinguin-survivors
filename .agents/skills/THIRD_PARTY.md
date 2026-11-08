# Skills de terceiros

Instaladas em 2026-09-27 (cópia curada; só `SKILL.md` + referências, **sem** hooks, settings, agentes ou projetos de exemplo). Cada skill ganhou um prefixo da origem, uma nota no topo explicando como se encaixa neste projeto, e entrada no `skills-lock.json`.

| Prefixo | Repositório | Commit | Licença | Skills |
|---|---|---|---|---|
| `gd-` | [gamedev-skills/awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills) | `d4b0e35` | Apache-2.0 | 20 (disciplinas, roguelike, rpg, publicação, phaser-core) |
| `gc-` | [PlayableIntelligence/game-creator](https://github.com/PlayableIntelligence/game-creator) | `4e64b83` | MIT | 11 (design, arquitetura, QA, review, deploy, monetização) |
| `ccgs-` | [Donchitos/Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) | `7ed2c3e` | MIT | 9 (balanceamento, playtest, perf, QA, release, localização) |

Ajustes locais: nome com prefixo; nota de projeto no topo; nas `ccgs-*`, removidas a injeção de config via `yaml-helper.sh` e a permissão de Bash para ele (script do CCGS que não existe aqui).
Não instaladas (fora do stack): Unity, Unreal, Godot, Roblox, Three.js, Bevy, Pygame, LÖVE, gêneros não relacionados, e o restante do CCGS (sprints/épicos/agentes de estúdio). Para trazer outra: copie a pasta, aplique o mesmo prefixo/nota e registre aqui.
