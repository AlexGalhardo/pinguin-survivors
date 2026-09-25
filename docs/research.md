# Pesquisa de mercado — ferramentas, skills e referências

> Pesquisa feita em 2026-09-25. Reverifique versões/preços antes de depender deles.

## Engine

| Item | Achado | Fonte |
|---|---|---|
| Phaser | Versão estável **4.2.1 "Giedi"** (jul/2026). Phaser 4 tem renderer WebGL novo (render nodes, filters no lugar de pipelines/FX). `npm i phaser`. | [phaser.io/download/stable](https://phaser.io/download/stable), [npm](https://www.npmjs.com/package/phaser) |
| Curiosidade | Vampire Survivors rodou em Phaser até a v1.6 — prova de que o gênero cabe na engine. | [VS Wiki — Phas3r](https://vampire-survivors.fandom.com/wiki/Phas3r) |
| Skills oficiais | O repo `phaserjs/phaser` publica **28 skills** de agente (Phaser 4): arcade physics, scenes, particles, audio, scale, etc. Instaladas em `.claude/skills/`. | [skills-hub.ai/sources/phaser](https://skills-hub.ai/sources/phaser) |

## Phaser MCP ("Phaser Game Agent") — ATENÇÃO

- Setup: `npx @phaserjs/game-agent setup --tool claude-code` → MCP HTTP em `https://mcp.phaser.io/agent/mcp` com `Authorization: Bearer pga_...`.
- **É um serviço pago por créditos** (sandbox na nuvem cobrado por minuto; imagens/áudio custam créditos; "um jogo completo ~500 créditos").
- **Trabalha só em projetos hospedados na nuvem da Phaser, não em código local.**
- Conclusão: **não serve como ferramenta de desenvolvimento deste repositório local**. As 28 skills oficiais cobrem o conhecimento de API. Uso opcional: protótipos descartáveis na nuvem.
- Fontes: [phaser.io/agent/mcp](https://phaser.io/agent/mcp), [phaser.io/agent/mcp/claude-code](https://phaser.io/agent/mcp/claude-code)

## Higgsfield (assets)

- MCP oficial (desde 30/04/2026): endpoint hospedado `https://mcp.higgsfield.ai/mcp`, **auth via OAuth da conta Higgsfield** (sem API key).
  - Claude Code: `claude mcp add --transport http higgsfield https://mcp.higgsfield.ai/mcp` e autenticar via `/mcp`.
- Também existe CLI: [higgsfield.ai/cli](https://higgsfield.ai/cli).
- Modelos de imagem expostos: Nano Banana Pro, GPT Image 2, Flux 2, Soul V2 (consistência de personagem), etc. Ferramenta principal: `generate_image`.
- **Não há suporte nativo documentado a pixel art "de verdade" (grid exato) nem a fundo transparente** → precisamos de pipeline de pós-processamento (ver `art-and-assets.md`).
- Preço: por créditos da conta (não publicado na página do MCP).
- Fontes: [higgsfield.ai/mcp](https://higgsfield.ai/mcp), [TECHSY — setup](https://techsy.io/en/blog/higgsfield-mcp-claude-code), [claudefa.st](https://claudefa.st/blog/tools/mcp-extensions/higgsfield-mcp)

## Áudio procedural (Alpha/Beta)

- **jsfxr** (port JS do sfxr): gera SFX 8-bit em runtime via Web Audio, presets `laserShoot`, `hitHurt`, `explosion`, `pickupCoin`, `powerUp`, `blipSelect`. npm `jsfxr`. [sfxr.me](https://sfxr.me/), [chr15m/jsfxr](https://github.com/chr15m/jsfxr)
- **ZzFX**: alternativa minúscula (<1KB) — um array de números = um som. Ótimo para prototipar sem arquivos.

## Pixel art com IA — estado da arte

- Modelos de difusão geram "estilo pixel art" mas com pixels inconsistentes (sub-pixels, anti-aliasing, blur). Fluxo usado pela comunidade: **gerar maior → recortar fundo → downscale nearest-neighbor para o grid alvo (16/32/48 px) → quantizar para paleta fixa → limpar no Aseprite**.
- Consistência entre frames de animação é o maior problema (cada geração é independente) → gerar sprite base, depois pedir variações com imagem de referência; ou animar via código (squash/stretch, bob, flash) em vez de muitos frames.
- Ferramentas/skills relacionadas:
  - [willibrandon/pixel-plugin](https://github.com/willibrandon/pixel-plugin) — plugin Claude Code para pixel art via **Aseprite** (paletas, dithering, export para engine).
  - [HermeticOrmus/claude-code-game-development](https://github.com/HermeticOrmus/claude-code-game-development) — padrões de gamedev com Claude Code.
  - Skills "pixel-art-sprites" / "pixel-art-generator" em marketplaces ([claudemarketplaces](https://claudemarketplaces.com/skills/absolutelyskilled/absolutelyskilled/pixel-art-sprites), [mcpmarket](https://mcpmarket.com/tools/skills/pixel-art-generator)).
  - Relato de workflow "AI-driving-AI" para sprites: [Mike Veerman — Claude After Dark](https://mikeveerman.be/blog/github-2026-01-17-claude-after-dark/).
- Paletas recomendadas (Lospec): **Endesga 32**, **Resurrect 64**, **PICO-8**.

## Referências de game design

- **Brotato**: ondas curtas cronometradas (20s → 60s), loja + level-up entre ondas, builds por sinergia de stats; dificuldade escala por onda. [Wikipedia](https://en.wikipedia.org/wiki/Brotato), [Choost — VS vs Brotato](https://choostgames.com/blog/vampire-survivors-vs-brotato/), [Adrian Hon](https://adrianhon.substack.com/p/brotato)
- **Vampire Survivors**: ataque automático, movimento é o único input, hordas crescentes, level-up por XP com escolha de 3–4 opções, evoluções de armas.
- Nosso híbrido: **rodadas estilo Brotato** + **escolha de 3 cartas estilo VS** entre rodadas + progressão infinita.

## Estrutura de prompts úteis (para agentes)

1. **Prompt de sessão** (código): "Leia `CLAUDE.md` e `PLAN.md`. Pegue a próxima microtarefa `[ ]` da fase atual. Implemente, teste com `agent-browser`, marque `[x]`, adicione linha no Changelog."
2. **Prompt de asset** (Higgsfield) — template em `art-and-assets.md`: `[sujeito] + [vista top-down 3/4] + [pixel art, 32x32, paleta limitada Endesga 32] + [fundo sólido #FF00FF] + [sem anti-aliasing, contorno escuro 1px] + [pose/frame]`.
3. **Prompt de balanceamento**: pedir ao agente simular N rodadas com as fórmulas de `balancing.md` e reportar TTK (time-to-kill) e DPS esperado.

## Skills instaladas neste projeto (`.claude/skills/`)

- `find-skills`, `grill-me` (+ `grilling`, dependência), `setup-matt-pocock-skills` — descoberta/entrevista/setup.
- `agent-browser` — testar o jogo no browser (screenshots, cliques, QA). Requer o CLI `agent-browser`.
- `canvas-design` — arte estática (PNG/PDF): útil para key art, logo, mockups de UI.
- `graphify` — grafo de conhecimento do código/docs (`/graphify .`). CLI Python `graphifyy` instalada (também em `~/.claude/skills`).
- 28 skills Phaser 4 (`physics-arcade`, `scenes`, `particles`, `scale-and-responsive`, `audio-and-sound`, ...).
- Lock: `skills-lock.json` (restaurar com `npx skills experimental_install`).
