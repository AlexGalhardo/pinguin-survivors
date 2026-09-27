# PLAN.md — Pinguin Survivors

> **Referência principal das sessões de agentes.** Leia inteiro antes de começar. Trabalhe na ordem, uma microtarefa por vez.
> Legenda: `[ ]` pendente · `[x]` concluída · `[~]` incompleta/bloqueada (diga o motivo).
> Ao terminar uma tarefa: marque o checkbox e adicione 1–3 linhas no **Changelog** (fim do arquivo).
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
| 3 | `0.1.0-beta.N` | Arte PixelLab: heróis (3 tiers), inimigos, boss, tiles, VFX, UI |
| 4 | `0.1.0-beta.N` | Gore persistente, iluminação estilo D4, juice |
| 5 | `0.1.0-beta.N` | Áudio ElevenLabs: SFX, música metal, vozes EN/PT-BR |
| 6 | `0.1.0-beta.N` | Conteúdo endless: biomas 2–3, pool de bosses, mais armas/cartas, balanceamento |
| 7 | `1.0.0-rc.N` → `1.0.0` | Polish, QA, performance, release |

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
- [x] Timer e troca de round (inimigos restantes viram poças); [ ] transição para as cartas (1.8)
- [x] Elites: escala e aura roxa/laranja (placeholder elíptico); [ ] drop garantido de Fish
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
- [ ] Versão no rodapé do **menu inicial** (quando o MainMenu existir, 2.5)
- [x] 131 conquistas globais (`src/data/achievements.ts`), avaliação, pontos e loja de extras (`src/logic/achievements.ts`) + textos EN/PT-BR + testes
- [x] Toast "Achievement unlocked" centralizado no topo, fila, badge placeholder, som `sfx.achievement` (ElevenLabs)
- [x] Badge final `ui.achievement` no PixelLab (seed 33 de 3; `public/assets/ui/ui.achievement.png`)
- [x] Contadores de conquistas durante a run (kills, elites, bosses, críticos, parries, dodges, DoTs, elementos, cartas, superpoderes) + feats de boss e desbloqueios, com `evaluateAchievements` ao vivo a cada 1 s
- [ ] Tela de conquistas (lista, progresso, filtros) e loja de extras (itens a definir)
- [x] Save local: schema v1 tolerante, migrações, snapshot da run, histórico das últimas 20 partidas, export/import (`src/logic/save.ts`, `src/core/storage.ts`) + testes
- [ ] Autosave no fim de cada round + botão **Continue** no menu + tela de **Histórico** das partidas

### 1.9 Pickups, HUD e fim de run
- [x] Orbes de XP, Fish e carne pooled, ímã pelo alcance de coleta, coleta total no fim do round
- [x] `HudScene`: HP, XP/level, Fish, kills, round/timer, barra do boss, 2x, superpoder, lista da build; [ ] aviso de round de elite; [ ] poções (2.3)
- [x] Morte / timeout do boss → `GameOverScene` (resumo, recorde) → Enter para jogar de novo
- [ ] QA: run completa com Jack até o round 10 (boss) no browser, sem erros

---

## FASE 2 — ALPHA: RPG, meta e menus

### 2.1 Save e progressão persistente
- [x] `src/logic/save.ts` schema v1 (heróis, Fish, poções, gambits, desbloqueios, progresso de conquistas, histórico, snapshot) + migração + testes
- [x] `src/logic/progression.ts`: `xpToNext`, level 1–100, pontos livres + testes (crescimento por classe em `stats.ts`)
- [x] XP e Fish da run somados ao save no fim da run (mantém tudo); level sobe ao vivo durante a run

### 2.2 Tela Hero (pontos, poções, upgrades)
- [ ] Distribuir pontos de stat com prévia
- [ ] Loja de poções (Fish) e upgrades permanentes
- [ ] Editor de gambits: 3 slots, tipo + condição

### 2.3 Poções em jogo
- [ ] `src/logic/potions.ts`: avaliação das condições em ordem a cada 0,25 s + testes
- [ ] `PotionSystem`: efeitos (cura, mega cura, escudo, fúria, antídoto, pressa) + feedback na HUD

### 2.4 Desbloqueios e seleção
- [x] Bob ao vencer o boss 10, Lucia ao vencer o boss 20 (banner na tela); [ ] tela de desbloqueio dedicada
- [ ] `HeroSelectScene` com heróis bloqueados/desbloqueados, level e stats

### 2.5 Menus e settings
- [ ] `MainMenuScene`, `PauseScene` (Resume / Settings / Quit com confirmação), `GameOverScene` final (XP ganho, levels, Fish, build, recorde)
- [ ] `SettingsScene`: idioma EN/PT-BR, volumes (master/música/SFX/voz), gore (máx./reduzido/gosma), screen shake, números de dano, fullscreen
- [ ] Records (melhor round por herói)

### 2.6 i18n e balanceamento
- [ ] Todas as strings em `en.ts` e `pt-BR.ts`; layouts conferidos nos dois idiomas
- [ ] `src/logic/sim/`: simulação headless de runs (3 heróis, rounds 1–30, levels 1/10/30) + script `scripts/sim.ts`
- [ ] Ajustar `balancing.md` e `src/data` pelas metas (§9)

---

## FASE 3 — BETA: arte PixelLab

> Siga a skill `pinguin-art-assets`. `GET /balance` antes de cada lote; piloto de 1 direção antes de lotes grandes.

### 3.1 Heróis
- [ ] (depende da aprovação 0.2) Regerar/ajustar os escolhidos no tamanho final, se preciso
- [ ] Piloto: `walk` de Jack T1 em 1 direção (v3, 12 frames) → medir custo e qualidade → anotar em art-and-assets
- [ ] `scripts/pl-animate.ts` (lotes por personagem × anim × direções, idempotente, zip → frames)
- [ ] Jack T1: idle, walk, attack, hurt, death, super × 8 dir
- [ ] Jack T2 (katana) e T3 (espada-motosserra) via `/create-character-state` + animações
- [ ] Bob T1–T3 (escopeta cano duplo → automática → foguete) + animações
- [ ] Lucia T1–T3 (cajado dos 4 elementos → arcano → Quatro Tempestades) + animações
- [ ] Retratos dos heróis para HeroSelect/HUD

### 3.2 Inimigos e boss (Antártida)
- [ ] Concepts dos 6 inimigos (64 px) → **aprovação do usuário**
- [ ] Animações walk/attack/death × 8 dir dos 6 inimigos
- [ ] Concept do boss urso polar (128–192 px) → aprovação → idle/walk/attack/special/death × 8 dir

### 3.3 Mundo
- [ ] Tiles iso 64×32 da Antártida (neve, gelo, neve suja, rocha) com variações
- [ ] Decorações (blocos de gelo, carcaças, placas, barris, destroços da base)

### 3.4 Armas, projéteis e pickups
- [ ] Sprites das secundárias e projéteis (bagos, foguete, 4 elementos, facas, molotov, drone)
- [ ] Orbe de XP, Fish, ícones de poções

### 3.5 VFX (≥ 12 frames)
- [ ] Jorros de sangue (3 variações), decalques de poça (8+ variações), gibs (pedaços por tipo de inimigo)
- [ ] Explosões, impactos, 4 elementos, auras de elite roxa/laranja, level up, cura
- [ ] **VFX exclusivos dos superpoderes**: Colheita Rubra (Jack), Bombardeio (Bob), Cataclismo Elemental (Lucia)
- [ ] VFX das cartas exclusivas (redemoinho, pisão, drone, granada, corrente arcana, nova glacial, meteoros, barreira, nuvem tóxica)

### 3.6 UI e integração
- [ ] Painéis, botões, molduras de carta por raridade, ícones de stats/cartas (`/create-ui-asset`), logo
- [ ] `pack-atlas` por grupo (heróis, bioma, fx, ui) + carregamento sob demanda por herói/bioma
- [ ] Trocar todos os placeholders pelas chaves finais; QA visual a 2560×1080

---

## FASE 4 — BETA: gore, luz e juice

### 4.1 Gore persistente
- [ ] `GoreLayer`: decalques por chunk (DynamicTexture), recarimbo ao voltar ao chunk, teto por chunk com fusão
- [ ] Jorros de sangue no hit e na morte; gibs com arco em z, sombra e decalque ao cair
- [ ] Settings de gore: máximo / reduzido / gosma verde

### 4.2 Iluminação estilo Diablo 4
- [ ] Spike: máscara de escuridão com luzes aditivas vs Lighting do Phaser 4 → escolher pelo custo
- [ ] Luzes em tiros, magias, explosões, auras, orbes; vinheta; bloom em projéteis/magias

### 4.3 Juice
- [ ] Hit-stop (crítico, elite, boss), screen shake, flash branco, knockback, zoom-punch do boss, números de dano estilizados

### 4.4 Performance
- [ ] 60 FPS com 300 inimigos + 2.000 decalques + luzes em 2560×1080 (medir no Chrome; anotar)

---

## FASE 5 — BETA: áudio ElevenLabs

> Siga a skill `pinguin-audio-assets`.

- [ ] Conferir endpoints atuais (SFX, música, TTS, voice design) e criar `scripts/el-sfx.ts`, `el-music.ts`, `el-voice.ts`
- [ ] Catálogo de SFX (armas, impactos, sangue, elementos, pickups, UI, level up, poção) com variações
- [ ] Música: menu, round, round tardio, boss, game over (loops sem emenda)
- [ ] Vozes EN + PT-BR dos 3 heróis (desenho de voz por herói + falas por evento)
- [ ] `AudioSystem` (limite de vozes, pitch) + `MusicSystem` (crossfade round↔boss) + volumes por canal

---

## FASE 6 — BETA: conteúdo endless

- [ ] Pool rotativo de bosses com escala por ciclo (`1,6^ciclo`)
- [ ] Bioma 2 (estação de pesquisa/porto): tiles, decoração, 4–6 inimigos, boss do round 20
- [ ] Bioma 3 (cidade em ruínas): tiles, decoração, 4–6 inimigos, boss do round 30
- [ ] +6 armas secundárias (bumerangue de peixe, pistola auxiliar, mina, anel de chamas, totem de raios, nuvem de veneno) e mais cartas on-hit
- [ ] Obstáculos sólidos leves (P-11) com desvio simples
- [ ] Conquistas e recordes por herói
- [ ] Balanceamento com sim + playtest (metas §9)

---

## FASE 7 — RC → 1.0.0

- [ ] QA cross-browser (`scripts/qa-browsers.ts`) e resoluções (1366×768 → 3840×2160, ultrawide)
- [ ] Tamanho do build e carregamento por grupos; tela de loading
- [ ] Gamepad completo, rebind de teclas, acessibilidade (tamanho dos números, flashes reduzidos)
- [ ] Revisão final de docs, créditos (PixelLab, ElevenLabs), build publicável (itch.io; modo gore reduzido para portais)
- [ ] `1.0.0`

---

## Changelog

- 2026-09-27 — Refundação como **Pinguin Survivors**: entrevista (P-01…P-36), branch `starfall-survivors-legacy`, remoto renomeado, `main` limpa (camada de jogo do Starfall removida; infra mantida).
- 2026-09-27 — Docs, CLAUDE.md, AGENTS.md e skills reescritos (`pinguin-art-assets`, `pinguin-audio-assets`); PLAN novo com fases 0–7.
- 2026-09-27 — Pedido do usuário: identidade forte por herói (P-37), 6 cartas exclusivas cada (P-38) e superpoderes no level 5 com VFX próprios (P-39/P-40) → GDD, balancing, art, HUD e PLAN (1.8b).
- 2026-09-27 — Engine iso: projeção 2:1, zoom inteiro pela altura, chunks infinitos em DynamicTexture, herói placeholder 8 direções, i18n EN/PT-BR, fonte Pixelify Sans (60 FPS a 1366×768).
- 2026-09-27 — Pedidos do usuário: TAB 2×, versão no rodapé, 131 conquistas + pontos, toast com som (ElevenLabs), save/histórico/export; histórico da `main` recomeçado e push por commit.
- 2026-09-27 — Fase 1 quase completa: efeitos de status, PlayerStats, CombatSystem, pickups/level/Fish, save ligado ao jogo, Game Over, cartas (48), secundárias e exclusivas, perks, superpoderes, IA especial dos inimigos e ataques do boss. 300 inimigos a 60 FPS. Alcance do Jack +50% (pedido do usuário).
- 2026-09-27 — Loop de combate jogável com placeholders: hordas fora da tela com separação, elites com aura, boss no round 10, armas T1 dos 3 heróis, sangue no chão, HUD (HP, round, timer, kills, boss). Playwright headless mediu ~38 FPS a 2560×1080 com ~40 inimigos (render por software; medir no Chrome real).
- 2026-09-27 — Concepts aprovados (Jack v3-a, Bob v3-a, Lucia v3-b; ~88 px). Versionamento passa a `0.1.0-alpha.N`.
- 2026-09-27 — Cliente PixelLab + `pl-concepts.ts`: 9 concepts (3 heróis × v3 a/b + Pro), 93 gerações; aguardando aprovação.

## Pendências do desenvolvedor

- [x] Aprovar os concepts dos heróis (`art-src/pixellab/concepts/sheet.png`) — ver 0.2
- [ ] Decidir se quer reescrever o histórico antigo / renomear as tags do Starfall (ver 0.2; precisa liberar a permissão)
- [ ] Rotacionar a chave do ElevenLabs e o token do PixelLab (foram colados no chat/TODO.md) e atualizar o `.env`
- [ ] Reiniciar a sessão do Claude Code para o MCP `pixellab` carregar (opcional; os scripts usam a API direto)
