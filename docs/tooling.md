# Ferramentas, skills e MCPs

Tudo está instalado em `.claude/skills/` (nível de projeto) e travado em `skills-lock.json`.
Para restaurar numa máquina nova: `bunx skills experimental_install`.

## Skills e quando usar

| Skill | Use quando… |
|---|---|
| **Phaser 4 (28 skills)**: `game-setup-and-config`, `scenes`, `physics-arcade`, `groups-and-containers`, `input-keyboard-mouse-touch`, `scale-and-responsive`, `cameras`, `particles`, `tweens`, `time-and-timers`, `text-and-bitmaptext`, `graphics-and-shapes`, `render-textures`, `sprites-and-images`, `animations`, `loading-assets`, `audio-and-sound`, `events-system`, `data-manager`, `filters-and-postfx`, `geometry-and-math`, `game-object-components`, `actions-and-utilities`, `curves-and-paths`, `tilemaps`, `physics-matter`, `v4-new-features`, `v3-to-v4-migration` | For **any** Phaser API question. Phaser 4 changed a lot relative to v3; always prefer these skills over v3 examples from the web |
| `agent-browser` | Abrir o jogo no browser, tirar screenshots, simular teclas, ler o console, fazer QA e smoke tests. Requer o CLI `agent-browser` (a skill explica a instalação) |
| `canvas-design` | Arte estática PNG/PDF: key art do menu, logo, mockups de telas, pôster |
| `graphify` | Gerar ou consultar o grafo de conhecimento do código e dos docs (`/graphify .`). Útil quando o código crescer. CLI Python `graphifyy` (fora do PATH: `%APPDATA%\Python\Python314\Scripts\graphify.exe`) |
| `find-skills` | Procurar novas skills (ex.: pixel art, Aseprite, balanceamento) |
| `grill-me` / `grilling` | Entrevistar o usuário para aprofundar uma decisão de design. `/grill-me` só é invocável pelo usuário; `grilling` pode ser usada pelo agente |
| `setup-matt-pocock-skills` | Configurar issue tracker, labels e docs de domínio para as skills de engenharia do Matt Pocock (rodar só se o usuário quiser esse fluxo) |

## MCPs

| MCP | Status | Notas |
|---|---|---|
| Higgsfield | `[~]` configurar no **1.0** | `claude mcp add --transport http higgsfield https://mcp.higgsfield.ai/mcp`, depois autenticar via `/mcp` (OAuth na conta do usuário, que consome créditos) |
| Phaser Game Agent | **não usar** | Pago e só em projetos na nuvem da Phaser (ver `research.md`) |

## Bibliotecas npm previstas

- `phaser` (^4.2), `jsfxr`: runtime.
- Runtime/gerenciador: **Bun 1.4.2** (`bun install`, `bun run`, `bunx`, `bun test`).
- `typescript`, `vite`, `@types/bun`, `@biomejs/biome` (v2, lint + format), `husky`, `@commitlint/cli` + `@commitlint/config-conventional`: dev.
- 1.0: `sharp` (pipeline de pixelização), um empacotador de atlas (script próprio ou `free-tex-packer-core`).

## Ferramentas externas úteis

- [sfxr.me](https://sfxr.me/): editor visual de SFX (exporta os parâmetros para o jsfxr).
- [Lospec](https://lospec.com/palette-list/endesga-32): paleta Endesga 32.
- Aseprite + [pixel-plugin](https://github.com/willibrandon/pixel-plugin): retoque manual de sprites no 1.0 (opcional).
