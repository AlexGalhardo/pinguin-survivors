# Brainstorming — Pinguin Survivors 1.0 comercial

> **Versão** 1.0 · **Data** 2026-11-08 · **Método** entrevista em rodadas (skill `grilling`, 30 perguntas de múltipla escolha) com o desenvolvedor, conduzida pelo Game Director (sessão de agente).
> Este documento registra **o que foi decidido e o que foi descartado** na virada do projeto para a versão comercial (Steam + Android, demo no Steam Next Fest de fevereiro de 2027). As decisões viram ADRs em [adrs/](adrs/) e entram no [gdd.md](gdd.md); as decisões anteriores (P-01…P-68) continuam em [decisions.md](decisions.md) e valem onde não forem substituídas aqui.

## Índice

1. [Contexto e meta](#1-contexto-e-meta)
2. [Decisões (B-01…B-30)](#2-decisões)
3. [Ideias descartadas](#3-ideias-descartadas)
4. [Pendências do desenvolvedor](#4-pendências-do-desenvolvedor)
5. [Impacto nos sistemas existentes](#5-impacto-nos-sistemas-existentes)
6. [Riscos levantados](#6-riscos-levantados)

## 1. Contexto e meta

- Estado no início da sessão: `0.1.0-beta.8` (build `playdev-7`), isométrico 2:1, Fases 0–6 do PLAN.md concluídas, Fase 7 parcial.
- Meta: **Release 1.0 comercial** na Steam (US$ 4,99) e Google Play (premium), com **demo pronta para o Steam Next Fest de 22/02 a 01/03/2027** (inscrição até 10/01/2027, itens para revisão até 08/02/2027 — ver [web-research.md](web-research.md) §7).
- Orçamento de assets no dia: PixelLab Tier 2 ativo, **2.320 gerações até 14/11/2026** e 5.000/mês depois; ElevenLabs Creator com **58.198 créditos** até 14/11/2026.

## 2. Decisões

| # | Tema | Decisão | Alternativas descartadas | ADR |
|---|---|---|---|---|
| B-01 | Stack | **Phaser 4 + TypeScript + Vite + Bun** continuam. O trecho "Rust + Bevy" do briefing foi um erro do desenvolvedor. Electron (Steam) e Capacitor (Android) embrulham o build web. | Porte para Rust + Bevy | ADR-001 |
| B-02 | UI | **Toda a UI em React + TypeScript + Tailwind CSS v4** como overlay DOM sobre o canvas: HUD, menus, loja, cartas, settings. Phaser renderiza só o mundo. | Só HUD e loja em React | ADR-002 |
| B-03 | Câmera | **2D top-down** (vista 3/4 estilo Brotato). Projeção isométrica removida. | Manter iso | ADR-003 |
| B-04 | Mapa | **Quadrado fixo** por round: 10×10 tiles no round 1, **+1 tile de lado por round**, **teto 40×40** (do round 31 em diante). Tile de **64 px**. Parede visível nas bordas; spawn nas bordas internas. | Tile 32 px; sem teto; mapa infinito em chunks | ADR-003 |
| B-05 | Código iso | Remover `iso.ts`, `chunks.ts`, `ChunkManager` e testes correspondentes. | Manter como código morto | ADR-003 |
| B-06 | Arte existente | **Reaproveitar** heróis e inimigos já gerados (vista `low top-down`, 8 direções) após QA visual; refazer só chão, decorações, lojista e o que ficar errado. Novos personagens: concept em 4 direções (S, E, N gerados, W espelhado) → aprovação → animação (8 frames heróis, 6 inimigos). | Recriar tudo em 4 direções | ADR-004 |
| B-07 | Armas | **6 slots iguais** estilo Brotato. Não existe mais "arma assinada" com tiers T1→T3 por herói. | 4 slots; slot 1 fixo com evolução | ADR-005 |
| B-08 | Arma inicial | Jogador **escolhe a arma inicial na seleção de herói** (lista por herói). Heróis mantêm perfis de stats e **multiplicadores por tag** (melee/fogo/magia) e 6 exclusivas. | Arma fixa por herói; sem classe | ADR-005 |
| B-09 | Loja | **Loja no fim de cada round** (como Brotato): 4 ofertas (armas e itens), **reroll com preço crescente**, **lock por item**, preços escalam por round. | Loja substitui cartas; 6 ofertas; 3 ofertas | ADR-006 |
| B-10 | Cartas | Cartas passam a ser a **escolha de level-up**: **4 opções**, só stats e exclusivas do herói; armas e itens ficam só na loja. | 3 opções; cartas com armas | ADR-006 |
| B-11 | Moeda da run | **Fish 🐟** vira a moeda da run (drop, zera a cada run, paga a loja e o reroll). | Fish persistente paga tudo | ADR-007 |
| B-12 | Moeda meta | Nova moeda persistente **Pérolas** (EN *Pearls*) para Oficina, poções e desbloqueios. | Krill; Gemas de gelo | ADR-007 |
| B-13 | Tela da loja | **UI estilo ARPG (Diablo)**: paper doll do herói com stats e 5 slots de equipamento à esquerda, NPC lojista integrado na mesma tela à direita. | Loja em lista simples | ADR-006 |
| B-14 | Lojista | **Pinguim velho mercador com carrinho de peixes**. Concept PixelLab em 1 direção, idle animado; aprovação do desenvolvedor antes de animar. | Foca contrabandista; cientista humano | — |
| B-15 | Dificuldade | **Danger 0–5 por herói**, desbloqueado em sequência (vencer o danger N libera N+1). | EASY/NORMAL/HARD | ADR-008 |
| B-16 | Fim da run | **Endless puro**, sem condição de vitória. Boss a cada 10 rounds continua. | Vitória no round 30 ou 20 | ADR-008 |
| B-17 | Sistemas mantidos | Superpoder (level 5, Espaço), poções com gambits (3 slots), equipamentos (5 slots, agora também vendidos na loja), 131 conquistas + loja de extras. | — | — |
| B-18 | Vozes | **Remover** vozes e legendas (84 MP3, `VoiceDirector`, `src/i18n/voice*`). Ficam só música, SFX e VFX. Snapshot em branch antes de remover. | Só desligar | ADR-009 |
| B-19 | Branch legado | Branch **`legacy-voices`** criada a partir de `main` em 2026-11-08 com o estado completo (iso + vozes). | Duas branches | ADR-009 |
| B-20 | Gore | Gore nível DOOM **mantido com toggle** (máximo por padrão; reduzido/gosma nas opções). Classificação alvo **16+** (IARC). | Reduzido por padrão | — |
| B-21 | Idiomas | **EN, PT-BR, ES e ZH simplificado** na 1.0. ES/ZH traduzidos por IA com revisão. | Só EN + PT-BR | ADR-010 |
| B-22 | Preço | **Steam US$ 4,99** (preço regional) e **Android premium** no mesmo patamar. Sem DLC no lançamento. | US$ 9,99; Android F2P com ads | ADR-011 |
| B-23 | Steam | **Conquistas Steam, Steam Cloud e leaderboards** na 1.0. | Só executável | ADR-011 |
| B-24 | Electron | **Windows primeiro**; Linux/macOS depois da 1.0. | Windows + Linux na demo | ADR-012 |
| B-25 | Mobile | **Landscape only** com joystick virtual flutuante. | Portrait | ADR-012 |
| B-26 | Demo | **Rounds 1–10 (até o 1º boss), só Jack**; Bob e Lucia aparecem bloqueados. **Save da demo migra** para o jogo completo. Mesma demo na web (`/demo`) e na Steam. | 3 heróis na demo; demo isolada | ADR-013 |
| B-27 | Site | Landing page + `/demo` no **mesmo build Vite**, hospedados no **GitHub Pages** (grátis). DNS próprio depois. | Vercel; site separado | ADR-014 |
| B-28 | Versionamento | **Padrão vukem**: tags `vX.Y.Z` sem sufixo `-alpha`/`-beta`; **0.0.x = alpha**, **0.1.x = beta**, **1.0.0 = lançamento comercial**. Release = tag, corpo em grupos Keep a Changelog com escopo em negrito e link do commit. | Manter `0.2.0-alpha.N` | ADR-015 |
| B-29 | Tags antigas | **Retag** das 11 tags `v0.1.0-alpha.1…v0.1.0-beta.8` como `v0.0.1…v0.0.11` (mesmos commits), apagar as antigas e criar releases retroativos como pre-release. Tags do Starfall (`v1.0.0-*`, `pinguin-survivors-final`) não geram release. | Manter nomes antigos | ADR-015 |
| B-30 | Prioridade | **Jogo completo em paridade**; a demo é um recorte do jogo completo, não um produto à parte. Se o tempo apertar, nada do jogo completo é cortado em favor da demo. | Demo polida acima de tudo | — |
| B-31 | Agentes | Subagentes em **paralelo** (até 3), sem worktrees; trabalho inline em `main`. | Sequencial; worktrees | — |

## 3. Ideias descartadas

| Ideia | Motivo |
|---|---|
| Porte para Rust + Bevy | Erro de briefing. Reescrita total a 106 dias do Next Fest; nenhum ganho para um jogo que roda em webview no Electron/Capacitor. |
| Manter arma assinada com evolução T1→T3 | Conflita com os 6 slots iguais do Brotato; as 9 armas já prontas viram armas normais da loja (3 por classe). |
| Condição de vitória no round 30 + endless desbloqueável | Desenvolvedor prefere endless puro; conquistas por round e danger dão o fechamento. |
| Android F2P com anúncios | Exige SDK de ads, playtest de monetização e classificação IARC com anúncios; premium é mais simples e combina com a Steam. |
| Vercel para o site | Custo potencial; GitHub Pages é grátis e o repositório já está no GitHub. |
| Worktrees por frente | Overhead de integração; o trabalho é sequencial o bastante para `main`. |
| Mapa infinito em chunks | Substituído pelo quadrado crescente; simplifica spawn, câmera e performance. |
| Vozes dos heróis | Custo de i18n (4 idiomas × 3 heróis × 7 eventos), peso no build e pouco valor no loop frenético. |

## 4. Pendências do desenvolvedor

| Pendência | Prazo sugerido | Bloqueia |
|---|---|---|
| Criar conta Steamworks (US$ 100) e o app do jogo + app da demo | até 2026-12-15 | Inscrição no Next Fest (10/01/2027), página da loja, wishlists |
| Criar conta Google Play Console (US$ 25) | até 2027-01-31 | Build Android |
| Aprovar concepts (lojista, personagens novos, chão top-down) | a cada lote | Animação e produção de arte |
| DNS para o GitHub Pages | após o site subir | Só o domínio final |
| Renovar/garantir PixelLab Tier 2 nos ciclos de 14/12, 14/01 e 14/02 | mensal | Arte nova |
| Trailer de até 2 min | após a 1.0 | Placeholder na landing até lá |
| Girar o secret do PixelLab exibido em print nesta sessão | imediato | Segurança |

## 5. Impacto nos sistemas existentes

| Sistema | O que muda |
|---|---|
| `src/logic/iso.ts`, `chunks.ts`, `world/ChunkManager.ts` | Removidos. Novo `src/logic/arena.ts` (tamanho por round, limites, spawn nas bordas) + `world/Arena.ts` (chão por tiles 64 px, paredes). |
| `WeaponSystem` + `WeaponRing` | 6 slots iguais; `src/data/weapons.ts` reorganizado por classe (melee/firearm/magic) e tier I–IV; "assinada" vira arma normal. |
| `CardPickScene` | Vira componente React disparado no level-up (4 opções, só stats/exclusivas). |
| Novo `ShopScene` → componente React `Shop` | Fim de round: 4 ofertas, reroll, lock, paper doll, lojista. |
| `RunState` / economia | `fish` zera por run; `pearls` no save; `src/data/economy.ts` com preços por round e reroll. |
| `difficulty.ts` | Danger 0–5 por herói no save (`progress.hero[h].danger`). |
| `VoiceDirector`, `src/core/voice.ts`, `src/i18n/voice*.ts`, `public/assets/audio/vo/` | Removidos. |
| Cenas Phaser de UI (`MainMenuScene`, `HudScene`, `SettingsScene`, …) | Substituídas por React; Phaser fica com `Boot`, `Game` e o mundo. Eventos tipados Game ↔ React via `GameEvents`. |
| `src/logic/display.ts` | Mantém zoom inteiro pela altura 540; alvo 1920×1080 (×2), 2560×1440 (×2, 1280×720 lógicos), mobile 6,7"/6,8" landscape (×2). |
| `src/i18n/` | +ES, +ZH simplificado; teste de chaves iguais nos 4 idiomas. |

## 6. Riscos levantados

1. **Prazo**: 106 dias até o Next Fest com refatoração de câmera, mapa, loja, UI React e 2 idiomas novos. Mitigação: ROADMAP com marcos semanais e corte explícito de escopo pós-Next Fest (biomas 2–3, Android).
2. **PixelLab**: o MCP `pixellab` do usuário está com token expirado; usar a API v2 pelo token do `.env`. Ciclo mensal de 5.000 gerações.
3. **Wishlists**: sem página na Steam até dezembro, a demo chega ao Next Fest com poucas wishlists (mediana de quem entra com < 1.000 é ~322 ganhas; ver web-research §7).
4. **Classificação 16+** reduz o alcance no Android; o toggle de gore não muda a classificação declarada.
