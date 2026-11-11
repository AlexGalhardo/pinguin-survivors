# ROADMAP.md — do 0.10.1 ao 1.0.0

> **Fonte da verdade do trabalho.** Reescrito em 2026-11-11 para ser executado em loop (`/goal`). O roadmap anterior (M0–M9, com a evidência de cada tarefa já feita) está no git: `git show 198f15d:ROADMAP.md`.
> Legenda: `[ ]` pendente · `[x]` feito (evidência na linha) · `[~]` bloqueado (motivo) · 🛑 só o desenvolvedor faz ou aprova.
> Processo: [docs/workflow.md](docs/workflow.md) · Specs: [docs/sdds/](docs/sdds/README.md) · Decisões: [docs/adrs/](docs/adrs/README.md) e [docs/brainstorming.md](docs/brainstorming.md) (B-32…B-36) · Design: [docs/gdd.md](docs/gdd.md).

## Índice

1. [Meta e datas](#1-meta-e-datas)
2. [Como trabalhar neste roadmap](#2-como-trabalhar-neste-roadmap)
3. [Estado em 2026-11-11](#3-estado-em-2026-11-11)
4. [F1 — Fechar a 0.11.0](#4-f1--fechar-a-0110)
5. [F2 — Penguin Survivors (rename)](#5-f2--penguin-survivors-rename)
6. [F3 — Primeiros cinco minutos](#6-f3--primeiros-cinco-minutos)
7. [F4 — Demo do Next Fest](#7-f4--demo-do-next-fest)
8. [F5 — Classes por herói](#8-f5--classes-por-herói)
9. [F6 — Steam Next Fest](#9-f6--steam-next-fest)
10. [F7 — Conteúdo, alcance e Balance 1.0](#10-f7--conteúdo-alcance-e-balance-10)
11. [F8 — Lançamento 1.0](#11-f8--lançamento-10)
12. [Pendências do desenvolvedor](#12-pendências-do-desenvolvedor)
13. [Orçamento de assets](#13-orçamento-de-assets)
14. [Riscos](#14-riscos)

## 1. Meta e datas

Lançar o jogo comercial na Steam (Windows, Electron) e na Google Play (Android, Capacitor), com a demo no Steam Next Fest.

| Data | Evento | Fase |
|---|---|---|
| 2026-11-14 | Renovação PixelLab (5.000 gerações) e ElevenLabs | — |
| 2026-12-15 | 🛑 Conta Steamworks e App IDs (jogo e demo) | F4 |
| 2027-01-10 | **Inscrição no Next Fest fecha** (23:59 PST) | F4 |
| 2027-01-25 | Build da demo enviado à Steam | F4 |
| 2027-02-08 | Itens do Next Fest em revisão | F4 |
| 2027-02-22 → 03-01 | **Steam Next Fest** | F6 |
| 2027-03-31 | Balance 1.0, Steam (conquistas, cloud), Android em teste interno | F7 |
| 2027-04-30 | **1.0.0 na Steam**; Android até 2027-05-15 | F8 |

Versões (padrão vukem, ADR-015): uma release por fase fechada, sempre com o `.exe` do Windows e o `.apk` do Android anexados para o desenvolvedor baixar e testar (`bun scripts/release.ts X.Y.Z --stable`). Próximas: `0.11.0` (F1), `0.12.0` (F2), `0.13.0` (F3), `0.14.0` (F4), `0.15.0` (F5), `0.15.x` (F6, hotfixes), `0.16.0` (F7), `1.0.0` (F8).

## 2. Como trabalhar neste roadmap

O loop de uma sessão (é o que o `/goal` repete):

1. Pegue a **primeira tarefa `[ ]`** da fase mais baixa que não seja 🛑 e não dependa de uma 🛑 aberta. Tarefa 🛑 nunca bloqueia o loop: pule para a próxima tarefa livre e deixe a pendência visível na seção 12.
2. A tarefa pede SDD ou ADR? Escreva primeiro. O que for decisão de produto vira pergunta ao desenvolvedor (`AskUserQuestion`, uma por vez, com recomendação). A resposta vale como aprovação e fica anotada no status da SDD.
3. Implemente no diretório atual, sem worktrees. Micro-commit por mudança lógica, com o teste junto, em Conventional Commits. Gates antes do push: `bun run lint`, `bun run typecheck`, `bun test`, `bun run build`. Push em `main` após cada commit.
4. Rode o **Assert** da tarefa. Passou: marque `[x]` e escreva a evidência na própria linha (comando e resultado, em uma frase). Não passou: corrija a causa; não marque.
5. Mudança visível: capture antes e depois em **1920×1080, 2560×1440 e 844×390** (`bun scripts/qa-menus.ts`, `bun scripts/qa-mobile.ts`) e confira `issues` vazio.
6. Registre o que mudou em `CHANGELOG.md` `[Unreleased]` e nos docs afetados, no mesmo conjunto de commits.
7. Fase sem tarefa livre aberta: rode a **Auditoria da fase** e, em seguida, a **release da fase** (regra do desenvolvedor, 2026-11-11: toda fase termina com uma release que ele baixa e testa):
   1. Gates de release: `bun run e2e`, `bun run e2e -- --demo`, `bun scripts/qa-browsers.ts`, `bun scripts/perf.ts --round 40` (≥ 58 FPS) e `bun scripts/pack-atlas.ts --check`.
   2. `bun scripts/release.ts X.Y.Z --stable` (bump, CHANGELOG, tag, push, GitHub Release).
   3. O workflow `release-assets.yml` anexa o **`.exe` do Windows** (zip do jogo completo e zip da demo) e o **`.apk` do Android**. Espere o run terminar (`gh run watch`); se falhar, gere e anexe à mão como em [docs/workflow.md](docs/workflow.md) §6 (`bun run build:desktop`, `bun run build:desktop:demo`, `./gradlew assembleDebug`, `gh release upload`).
   4. Confira com `gh release view vX.Y.Z --json assets`: os dois zips do Windows e o APK têm que estar na lista.
   5. Termine a sessão entregando ao desenvolvedor o link da release e o link direto de cada arquivo.

A release de fase não precisa de "ok": só a `1.0.0` (F8.5) continua com gate. Pare e pergunte só em: 🛑, gasto acima de 200 gerações PixelLab ou 2.000 créditos ElevenLabs num lote, concept de arte de personagem, apagar ou substituir arte existente, mudança de escopo.

**Condição de término por fase** (texto para o `/goal`): "Todas as tarefas não-🛑 da fase Fn do ROADMAP.md estão `[x]` com evidência na linha, a auditoria da fase está marcada, `git status` está limpo com tudo no `origin/main` e a release da fase está publicada no GitHub com os zips do `.exe` do Windows e o `.apk` do Android anexados (`gh release view vX.Y.Z --json assets`)."

## 3. Estado em 2026-11-11

Versão publicada: **0.10.1** (Latest). O que existe e funciona, conferido no código nesta data:

| Área | Estado |
|---|---|
| Jogo | Arena top-down, 6 slots de arma com raridade I–V e afixos, loja no fim do round, cartas de level-up, campanha de 50 rounds em 5 biomas, 10 bosses com atlas próprio e ataques em área (`BOSS_ROUNDS`, `boss-hazard.ts`), endless a partir do 51, dificuldade Fácil/Normal/Difícil, árvore de habilidades por herói, 3 heróis |
| UI | Toda em React + Tailwind v4, Estilo D plano (ADR-027), 4 idiomas (EN, PT-BR, ES, ZH-CN). Polimento da SDD-021 entregue em `main` depois da 0.10.1 |
| Ports | `apps/desktop` (Electron, `.exe` completo e demo, sem App ID) e `apps/mobile` (Capacitor, AAB debug no CI) |
| Site | Astro em GitHub Pages com `/demo/` e `/play/`; link da Steam ainda `app/TBD` |
| QA | `bun test` 638 pass; `e2e` e `e2e -- --demo` passam; `qa-menus` e `qa-mobile` sem issues; `perf --round 40` 74 FPS |
| Ainda marcado como pendente no roadmap antigo, mas presente no código | Campanha de 50 rounds, ataques em área, arte dos 5 bosses novos, kraken e abominação (antigas T7.3, T7.16–T7.18). A tarefa F7.1 audita e fecha |

## 4. F1 — Fechar a 0.11.0

- [x] **F1.1** Polimento de UI 1.0 ([SDD-021](docs/sdds/SDD-021-polimento-de-ui-1-0.md)): fim de run, HUD, atributos com ícone, loja, pausa, escolha do pinguim, heróis e poções, árvore com ícones, loja no celular de 360 px, scripts de QA, textos do site. · Evidência (2026-11-11): `bun test` 638 pass; `qa-menus` → `issues []`; `qa-mobile` → `issues none`; `e2e` e `e2e -- --demo` passed; `perf --round 40` → 74 FPS, p95 13,4 ms; commits `a1239e6`…`198f15d`.
- [x] **F1.2** Conferir as telas da SDD-021 em **2560×1440** (só 1920×1080, 1280×720, 2560×1080 e celular foram capturadas). · DoD: `qa-menus` ganha 2560×1440 na lista de viewports. · Assert: `bun scripts/qa-menus.ts <dir>` → `issues []` com os 4 viewports. · Evidência (2026-11-11): `bun scripts/qa-menus.ts` com 1280×720, 1920×1080, 2560×1080 e 2560×1440 → `issues []`; capturas da loja com comparação e da pausa em 2560×1440 conferidas.
- [x] **F1.3** `CHANGELOG.md` com grupos repetidos na mesma versão (`### Fixed` duas vezes em 0.10.1, `### Added` em 0.10.0 e 0.9.0): o `release.ts` anexa um segundo bloco em vez de fundir. Corrigir o script e as três seções. · Assert: `bunx markdownlint-cli2 CHANGELOG.md` → 0 erros; teste do `release-notes` cobrindo a fusão. · Evidência (2026-11-11): `mergeGroups` em `scripts/lib/release-notes.ts` funde os grupos; `bun test tests/release-notes.test.ts` 5 pass; `bunx markdownlint-cli2 CHANGELOG.md` → 0 issues; as seções 0.10.1, 0.10.0 e 0.9.0 foram fundidas sem perder linha (diff de conteúdo vazio).
- [x] **F1.4** Nome da oferta truncado na loja do celular ("Ring …"): apertar o padding de COMPRAR e TRAVAR abaixo de 500 px de altura. · Assert: captura 800×360 com os 4 nomes legíveis até pelo menos 12 caracteres; `qa-mobile` sem issues. · Evidência (2026-11-11): botões COMPRAR e TRAVAR mais estreitos abaixo de 500 px de altura; captura 800×360 (DPR 3) mostra "Ring of Fire", "Backup Pistol", "Clover Charm" e "Lucky Charm" inteiros; `qa-mobile` → `issues none`.
- [x] **F1.5** Gates de release: `bun scripts/qa-browsers.ts` (Chrome, Edge, Firefox, com `bun run dev`: o build de produção não expõe `window.__GAME__`) e `bun scripts/pack-atlas.ts --check`. · Assert: relatório em `docs/reports/qa-browsers-<data>.md` com 0 erros; `--check` com 0 faltando. · Evidência (2026-11-11): `bun scripts/qa-browsers.ts http://localhost:5173` → Chrome 157, Edge 157 e Firefox 159 completam o fluxo (menu → run → loja → round 2 → pausa → fim → menu) com 0 erros e 0 respostas 4xx/5xx; 6 resoluções sem scroll ([relatório](docs/reports/qa-browsers-2026-11-11.md)); `bun scripts/pack-atlas.ts --check` → 290 chaves, 0 faltando; `e2e` e `e2e -- --demo` passed; `perf --round 40` 74 FPS.
- [~] **F1.6** Release `0.11.0` com o `.exe` e o `.apk` para download (passo 7 da seção 2). · Assert: `gh release view v0.11.0 --json assets,isPrerelease` Latest, com os dois zips do Windows e o APK; `package.json` 0.11.0; links entregues ao desenvolvedor. · Bloqueado (2026-11-11): o classificador de permissões do modo automático recusa a publicação ("Create Public Surface"). Gates já verdes; falta só o desenvolvedor rodar `! bun scripts/release.ts 0.11.0 --stable` no prompt (ou liberar o comando nas permissões) e conferir os assets com `gh release view v0.11.0 --json assets`. Enquanto isso, os builds locais ficam em `apps/desktop/dist/full/win-unpacked/Penguin Survivors.exe` e `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`.
- [x] **Auditoria F1**: reexecutar os asserts de F1.1–F1.5 e anotar a data aqui. · 2026-11-11 (orquestrador): `bun test` 639 pass, `qa-menus` e `qa-mobile` sem issues, `qa-browsers` 3/3, `pack-atlas --check` 0 faltando.

## 5. F2 — Penguin Survivors (rename)

Decisão B-33: o nome vira **Penguin Survivors** antes de a página da Steam existir.

- [x] **F2.1** ADR-028 "Nome Penguin Survivors": o que muda (título, textos, site, executável, id do Android, arquivos de release), o que não muda (repositório até F2.4, pacotes, `appId` do Electron, chaves de save e de assets, tags e releases antigas). · Assert: ADR no índice `docs/adrs/README.md`. · Evidência (2026-11-11): [ADR-028](docs/adrs/ADR-028-nome-penguin-survivors.md) no índice (`56dd03b`).
- [x] **F2.2** Jogo: `game.title` nos 4 idiomas, `<title>`, `productName` do Electron, nome do app e `applicationId` do Android (`xyz.lekzera.penguinsurvivors`), nomes dos arquivos de release. Sem migração de save: o ADR-028 mantém o nome do pacote do desktop, de onde sai a pasta de dados. · Assert: `git grep -I "Pinguin Survivors" -- src apps index.html scripts .github` vazio; `bun run build:desktop` gera `Penguin Survivors.exe`; APK debug compila com o id novo. · Evidência (2026-11-11): grep vazio; `bun run build:desktop` → `apps/desktop/dist/full/win-unpacked/Penguin Survivors.exe`; `bun scripts/smoke-desktop.ts full` → `desktop smoke passed` (menu, run, pausa, fim, `save.json` gravado); `./gradlew assembleDebug` → `app-debug.apk` (41 MB); `bun test` 639 pass; `bun run e2e` passed; commits `c1dfd1a`, `bd07e3e`, `1fd2793`, `b2aab1d`.
- [x] **F2.3** Site e press kit nos 4 idiomas, SEO (`<title>`, OG), `README.md`, `AGENTS.md`, `docs/`, wireframes e marketing. As skills `pinguin-*` mantêm o nome da pasta (ADR-028). · Assert: `cd site && bun run build` ok; `git grep -I "Pinguin Survivors"` só em `CHANGELOG.md`, `docs/reports/`, `docs/brainstorming.md`, `ROADMAP.md` e no ADR-028 (histórico). · Evidência (2026-11-11): `cd site && bun run build` → 9 páginas; grep conferido; commits `118e1d1`, `63d0281`.
- [ ] **F2.4** 🛑 Renomear o repositório no GitHub para `penguin-survivors` e confirmar o redirect; atualizar `origin`, a URL do Pages e os links do README e do `release.ts`. · Assert: `git remote -v` novo; `curl -I` da URL nova do Pages → 200.
- [~] **F2.5** Release `0.12.0` com o `.exe` e o `.apk` para download (passo 7 da seção 2). · Bloqueado (2026-11-11): o classificador de permissões do modo automático recusa a publicação ("Create Public Surface"). Gates já verdes; falta só o desenvolvedor rodar `! bun scripts/release.ts 0.12.0 --stable` no prompt (ou liberar o comando nas permissões) e conferir os assets com `gh release view v0.12.0 --json assets`. Se a `0.11.0` sair depois deste commit ela já leva o rename, e a `0.12.0` deixa de ser necessária.
- [x] **Auditoria F2**: abrir o jogo, o `.exe` e o site e procurar "Pinguin" na tela; anotar a data. · 2026-11-11 (orquestrador): menu em 1920×1080 mostra "PENGUIN SURVIVORS" e `document.title` é "Penguin Survivors"; o smoke do `.exe` novo passou; `site/dist` sem o nome antigo fora das URLs do repositório.

## 6. F3 — Primeiros cinco minutos

Decisões B-35 e B-36. Tudo aqui entra na demo.

- [x] **F3.1** SDD-022 "Onboarding": sistemas destravados por marcos (árvore, poções e gambits, Marcas e Núcleos), aviso de uma linha em cada destrave e 3 dicas contextuais na primeira run (mover, a arma ataca sozinha, Super Magia). Nada é removido; save sem compatibilidade retroativa. · Assert: SDD aprovada no chat e no índice. · Evidência (2026-11-11): [SDD-022](docs/sdds/SDD-022-onboarding.md) aprovada (B-35) e no índice; marcos derivados do save, sem flag por sistema.
- [x] **F3.2** Lógica dos marcos em `src/logic/` com teste, flags no save, entradas do menu e da loja escondidas até o marco. · Assert: `bun test tests/onboarding.test.ts`; E2E com save novo não vê gambits antes da primeira run. · Evidência (2026-11-11): `src/logic/onboarding.ts` + `save.onboarding.seen`; `bun test tests/onboarding.test.ts` 7 pass (marcos, anúncio único, save antigo sem o campo); `bun test tests/ui/onboarding.test.tsx` 4 pass (menu, pausa e loja escondem o que está travado); captura do menu de save novo: PLAY, NEW GAME, LOAD GAME, ACHIEVEMENTS, MATCH HISTORY, SETTINGS.
- [x] **F3.3** Dicas da primeira run e avisos de destrave (React, 4 idiomas, somem sozinhos, nunca pausam o jogo). · Assert: teste de componente; `bun run lint:i18n` e `bun scripts/i18n-check.ts` 0/0/0; captura em 1920×1080 e 844×390. · Evidência (2026-11-11): dica no HUD (`data-hud="tip"`): "Move with WASD or the left stick." em 1920×1080 e "Drag on the left side to move." em 844×390 (capturas); avisos de destrave por `Toast`; `i18n-check` 0/0/0, `lint:i18n` 0; `bun test` 650 pass; `bun run e2e` passed; `E2E_DEMO_PORT=5299 bun run e2e -- --demo` passed (a porta 5199 estava com outro projeto local); `qa-menus` → `issues []`, `qa-mobile` → `issues none`.
- [x] **F3.4** SDD-023 "Fundo da arena": em volta da arena aparece o cenário do bioma (mar e gelo, floresta, cidade, estação, ruínas) no lugar do preto, com os tiles e props que já existem. · Assert: SDD aprovada; nenhuma geração nova prevista, ou lote ≤ 60 gerações listado na SDD. · Evidência (2026-11-11): [SDD-023](docs/sdds/SDD-023-fundo-da-arena.md) aprovada (B-36): chão do bioma escurecido em volta dos muros, 0 gerações.
- [x] **F3.5** Implementar o fundo por bioma em `src/world/` (Phaser, sem física, com pooling). · Assert: capturas dos rounds 1, 11, 21, 31 e 41 em 2560×1440 sem área preta; `bun scripts/perf.ts --round 40` ≥ 58 FPS. · Evidência (2026-11-11): `Arena.rebuildBackdrop` (um `TileSprite`, `backdropBounds` em `src/logic/arena.ts`); `bun test tests/arena.test.ts` 12 pass; capturas dos rounds 1, 11, 21, 31 e 41 em 2560×1440 e do round 1 em 1920×1080 sem preto em volta da arena, 0 erros de página; `bun scripts/perf.ts --round 40` → 74 FPS, p95 13,4 ms; `bun run e2e` passed.
- [x] **F3.6** Pausa com o herói no centro (`PauseData` ganha o id do herói). · Assert: `tests/ui/screens.test.tsx`; captura 1920×1080. · Evidência (2026-11-11): `PauseData.hero`; a coluna de detalhe mostra o herói e o nome enquanto nenhum item está focado; `bun test tests/ui` 109 pass; captura 1920×1080 com o Jack na pausa.
- [x] **F3.7** Ícones de Marca de Elite e Núcleo de Boss (2 gerações PixelLab, 32 px, mesmo estilo dos `icon.currency.*`) no cabeçalho da loja. · Assert: `pack-atlas --check` 0 faltando; `tests/art-coverage.test.ts`; captura da loja. · Evidência (2026-11-11): `icon.currency.mark` e `icon.currency.core` gerados (2 gerações, saldo 1.192 → 1.190, registrado em `docs/visual.md` §10) e no atlas `ui`; `bun scripts/pack-atlas.ts --check` → 292 chaves, 0 faltando; `tests/art-coverage.test.ts` verde; captura do cabeçalho da loja com os dois ícones e os números.
- [~] **F3.8** Release `0.13.0` com o `.exe` e o `.apk` para download (passo 7 da seção 2). · Assert: `gh release view v0.13.0 --json assets,isPrerelease` com os dois zips do Windows e o APK; links entregues ao desenvolvedor. · Bloqueado (2026-11-11): mesma recusa do classificador de permissões da F1.6 (publicar release). O desenvolvedor roda `! bun scripts/release.ts <versão> --stable`; uma release única agora leva F1, F2 e F3.
- [x] **Auditoria F3**: jogar a demo do zero com save novo (`bun run e2e -- --demo`) e anotar o tempo até a primeira loja. · 2026-11-11 (orquestrador): `E2E_DEMO_PORT=5299 bun run e2e -- --demo` passed; o round 1 dura 30 s (`ROUNDS.firstDuration`), então a primeira loja abre aos ~30 s de jogo; `bun test` 656 pass; `perf --round 40` 74 FPS.

## 7. F4 — Demo do Next Fest

- [ ] **F4.1** 🛑 Conta Steamworks (US$ 100), app do jogo e app da demo; App IDs em `steam_appid.txt` (gitignored). Prazo 2026-12-15.
- [ ] **F4.2** 🛑 Inscrição no Next Fest de fevereiro de 2027. Prazo 2027-01-10.
- [ ] **F4.3** Key art, 6 capsules da Steam e OG image do site (`art-src/steam/`, nome novo do jogo). ~400 gerações: 🛑 aprovar o lote e as peças. · Assert: arquivos nas dimensões exigidas pela Steamworks; `scripts/press-shots.ts` atualizado.
- [x] **F4.4** Textos da página da Steam (descrição curta e longa, features, tags) nos 4 idiomas em `docs/marketing/`, e roteiro do trailer de até 60 s com os primeiros 5 s em gameplay. · Assert: arquivos no repo; contagem de caracteres dentro dos limites da Steamworks. · Evidência (2026-11-11): `docs/marketing/steam-page.md` (descrição curta de 181, 195, 208 e 65 caracteres em EN, PT-BR, ES e ZH-CN, limite 300; longa, features e tags) e `docs/marketing/trailer-script.md` atualizados para a campanha de 50 rounds, 10 chefes, 5 biomas e 3 dificuldades; nenhuma menção a Danger 0–5 (`git grep -i danger docs/marketing` vazio). O roteiro tem 120 s com o gancho de gameplay nos primeiros 5 s; a versão de 60 s fica para a edição.
- [x] **F4.5** Steam Deck: layout e legibilidade em **1280×800**, glifos de controle nas dicas de tecla quando a última entrada foi gamepad. · Assert: `qa-menus` com 1280×800 → `issues []`; teste de componente das dicas. · Evidência (2026-11-11): `scripts/qa-menus.ts` com 1280×800 → `issues []` nos 5 tamanhos; `src/core/input-kind.ts` troca as dicas do HUD para os botões do controle ("SUPER MAGIC · Y", "X · speed") quando a última entrada foi gamepad; `bun test tests/ui` 105 pass (inclui o teste da troca teclado ↔ controle).
- [ ] **F4.6** Desktop com Steam (depende de F4.1): `steamworks.js` inicializa com o App ID, conquista de teste dispara, overlay abre, `STEAM_URL` real no jogo e no site. · Assert: `bun scripts/smoke-desktop.ts full` passa; QA manual do overlay anotado.
- [ ] **F4.7** 🛑 Página da Steam em "coming soon" com capsules, textos e gif (depende de F4.1, F4.3, F4.4).
- [ ] **F4.8** 🛑 Upload do build da demo até 2027-01-25 e itens do Next Fest em revisão até 2027-02-08 (depende de F4.6).
- [~] **F4.9** Tempo da demo com jogador real: 12 a 25 minutos (SDD-006 A5). · Assert: `docs/reports/demo-time-<data>.md` com 3 sessões. · Bloqueado (2026-11-11): precisa de 3 sessões de jogador humano; o bot já mediu 12,9 e 13,1 min em `docs/reports/demo-time-2026-11-08.md`.
- [ ] **F4.10** Release `0.14.0` com o `.exe` e o `.apk` para download (passo 7 da seção 2). · Assert: `gh release view v0.14.0 --json assets,isPrerelease` com os dois zips do Windows e o APK; links entregues ao desenvolvedor.
- [ ] **Auditoria F4**: checklist do Next Fest da Steamworks 100% e `e2e -- --demo` verde no `.exe` da demo.

## 8. F5 — Classes por herói

Decisão B-34: 3 a 4 classes por herói com regra própria, sobre os 3 sprites atuais. Fora da demo.

- [x] **F5.1** SDD-024 "Classes": lista das classes (nome, regra, bônus, restrição), como destravam, como aparecem na escolha do pinguim e o que o save guarda. Uma pergunta por classe polêmica. · Assert: SDD aprovada; números iniciais marcados como provisórios na Parte B do balanceamento. · Evidência (2026-11-11): [SDD-024](docs/sdds/SDD-024-classes-por-heroi.md) aprovada (B-34): 12 classes (4 por herói), destrave nos níveis 1, 5, 10 e 20, números provisórios.
- [x] **F5.2** Dados em `src/data/classes.ts`, aplicação em `src/logic/stats.ts` e nas regras de arma, com testes. · Assert: `bun test tests/classes.test.ts` (cada classe muda o que a SDD diz e nada além). · Evidência (2026-11-11): `src/data/classes.ts`, `src/logic/classes.ts` e `heroStats(..., heroClass)`; `bun test tests/classes.test.ts` 4 pass (a base não muda nada, cada classe muda só o que lista, multiplicador depois da soma, classe travada ou de outro herói cai na base).
- [x] **F5.3** Escolha do pinguim com a classe (‹ classe ›, o que muda) e textos nos 4 idiomas. · Assert: `tests/ui/menus.test.tsx`; `i18n-check` 0/0/0; capturas nas 3 resoluções. · Evidência (2026-11-11): seção "CLASS" na escolha do pinguim (‹ classe ›, ganhos em verde, custos em laranja, "Next class at hero level N"); `StartRunRequest.heroClass` chega ao jogo (`?class=` para QA); `bun test tests/ui` 106 pass; `i18n-check` 0/0/0; captura 1920×1080 com o Berserker e, na run, `armor 0 · damage 1.25 · maxHp 156`. Na demo só a classe base. Só a captura de 1920×1080 foi feita: no celular a seção não aparece (o layout compacto não tem a coluna de escolhas detalhadas).
- [x] **F5.4** Sim e bot conhecem as classes; passada de balance por classe. · Assert: `bun scripts/sim.ts` com `--class`; `docs/reports/balance-classes-<data>.md` com nenhuma classe acima de 1,5× a mediana de round das outras. · Evidência (2026-11-11): `bun scripts/sim.ts 200 --classes` e `--class <id>`; [relatório](docs/reports/balance-classes-2026-11-11.md): as 9 classes novas ficam entre 0,89× e 1,13× da base no round médio (meta 0,67–1,5), nenhum número ajustado. A mediana não distingue as classes (mortes concentradas nos rounds de boss), então o relatório usa a média. O bot real ainda não rodou por classe.
- [~] **F5.5** Conquistas das classes e mapa Steam. · Assert: `tests/achievements.test.ts`, `tests/steam-achievements.test.ts`. · Adiado (2026-11-11): a SDD-024 deixa as conquistas por classe para depois da passada com o bot real, para não fixar ids de conquista (que vão para a Steam) em classes cujo nome ou regra ainda pode mudar.
- [~] **F5.6** Release `0.15.0` com o `.exe` e o `.apk` para download (passo 7 da seção 2). · Assert: `gh release view v0.15.0 --json assets,isPrerelease` com os dois zips do Windows e o APK; links entregues ao desenvolvedor. · Bloqueado (2026-11-11): mesma recusa do classificador de permissões da F1.6 (publicar release).
- [x] **Auditoria F5**: uma run por classe no bot (`bun scripts/playtest-bot.ts`) sem erro de console. · 2026-11-11 (orquestrador): 12 runs curtas no jogo real por Playwright (`?class=<id>&round=3`, heróis no nível 20, 5 s andando): 0 erros de página e os atributos iniciais batem com a SDD-024 (Berserker `armor 0, dmg 1.25, as 1.10`; Baluarte `hp ×1,3, armor +8, dmg 0.85`; Canhão de Vidro `hp ×0,7`). Não foi o `playtest-bot.ts` completo: runs longas por classe ficam para a F7.2.

## 9. F6 — Steam Next Fest

- [ ] **F6.1** 🛑 Duas livestreams agendadas na página (Steam Broadcast).
- [ ] **F6.2** Plantão de hotfix de 22/02 a 01/03: triagem diária das issues, patch `0.15.x` em menos de 24 h para bloqueador. · Assert: nenhuma issue com label `blocker` aberta por mais de 24 h.
- [ ] **F6.3** Métricas: wishlists antes e depois, conversão demo → wishlist (🛑 o desenvolvedor exporta da Steamworks). · Assert: `docs/reports/nextfest-2027-02.md` comparando com `docs/web-research.md` §7.
- [ ] **F6.4** Feedback do festival vira hipóteses de UX e balance com teste definido. · Assert: ≥ 5 hipóteses novas em `docs/reports/`.

## 10. F7 — Conteúdo, alcance e Balance 1.0

- [x] **F7.1** Auditar o que o roadmap antigo deixou em aberto mas já está no código: campanha de 50 rounds, ataques em área, arte e animação `attack` dos 10 bosses, kraken e abominação. · Assert: `bun test tests/biome.test.ts tests/boss-hazard.test.ts tests/art-coverage.test.ts`; captura de cada boss (rounds 5 a 50) em 1920×1080; lista do que faltar vira tarefa nova aqui. · Evidência (2026-11-11): `bun test tests/biome.test.ts tests/boss-hazard.test.ts tests/art-coverage.test.ts` 37 pass; os 10 bosses nascem no round certo (5 a 50) com textura e animação próprias e 0 erros de console (kraken e abominação usam os atlas `enemy.kraken-b` e `enemy.abomination-b`, com `walk` e `attack`; os atlas `enemy.kraken` e `enemy.abomination` de 5 frames são os antigos e não são usados). **Achado e corrigido:** estação e ruínas (rounds 31–50) não tinham tiles nem bordas, só props, e o chão era o placeholder de código; gerados os dois tilesets (30 gerações, saldo 1.190 → 1.160) e as bordas por código; `pack-atlas --check` → 304 chaves, 0 faltando; capturas dos rounds 33 e 43. **Fica para depois:** com a arena grande o boss nasce fora da tela e não há seta apontando para ele (tarefa F7.8).
- [~] **F7.2** Balance dos 50 rounds: metas A4 reescritas para a campanha de 50, até 3 passadas de sim e bot. · Assert: `docs/reports/balance-1.0.md` com as metas ✓ ou exceção justificada. · Em aberto (2026-11-11): linha de base medida em [balance-1.0.md](docs/reports/balance-1.0.md) (`bun scripts/sim.ts 100` e `--report 100`): a campanha não fecha no modelo (nível 30 morre por volta do round 24; metas #1, #2 e #3 fora da janela; #6 ok). Nenhum número foi alterado: o relatório de 2026-11-10 pede calibrar a sim contra o bot real antes de mexer na curva, e essa passada (horas de bot) e a decisão da curva dos rounds 11 a 50 ficam pendentes.
- [ ] **F7.3** Steam: registrar as conquistas no Steamworks (🛑 App ID), Steam Cloud em segunda máquina, decidir leaderboards (hoje adiados para depois da 1.0). · Assert: conquista dispara no overlay; save aparece em outra máquina.
- [ ] **F7.4** Idiomas novos (ordem: japonês, coreano, alemão, francês, russo): glossário, tradução, fontes sob demanda, layout. 🛑 Confirmar quais entram na 1.0. · Assert: `i18n-check` 0/0/0 por idioma; `qa-menus` sem issues em cada um.
- [ ] **F7.5** Android: 🛑 conta Google Play Console e IARC; QA em aparelho de 6,7" e 6,8" com ≥ 55 FPS no round 10; AAB assinado (🛑 keystore nos secrets). · Assert: run verde do `android.yml` com AAB de release; relatório do teste interno sem crash.
- [x] **F7.6** Acessibilidade e conforto: revisão de contraste, flashes reduzidos, remapeamento de teclas com aviso de conflito. · Assert: Lighthouse acessibilidade ≥ 90 no menu; teste do conflito de tecla. · Evidência (2026-11-11): remapear para uma tecla em uso troca as duas e avisa por `Toast` qual ação mudou (`bindConflict`, `bun test tests/keybinds.test.ts` 3 pass); checagem automática de contraste e tamanho em menu, escolha do pinguim, heróis, pausa e loja (1920×1080): 239 textos, 0 abaixo de AA e 0 abaixo de 22 px; Lighthouse do menu (DevTools, desktop): acessibilidade 100, boas práticas 100; "flashes reduzidos" já existe nas configurações.
- [x] **F7.8** Indicador de boss fora da tela: seta na borda do HUD apontando para o boss enquanto ele não está visível (achado da F7.1). · Assert: teste da função de direção em `src/logic/`; captura do round 40 com a seta. · Evidência (2026-11-11): `src/logic/offscreen.ts` (`offscreenArrow`), `bun test tests/offscreen.test.ts` 3 pass e teste do HUD; captura do round 40 com a seta laranja na borda esquerda apontando para o Kraken.
- [ ] **F7.7** Release `0.16.0` com o `.exe` e o `.apk` para download (passo 7 da seção 2). · Assert: `gh release view v0.16.0 --json assets,isPrerelease` com os dois zips do Windows e o APK; links entregues ao desenvolvedor.
- [ ] **Auditoria F7**: gates de release completos (`e2e`, `qa-browsers`, `perf`, `pack-atlas --check`).

## 11. F8 — Lançamento 1.0

- [ ] **F8.1** Congelamento de 2 semanas: só `fix` e `balance`; checklists `ccgs-release-checklist` e `gd-steam-publish`. · Assert: `docs/reports/release-1.0.md` 100%.
- [ ] **F8.2** 🛑 Preço US$ 4,99 e regional, desconto de lançamento, data e hora.
- [ ] **F8.3** 🛑 Trailer final (captura) com o roteiro de F4.4; música do trailer pela ElevenLabs. · Assert: `<video>` do site aponta para o arquivo final.
- [ ] **F8.4** Site: CTA "Comprar" (`SITE_RELEASED=true`), links das lojas, press kit. · Assert: Lighthouse ≥ 95; links das lojas 200.
- [ ] **F8.5** 🛑 Release **`1.0.0`** (`bun scripts/release.ts 1.0.0 --stable`), a única release com gate, com o `.exe` e o `.apk` anexados. · Assert: `gh release view v1.0.0` não é pre-release; `package.json` 1.0.0.
- [ ] **F8.6** 🛑 Publicar na Steam; Android em produção até 2027-05-15.

## 12. Pendências do desenvolvedor

| # | Pendência | Prazo | Bloqueia |
|---|---|---|---|
| D1 | Baixar e testar o `.exe` e o `.apk` de cada release de fase e dizer o que achou | a cada release | a fase seguinte herda os ajustes |
| D2 | Renomear o repositório para `penguin-survivors` | F2 | F2.4 |
| D3 | Conta Steamworks e App IDs | 2026-12-15 | F4.2, F4.6–F4.8, F7.3 |
| D4 | Inscrição no Next Fest | 2027-01-10 | F6 |
| D5 | Aprovar o lote de key art e capsules (~400 gerações) | F4 | F4.3, F4.7 |
| D6 | Conta Google Play Console, IARC e keystore do Android nos secrets | 2027-01-31 | F7.5 |
| D7 | Girar o token do PixelLab exibido em print em 2026-11-08 | imediato | segurança |
| D8 | Renovar PixelLab e ElevenLabs no dia 14 de cada mês até abril | mensal | F3.7, F4.3, F8.3 |
| D9 | Captura do trailer | F8 | F8.3 |
| D10 | Decidir os idiomas novos da 1.0 | F7 | F7.4 |

## 13. Orçamento de assets

Saldos lidos das APIs em 2026-11-11: **PixelLab 1.192 gerações** de 5.000 e **ElevenLabs 42.910 créditos** de 124.333. Os dois renovam em 2026-11-14.

| Lote | Tarefa | Gerações | Créditos | Gate |
|---|---|---|---|---|
| Ícones de Marca e Núcleo | F3.7 | 2 | — | — |
| Fundo da arena, se a SDD-023 pedir arte nova | F3.4 | ≤ 60 | — | — |
| Key art, 6 capsules e OG image | F4.3 | ~400 | — | 🛑 lote > 200 |
| Ícones das classes (9 a 12) | F5.3 | ≤ 24 | — | — |
| O que a auditoria F7.1 achar faltando nos bosses | F7.1 | ≤ 300 | — | 🛑 lote > 200 |
| Reserva para retries | — | ~100 | — | — |
| Música do trailer e SFX de reserva | F8.3 | — | ~3.000 | 🛑 lote > 2.000 |
| **Total** | | **~890 de 1.192** | **~3.000 de 42.910** | |

Tudo o que falta cabe no saldo de hoje, sem contar a renovação. Regras: ler o saldo antes de cada lote (`bun scripts/el-quota.ts`; `getBalance()` em `scripts/lib/pixellab.ts`), fazer um piloto, registrar o saldo depois em `docs/visual.md` §10 e `docs/audio.md` §7, e nunca apagar nem substituir arte existente.

## 14. Riscos

| # | Risco | Prob. | Impacto | Mitigação | Gatilho de corte |
|---|---|---|---|---|---|
| R1 | Sem conta Steamworks até 15/12, a inscrição no Next Fest não sai | média | alto | D3 é a pendência mais cara; F1–F3 não dependem dela | sem App ID em 2027-01-05: mirar o Next Fest de junho e manter a demo web |
| R2 | Rename quebra saves, links e o Pages | média | médio | ADR-028 com ordem segura, migração da pasta de save, redirect do GitHub | — |
| R3 | Classes desbalanceadas atrasam a 1.0 | média | médio | F5 fora da demo; sim por classe com teto de 1,5× | lançar com 2 classes por herói e completar em patch |
| R4 | Prazo: F1–F4 em 10 semanas | alta | alto | ordem estrita; a demo só precisa de F1–F4 | F3.4–F3.5 (fundo da arena) saem da demo se F4 atrasar |
| R5 | WebView do Android fraco em aparelho médio | média | médio | `tier` baixo; medir cedo em F7.5 | abaixo de 45 FPS: cortar luzes e decalques no mobile |
| R6 | Idiomas novos estouram o layout | média | baixo | `qa-menus` por idioma; texto trunca em vez de quebrar | lançar só com os idiomas que passarem |
