# PLAN.md — Pinguin Survivors

> **Referência principal das sessões de agentes.** Leia inteiro antes de começar. Trabalhe na ordem, uma microtarefa por vez.
> Legenda: `[ ]` pendente · `[x]` concluída · `[~]` incompleta/bloqueada (diga o motivo).
> Ao terminar uma tarefa: marque o checkbox; mudanças relevantes vão para `[Unreleased]` do [CHANGELOG.md](CHANGELOG.md) (Keep a Changelog).
> Git: micro-commits em **Conventional Commits 1.0.0**; ao fechar cada **seção** (0.1, 1.1, …) → bump **SemVer** (`0.1.0-alpha.N` / `0.1.0-beta.N`) + tag + `git push origin main --follow-tags`. Ver [docs/git-and-versioning.md](docs/git-and-versioning.md).
> Contexto: [CLAUDE.md](CLAUDE.md) · [AGENTS.md](AGENTS.md) · [docs/](docs/README.md) · decisões [docs/decisions.md](docs/decisions.md)

## Visão geral

Endless roguelite frenético em **pixel art 2.5D isométrica 2:1** (layout Diablo 2, clima Diablo 4), inspirado em **Brotato**. Três pinguins sobreviventes de um apocalipse zumbi: **Jack** (melee), **Bob** (armas de fogo), **Lucia** (magia).
Loop: **Round cronometrado (20 s +5/round, teto 60 s) → 3 cartas → próximo round**; boss a cada 10 rounds (3 min ou game over); elites a cada 3 rounds; **level 1–100 persistente por herói**; Fish 🐟 persistente; poções com gambits.
Stack: **TypeScript + Vite + Phaser 4.2 (sem Arcade; simulação própria em mundo cartesiano + projeção iso) + Bun 1.4.2 + bun:test**. Arte **PixelLab**, áudio **ElevenLabs**. UI **EN + PT-BR**.
O jogo anterior (Starfall Survivors) está na branch `starfall-survivors-legacy`.

| Fase | Versão | Objetivo |
|---|---|---|
| 0 | `0.1.0-alpha.1` | Refundação: entrevista, docs, limpeza, pipeline PixelLab, concepts dos heróis |
| 1 | `0.1.0-alpha.N` | Engine iso + loop jogável com placeholders (herói, hordas, combate, rounds, cartas, boss) |
| 2 | `0.1.0-alpha.N` | RPG e meta: save, level 1–100, pontos, Fish, poções/gambits, desbloqueios, menus, i18n |
| 3 | `0.1.0-beta.N` | Armas estilo Brotato, simulação headless e balanceamento, polimento de sistemas |
| 4 | `0.1.0-beta.N` | Gore persistente, iluminação estilo D4, juice |
| 5 | `0.1.0-beta.N` | Áudio ElevenLabs: SFX, música metal, vozes EN/PT-BR |
| 6 | `0.1.0-beta.N` | Conteúdo endless: biomas 2–3, pool de bosses, mais armas/cartas, balanceamento |
| 7 | `1.0.0-rc.N` → `1.0.0` | QA e RC com placeholders; **só então** produção e troca de todos os assets finais; release |

**Ordem acordada (P-34):** concepts aprovados → loop jogável com placeholders → animações e assets finais em paralelo. A Fase 3 pode começar assim que os concepts forem aprovados, intercalada com as Fases 1–2.

---

## FASE 0 — Refundação

### 0.1 Contexto, limpeza e documentação
- [x] Check-up do projeto Starfall (stack, padrões, docs, skills, pendências)
- [x] Entrevista com o usuário (36 perguntas) → `docs/decisions.md` (P-01…P-36)
- [x] Branch `starfall-survivors-legacy` com todo o histórico, push para o `origin`
- [x] Remoto `origin` → `git@github.com:AlexGalhardo/pinguin-survivors.git`
- [x] Limpar a `main`: remover a camada de jogo do Starfall (cenas, sistemas, entidades, UI, arte, dados, lógica específica, scripts Retro Diffusion/jsfxr/sim/playtest/profile) e a dependência `jsfxr`; manter rng, spatial-grid, geometry, gamepad, key-claim, voice-limiter, core/input, core/gamepad, synthetic-keys, pack-atlas, qa-browsers
- [x] Reescrever docs: game-design, balancing, architecture, art-and-assets, art-prompts, audio, ui-hud, tooling, README, agent-workflow, git-and-versioning; nota em game-market; remover research
- [x] Skills: criar `pinguin-art-assets` e `pinguin-audio-assets`; remover `starfall-art-assets` e `setup-matt-pocock-skills`
- [x] CLAUDE.md e AGENTS.md reescritos; PLAN.md novo
- [x] `.gitignore`: `TODO.md` (contém chaves) e `art-src/pixellab/raw/`
- [x] `package.json` (`pinguin-survivors`, `0.1.0-alpha.0`), título do `index.html`

### 0.2 Pipeline PixelLab e concepts
- [x] MCP `pixellab` adicionado no escopo de usuário (aparece após reiniciar a sessão)
- [x] `PIXELLAB_API_TOKEN` no `.env`; cliente `scripts/lib/pixellab.ts` (api, waitJob, getCharacter, download, log, balance)
- [x] `scripts/pl-concepts.ts`: 3 heróis × (v3 seed a, v3 seed b, Pro) em 96 px, 8 rotações + `sheet.png` (93 gerações)
- [x] **Aprovação do usuário** (2026-09-27): Jack `jack-v3-a`, Bob `bob-v3-a`, Lucia `lucia-v3-b`; tamanho ~88 px aceito (P-05, P-49)
- [x] `character_id` aprovados em `docs/art-prompts.md` e em `src/data/heroes.ts`
- [x] Histórico da `main` recomeçado no 1º commit do Pinguin Survivors (pedido do usuário); push após cada commit (P-48)
- [x] Versionamento `0.1.0-alpha.N` nos arquivos (P-46)
- [~] Reescrever o histórico antigo (mensagens/conteúdo com `2.0.0`) e renomear as tags do Starfall para `starfall/v*`: **bloqueado pela permissão do auto mode** — depende do usuário
- [x] `CHANGELOG.md` (Keep a Changelog 1.1.0) na raiz (P-47)
- [x] Release `0.1.0-alpha.1` (docs(plan) → chore(release) + CHANGELOG → tag → push)

---

## FASE 1 — ALPHA: engine iso + loop jogável (placeholders)

### 1.1 Boot, config e contrato
- [x] `src/config/constants.ts` (LOGICAL_H=540, TILE_W=64, TILE_H=32, CHUNK_TILES=16, MAX_ENEMIES=300…) e `palette.ts` (noite polar, sangue, auras, raridades)
- [x] `src/logic/viewport.ts`: zoom inteiro pela altura + largura lógica variável (+ testes: 2560×1080, 1920×1080, 2560×1440, 3840×2160, 1366×768)
- [x] `game-config.ts` (RESIZE, pixelArt, roundPixels, sem physics) + `main.ts` + BootScene (carrega só arquivos presentes em `public/assets`; Preload dedicado virá com o atlas)
- [x] `src/debug/params.ts` (`skipMenu`, `hero`, `round`, `seed`, `debug`, `god`, `tier`) + testes; `window.__GAME__` só no dev; overlay de FPS/contagem
- [x] `src/i18n/` (`en.ts`, `pt-BR.ts`, `t(key, vars)`, idioma salvo) + teste que as duas línguas têm as mesmas chaves
- [x] Fonte pixel com acentos (avaliar Pixelify Sans / fonte bitmap própria); carregada no Preload
- [x] `src/art/manifest.ts` (chaves de personagens, anims, tiles, fx, ui, sfx) + placeholders por código: tile losango, pinguim 8 direções (cores por herói), zumbis (cor por tipo), sombra elíptica
- [x] Smoke test no browser (Playwright, pois o CLI agent-browser não está instalado nesta máquina; 2560×1080 e 1366×768): sem scroll, zoom correto, sem erros

### 1.2 Projeção iso e mundo infinito
- [x] `src/logic/iso.ts`: `worldToScreen`, `screenToWorld`, depth, `dir8` a partir de vetor de tela, rotação do input 45° + testes
- [x] `src/logic/chunks.ts`: coordenada de chunk, chunks visíveis para um retângulo de câmera, decoração determinística por (seed, cx, cy) + testes
- [x] `ChunkManager.ts` (pool de DynamicTextures por chunk, cria/recicla conforme a câmera); camadas por depth (chão `GROUND_DEPTH`, decalques, sombras, entidades por `x+y`)
- [x] Câmera segue o herói com lerp, zoom inteiro, sem tremer (roundPixels)
- [x] Depth sorting por `x+y` validado com 300 inimigos na tela (sem artefatos no teste de estresse)

### 1.3 Herói e movimento
- [x] `src/data/heroes.ts` (stats base, crescimento, arma assinada por tier, cores de placeholder)
- [x] Input teclado + gamepad (WASD/setas/analógico) e movimento no mundo cartesiano; [ ] abstração formal para joystick mobile
- [x] `entities/Hero.ts`: sprite 8 direções (idle/walk por direção), sombra, flash de hit, i-frames
- [x] `RunState` mínimo (herói, tier, round, timer, HP, kills, XP, Fish, carga do superpoder, dano) + testes; cartas/armas/poções entram com as seções 1.8 e 2.3

### 1.4 Inimigos, spawn e hordas
- [x] `src/data/enemies.ts`: 6 inimigos da Antártida (pinguim zumbi, foca, skua, cientista, morsa, inchado) + boss urso polar
- [x] `src/logic/spawn.ts`: pontos fora da área visível real (largura variável), taxa por round + testes
- [x] `EnemySystem`: spawn fora da tela, perseguir + separação via SpatialGrid (recentralizada no herói), reciclagem de distantes
- [x] Comportamentos especiais (`src/logic/enemy-ai.ts` + testes): voador em z, cientista mantém distância e cospe, morsa com preparação e investida, inchado explode em veneno
- [x] `entities/Enemy.ts` pooled (máx. 300) com sombra, aura de elite, flash de hit e flip horizontal; [ ] barra de HP dos elites; [ ] 8 direções quando a arte chegar
- [x] Estresse: **300 inimigos a 60 FPS** a 2560×1080 (Chrome via Playwright, round 40, Lucia)

### 1.5 Combate e armas assinadas
- [x] `src/logic/stats.ts` (PlayerStats: perfil + crescimento por level + pontos + cartas; chaves `resist.*`/`tagMul.*`) + testes
- [x] `src/logic/combat.ts`: crítico, armadura, resist. elemental, dodge, parry, especialista + testes
- [x] `src/data/weapons.ts`: armas assinadas T1–T3 dos 3 heróis (balancing §6)
- [x] `WeaponSystem`: arco melee (Jack), leque de bagos (Bob), projétil elemental alternando 4 elementos (Lucia), cadência, projéteis pooled em z; [ ] área/corrente reais da magia
- [x] Dano no inimigo e no herói, knockback, morte com sangue, números de dano pooled (no `GameScene`; extrair para `CombatSystem` quando crescer)
- [x] Contato de inimigo com o herói (dano por contato + parry)

### 1.6 Efeitos de status
- [x] `src/logic/status.ts`: sangramento, veneno, queimadura, gelo/congelar, terra (atordoar/quebra de armadura), energia (corrente) + testes
- [x] Ticks no `EnemySystem`, números coloridos por DoT, lentidão/congelamento/atordoamento no movimento, crédito do abate para conquistas

### 1.7 Rounds, elites e boss
- [x] `src/logic/round.ts`: duração, boss (N%10), elite roxo/laranja (N%3, ≥11), escala por round/ciclo + testes
- [x] Timer e troca de round (inimigos restantes viram poças) e transição para as cartas (1.8)
- [x] Elites: escala, aura roxa/laranja (placeholder elíptico) e drop garantido de Fish
- [x] Boss urso polar: barra na HUD, timer 3:00 (timeout = game over), patada em arco com preparação, investida e rugido que invoca 6 pinguins

### 1.8 Cartas e armas secundárias
- [x] `src/data/cards.ts` (stats, on-hit, secundárias, exclusivas, evolução) e `src/logic/cards.ts` + `src/logic/build.ts` (raridade por round + sorte, slots máx. 3, níveis 1–5, evolução garantida quando liberada) + testes
- [x] `CardPickScene` (tempo pausado; mouse, 1/2/3, setas/A-D + Enter) com moldura por raridade e textos EN/PT-BR; [ ] gamepad dedicado (hoje via teclas sintéticas)
- [x] 4 armas secundárias gerais (facas arremessáveis, molotov, estilhaços de gelo orbitando, pistola reserva — trocada pelo drone, que ficou exclusivo do Bob) com níveis 1–5
- [x] Evolução da arma assinada T1→T2→T3 via carta (após os bosses 10 e 20)

### 1.8b Identidade dos heróis e superpoderes (P-37…P-40)
- [x] Perfis de stats e multiplicadores por tag em `src/data/heroes.ts`, aplicados por `PlayerStats` e testados
- [x] Exclusivas do Jack: Sede de Sangue, Contra-Ataque, Redemoinho de Lâminas, Pele de Ferro, Açougueiro, Pisão Sísmico
- [x] Exclusivas do Bob: Pontas Ocas, Ricochete, Drone-Sentinela, Atirar Correndo, Reflexo, Cinto de Granadas
- [x] Exclusivas da Lucia: Sintonia Elemental, Corrente Arcana, Nova Glacial, Chuva de Meteoros, Barreira Arcana, Florescer Tóxico
- [x] `src/logic/superpower.ts`: desbloqueio no level 5, carga por abates (elite 3, boss 0), persiste entre rounds, zera ao usar + testes
- [x] `SuperpowerSystem`: Espaço; Colheita Rubra (giro que puxa e sangra), Bombardeio (16 explosões na tela), Cataclismo Elemental (vórtice dos 4 elementos); invulnerável 0,8 s; VFX placeholder
- [x] Medidor do superpoder na HUD (visível a partir do level 5, pisca quando pronto)

### 1.8c Pedidos do usuário já adiantados (P-41…P-45)
- [x] TAB alterna 1×/2× (sim, timers e tweens) + indicador "2x ▶▶" na HUD
- [x] Versão SemVer centralizada no rodapé da HUD (`src/ui/version-footer.ts`)
- [x] Versão no rodapé do **menu inicial** e de todas as telas de menu
- [x] 131 conquistas globais (`src/data/achievements.ts`), avaliação, pontos e loja de extras (`src/logic/achievements.ts`) + textos EN/PT-BR + testes
- [x] Toast "Achievement unlocked" centralizado no topo, fila, badge placeholder, som `sfx.achievement` (ElevenLabs)
- [x] Badge final `ui.achievement` no PixelLab (seed 33 de 3; `public/assets/ui/ui.achievement.png`)
- [x] Contadores de conquistas durante a run (kills, elites, bosses, críticos, parries, dodges, DoTs, elementos, cartas, superpoderes) + feats de boss e desbloqueios, com `evaluateAchievements` ao vivo a cada 1 s
- [x] Tela de conquistas (lista com progresso, rolagem, pontos); [ ] loja de extras (itens a definir)
- [x] Save local: schema v1 tolerante, migrações, snapshot da run, histórico das últimas 20 partidas, export/import (`src/logic/save.ts`, `src/core/storage.ts`) + testes
- [x] Tela de **Histórico** das partidas; autosave no início de cada round (após a carta) + **Continuar (Round N)** no menu

### 1.9 Pickups, HUD e fim de run
- [x] Orbes de XP, Fish e carne pooled, ímã pelo alcance de coleta, coleta total no fim do round
- [x] `HudScene`: HP, XP/level, Fish, kills, round/timer, barra do boss, 2x, superpoder, lista da build, aviso de round de elite e poções (2.3)
- [x] Morte / timeout do boss → `GameOverScene` (resumo, recorde) → Enter para jogar de novo
- [ ] QA: run completa com Jack até o round 10 (boss) no browser, sem erros

---

## FASE 2 — ALPHA: RPG, meta e menus

### 2.1 Save e progressão persistente
- [x] `src/logic/save.ts` schema v1 (heróis, Fish, poções, gambits, desbloqueios, progresso de conquistas, histórico, snapshot) + migração + testes
- [x] `src/logic/progression.ts`: `xpToNext`, level 1–100, pontos livres + testes (crescimento por classe em `stats.ts`)
- [x] XP e Fish da run somados ao save no fim da run (mantém tudo); level sobe ao vivo durante a run

### 2.2 Tela Hero (pontos, poções, upgrades)
- [x] Distribuir pontos de stat com prévia (tela Heróis e Poções)
- [x] Loja de poções (Fish) e **Oficina** de upgrades permanentes com Fish (`src/data/upgrades.ts`, `src/logic/upgrades.ts` + testes; 9 melhorias compartilhadas pelos heróis)
- [x] Editor de gambits: 3 slots, poção (← →) + condição (Enter)

### 2.3 Poções em jogo
- [x] `src/logic/potions.ts`: avaliação das condições em ordem a cada 0,25 s, estoque consumido/devolvido + testes
- [x] Efeitos das poções no `GameScene` (cura, mega cura, escudo, fúria, antídoto, pressa) + slots na HUD; veneno no herói (cuspe do cientista)

### 2.4 Desbloqueios e seleção
- [x] Bob ao vencer o boss 10, Lucia ao vencer o boss 20 (banner na tela); [ ] tela de desbloqueio dedicada
- [x] `HeroSelectScene` com retratos (concepts aprovados), bloqueio com dica de desbloqueio e nível

### 2.5 Menus e settings
- [x] `MainMenuScene` (key art animada, carteira de Fish/pontos, versão no rodapé), `PauseScene` (Continuar / Configurações / Desistir com confirmação), `GameOverScene` (XP, levels, Fish, recorde; Enter = de novo, Esc = menu)
- [x] `SettingsScene`: idioma EN/PT-BR, **resolução (auto/SD/HD/FHD/2K/3K/4K)**, volumes, gore, tremor de tela, números de dano, exportar/importar save; gore (reduzido/gosma), tremor e números de dano aplicados no jogo; [ ] fullscreen
- [x] Records: melhor round por herói na seleção de heróis (`progress.hero[h].bestRound`)

### 2.6 i18n e balanceamento
- [ ] Todas as strings em `en.ts` e `pt-BR.ts`; layouts conferidos nos dois idiomas
- [ ] `src/logic/sim/`: simulação headless de runs (3 heróis, rounds 1–30, levels 1/10/30) + script `scripts/sim.ts`
- [ ] Ajustar `balancing.md` e `src/data` pelas metas (§9)

---

## FASE 3 — BETA: armas estilo Brotato, simulação e balanceamento (placeholders)

> **Regra do usuário (P-57, 2026-09-27): nenhum asset novo até o fim da Fase 7.** Tudo com placeholders por código usando as chaves do manifest; arte e áudio finais entram só na seção 7.2.

### 3.1 Armas como sprites separados (P-56)
- [x] `WeaponView`: sprite da arma assinada ao lado do herói, mira no alvo, animação por código (corte em arco com rastro, recuo + clarão de tiro, brilho/pulso do cajado)
- [x] Placeholders por código das 9 armas assinadas (T1–T3 × 3 heróis) e da pistola
- [x] Ataque não depende de frames do herói (`Hero.attack` só vira para o alvo quando não há atlas; placeholder já é sem arma)
- [x] Testes da lógica de pose/ângulo e do tempo do golpe vs. cadência (`tests/weapon-anim.test.ts`)

### 3.2 Simulação headless e balanceamento
- [x] `src/logic/sim/run-sim.ts`: run simulada (herói, level, cartas por seed) com as fórmulas reais; [ ] calibrar o contato com o bot (hoje prevê rounds 3–4)
- [x] `scripts/sim.ts` (tabela herói × level) e `scripts/playtest-bot.ts` (bot no jogo real, foge do grupo, 2×)
- [x] 1ª passada de balanceamento pelo bot (balancing §10): heróis nível 1 morrem entre os rounds 7 e 10; [ ] passada com níveis 10/30 e cartas
- [ ] Teste de sanidade da sim (determinística por seed)

### 3.3 Polimento de sistemas
- [ ] Zoom-punch do boss, luz nos projéteis mágicos e bloom (filtros do Phaser 4)
- [ ] Performance: 60 FPS com 300 inimigos + 2.000 decalques + luzes em 2560×1080 (medir e anotar)
- [ ] Tela de desbloqueio dedicada (Bob/Lucia) e fullscreen nas configurações
- [ ] Loja de extras das conquistas: mecânica pronta; itens a definir com o usuário
- [ ] Auditoria de i18n (nenhum texto fora de `src/i18n`; skill `ccgs-localize`)

---

## FASE 4 — BETA: gore, luz e juice

### 4.1 Gore persistente
- [x] Decalques por chunk (`ChunkManager.addDecal`, carimbados na DynamicTexture do chão), recarimbo ao voltar, teto de 400 por chunk
- [x] Jorros de sangue (partículas) no hit e na morte; gibs com arco em z, sombra e decalque ao cair
- [x] Settings de gore: máximo / reduzido / gosma verde

### 4.2 Iluminação estilo Diablo 4
- [x] Escuridão (RenderTexture na HUD) com luzes carimbadas em modo ERASE (`world/Lighting.ts`)
- [x] Luzes no herói, fogo, explosões/flashes, elites e boss, superpoder (luz de projéteis e bloom → 3.3)

### 4.3 Juice
- [x] Hit-stop (crítico com limite, elite, boss), screen shake, flash, knockback (zoom-punch → 3.3)

---

## FASE 5 — BETA: sistemas de áudio

- [x] `scripts/el-sfx.ts` + cliente `scripts/lib/elevenlabs.ts`; 18 SFX; `sfx()` com limite de vozes, pitch e volumes
- [x] Música (plano Starter): `music.menu`, `music.round`, `music.boss` pela Music API; `core/music.ts` com crossfade e volume ao vivo
- [ ] Canal de voz (`vo.*`) e gatilhos por evento (início de run, level up, HP baixo, poção, boss, morte) com legendas i18n — tocando placeholders silenciosos até 7.2

---

## FASE 6 — BETA: conteúdo endless (sistemas com placeholders)

- [ ] Pool rotativo de bosses com escala por ciclo (`1,6^ciclo`); bosses 2 e 3 com IA própria (placeholders)
- [ ] Biomas 2 (estação de pesquisa/porto) e 3 (cidade em ruínas): troca de bioma a cada 10 rounds, paleta/decoração por código, 4–6 inimigos novos cada (placeholders)
- [ ] +6 armas secundárias (bumerangue de peixe, mina, anel de chamas, totem de raios, nuvem de veneno, besta) e mais cartas on-hit
- [ ] Obstáculos sólidos leves (P-11) com desvio simples
- [ ] Recordes por herói e conquistas que dependem dos biomas 2–3
- [ ] Balanceamento com sim + playtest (metas §9)

---

## FASE 7 — RC → 1.0.0

### 7.1 QA e release candidate (ainda com placeholders)
- [ ] QA cross-browser (`scripts/qa-browsers.ts`) e resoluções (1366×768 → 3840×2160, ultrawide, Retina)
- [ ] Gamepad completo, rebind de teclas, acessibilidade (tamanho dos números, flashes reduzidos)
- [ ] Testes E2E com Playwright (skills `gc-game-qa`/`gc-qa-game`): menu → run → cartas → morte → histórico
- [ ] `1.0.0-rc.1`

### 7.2 Produção e troca dos assets finais (só aqui — P-57)
> Siga as skills `pinguin-art-assets` e `pinguin-audio-assets`. `GET /balance` antes de cada lote; piloto antes de lotes grandes.
- [ ] Heróis **sem arma** via `/create-character-state` + templates (idle, walk8, hurt, death) × 5 direções + espelho; superpoder (1 direção)
- [ ] 9 armas assinadas + secundárias como imagens (`/create-image-pixflux`), animadas por código (P-56)
- [ ] Inimigos: aprovar concepts (já gerados em `art-src/pixellab/concepts/enemies/`) → templates walk/attack/death; boss urso polar (skeleton-v3); bosses/inimigos dos biomas 2–3
- [ ] Tiles iso e decorações dos 3 biomas (`scripts/pl-tiles.ts`)
- [ ] Projéteis, pickups, ícones de cartas/stats/poções, molduras de UI
- [ ] VFX dos 3 superpoderes (demais efeitos seguem por código)
- [ ] Vozes EN + PT-BR dos 3 heróis; variações extras de SFX; música do round tardio
- [ ] `pack-heroes`/`pack-atlas` por grupo + carregamento sob demanda; trocar todos os placeholders; QA visual a 2560×1080 e no M1
- [ ] Revisão final de docs, créditos (PixelLab, ElevenLabs), build publicável (itch.io; gore reduzido para portais)
- [ ] `1.0.0`
