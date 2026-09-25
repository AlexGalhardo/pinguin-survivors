# PLAN.md — Starfall Survivors

> **Referência principal das sessões de agentes.** Leia inteiro antes de começar. Trabalhe na ordem, uma microtarefa por vez.
> Legenda: `[ ]` pendente · `[x]` concluída · `[~]` incompleta (depende de ação do usuário, de uma fase futura ou está bloqueada; diga o motivo).
> Ao terminar uma tarefa: marque o checkbox e adicione uma linha curta no **Changelog** (fim do arquivo).
> Git: micro-commits em **Conventional Commits 1.0.0**; ao fechar cada **seção** (0.2, 1.1, …) → bump **SemVer** + tag + `git push origin main --follow-tags`. Ver [docs/git-and-versioning.md](docs/git-and-versioning.md).
> Contexto: [CLAUDE.md](CLAUDE.md) · [AGENTS.md](AGENTS.md) · [docs/](docs/README.md)

## Visão geral

Jogo 2D para browser (Chrome, Firefox, Edge), top-down arena shooter roguelite no estilo **Brotato + Vampire Survivors**, pixel art 32 px, tema sci-fi retrô, **tela cheia sem scroll**.
Loop: **Onda cronometrada → 3 cartas (grátis) → loja (ouro) → próxima onda**, com dificuldade **infinita**. Três classes: **Warrior**, **Ranger** e **Mage**.
Stack: **TypeScript + Vite + Phaser 4.2.x (Arcade) + bun:test + jsfxr** sobre **Bun 1.4.2**. UI em inglês.

| Fase | Versão | Objetivo | Arte | Áudio |
|---|---|---|---|---|
| 0 | `0.1.0` | Setup, pesquisa, documentação, tooling | — | — |
| 1 | **ALPHA** `1.0.0-alpha.N` | Protótipo jogável: mecânicas, loop completo, HUD, UI, economia | 100% por código (canvas) | jsfxr |
| 2 | **BETA** `1.0.0-beta.N` | Profundidade (evoluções, sinergias, mais conteúdo), juice, balanceamento, desbloqueios | Placeholders melhores por código + art spike `[~]` | jsfxr refinado + chiptune |
| 3 | **1.0** `1.0.0` | Assets finais (Higgsfield) em todo o jogo, polish, meta-progressão, release | Higgsfield + pipeline de pixelização | SFX finais + música de IA |

## Critérios de saída das fases

- **Alpha pronto**: uma run completa jogável com as 3 classes, do menu ao game over, com cartas, 6 habilidades, loja e 12 itens, 4 inimigos + elite + boss, HUD, pausa, SFX, 60 FPS com 300 inimigos, testes de lógica passando.
- **Beta pronto**: evoluções e sinergias, ~8 inimigos, 2+ bosses, ~40 itens, ~10 habilidades, desbloqueios, juice completo, música, balanceamento validado por simulação e playtest.
- **1.0 pronto**: nenhum placeholder visível; todos os assets finais em pixel art; áudio final; QA em Chrome, Firefox e Edge; build publicável.

---

## FASE 0 — Setup e fundação

### 0.1 Contexto e ferramentas
- [x] Instalar skills no projeto: find-skills, grill-me (+ grilling), agent-browser, setup-matt-pocock-skills, canvas-design, graphify, 28 skills Phaser 4
- [x] Pesquisa de mercado (prompts, skills, plugins, MCPs) → `docs/research.md`
- [x] Entrevista com o usuário (grilling, 30 perguntas) → `docs/decisions.md`
- [x] Documentação em `docs/` (GDD, balanceamento, arquitetura, arte, áudio, UI, tooling, workflow)
- [x] `CLAUDE.md` e `AGENTS.md`
- [x] `PLAN.md`
- [~] Phaser MCP (Game Agent): **não será usado** (pago, só na nuvem). Reavaliar só se o usuário pedir
- [~] `setup-matt-pocock-skills`: rodar só se o usuário quiser o fluxo de issues/triage (`/setup-matt-pocock-skills`)
- [x] CLI do `agent-browser` instalado globalmente (v0.38.1 + Chrome 154)
- [~] Adicionar `%APPDATA%\Python\Python314\Scripts` ao PATH do usuário (CLI do graphify). Ação do usuário

### 0.2 Scaffold do projeto
- [x] `git init` + `.gitignore` (node_modules, dist, .DS_Store, graphify-out, art-src/raw) + `.gitattributes` (LF)
- [x] `package.json` + Vite 8 na raiz; `index.html` com `<div id="game">` e CSS sem scroll (100vw/100dvh, overflow hidden)
- [x] Instalar `phaser@^4.2.1` e `jsfxr`; dev: `typescript` (6.0), `vite`, `@types/bun` — via **Bun 1.4.2** (`bun.lock`; npm/Vitest removidos)
- [x] `tsconfig.json` strict; scripts `dev`, `build`, `preview`, `test`, `test:watch`, `typecheck`
- [x] Estrutura de pastas de `docs/architecture.md` (pastas com `.gitkeep`)
- [x] `src/config/constants.ts`, `palette.ts` (Endesga 32), `strings.ts`
- [x] `src/logic/rng.ts` (mulberry32 com seed) + teste `bun:test`
- [x] `src/debug/`: leitura de query params (`seed`, `char`, `wave`, `god`, `debug`, `skipMenu`) + teste, e `window.__GAME__` só no dev
- [x] Smoke test: `bun run dev` abre uma cena preta em tela cheia; validado com agent-browser (1366×768: sem scroll, canvas cheio, WebGL, sem erros)
- [x] `.editorconfig`: TAB, largura 4, LF, UTF-8 (YAML com espaços por exigência da especificação)
- [x] **Biome v2** (lint + format, TAB/4) no lugar de ESLint + Prettier; scripts `lint`, `format`, `format:check`, `check`, `check:fix`
- [x] Husky: `pre-commit` (Biome staged + typecheck + testes), `commit-msg` (commitlint Conventional Commits), `pre-push` (Biome ci + typecheck + testes + build)
- [x] Convenções Conventional Commits 1.0.0 + SemVer 2.0.0 documentadas (`docs/git-and-versioning.md`, CLAUDE.md, AGENTS.md)
- [x] Migração para **Bun 1.4.2** (runtime + pacotes + scripts + hooks) e testes para **`bun:test`** (Vitest removido)
- [x] Remoto `origin` (GitHub) + micro-commits + versão `0.1.0` + tag + push para `main`

---

## FASE 1 — ALPHA (protótipo; arte só por código)

### 1.1 Núcleo da engine
- [x] `game-config.ts`: WebGL, `pixelArt: true`, `roundPixels`, Scale `RESIZE`, Arcade Physics (sem gravidade)
- [x] Zoom inteiro responsivo (`floor(min(w/480, h/270))`) aplicado às câmeras e recalculado no `resize`
- [x] `BootScene`: gerar texturas placeholder por canvas para todas as chaves do `art/manifest.ts`
- [x] Fonte bitmap 5×7 gerada por código (A–Z, 0–9, pontuação) → BitmapText/RetroFont
- [x] `art/manifest.ts` com todas as chaves previstas (ver docs/art-and-assets.md)
- [x] Sistema de eventos tipado entre cenas (enum de eventos)
- [x] Overlay de debug (`?debug=1`): FPS, inimigos, projéteis

### 1.2 Jogador, arena e câmera
- [x] Arena 960×540 com paredes (static bodies) e chão em tiles placeholder
- [x] `Player` com movimento WASD/setas normalizado (diagonal ≠ mais rápida), colisão com paredes
- [x] Câmera segue com deadzone e fica limitada à arena
- [x] `RunState` (objeto serializável da run) + `logic/stats.ts` com os stats base das 3 classes (data/characters.ts) + testes

### 1.3 Inimigos e spawn
- [x] `Enemy` com pool (Group `maxSize`) e dados de `data/enemies.ts`
- [x] IA do Chaser (seek) e separação simples entre inimigos (evitar empilhamento)
- [x] `SpawnSystem`: telegraph de 0.8 s → spawn nas bordas/longe do jogador, pesos por tipo, teto de 300 vivos
- [x] Runner (grupos), Shooter (mantém distância + projéteis inimigos em pool), Tank (resistente a knockback)
- [x] Dano de contato no jogador (cooldown por inimigo) + 0.4 s de invulnerabilidade + flash

### 1.4 Combate e armas
- [x] `logic/stats.ts`: fórmulas de dano, crit, armor, dodge, cooldown, lifesteal, regen (docs/balancing.md §4) + testes
- [x] Auto-target: inimigo mais próximo no alcance (grade espacial se houver > 150 inimigos)
- [x] Energy Blade (Warrior): arco de 120°, knockback, acerta todos no arco
- [x] Blaster (Ranger): projétil em pool, alcance 260
- [x] Psi Orb (Mage): projétil lento com pierce 3
- [x] `CombatSystem`: aplicar dano → flash branco → número de dano (pool) → morte do inimigo → drop de ouro
- [x] Morte do jogador → evento `PLAYER_DIED` (revive ou game over)

### 1.5 Ondas e escala infinita
- [x] `logic/scaling.ts`: duração, taxa de spawn, hpMul, dmgMul, spdMul, conversão do excedente acima do teto + testes
- [x] `WaveSystem`: timer, liberação de tipos por onda, fim da onda (purge com efeito + coleta automática de ouro)
- [x] Elite a cada 5 ondas (×8 HP, modificador fast/shielded/volatile)
- [x] Boss a cada 10 ondas (64×64): rajada radial + investida telegrafada; a onda só termina com o boss morto
- [x] Transição de onda: "WAVE N" na tela + pausa da física

### 1.6 Cartas e revive
- [x] `data/cards.ts` (stat cards, ability cards, specials) e `logic/rarity.ts` (pesos por onda + Luck; Legendary ≥ onda 5) + testes
- [x] `logic/cards.ts`: gerar 3 cartas distintas respeitando slots (máx. 6 habilidades), nível máx. 5 e revive (máx. 1 carga) + testes
- [x] `CardPickScene`: 3 cartas pixel art com moldura de raridade, hover, teclas 1/2/3, setas + Enter
- [x] Aplicar a carta escolhida ao `RunState` e ao `StatsSystem`
- [x] Revive: 50% de HP + 2 s de invulnerabilidade + onda de choque (knockback radial)

### 1.7 Habilidades (6)
- [x] `AbilitySystem` + `data/abilities.ts` (níveis 1–5, escala com Ability Power)
- [x] Orbital Drones
- [x] Chain Lightning
- [x] Plasma Nova
- [x] Cryo Field (lentidão)
- [x] Homing Missiles
- [x] Laser Beam

### 1.8 HUD e UI (pixel art por código)
- [x] Componentes `ui/`: PixelPanel (9-slice gerado), PixelButton (normal/hover/pressed/disabled), Bar, IconFactory (ícones 16×16 por código), CardView
- [x] `HudScene`: HP + número, ícone de revive, onda + timer (vermelho nos últimos 5 s), ouro, 6 slots de habilidade com nível, barra do boss
- [x] Números de dano (crit maior/amarelo), respeitando a Setting
- [x] Ancoragem responsiva da HUD em todas as resoluções (testar 1366×768, 1920×1080, 2560×1440, janela estreita)

### 1.9 Áudio (jsfxr)
- [ ] `AudioSystem`: pré-renderizar os SFX do catálogo (docs/audio.md) em AudioBuffers no Boot
- [ ] Limite de vozes, intervalo mínimo e variação de pitch
- [ ] Ligar SFX a todas as ações (armas, hits, mortes, coleta, UI, onda, dano no jogador, revive, game over)
- [ ] Desbloqueio do AudioContext no primeiro input

### 1.10 Economia: ouro, loja, itens, re-roll (final do Alpha)
- [ ] Pickup de ouro em pool + ímã (Pickup Range) + medkit raro
- [ ] `logic/shop.ts` + `logic/economy.ts`: preços por onda, re-roll crescente, sorteio por raridade + testes
- [ ] `data/items.ts`: 12 itens do Alpha (docs/balancing.md §7) com trade-offs
- [ ] `ShopScene`: 4 slots, comprar, re-roll, Continue, painel de stats e de itens possuídos
- [ ] Re-roll pago na `CardPickScene`

### 1.11 Menus, pausa e persistência
- [ ] `MainMenuScene` (Play, Settings) com título em fonte bitmap
- [ ] `CharacterSelectScene`: 3 classes com stats e arma inicial
- [ ] `PauseScene` (ESC): Resume, Settings, Quit run (com confirmação)
- [ ] `SettingsScene`: volume de SFX e música, fullscreen, screen shake, números de dano
- [ ] `GameOverScene`: estatísticas da run, recorde, Retry, Main Menu
- [ ] `SaveSystem` (localStorage com try/catch + versão): settings, recorde por classe, estatísticas

### 1.12 QA e fechamento do Alpha
- [ ] Teste de estresse: 300 inimigos + 500 projéteis em `?debug=1` → 60 FPS no Chrome (registrar o resultado no changelog)
- [ ] `logic/sim`: simulação headless de runs (3 classes, builds aleatórias) comparada com as metas de docs/balancing.md §10
- [ ] Playtest guiado com agent-browser: uma run por classe até a onda 10 (screenshots, erros)
- [ ] Teste em Firefox e Edge (tela cheia, sem scroll, áudio)
- [~] Playtest humano do usuário + feedback → ajustes (ação do usuário)
- [ ] Atualizar docs (balancing/decisions) com o que mudou; marco do Alpha: versão final `1.0.0-alpha.N` com tag e push

---

## FASE 2 — BETA (melhorar detalhes)

### 2.1 Profundidade de build
- [ ] Evoluções: habilidade nível 5 + item específico → habilidade evoluída (1 por habilidade)
- [ ] Sinergias por tags (`energy`, `cryo`, `psi`, `kinetic`…) com bônus por quantidade
- [ ] +4 habilidades (total de ~10)
- [ ] Itens até ~40; lock de item na loja
- [ ] Venda de item (opcional; decidir com o usuário)

### 2.2 Conteúdo de inimigos
- [ ] +4 tipos (ex.: Splitter, Bomber suicida, Healer, Burrower com teleporte)
- [ ] 2º e 3º boss com padrões próprios; rotação de bosses a cada 10 ondas
- [ ] Modificadores de onda ocasionais (ex.: "Swarm", "Armored", "Fast")

### 2.3 Personagens e meta-progressão
- [ ] Desbloqueio do Ranger (onda 10 com o Warrior) e do Mage (matar o 1º boss); tela de desbloqueio
- [ ] Passivas únicas por classe (ex.: Warrior +Armor por inimigo próximo)
- [ ] Estatísticas globais e histórico das últimas runs

### 2.4 Game feel (juice)
- [ ] Hit-stop curto em crit e morte de elite
- [ ] Partículas (Phaser 4 particles) em hit, morte, coleta, nova e explosões
- [ ] Squash/stretch e bob no movimento; morte com explosão de pixels
- [ ] Transições de cena pixeladas; tremor de tela calibrado
- [ ] Indicadores fora da tela (setas) para o boss e os elites

### 2.5 Arte (ainda por código) + art spike
- [ ] Placeholders melhores: silhuetas com sombreamento de 2–3 tons, frames de walk/idle gerados por código
- [ ] Decoração da arena (não bloqueante) e variação de chão
- [~] **Art spike Higgsfield** (opcional, depende do usuário configurar o MCP antes): 5–10 sprites testando o pipeline de pixelização

### 2.6 Áudio
- [ ] Refinar os parâmetros dos SFX (editor sfxr.me) e salvar os presets em `src/data/sfx.ts`
- [ ] Loop de música chiptune (sequenciador Web Audio simples ou faixa CC0) com volume próprio
- [ ] Ducking da música em pausa/cartas/loja

### 2.7 UX e acessibilidade
- [ ] Tutorial rápido na primeira run (WASD, auto-ataque, cartas, loja)
- [ ] Tooltips de stats (o que cada stat faz) e comparação antes/depois ao escolher uma carta ou item
- [ ] Opções: reduzir flashes, tamanho do texto de dano, pausar ao perder o foco da janela
- [ ] Pausa automática ao trocar de aba (`visibilitychange`)

### 2.8 Balanceamento e performance
- [ ] Rodar a simulação para as ondas 1–60 nas 3 classes; ajustar as curvas até atingir as metas §10
- [ ] Profiling (Chrome DevTools) e otimizações (grade espacial, menos alocações, culling)
- [ ] Playtests com agent-browser em todas as classes até a onda 20
- [~] Playtest humano do usuário + feedback
- [ ] Marco do Beta: versão final `1.0.0-beta.N` com tag e push

---

## FASE 3 — 1.0 (assets oficiais finais)

### 3.1 Setup de assets
- [~] Usuário: conta e créditos no Higgsfield; `claude mcp add --transport http higgsfield https://mcp.higgsfield.ai/mcp` + login OAuth via `/mcp`
- [ ] `scripts/pixelize.ts` (sharp): chroma key → trim → downscale nearest → quantizar para Endesga 32 → contorno → âncora
- [ ] `scripts/pack-atlas.ts`: atlas PNG+JSON (formato Phaser) com as chaves do manifest
- [ ] `PreloadScene` carregando o atlas real com fallback para o placeholder (por chave)
- [ ] `art-src/prompts.md`: registro de prompt, modelo e seed de cada asset aprovado

### 3.2 Produção de arte (Higgsfield → pipeline → revisão)
- [ ] Estudo de estilo: 3 personagens em pose base, aprovados pelo usuário `[~]`
- [ ] Personagens: idle 2f, walk 4f, hit 1f (×3)
- [ ] Inimigos: 4 básicos + variações ampliadas dos elites + inimigos do Beta
- [ ] Bosses 64×64 (todos os do Beta)
- [ ] Projéteis, efeitos de habilidades e pickups
- [ ] Tileset da arena + decorações
- [ ] UI: painel 9-slice, botões, 4 molduras de carta, barras, cursor
- [ ] Ícones 16×16: stats, habilidades, itens
- [ ] Fonte bitmap final (manter a 5×7 ou gerar uma nova)
- [ ] Logo + key art do menu (skill `canvas-design` + Higgsfield)
- [ ] Trocar todos os placeholders; auditoria: nenhuma textura gerada por código visível no jogo

### 3.3 Áudio final
- [~] Escolher a ferramenta de música de IA (Higgsfield se suportar; senão, outra) e aprovar com o usuário
- [ ] Trilha: menu, combate (2–3 loops com intensidade), boss, game over
- [ ] SFX finais exportados (WAV/OGG) ou refinados, com mixagem de volumes

### 3.4 Meta e conteúdo final
- [~] Definir com o usuário a árvore de upgrades permanentes
- [ ] Implementar a moeda meta + a árvore + a tela de upgrades
- [ ] Conquistas simples (locais)

### 3.5 Polish, QA e release
- [ ] QA completo em Chrome, Firefox e Edge (Windows) + Safari/macOS se possível
- [ ] Performance final (60 FPS com a arte final; tamanho do build e tempo de load)
- [ ] Tela de loading com barra em pixel art
- [ ] Créditos e licenças (paleta, libs, ferramentas de IA)
- [~] Definir a plataforma de publicação (itch.io/GitHub Pages) e o remoto git (ação do usuário)
- [ ] Build de produção e publicação; `chore(release): 1.0.0` + tag `v1.0.0` + push

---

## Backlog / ideias (não priorizadas)

- Suporte a gamepad e a toque/mobile (fora do escopo por decisão D-03)
- Modo diário com seed fixa + ranking local
- Mira manual opcional
- Mais personagens (além dos 3)
- Leaderboard online

---

## Changelog

- **2026-09-25**: Instaladas 35 skills (Phaser 4 ×28, agent-browser, canvas-design, graphify, grill-me/grilling, find-skills, setup-matt-pocock-skills).
- **2026-09-25**: Pesquisa de mercado (`docs/research.md`). O Phaser MCP foi descartado (pago, só na nuvem).
- **2026-09-25**: Entrevista de 30 perguntas com o usuário → 27 decisões em `docs/decisions.md`.
- **2026-09-25**: Criados `docs/` (10 arquivos), `CLAUDE.md`, `AGENTS.md` e `PLAN.md`. Fase 0.1 concluída.
- **2026-09-25 · v0.1.0**: Scaffold (Bun 1.4.2 + Vite 8 + TS 6 + Phaser 4.2.1 + bun:test), RNG com seed, debug params, cena Boot em tela cheia (smoke test OK).
- **2026-09-25 · v0.1.0**: Biome v2 (TAB/4) + .editorconfig; Husky + commitlint; Conventional Commits + SemVer; remoto GitHub. Fase 0 concluída.
- **2026-09-25 · v1.0.0-alpha.1**: Núcleo da engine: WebGL pixel-art, zoom inteiro responsivo, placeholders por código para todas as chaves do manifest, fonte bitmap 5×7 (RetroFont), eventos tipados e overlay de debug.
- **2026-09-25**: agent-browser não está no PATH; usado via `bunx agent-browser@0.38.1`.
- **2026-09-25 · v1.0.0-alpha.2**: Arena 960×540 com paredes (static bodies) e chão em tiles; Player com WASD/setas normalizado; câmera com deadzone e limites; RunState + modelo de stats das 3 classes (testes).
- **2026-09-25**: o agent-browser envia `keyCode` 0 (o Phaser ignora); para QA use `__GAME__.hold('KeyD', ms)` / `__GAME__.press('Enter')`.
- **2026-09-25 · v1.0.0-alpha.3**: Inimigos em pool (Chaser/Runner/Shooter/Tank) com seek, keep-distance e separação via grade espacial; spawner com telegraph de 0.8 s e teto de 300; dano de contato + i-frames. Estresse: 300 inimigos a 60 FPS (Chrome, 1366×768).
- **2026-09-25 · v1.0.0-alpha.4**: Fórmulas de combate (dano, crit, armor, dodge, cooldown, lifesteal, regen) com testes; auto-target (grade acima de 150 inimigos); Energy Blade, Blaster e Psi Orb; CombatSystem com flash, números de dano em pool, drop de ouro e evento PLAYER_DIED.
- **2026-09-25 · v1.0.0-alpha.5**: WaveSystem (timer, desbloqueio de tipos, purge + coleta de ouro), elites a cada 5 ondas (fast/shielded/volatile), boss a cada 10 (rajada radial de 16 + investida telegrafada), banner "WAVE N" com física pausada.
- **2026-09-25 · v1.0.0-alpha.6**: Cartas (stat/habilidade/especial) com raridade por onda + Luck e regras de slots/nível/revive (testes); CardPickScene (mouse, 1/2/3, setas + Enter); ícones 16×16 por código; revive com 50% HP, 2 s de i-frames e onda de choque.
- **2026-09-25 · v1.0.0-alpha.7**: AbilitySystem com as 6 habilidades (níveis 1–5, escala com Ability Power e Range): Orbital Drones, Chain Lightning, Plasma Nova, Cryo Field (lentidão), Homing Missiles e Laser Beam (mira na maior aglomeração).
- **2026-09-25 · v1.0.0-alpha.8**: Componentes de UI (PixelPanel, PixelButton, Bar, IconFactory, CardView); HudScene com HP, revive, onda + timer (vermelho nos últimos 5 s), ouro, 6 slots com nível e cooldown, barra do boss; números de dano respeitam a Setting. Validado em 1366×768, 1920×1080, 2560×1440 e 700×900 (arena centralizada).
