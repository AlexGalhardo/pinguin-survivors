# ROADMAP.md — Pinguin Survivors 1.0

> **Fonte da verdade do trabalho.** Substitui o `PLAN.md` (histórico, congelado em 2026-11-08). Leia inteiro antes de começar; trabalhe na ordem dos marcos, uma tarefa por vez; marque `[x]` **só com a evidência do assert** anotada na linha.
> Legenda: `[ ]` pendente · `[x]` feito (evidência) · `[~]` bloqueado (motivo) · 🛑 gate do desenvolvedor.
> Cada tarefa traz: **Resp.** (orquestrador · senior · estagiario · dev = desenvolvedor humano) · **Dep.** · **Est.** (horas de agente) · **Assets** (gerações PixelLab / créditos ElevenLabs) · **DoD** · **Assert** (comando, teste ou métrica) · **Auditoria** (como conferir depois).
> Processo: [docs/workflow.md](docs/workflow.md) · Specs: [docs/sdds/](docs/sdds/README.md) · Decisões: [docs/adrs/](docs/adrs/README.md) · Design: [docs/gdd.md](docs/gdd.md).
> Versões (padrão vukem, ADR-015): `0.0.x` até a demo jogável · `0.1.x` da demo pública até o lançamento · `1.0.0` lançamento comercial. Release ao fechar cada marco: `bun scripts/release.ts X.Y.Z`.

## Índice

1. [Datas e marcos](#1-datas-e-marcos)
2. [M0 — Estruturação (2026-11-08)](#2-m0--estruturação-2026-11-08)
3. [M1 — Fundações top-down (até 2026-11-29)](#3-m1--fundações-top-down-até-2026-11-29)
4. [M2 — Armas, loja e economia (até 2026-12-20)](#4-m2--armas-loja-e-economia-até-2026-12-20)
5. [M3 — UI React e Danger (até 2027-01-10)](#5-m3--ui-react-e-danger-até-2027-01-10)
6. [M4 — Arte e áudio da demo (até 2027-01-17)](#6-m4--arte-e-áudio-da-demo-até-2027-01-17)
7. [M5 — Demo, Electron e site (até 2027-02-08)](#7-m5--demo-electron-e-site-até-2027-02-08)
8. [M6 — Steam Next Fest (22/02–01/03/2027)](#8-m6--steam-next-fest-220201032027)
9. [M7 — Conteúdo completo, i18n e Balance 1.0 (até 2027-03-31)](#9-m7--conteúdo-completo-i18n-e-balance-10-até-2027-03-31)
10. [M8 — Android (até 2027-04-15)](#10-m8--android-até-2027-04-15)
11. [M9 — Lançamento 1.0 (até 2027-04-30)](#11-m9--lançamento-10-até-2027-04-30)
12. [Pós-1.0](#12-pós-10)
13. [Orçamento de assets](#13-orçamento-de-assets)
14. [Riscos](#14-riscos)
15. [Pendências do desenvolvedor](#15-pendências-do-desenvolvedor)
16. [Como auditar um marco](#16-como-auditar-um-marco)

## 1. Datas e marcos

| Data | Evento | Marco |
|---|---|---|
| 2026-11-08 | Estruturação concluída; release `0.0.11` | M0 |
| 2026-11-14 | Renovação PixelLab (5.000) e ElevenLabs | — |
| 2026-11-29 | Jogo roda top-down em arena quadrada, sem vozes, save v2 | M1 → `0.0.12` |
| 2026-12-15 | 🛑 Conta Steamworks criada; página da Steam em rascunho | dev |
| 2026-12-20 | 6 slots, loja, cartas de level-up, Fish/Pérolas jogáveis com placeholders | M2 → `0.0.13` |
| 2027-01-10 | **Inscrição no Next Fest fecha (23:59 PST)**; UI React completa; Danger 0–5 | M3 → `0.1.0` |
| 2027-01-17 | Arte top-down (chão, bordas, props, lojista, tiers) e áudio da loja | M4 → `0.1.1` |
| 2027-01-25 | Build da demo enviado à Steam (data de terceiros; 08/02 é a oficial para itens em revisão) | M5 |
| 2027-02-08 | **Itens do Next Fest em revisão**; site no ar com `/demo`; Electron Windows | M5 → `0.1.2`–`0.1.3` |
| 2027-02-22 → 03-01 | **Steam Next Fest** | M6 → `0.1.4`+ hotfixes |
| 2027-03-31 | Biomas 2–3 revisados, ES/ZH, Steam conquistas/cloud/leaderboards, Balance 1.0 | M7 → `0.1.x` |
| 2027-04-15 | Android (Capacitor) em teste interno no Play Console | M8 |
| 2027-04-30 | **1.0.0 na Steam**; Android até 2027-05-15 | M9 → `1.0.0` |

Capacidade assumida: ~20 h de agente por semana úteis para implementação (hipótese; ajustar após M1).

## 2. M0 — Estruturação (2026-11-08)

- [x] **T0.1** Pesquisa de mercado · Resp.: orquestrador · Evidência: `docs/web-research.md` (commit `f063071`).
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada.
- [x] **T0.2** Entrevista e decisões B-01…B-31 · Evidência: `docs/brainstorming.md` (`0e0dbfc`).
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada.
- [x] **T0.3** ADR-000…015 e SDD-001…013 · Evidência: `docs/adrs/`, `docs/sdds/` (`bca1e2c`, `8bff490`).
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada.
- [x] **T0.4** GDD, Art Bible, Áudio, Arquitetura, Workflow, Balancing & Sim, Site; docs legados mesclados e removidos · Evidência: `docs/README.md` lista 9 docs + 2 pastas (`60fe395`).
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada.
- [x] **T0.5** CLAUDE.md, AGENTS.md e skills alinhados · Evidência: `030abd2`, `3e85e6b`.
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada.
- [x] **T0.6** Branch `legacy-voices` · Evidência: `git ls-remote --heads origin legacy-voices`.
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada.
- [x] **T0.7** Retag `v0.0.1…v0.0.10` + 10 pre-releases vukem; tags do Starfall (`v1.0.0-*`, `v0.1.0`, `pinguin-survivors-final`) apagadas · Evidência: `gh release list` (10 Pre-release); `git tag -l | wc -l` = 10 = `git ls-remote --tags origin | grep -vc "^{}"`.
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada.
- [x] **T0.8** Scripts `release.ts`, `release-backfill.ts`, `lib/release-notes.ts` · Evidência: `bun scripts/release.ts --dry-run 0.0.11`.
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada.
- [x] **T0.9** Release `0.0.11` · Resp.: orquestrador · Evidência: `gh release view v0.0.11` → pre-release; `package.json.version === '0.0.11'`; 11 tags = 11 releases.
  - [x] Auditoria (2026-11-08, orquestrador): `gh release view v0.0.11 --json isPrerelease` = true; corpo com `### Added/Changed/Fixed` e links de commit; CHANGELOG `[0.0.11] - 2026-11-08` presente.
- [x] **T0.10** README raiz no padrão open source (vukem-hexascore), `LICENSE.md` (MIT no código, assets reservados), `CONTRIBUTING.md`, `.github/SECURITY.md`, `.github/CODE_OF_CONDUCT.md`, `ci.yml`, `dependabot.yml` · Evidência: arquivos no repo; badge do CI verde após o 1º push.
  - [x] Auditoria: `gh run list --workflow ci.yml` verde; links do README respondem (sem 404 interno). · Conferido (2026-11-08, orquestrador): últimos 3 runs do `ci.yml` em `main` = success (as 2 falhas intermediárias eram formatação do `lint-i18n.ts`, corrigida em `129ad1b`); todos os links relativos do README apontam para arquivos existentes.
- [x] **T0.11** `PLAN.md` deixa de ser versionado (pedido do desenvolvedor via `.gitignore`); histórico no git · Evidência: `git ls-files PLAN.md` vazio.
  - [x] Auditoria: `git log --oneline -- PLAN.md | head -1` mostra a remoção (2026-11-08).

## 3. M1 — Fundações top-down (até 2026-11-29)

Specs: [SDD-001](docs/sdds/SDD-001-arena-topdown.md), [SDD-010](docs/sdds/SDD-010-remocao-de-vozes.md), [SDD-005](docs/sdds/SDD-005-danger-e-save-v2.md) (parte save).

- [x] **T1.1** Remover vozes e legendas (SDD-010 RF-01…05) · Resp.: orquestrador · Dep.: — · Est.: 4 h · DoD: SDD-010 A1–A5 · Assert: `rg -n "voice|subtitle|vo\." src tests scripts --glob '!**/sfx-limiter*' --glob '!tests/fixtures/**' --glob '!tests/save.test.ts'` vazio (fixture v1 e teste da migração citam os campos antigos de propósito); `bun run build` OK · Evidência (2026-11-08): grep vazio; `public/assets` 11M → 6.2M sem `audio/vo`; lint/typecheck/171 testes/build verdes; `bun run e2e` 11/11 ok; `voice-limiter` renomeado `sfx-limiter` (RF-03).
  - [x] Auditoria: `du -sh public/assets` ≥ 3 MB menor que `6980b99`. · Conferido (2026-11-08, orquestrador): `git ls-tree -l` de `public/assets` 9,89 MiB em `6980b99` → 5,83 MiB (−4,06 MiB); grep A1 vazio re-executado.
- [x] **T1.2** `src/logic/arena.ts` + `src/data/arena.ts` + testes (SDD-001 RF-01, RF-04) · Resp.: senior · Est.: 4 h · Assert: `bun test tests/arena.test.ts` (A1, A2 verdes) · Evidência (2026-11-08): `bun test tests/arena.test.ts` 6 pass (A1, A2, A3 do clamp, `propLayout`); API `arenaSide`, `arenaBounds`, `clampToArena`, `spawnRing`, `propLayout`.
  - [x] Auditoria: ler o teste de propriedade com 1.000 pontos. · Conferido (2026-11-08, orquestrador): `tests/arena.test.ts` checa bounds, distância ≤ 64 u da borda e fora da view+48 px nos 1.000 pontos; caso de arena visível exige telegraph.
- [x] **T1.3** Projeção top-down: remover `iso.ts`/`chunks.ts`/`ChunkManager`, depth por `y`, input sem rotação (RF-06, RF-09) · Resp.: senior · Dep.: T1.2 · Est.: 10 h · Assert: `rg -n "logic/iso|logic/chunks|ChunkManager" src tests` vazio; `bun test` verde · Evidência (2026-11-08): `rg -n "logic/iso|logic/chunks|ChunkManager" src tests` vazio; `bun test` 219 pass; `src/logic/projection.ts` (identidade, `depthOf = y`, 8 direções pelo vetor, input sem rotação); frames `tile.*` iso saíram dos atlas.
  - [x] Auditoria: diff não toca `src/data/*` de gameplay. · Conferido (2026-11-08, orquestrador): diff de T1.3/T1.4 não toca `src/data/*` (só `config/constants.ts`, `debug/params.ts`, `logic/*`); grep A4 re-executado vazio.
- [x] **T1.4** `world/Arena.ts`: chão por tiles 64 px (placeholder por código), borda, props sólidos, crescimento centrado (RF-02, RF-03, RF-07) · Resp.: senior · Dep.: T1.3 · Est.: 10 h · Assert: screenshot `?skipMenu=1&hero=jack&round=1&seed=1&debug=1` com arena 10×10 inteira (A6); E2E round 1→2 cresce (`bun run e2e`) · Evidência (2026-11-08): `src/world/Arena.ts` (chão 64×64 por `tileVariant`, borda com cantos, props de `propLayout`, `grow(round)` centrado, `?arena=NN`); `bun run e2e` 12/12 com `arena grew 10x10 to 11x11`; screenshot round 1 em 1920×1080 com a arena top-down (A6 da SDD-001 v1.1); herói contra a parede para em x = 352 − 12.
  - [x] Auditoria: `?arena=40` sem erros de console. · Conferido (2026-11-08, orquestrador): Playwright em `?skipMenu=1&hero=jack&round=1&seed=1&arena=40&debug=1` (1920×1080, 6 s): 0 erros de console, página 1920×1080 sem scroll.
- [x] **T1.5** Spawn no anel interno + telegraph; câmera clampada (RF-04, RF-05) · Resp.: senior · Dep.: T1.4 · Est.: 6 h · Assert: `tests/spawn.test.ts` atualizado verde; vídeo/gif de 30 s sem spawn visível sem telegraph · Evidência (2026-11-08): `tests/spawn.test.ts` verde (1.000 pontos fora da view sem telegraph; view cobrindo a arena → todos telegrafados; `SpawnQueue`); `clampCameraCenter` testado; vídeos webm de 30 s em 1920×1080 (round 1: 40 spawns, 20 com `fx.spawnMark`, 0 visíveis sem marca; arena 40: 109 spawns, 0 visíveis).
  - [x] Auditoria: contar spawns dentro do viewport no log de debug = 0 quando arena > tela. · Conferido (2026-11-08, orquestrador): Playwright 20 s com `__GAME__…enemies.spawnStats`: `round=1` total 15/telegraphed 11/`silentInView` 0; `round=5&arena=40` total 37/telegraphed 0/`silentInView` 0; 0 erros de console.
- [x] **T1.6** `GoreLayer` na textura da arena com recarimbo ao crescer (RF-08) · Resp.: senior · Dep.: T1.4 · Est.: 6 h · Assert: teste `GoreLayer.grow` com 500 decalques (A7) · Evidência (2026-11-08): `tests/gore.test.ts` (A7: 500 decalques entre `arenaBounds(1)` e `(2)` mantêm contagem e posição de mundo; teto 4.000 e ordem do `DecalLog`); `src/world/GoreLayer.ts` com recarimbo ao crescer.
  - [x] Auditoria: `?round=30&debug=1` mostra contagem de decalques estável após troca de round. · Conferido (2026-11-08, orquestrador): re-executado verde; no browser do Senior A, round 29→30 com 500 decalques: 500 → 503 (3 novos da luta), round 5→6: 500 → 500; screenshot `t16-round30.png` conferido no relatório.
- [x] **T1.7** Perf na arena 40×40 (RF-10) · Resp.: estagiario roda, orquestrador decide · Dep.: T1.6 · Est.: 2 h · Assert: `bun scripts/perf.ts --round 40` ≥ 58 FPS, p95 ≤ 18 ms (A5) · Evidência (2026-11-08): `SOUND_MUTED=true bun run dev` + `bun scripts/perf.ts --round 40` (1920×1080, 300 inimigos, 2.000 decalques): 59/59/59 FPS, p95 16,8 ms, 0 erros. `perf.ts` ganhou flags e retry (`a73ec48`, `b60e87d`).
  - [x] Auditoria: anexar saída em `docs/reports/perf-<data>.md`. · Conferido (2026-11-08, orquestrador): saída anexada em `docs/reports/perf-2026-11-08.md` (máquina, comando, 3 rodadas, veredito ✓).
- [x] **T1.8** Save v2: `pearls`, `dangerUnlocked`, migração v1→v2, `activeRun` descartado (SDD-005 RF-05…07) · Resp.: senior · Est.: 6 h · Assert: `bun test tests/save.test.ts` com fixture `tests/fixtures/save-v1.json` (A2, A3) · Evidência (2026-11-08): `bun test tests/save.test.ts tests/achievements.test.ts` 21 pass; fixture `tests/fixtures/save-v1.json`; `SAVE_VERSION = 2`, `pearls`, `progress.hero[h].dangerUnlocked`, `activeRun` descartado na migração. Restante do RF-05 (`bestRoundByDanger`, `unlocks.startingWeapons`, `settings.locale`, remoção de `fish`/`difficulty`/`activeRun` do tipo) fica com T2.7/T3.9/T7.6.
  - [x] Auditoria: importar um save real exportado do `0.0.10` no build novo sem erro. · Conferido (2026-11-08, orquestrador): save gerado por `serializeSave` do código de `v0.0.10` (`git archive`) lido pelo `parseSave` novo → `version 2`, Jack L17/XP 900 e conquistas mantidos, `activeRun null`, `dangerUnlocked 1`, reparse idêntico.
- [x] **T1.9** `docs/balancing-and-simulation.md` Parte B: marcar `[1.0: revisar]` nos itens afetados pela arena; `architecture.md` conferido · Resp.: estagiario · Est.: 2 h · Assert: `rg -c "1.0: revisar" docs/balancing-and-simulation.md` ≥ 5. · Evidência (2026-11-08): `rg -c "1.0: revisar"` = 12 (11 marcações + legenda); `architecture.md` conferido sem resquício iso/chunks; SDD-001 A6 corrigida (v1.1: 640 u > altura lógica 540).
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): re-executado = 12; lido o diff de `balancing-and-simulation.md` (12 linhas, só etiquetas e versão 2.1).
- [x] **T1.10** Release `0.0.12` com todo o M1, só depois de todas as auditorias do marco marcadas (decisão do desenvolvedor em 2026-11-08: uma release por marco) · Resp.: orquestrador · Assert: `gh release view v0.0.12` pre-release. · Evidência (2026-11-08): `bun scripts/release.ts 0.0.12` (gates lint/typecheck/test/build verdes) → [release v0.0.12](https://github.com/AlexGalhardo/pinguin-survivors/releases/tag/v0.0.12); `gh release view v0.0.12` pre-release; `package.json.version === '0.0.12'`; 12 tags = 12 releases.
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): corpo com `### Added/Changed/Fixed` e links de commit; CHANGELOG `[0.0.12] - 2026-11-08` com `[Unreleased]` vazio.

### Auditoria do marco M1

Marque conforme a auditoria avança: `[ ]` não feita · `[~]` parcial (anote o que falta) · `[x]` feita (data e quem auditou).

- [x] Todos os asserts das tarefas `[x]` re-executados e conferidos (Auditoria de cada tarefa marcada). · 2026-11-08: T1.1–T1.9 com auditoria marcada; re-execução em `docs/reports/audit-m1-2026-11-08.md`.
- [x] SDDs do marco em "Aprovada" e implementação sem contradizer nenhum RF (grep pelos arquivos/funções citados). · SDD-001 1.1, SDD-010 1.1, SDD-005 (RF-05 parcial sem contradição, ver relatório).
- [x] `bun run lint && bun run typecheck && bun test && bun run build` verdes no commit do release. · gates do `release.ts` em `v0.0.12`.
- [x] Release `vX.Y.Z` conferido (`gh release view`): título = tag, grupos Keep a Changelog, links de commit válidos, `0.x` pre-release. · `v0.0.12`.
- [x] `CHANGELOG.md` com a seção da versão datada e `[Unreleased]` vazio. · `[0.0.12] - 2026-11-08`.
- [x] Docs afetados atualizados (gdd/visual/audio/architecture/balancing Parte B/site) e sem links quebrados. · links `decisions.md` corrigidos; demais conferidos.
- [x] Saldos PixelLab/ElevenLabs registrados se o marco gastou assets. · M1 não gastou assets.
- [x] Relatório `docs/reports/audit-m1-<data>.md` gravado (tabela tarefa · status · evidência). · `docs/reports/audit-m1-2026-11-08.md`.

## 4. M2 — Armas, loja e economia (até 2026-12-20)

Specs: [SDD-002](docs/sdds/SDD-002-armas-slots-classes-tiers.md), [SDD-003](docs/sdds/SDD-003-loja-cartas-economia.md). UI ainda em Phaser provisória ou React mínimo (ver T3.x); o que importa aqui é a lógica.

- [x] **T2.1** `src/data/weapons.ts` por classe e tier I–IV (17 linhas), `sets.ts`, `unlocks.ts`; placeholder tingido por tier · Resp.: senior · Est.: 8 h · Assert: `bun test tests/weapons-data.test.ts` (A3) · Evidência (2026-11-08): `bun test tests/weapons-data.test.ts` 5 pass (A3); 17 linhas em `src/data/weapon-lines.ts` (vira `weapons.ts` no T2.3, quando o `SIGNATURE` antigo sai), `src/data/sets.ts`, `src/data/unlocks.ts`, tokens `weaponTier1..4`.
  - [x] Auditoria: toda linha tem 4 tiers com `damage` crescente. · Conferido (2026-11-08, orquestrador): re-executado; lido `weapon-lines.ts` (tier I = números atuais, II–IV por `TIER_SCALE`, dano crescente).
- [x] **T2.2** `build.ts`: 6 slots, `addWeapon`, `fuse`, `setBonuses`; `stats.ts` aplica sets · Resp.: senior · Dep.: T2.1 · Est.: 6 h · Assert: `tests/build.test.ts`, `tests/sets.test.ts` (A1, A2). · Evidência (2026-11-08): `bun test tests/build.test.ts tests/sets.test.ts tests/stats.test.ts tests/weapons-data.test.ts tests/cards.test.ts tests/sim.test.ts` 28 pass (A1, A2); `fuse` por índice de slot (SDD-002 v1.1); `applyModifiers(stats, setBonuses(build))` pronto, chamado pelo jogo no T2.3.
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): re-executado 28 pass; diff de `stats.ts` só adiciona `applyModifiers`; API antiga de `build.ts` intacta.
- [x] **T2.3** `WeaponRing`/`WeaponSystem` com 6 slots e prioridade boss/elite; remover arma assinada e evolução · Resp.: senior · Dep.: T2.2 · Est.: 8 h · Assert: `rg "signature|evolve|tierUp" src` vazio (A7); `?weapons=machete,knives,molotov,auxPistol,iceShards,flameRing` mostra 6 armas (A6). · Evidência (2026-11-08): A7 `rg "signature|evolve|tierUp" src` vazio; A6 `?skipMenu=1&weapons=machete,knives,molotov,auxPistol,iceShards,flameRing` mostra 6 armas no anel (screenshot 1920×1080, 0 erros); `bun test` 250 pass; `bun run e2e` verde com som desligado; `weapon-lines.ts` → `weapons.ts`; passivas novas com efeito; SDD-003 A6 em `tests/cards.test.ts`.
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): re-executei A7 vazio, gates completos e screenshot A6 próprio (`round=3`, tiers mistos): 6 armas visíveis, sem scroll, 0 erros.
- [x] **T2.4** Arma inicial por herói na seleção (3 cada) · Resp.: senior · Dep.: T2.1 · Est.: 3 h · Assert: `tests/heroes.test.ts` (A4). · Evidência (2026-11-08): `bun test tests/heroes.test.ts` verde (A4): `HeroDef.startingWeapons` (3 por herói, classe favorita, exclusivas só do dono) a partir de `STARTING_WEAPONS`. Seleção na `HeroSelect` fica na UI React (T3.6).
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): re-executado; lido o teste (classe favorita = maior `tagMul`).
- [x] **T2.5** Exclusivas: 3 viram armas exclusivas; 3 passivas novas (Fôlego de Ferro, Recarga Rápida, Eco Arcano) com números iniciais · Resp.: senior · Dep.: T2.2 · Est.: 5 h · Assert: `tests/cards.test.ts` sem `kind: 'weapon'|'evolve'` (SDD-003 A6) · Evidência (2026-11-08): `tests/cards.test.ts` verde: `bladeWhirl`, `grenadeBelt`, `droneSentinel` fora do pool de cartas; passivas novas `ironBreath`, `quickReload`, `arcaneEcho` como exclusivas com textos EN/PT-BR. Parcial da SDD-003 A6: cartas `weapon`/`evolve` restantes e o efeito em jogo das 3 passivas entram com o T2.3.
  - [x] Auditoria: i18n das 3 cartas nos idiomas existentes. · Conferido (2026-11-08, orquestrador): re-executado; `card-policy.ts` da sim ganhou nota baixa para as 3 passivas (sem efeito ainda), corrigindo o typecheck.
- [x] **T2.6** `logic/shop.ts` + `data/economy.ts` (ofertas, reroll, lock, preços, venda) · Resp.: senior · Est.: 8 h · Assert: `bun test tests/shop.test.ts` propriedade 1.000 seeds (SDD-003 A1, A2). · Evidência (2026-11-08): `bun test tests/shop.test.ts` 9 pass (A1 em 1.000 seeds com herói/round variando; A2 `rerollPrice` 4/5/19); `src/logic/shop.ts` puro + `SHOP` em `src/data/economy.ts`. Poções na loja (RF-09) e locks entre lojas ficam com T2.7.
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): re-executado 9 pass; fórmulas conferidas com SDD-003 RF-02/RF-03 ((10,2)=13+3·2=19).
- [x] **T2.7** `RunState`: Fish da run, loja, fila de level-ups; fim de round → loja → autosave; conversão Fish→Pérolas · Resp.: senior · Dep.: T2.6, T1.8 · Est.: 8 h · Assert: E2E cenário `shop` (A3); `tests/run-state.test.ts`. · Evidência (2026-11-08): `bun run e2e` (sem som) com cenário `shop`: level-up → `CardPick` → loja com 4 ofertas → React no `#ui` → compra debita o preço exato → reroll cobra → lock persiste → `closeShop` → round 2 com arena 11×11 e 2 armas no anel; `tests/run-state.test.ts` verde; `finishRun` converte Fish → Pérolas; Oficina, poções e menu em Pérolas. Pendências: botão de reroll de carta (UI React, T3.5/T3.6) e ofertas de item/equipamento (T3.4).
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): e2e re-executado verde; screenshots da loja React em 1280×720, 1920×1080 e 2400×1080 (fase `shop`, sem scroll, 0 erros); corrigi o contraste dos botões (`Btn` sem fundo nativo, sem preflight do Tailwind).
- [x] **T2.8** Cartas de level-up: 4 opções, só stats/exclusivas; fila de level-ups · Resp.: senior · Dep.: T2.5 · Est.: 4 h · Assert: `tests/cards.test.ts` (A6). · Evidência (2026-11-08): `tests/cards.test.ts` (A6: só stat/ativas/perks, 4 cartas em 40 rounds por herói), `tests/upgrades.test.ts` (`insight`), `tests/run-state.test.ts` (`rerollCards`, Fish com `harvesting`) verdes; `LEVEL_UP_CARDS = 4`, stat `harvesting` (RF-08), upgrade `insight` (1 reroll de carta por run). Fila consumida pela cena no T2.7; sim `--report`: #1 ✓ (17/16/10), #6 ✓ (0,897).
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): re-executado 24 pass; diff limitado a dados/lógica/i18n de cartas.
- [x] **T2.9** Sim e bot: `shop-policy.ts`, 6 slots, Fish/Pérolas (`SDD-013` RF-01/02 parcial) · Resp.: senior · Dep.: T2.7 · Est.: 10 h · Assert: `bun scripts/sim.ts 20` < 60 s; `tests/sim.test.ts` determinístico. · Evidência (2026-11-08): `bun scripts/sim.ts 20` em 2,9 s; `tests/sim.test.ts` + `tests/shop-policy.test.ts` 13 pass (determinístico por seed); `src/logic/sim/shop-policy.ts` (compra por valor/Fish, fusão, troca com 6 slots cheios, lock, reroll); sim com 6 slots, Fish da run, loja por round e Pérolas no fim. Bot real com loja (`--danger`, `--weapons`, JSONL) depende da loja na cena (T2.7/T3.4). Sim fora da meta (L1 morre no round 26–52): é o T2.10.
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): re-executado (2,9 s, 13 pass, biome limpo).
- [~] **T2.10** 1ª passada de balanceamento do design 1.0 (metas #1, #5, #6 da Parte A4) · Resp.: estagiario roda bot/sim; orquestrador ajusta `src/data` · Dep.: T2.9 · Est.: 8 h · Assert: `docs/reports/balance-<data>.md` com #1, #5, #6 ✓ · Progresso (2026-11-08): 1ª passada com a sim em `docs/reports/balance-2026-11-08.md` — #1 ✓ (L1 mediana 18/17/10, ninguém passa do 30), #6 ✓ (gasto/ganho 0,903; reroll 0,5%), #5 ✓ nas armas (9,7–32,7%) e ✗ no set `elemental` (67,7% > 50%: toda arma mágica é `elemental`) — pergunta ao desenvolvedor em `questions-to-dev.md`. · Bloqueado (2026-11-08): aguarda decisão do desenvolvedor sobre o set `elemental` (meta #5); demais metas ✓.
  - [ ] Auditoria: Parte B atualizada no mesmo commit.
- [x] **T2.11** Release `0.0.13` com todo o M2 (uma release por marco). · Evidência (2026-11-08): `bun scripts/release.ts 0.0.13` (gates verdes, rodado em clone limpo de `origin/main` porque os agentes mantêm a árvore suja) → [release v0.0.13](https://github.com/AlexGalhardo/pinguin-survivors/releases/tag/v0.0.13); pre-release; 13 tags = 13 releases; `package.json` 0.0.13.
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): `gh release view v0.0.13`: grupos Added/Changed/Fixed com links; inclui também o trabalho do M3 já entregue.

### Auditoria do marco M2

Marque conforme a auditoria avança: `[ ]` não feita · `[~]` parcial (anote o que falta) · `[x]` feita (data e quem auditou).

- [x] Todos os asserts das tarefas `[x]` re-executados e conferidos (Auditoria de cada tarefa marcada). · 2026-11-08: 64 testes do M2, grep A7, sim; T2.10 `[~]` com motivo.
- [x] SDDs do marco em "Aprovada" e implementação sem contradizer nenhum RF (grep pelos arquivos/funções citados). · SDD-002 1.1, SDD-003; desvios documentados no relatório.
- [x] `bun run lint && bun run typecheck && bun test && bun run build` verdes no commit do release. · gates do `release.ts` em `v0.0.13`.
- [x] Release `vX.Y.Z` conferido (`gh release view`): título = tag, grupos Keep a Changelog, links de commit válidos, `0.x` pre-release. · `v0.0.13`.
- [x] `CHANGELOG.md` com a seção da versão datada e `[Unreleased]` vazio. · `[0.0.13] - 2026-11-08`.
- [x] Docs afetados atualizados (gdd/visual/audio/architecture/balancing Parte B/site) e sem links quebrados. · balancing 2.3, architecture 2.2.
- [x] Saldos PixelLab/ElevenLabs registrados se o marco gastou assets. · M2 não gastou assets.
- [x] Relatório `docs/reports/audit-m2-<data>.md` gravado (tabela tarefa · status · evidência). · `docs/reports/audit-m2-2026-11-08.md`.

## 5. M3 — UI React e Danger (até 2027-01-10)

Specs: [SDD-004](docs/sdds/SDD-004-ui-react-tailwind.md), [SDD-005](docs/sdds/SDD-005-danger-e-save-v2.md). 🛑 Antes de T3.1: confirmar com o desenvolvedor as versões exatas de `react`, `react-dom`, `tailwindcss`, `@tailwindcss/vite` (estáveis no dia).

- [x] **T3.1** Infra: dependências fixas, `<div id="ui">`, `App.tsx`, `store.ts`, `commands.ts`, `theme.css` com tokens de `palette.ts`, plugin Tailwind no Vite · Resp.: senior · Est.: 6 h · Assert: `bun run build` OK; `rg -n "Phaser" src/ui` vazio (A1). · Evidência (2026-11-08): `vite build` OK com Tailwind; `rg -n "Phaser" src/ui` vazio (helpers Phaser movidos para `src/scenes/ui-phaser/`, removidos no T3.7); `#ui` sobre o canvas, `App.tsx`, `store.ts` (`useSyncExternalStore`), `commands.ts`, `theme.css` + `palette.css` gerado de `palette.ts` (`scripts/export-palette-css.ts`); `bun test tests/ui` 3 pass.
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): snapshot do índice exportado (`git checkout-index`) → typecheck 214 arquivos sem erro, 222 testes, biome limpo, `vite build` OK; grep A1 vazio.
- [x] **T3.2** Gerenciador de foco (teclado, gamepad, toque) e `Toast` · Resp.: senior · Dep.: T3.1 · Est.: 6 h · Assert: teste de componente de navegação por setas/`Enter`/`Esc`. · Evidência (2026-11-08): `bun test tests/ui` 9 pass (setas/Enter/Esc, item desabilitado, clique, escopo modal, Toast auto-dismiss); `src/ui/focus.tsx` (`FocusScope`, `useFocusable`), `src/ui/focus-nav.ts` (navegação espacial pura), `src/ui/toast.ts` + `components/Toast.tsx` (`aria-live`); gamepad pela ponte `core/gamepad` → `keydown`.
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): re-executado 9 pass; biome limpo em `src/ui`/`tests/ui`; `lint-i18n` 0; grep A1 vazio.
- [x] **T3.3** `Hud` (HP, XP, Fish, round/timer, boss, 6 armas, equipamento, gambits, superpoder, 2×, FPS, rodapé) · Resp.: senior · Dep.: T3.2 · Est.: 8 h · Assert: screenshot em 1920×1080 e 2400×1080 sem overflow (A7). · Evidência (2026-11-08): `?uiHud=1` (HUD React atrás de flag até o T3.7): screenshots 1920×1080 e 2400×1080 com `scrollWidth/Height` = viewport, 0 erros; `tests/ui/hud.test.tsx` verde; `hud-bridge.ts` a 10 Hz lendo `build.weapons`.
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): refiz os screenshots com o jogo já com T2.3: 3 slots tingidos por tier (III, I, II), HP/XP/Fish/round/timer/FPS visíveis, sem overflow nas 2 resoluções.
- [x] **T3.4** `Shop` estilo ARPG (paper doll + lojista + 4 ofertas, reroll, lock, fusão, equipamento) · Resp.: senior · Dep.: T3.3, T2.7 · Est.: 12 h · Assert: `bun test tests/ui/shop.test.tsx` (A3); screenshot nas 4 resoluções. · Evidência (2026-11-08): `bun test tests/ui/shop.test.tsx` verde (A3: 4 ofertas, compra/lock/reroll/vender/fundir, sem Fish desabilita, gear e poção, falas do lojista); screenshots da loja em 1920×1080, 2560×1440, 2400×1080 e 1366×768 sem overflow nem rolagem; lojista fala por balão (SDD-010 RF-05).
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): abri `shop-1920x1080.png` (poção, gear com cor de raridade, armas por tier, balão "Fresh stock!") e os 3 da 1ª rodada; testes re-executados.
- [x] **T3.5** `LevelUpCards`, `Pause`, `GameOver`, `Unlock` · Resp.: senior · Dep.: T3.2 · Est.: 8 h · Assert: E2E cobre level-up → cartas → pausa → game over. · Evidência (2026-11-08): `bun run e2e -- --react` (sem som) cobre menu React → START RUN → cartas React (com reroll) → loja → pausa → Configurações → retomar → desistir → game over → menu; `tests/ui/screens.test.tsx` verde; Unlock de herói/conquista antes do resumo. Telas React atrás de `?reactUi=1` até o T3.7.
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): `e2e -- --react` re-executado verde; fluxo Phaser (`bun run e2e`) também verde.
- [x] **T3.6** `MainMenu`, `HeroSelect` (herói, danger, arma inicial), `HeroScreen` (pontos, gambits, Oficina com Pérolas), `Settings`, `Controls`, `Achievements`, `Extras`, `History` · Resp.: senior · Dep.: T3.2 · Est.: 16 h · Assert: E2E completo `bun run e2e` zero erros (A4). · Evidência (2026-11-08): `bun run e2e` (sem som) percorre menu React → seleção (herói, Danger, arma) → run → cartas → loja → pausa → game over → menu, zero erros (A4); menus ligados ao save por `menu-controller`.
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): e2e re-executado verde após o T3.7; screenshot do menu em 1920×1080 conferido (falta o fundo de key art — tarefa de polimento aberta).
- [x] **T3.7** Remover cenas Phaser de UI e `installCrispText` · Resp.: senior · Dep.: T3.3–T3.6 · Est.: 4 h · Assert: `rg -n "scene.add.text|add.bitmapText" src/scenes src/systems` só no overlay de debug (A2). · Evidência (2026-11-08): 13 cenas Phaser de UI, `src/scenes/ui-phaser/` e `installCrispText` removidos; `game-config` só com Boot, Game e Hud; A2 `rg -n "scene.add.text|add.bitmapText" src/scenes src/systems` vazio (texto Phaser só no overlay `?debug=1` do HudScene); HUD/menus/cartas/loja/pausa/game over/unlock sempre React; pausa React com equipamento.
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): re-executei A2 vazio, typecheck, 333 testes, lint, build e `bun run e2e` (fluxo React) sem som.
- [x] **T3.8** `scripts/lint-i18n.ts` (sem literais em JSX) · Resp.: estagiario · Est.: 2 h · Assert: `bun scripts/lint-i18n.ts` retorna 0 (A5). · Evidência (2026-11-08): `bun scripts/lint-i18n.ts` exit 0 (0 `.tsx` ainda); `bun test tests/lint-i18n.test.ts` 16 pass; script `bun run lint:i18n`.
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): re-executado exit 0; amostra `<div title="Sair">Iniciar jogo {t("ok")}</div>` acusa `attr Sair` e `text Iniciar jogo`, ignora `t()`.
- [x] **T3.9** Danger 0–5: `difficulty.ts`, waves extras, desbloqueio por herói, aviso na loja · Resp.: senior · Dep.: T3.4 · Est.: 6 h · Assert: `tests/difficulty.test.ts`, `tests/progression.test.ts` (SDD-005 A1, A4). · Evidência (2026-11-08): `tests/difficulty.test.ts` (A1, 500 seeds, `scaleDrops`) e `tests/progression.test.ts` (A4) verdes; jogo usa `dangerMods(run.danger)`, waves extras com banner, desbloqueio no boss do round 20 e `recordBestRound`; HeroSelect (Phaser e React) escolhe Danger até `maxSelectableDanger`; aviso de wave na loja do D2 em diante; `settings.difficulty`/`DIFFICULTIES` removidos; `?danger=` e `?weapon=`.
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): browser `?danger=5&weapon=hammer` (mods 1,75/1,5/1,12/1,5, 3 waves extras, só `hammer`, 0 erros) e `?danger=5&seed=3&round=7` (aviso na loja, round 8 com `wave === 'elite'`) no relatório do Senior A; re-executei 303 testes e e2e sem som.
- [x] **T3.10** Acessibilidade: Lighthouse ≥ 90 na `MainMenu`; hit targets ≥ 44 px · Resp.: estagiario · Est.: 2 h · Assert: relatório chrome-devtools (A6). · Evidência (2026-11-08): Lighthouse (Chrome DevTools) na MainMenu React: Accessibility 100 (meta ≥ 90; A6); `docs/reports/a11y-2026-11-08.md`: 0 alvos < 44 px em MainMenu, Settings, HeroSelect e loja (1920×1080).
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): Lighthouse rodado por mim; Btn com `min-h-11 min-w-11` em todos os botões React.
- [ ] **T3.11** 🛑 Inscrição no Next Fest até 2027-01-10 (depende de T15.1 Steamworks) · Resp.: dev · Assert: confirmação da Steamworks por e-mail.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [x] **T3.12** Release `0.1.0` (entra na fase beta: jogo completo jogável com UI React). · Evidência (2026-11-08): `bun scripts/release.ts 0.1.0` (clone limpo, gates verdes) → [release v0.1.0](https://github.com/AlexGalhardo/pinguin-survivors/releases/tag/v0.1.0); pre-release; `package.json` 0.1.0; 14 tags = 14 releases. O conteúdo do M3 já tinha saído em `v0.0.13` (release por marco feita com o código pronto); `v0.1.0` marca a entrada na fase beta.
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): `gh release view v0.1.0` pre-release, título = tag.

### Auditoria do marco M3

Marque conforme a auditoria avança: `[ ]` não feita · `[~]` parcial (anote o que falta) · `[x]` feita (data e quem auditou).

- [x] Todos os asserts das tarefas `[x]` re-executados e conferidos (Auditoria de cada tarefa marcada). · 2026-11-08: ver `docs/reports/audit-m3-2026-11-08.md`.
- [x] SDDs do marco em "Aprovada" e implementação sem contradizer nenhum RF (grep pelos arquivos/funções citados). · SDD-004, SDD-005 (desvios documentados).
- [x] `bun run lint && bun run typecheck && bun test && bun run build` verdes no commit do release. · gates do `release.ts` em `v0.1.0`.
- [x] Release `vX.Y.Z` conferido (`gh release view`): título = tag, grupos Keep a Changelog, links de commit válidos, `0.x` pre-release. · `v0.1.0`.
- [x] `CHANGELOG.md` com a seção da versão datada e `[Unreleased]` vazio. · `[0.1.0] - 2026-11-08`.
- [x] Docs afetados atualizados (gdd/visual/audio/architecture/balancing Parte B/site) e sem links quebrados. · architecture 2.3, workflow 2.1, README; lint:md 0.
- [x] Saldos PixelLab/ElevenLabs registrados se o marco gastou assets. · M3 não gastou assets.
- [x] Relatório `docs/reports/audit-m3-<data>.md` gravado (tabela tarefa · status · evidência). · `docs/reports/audit-m3-2026-11-08.md`.

## 6. M4 — Arte e áudio da demo (até 2027-01-17)

Specs: [SDD-012](docs/sdds/SDD-012-arte-topdown-e-vfx.md), [docs/audio.md](docs/audio.md) §6. Só o necessário para a demo (bioma 1) e a loja; o resto em M7.

- [ ] **T4.1** QA visual dos heróis e inimigos do bioma 1 na câmera top-down; prancha em `art-src/pixellab/qa/` · Resp.: estagiario gera prancha; 🛑 dev aprova a lista do que refazer · Est.: 3 h · Assets: 0 · Assert: arquivo da prancha + lista aprovada registrada em `docs/visual.md` §11.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [ ] **T4.2** Tileset top-down 64×64 + bordas da Antártida · Resp.: orquestrador (skill `pinguin-art-assets`) · Dep.: T4.1 · Est.: 4 h · Assets: ~80 gerações · Assert: prancha 3×3 sem costura; `bun scripts/pack-atlas.ts --check` OK.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [ ] **T4.3** Props top-down da Antártida (4) · Est.: 2 h · Assets: ~5 · Assert: chaves `deco.antarctica.*` sem placeholder em `?debug=1`.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [ ] **T4.4** Lojista: concept 🛑 aprovação → idle · Resp.: orquestrador · Est.: 3 h · Assets: ~10 · Assert: `npc.merchant.idle` no atlas e na `Shop`.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [ ] **T4.5** Tiers II–IV das 9 armas da demo (Jack + neutras) · Est.: 4 h · Assets: ~30 · Assert: `weapon.*.t2–t4` sem placeholder para as 9 linhas.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [ ] **T4.6** Ícones: cartas de stat (~25), exclusivas do Jack (6), itens (~15), moedas (2), danger (6) · Est.: 4 h · Assets: ~55 · Assert: `installPlaceholders` não lista `icon.*` dessas chaves.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [ ] **T4.7** Refações aprovadas em T4.1 (até 3 personagens) · Est.: 6 h · Assets: ≤ 300 · Assert: prancha pós-refação aprovada.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [x] **T4.8** SFX da loja (5) e de elementos (5); música da loja (30 s) · Resp.: orquestrador (skill `pinguin-audio-assets`) · Est.: 3 h · Assets: ~420 créditos · Assert: chaves `sfx.shop*`, `music.shop` no manifest e tocando no E2E. · Evidência (2026-11-08): 6 SFX da loja (`shopOpen`, `shopBuy`, `shopReroll`, `shopLock`, `weaponFuse`, `shopNoFish`), 5 de elementos (`fire`, `ice`, `earth`, `lightning`, `freeze`) e `music.shop` (30 s, 70 bpm), normalizados por ffmpeg; chaves no manifest e tocando na loja/hits; `tests/audio-assets.test.ts` e o E2E `--demo` conferem as 12 chaves no cache do Phaser (sem som). Gasto 519 créditos (estimativa 420; saldo 58.198 → 57.679), registrado em `docs/audio.md` §6–§7.
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): teste re-executado; durações por ffprobe batem; gasto acima do teto interno de 450 que dei, mas abaixo do gate de 2.000 — anotado.
- [ ] **T4.9** VFX do superpoder do Jack (Colheita Rubra) · Est.: 4 h · Assets: ~50 · Assert: `fx.super.jack` ≥ 12 frames no atlas.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [ ] **T4.10** Registro: `docs/visual.md` §10–§13 e `docs/audio.md` §6–§7 com saldos · Resp.: estagiario · Assert: saldo PixelLab após M4 ≥ 3.500 (mês de janeiro).
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [ ] **T4.11** Release `0.1.1`.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.

### Auditoria do marco M4

Marque conforme a auditoria avança: `[ ]` não feita · `[~]` parcial (anote o que falta) · `[x]` feita (data e quem auditou).

- [ ] Todos os asserts das tarefas `[x]` re-executados e conferidos (Auditoria de cada tarefa marcada).
- [ ] SDDs do marco em "Aprovada" e implementação sem contradizer nenhum RF (grep pelos arquivos/funções citados).
- [ ] `bun run lint && bun run typecheck && bun test && bun run build` verdes no commit do release.
- [ ] Release `vX.Y.Z` conferido (`gh release view`): título = tag, grupos Keep a Changelog, links de commit válidos, `0.x` pre-release.
- [ ] `CHANGELOG.md` com a seção da versão datada e `[Unreleased]` vazio.
- [ ] Docs afetados atualizados (gdd/visual/audio/architecture/balancing Parte B/site) e sem links quebrados.
- [ ] Saldos PixelLab/ElevenLabs registrados se o marco gastou assets.
- [ ] Relatório `docs/reports/audit-m4-<data>.md` gravado (tabela tarefa · status · evidência).

## 7. M5 — Demo, Electron e site (até 2027-02-08)

Specs: [SDD-006](docs/sdds/SDD-006-demo.md), [SDD-007](docs/sdds/SDD-007-ports-electron-capacitor.md) (desktop), [SDD-008](docs/sdds/SDD-008-site-astro-github-pages.md), [docs/site.md](docs/site.md).

- [x] **T5.1** `src/data/demo.ts`, gating de herói/round/danger, `DemoEnd` com wishlist, `build:demo` · Resp.: senior · Est.: 8 h · Assert: `bun run e2e -- --demo` (A2, A3); bundles conferidos (A1). · Evidência (2026-11-08): `bun run e2e -- --demo` (dev server próprio com `VITE_DEMO=1`, sem som): toast do herói bloqueado, round ≤ 10, Danger ≤ 1, `DEMO COMPLETE` após o boss do 10 com botão de wishlist (`STEAM_URL`), `DEMO OVER` ao morrer (A2, A3); `bun run build:demo --check-full` (A1).
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): re-executado verde. Pendências menores: texto de herói bloqueado na HeroSelect da demo e ocultar conquistas > round 10 (RF-04).
- [x] **T5.2** Migração do save da demo → completo (web import; Electron arquivo) · Resp.: senior · Est.: 3 h · Assert: `tests/save.test.ts` fixture `save-demo.json` (A4). · Evidência (2026-11-08): `tests/save.test.ts` com fixture `tests/fixtures/save-demo.json` (A4: Jack nível 14, Pérolas, upgrades e conquistas mantidos, idempotente). Botão "Importar save da demo" fica com a UI (T3.6/T5.1).
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): re-executado verde.
- [x] **T5.3** `Platform` (web/electron/capacitor) e `storage.ts` delegando · Resp.: senior · Est.: 6 h · Assert: `tests/platform-web.test.ts`; `rg -n "from 'electron'|steamworks|@capacitor" src` vazio (SDD-007 A1, A5). · Evidência (2026-11-08): `bun test tests/platform-web.test.ts` 6 pass (A5 export/import roundtrip, storage bloqueado não lança, ponte nativa com fallback web); `rg -n "from 'electron'|steamworks|@capacitor" src` vazio (A1); `src/core/platform/` (web, ponte `window.platform` para electron/capacitor), `storage.ts` delega.
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): re-executado; ponte renomeada para `window.platform` conforme SDD-007 RF-03/RF-07.
- [ ] **T5.4** `apps/desktop/`: Electron + `steamworks.js` (init, conquista de teste, overlay), `electron-builder` Windows, builds demo e completo · Resp.: senior · Dep.: T5.3, T15.1 (App ID) · Est.: 12 h · Assert: `bun run build:desktop` gera os `.exe` (A2); QA manual A3 registrado. · Progresso (2026-11-08): `bun run build:desktop` e `build:desktop:demo` geram `Pinguin Survivors.exe` e `Pinguin Survivors Demo.exe` (A2); smoke do .exe: `window.platform.kind === 'electron'`, save em `%APPDATA%`, sem App ID tudo no-op; `rg` A5 vazio. Falta: App ID (T15.1, dev), QA manual A3 com Steam (dev), leaderboards (steamworks.js 0.4.0 não tem API — decidir no T7.7).
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [x] **T5.5** Workflow `desktop.yml` (Windows) com artefato · Resp.: estagiario · Dep.: T5.4 · Est.: 3 h · Assert: `gh run list --workflow desktop.yml` verde. · Evidência (2026-11-08): `gh run list --workflow desktop.yml` → run 42498026970 `success` (windows-latest, flavor both), artefato `pinguin-survivors-windows-both` (353 MB); só `workflow_dispatch`, actions pinadas por SHA, `permissions: contents: read`.
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): `gh run view 42498026970` success e artefato listado via API.
- [x] **T5.6** `site/` em Astro 7.4 estático: landing 4 idiomas, SEO, trailer placeholder, `build-site.ts`, `pages.yml` · Resp.: senior · Dep.: T5.1 · Est.: 10 h · Assert: SDD-008 A1–A5, A7; Lighthouse ≥ 95 (A3). · Evidência (2026-11-08): `bun scripts/build-site.ts` gera `site/dist/` (Astro 7.4.7 estático; EN, pt-br, es, zh-cn, `/demo/`, 404, sitemap, robots) — A1 páginas, A2 sem adapter/server, A4 sem scroll em 1920×1080 e 1366×768 e sem rolagem horizontal em 390×844, A7 hreflang nos 4 idiomas; `/demo/` abre sem erros (A5 parcial); `pages.yml` só manual até o T5.7. A3: Lighthouse (desktop e mobile, `site/dist` servido local) Accessibility 100, SEO 100, Best Practices 81 só por `is-on-https` (HTTP local; Pages serve HTTPS); performance a medir no deploy (T5.7).
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): Lighthouse rodado por mim; corrigi `label-content-name-mismatch` no seletor de idioma (nome acessível agora contém o texto visível); `pages.yml` com `setup-bun` pinado por SHA e permissões de Pages só no job `deploy`.
- [ ] **T5.7** Deploy no GitHub Pages; `/demo/` jogável · Resp.: orquestrador · Dep.: T5.6 · Est.: 2 h · Assert: `curl -I https://alexgalhardo.github.io/pinguin-survivors/` 200; `/demo/` abre o round 1 sem erros (A5, A6).
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [ ] **T5.8** 🛑 Página da Steam (jogo e demo) com capsules (T7.9 antecipa as capsules mínimas), descrição 4 idiomas, trailer placeholder/gif · Resp.: dev com textos do orquestrador · Dep.: T15.1 · Assert: página visível em "coming soon".
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [ ] **T5.9** Upload da demo na Steam (build Windows) até 2027-01-25; itens do Next Fest até 2027-02-08 · Resp.: dev · Dep.: T5.4, T5.8 · Assert: build "released" no branch default da demo; checklist do Next Fest completo na Steamworks.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [~] **T5.10** Tempo da demo: bot médio L1 em 12–25 min (SDD-006 A5) · Resp.: estagiario · Assert: log do bot em `docs/reports/`. · Bloqueado (2026-11-08): medido com o bot (`docs/reports/demo-time-2026-11-08.md`): ~6,2 min de jogo até `demoWin` (meta 12–25 min) — o formato atual (rounds 1–9 = 360 s + boss ≤ 180 s) não alcança a meta sem tempo humano de loja/cartas; decisão do desenvolvedor (alongar rounds/`DEMO.maxRound` ou mudar o critério), `questions-to-dev.md` #11.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [ ] **T5.11** Releases `0.1.2` (demo + site) e `0.1.3` (Electron).
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.

### Auditoria do marco M5

Marque conforme a auditoria avança: `[ ]` não feita · `[~]` parcial (anote o que falta) · `[x]` feita (data e quem auditou).

- [ ] Todos os asserts das tarefas `[x]` re-executados e conferidos (Auditoria de cada tarefa marcada).
- [ ] SDDs do marco em "Aprovada" e implementação sem contradizer nenhum RF (grep pelos arquivos/funções citados).
- [ ] `bun run lint && bun run typecheck && bun test && bun run build` verdes no commit do release.
- [ ] Release `vX.Y.Z` conferido (`gh release view`): título = tag, grupos Keep a Changelog, links de commit válidos, `0.x` pre-release.
- [ ] `CHANGELOG.md` com a seção da versão datada e `[Unreleased]` vazio.
- [ ] Docs afetados atualizados (gdd/visual/audio/architecture/balancing Parte B/site) e sem links quebrados.
- [ ] Saldos PixelLab/ElevenLabs registrados se o marco gastou assets.
- [ ] Relatório `docs/reports/audit-m5-<data>.md` gravado (tabela tarefa · status · evidência).

## 8. M6 — Steam Next Fest (22/02–01/03/2027)

- [ ] **T6.1** 2 livestreams agendadas na página (Steam Broadcast) · Resp.: dev · Assert: eventos visíveis na página.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [ ] **T6.2** Plantão de hotfix: triagem diária de crashes/erros reportados; patch `0.1.x` em < 24 h para bloqueadores · Resp.: orquestrador + senior · Assert: nenhum bug bloqueador aberto por > 24 h (issues do GitHub).
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [ ] **T6.3** Coleta de métricas: wishlists antes/depois, conversão demo → wishlist (Steamworks) · Resp.: dev exporta, estagiario documenta · Assert: `docs/reports/nextfest-2027-02.md` com os números e comparação com os benchmarks de `web-research.md` §7.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [ ] **T6.4** Feedback → hipóteses de balanceamento e UX (Parte A3) · Resp.: orquestrador · Assert: ≥ 5 hipóteses registradas em `docs/reports/`.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.

### Auditoria do marco M6

Marque conforme a auditoria avança: `[ ]` não feita · `[~]` parcial (anote o que falta) · `[x]` feita (data e quem auditou).

- [ ] Todos os asserts das tarefas `[x]` re-executados e conferidos (Auditoria de cada tarefa marcada).
- [ ] SDDs do marco em "Aprovada" e implementação sem contradizer nenhum RF (grep pelos arquivos/funções citados).
- [ ] `bun run lint && bun run typecheck && bun test && bun run build` verdes no commit do release.
- [ ] Release `vX.Y.Z` conferido (`gh release view`): título = tag, grupos Keep a Changelog, links de commit válidos, `0.x` pre-release.
- [ ] `CHANGELOG.md` com a seção da versão datada e `[Unreleased]` vazio.
- [ ] Docs afetados atualizados (gdd/visual/audio/architecture/balancing Parte B/site) e sem links quebrados.
- [ ] Saldos PixelLab/ElevenLabs registrados se o marco gastou assets.
- [ ] Relatório `docs/reports/audit-m6-<data>.md` gravado (tabela tarefa · status · evidência).

## 9. M7 — Conteúdo completo, i18n e Balance 1.0 (até 2027-03-31)

Specs: [SDD-009](docs/sdds/SDD-009-i18n-es-zh.md), [SDD-012](docs/sdds/SDD-012-arte-topdown-e-vfx.md) (restante), [SDD-013](docs/sdds/SDD-013-balanceamento-e-simulacao.md), [SDD-007](docs/sdds/SDD-007-ports-electron-capacitor.md) (Steam).

- [ ] **T7.1** Tilesets + bordas + props dos biomas 2–3 · Resp.: orquestrador · Est.: 6 h · Assets: ~180 · Assert: prancha 3×3 por bioma; `pack-atlas --check`.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [ ] **T7.2** Tiers II–IV das 8 armas restantes; ícones restantes (~70) · Est.: 6 h · Assets: ~95 · Assert: nenhum `weapon.*`/`icon.*` em placeholder.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [ ] **T7.3** Kraken e abominação (base limpa + walk), voadores (3), ataques (10 inimigos + 3 bosses) · Est.: 10 h · Assets: ~185 · Assert: `enemy.*.attack` no atlas para todos os `ranged`/`charger`/bosses.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [ ] **T7.4** VFX dos superpoderes de Bob e Lucia · Est.: 5 h · Assets: ~100 · Assert: `fx.super.bob`, `fx.super.lucia` ≥ 12 frames.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [ ] **T7.5** Músicas dos biomas 2–3 (2 × 45 s), SFX de armas novas (8), bosses (3), UI/meta (4), `sfx.bossDown` · Est.: 4 h · Assets: ~1.200 créditos · Assert: chaves no manifest; `docs/audio.md` §6 zerado.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [x] **T7.6** i18n ES e ZH: tradução (estagiario/`text-editor`), glossário, fonte CJK sob demanda, layouts · Resp.: estagiario traduz; orquestrador revisa · Est.: 12 h · Assert: `bun scripts/i18n-check.ts` 0/0/0 (SDD-009 A2); screenshots ZH/ES sem overflow (A3); glossário "revisado". · Evidência (2026-11-08): `bun scripts/i18n-check.ts` 0/0/0 em pt-BR, es e zh-CN (A2); screenshots ES e ZH (menu React, HUD, loja) em 1920×1080 sem overflow (A3); `LANGS` com 4 idiomas, Noto Sans SC carregada só em zh-CN, seletor nos Settings React e Phaser; glossário `docs/i18n-glossary.md` revisado.
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): `i18n-check` re-executado 0/0/0; abri `lang-zh-shop.png` (CJK legível, sem overflow); `settings.lang` cobre o `locale` da SDD-005 (texto da SDD ajustado).
- [ ] **T7.7** Steam: conquistas (mapa das 131 + novas), Steam Cloud, leaderboards por herói × danger · Resp.: senior · Dep.: T5.4 · Est.: 10 h · Assert: conquista dispara no overlay; save aparece em 2ª máquina (SDD-007 A3, A6); leaderboard recebe score. · Progresso (2026-11-08): shell mapeia conquistas internas → `ACH_*` (`src/data/steam-achievements.ts`), `cloud` = Steam inicializada, Auto-Cloud documentado em `architecture.md` §9 (`WinAppDataRoaming/pinguin-survivors-desktop/save.json`); leaderboards bloqueados: `steamworks.js` 0.4.0 (última estável) não tem API — decidir outro binding ou Web API. Falta: App ID, registro das conquistas no Steamworks e QA A3/A6 (dev); chamada `platform().achievements.unlock` no jogo (orquestrador).
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [x] **T7.8** Conquistas novas (danger, sets, fusão IV, rounds) e textos nos 4 idiomas · Resp.: senior + estagiario · Est.: 4 h · Assert: `tests/achievements.test.ts`; `i18n-check` 0/0/0. · Evidência (2026-11-08): 47 conquistas novas (131 → 178: Danger por herói e geral, sets 2/4/6, fusões e tier IV simultâneas, round 60) com textos nos 4 idiomas; `tests/achievements.test.ts` e `tests/achievement-text.test.ts` verdes; `bun scripts/i18n-check.ts` 0/0/0; mapa Steam `src/data/steam-achievements.ts` (178 ids, nomes únicos ≤ 64, `tests/steam-achievements.test.ts`). Ligação dos contadores de set/tier IV na cena com o T3.7.
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): 35 testes re-executados; ids antigos intactos (saves existentes não perdem conquistas).
- [ ] **T7.9** Key art e capsules da Steam (6 peças) e OG image do site · Resp.: orquestrador · Est.: 4 h · Assets: ~400 · Assert: arquivos nas dimensões exigidas em `art-src/steam/`; 🛑 dev aprova.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [x] **T7.10** `balance-report.ts`, telemetria local opt-in, `--danger` no bot (SDD-013 RF-03…05) · Resp.: senior · Est.: 8 h · Assert: SDD-013 A1–A3, A5. · Evidência (2026-11-08): `scripts/balance-report.ts` + `src/logic/sim/balance-report.ts` (A1–A2: metas #1–#8 ✓/✗/n/d a partir de JSONL da sim ou do bot), `sim.ts --jsonl` herói × nível × Danger (A3), telemetria opt-in no save com teto 200 e export (A5); `tests/balance-report.test.ts`, `tests/telemetry.test.ts`, `tests/save.test.ts` verdes; `--danger` no bot.
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): testes re-executados; relatório gerado `docs/reports/balance-auto-2026-11-08.md` lido.
- [ ] **T7.11** **Balance 1.0**: metas A4 #1–#8 (até 3 passadas de bot) · Resp.: estagiario roda; orquestrador ajusta · Dep.: T7.10 · Est.: 16 h · Assert: `docs/reports/balance-1.0.md` com #1–#8 ✓ ou exceções justificadas (A4). · Progresso (2026-11-08): passada 1 de 3 aplicada (Oficina ×0,6; `elementStaff` 10→16) — #1, #3, #4, #6 ✓; #2 ✗ em 100 seeds (2–3% morrem no boss do 10) e #5 ✗ (arma líder ~39%, set `elemental` 83%) aguardam decisão do desenvolvedor sobre as metas e o set (`questions-to-dev.md` #3 e #8); #7/#8 precisam do bot e do perf.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [x] **T7.12** QA cross-browser e E2E completos; `scripts/qa-browsers.ts` · Resp.: estagiario · Assert: zero erros/4xx em Chrome/Edge/Firefox. · Evidência (2026-11-08): `bun scripts/qa-browsers.ts` (fluxo React, sem som) em Chrome 156, Edge 157 e Firefox 159: 0 erros, 0 4xx/5xx, FPS 59,6/56/55,2; 6 resoluções no Chrome sem scroll — `docs/reports/qa-browsers-2026-11-08.md`. E2E completo (`bun run e2e`, `--demo`) verde.
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): relatório lido; e2e padrão e demo re-executados verdes nesta sessão.
- [ ] **T7.14** Biomas da campanha (ADR-016): rounds 11–20 floresta, 21–30 cidade destruída com 6 aliens originais + boss; endless 31+ sorteia bioma e inimigos de todo o acervo (incluindo estação e ruínas legados) · Resp.: senior · Est.: 10 h · Assert: `tests/biome.test.ts` (campanha e endless determinístico, todo inimigo possível no endless); screenshots `round=11` e `round=21` em 1920×1080; `bun scripts/i18n-check.ts` 0/0/0.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [ ] **T7.15** Arte dos biomas novos: tileset + props de floresta e cidade destruída; concepts 4 direções dos 6 aliens + boss (🛑 aprovação do desenvolvedor antes de animar) · Resp.: orquestrador (skill `pinguin-art-assets`) · Est.: 10 h · Assets: a medir (`GET /balance`), lotes ≤ 200 gerações · Assert: prancha 3×3 por bioma; concepts em `art-src/pixellab/concepts/aliens/`.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [ ] **T7.13** Releases `0.1.4+` por sub-bloco.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.

### Auditoria do marco M7

Marque conforme a auditoria avança: `[ ]` não feita · `[~]` parcial (anote o que falta) · `[x]` feita (data e quem auditou).

- [ ] Todos os asserts das tarefas `[x]` re-executados e conferidos (Auditoria de cada tarefa marcada).
- [ ] SDDs do marco em "Aprovada" e implementação sem contradizer nenhum RF (grep pelos arquivos/funções citados).
- [ ] `bun run lint && bun run typecheck && bun test && bun run build` verdes no commit do release.
- [ ] Release `vX.Y.Z` conferido (`gh release view`): título = tag, grupos Keep a Changelog, links de commit válidos, `0.x` pre-release.
- [ ] `CHANGELOG.md` com a seção da versão datada e `[Unreleased]` vazio.
- [ ] Docs afetados atualizados (gdd/visual/audio/architecture/balancing Parte B/site) e sem links quebrados.
- [ ] Saldos PixelLab/ElevenLabs registrados se o marco gastou assets.
- [ ] Relatório `docs/reports/audit-m7-<data>.md` gravado (tabela tarefa · status · evidência).

## 10. M8 — Android (até 2027-04-15)

Spec: [SDD-007](docs/sdds/SDD-007-ports-electron-capacitor.md).

- [ ] **T8.1** 🛑 Conta Google Play Console; app criado; classificação IARC 16+ preenchida · Resp.: dev · Assert: app em "rascunho" no Console.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [ ] **T8.2** `apps/mobile/` Capacitor, landscape, `Preferences`, safe areas, joystick + botões de toque na HUD, `tier` baixo · Resp.: senior · Dep.: T5.3 · Est.: 14 h · Assert: AAB gerado (SDD-007 A4); QA em aparelho 6,7" com ≥ 55 FPS no round 10 registrado. · Progresso (2026-11-08): `apps/mobile/` Capacitor 8.6.0 (core, android, app, preferences; cli dev), landscape (`sensorLandscape`), imersivo, safe areas, ponte `window.platform` com `Preferences` hidratado e `tier: 'low'`, `TouchControls` (joystick + super/velocidade/pausa) via `src/core/touch-bridge.ts`; `./gradlew bundleDebug` gerou `app-debug.aab` (15,8 MB) localmente (A4 parcial). Falta: QA em aparelho 6,7" ≥ 55 FPS no round 10 (dev) e AAB release assinado (keystore do dev).
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [x] **T8.3** Workflow `android.yml` com assinatura por secrets · Resp.: estagiario · Est.: 3 h · Assert: run verde com artefato AAB. · Evidência (2026-11-08): run 42499006510 do `android.yml` (`build_type=debug`) `success` com artefato `pinguin-survivors-debug-aab` (15,7 MB); assinatura de release lida de secrets (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`) — o AAB assinado depende do keystore do desenvolvedor.
  - [x] Auditoria: re-executar o assert e conferir a evidência anotada. · Conferido (2026-11-08, orquestrador): 1ª run falhou (`gradlew` sem +x); corrigido em commit próprio e re-executado verde; artefato listado via API.
- [ ] **T8.4** Teste interno (Play Console) com 5+ aparelhos · Resp.: dev · Assert: relatório pré-lançamento do Console sem crashes.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [ ] **T8.5** Release `0.1.x` (mobile).
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.

### Auditoria do marco M8

Marque conforme a auditoria avança: `[ ]` não feita · `[~]` parcial (anote o que falta) · `[x]` feita (data e quem auditou).

- [ ] Todos os asserts das tarefas `[x]` re-executados e conferidos (Auditoria de cada tarefa marcada).
- [ ] SDDs do marco em "Aprovada" e implementação sem contradizer nenhum RF (grep pelos arquivos/funções citados).
- [ ] `bun run lint && bun run typecheck && bun test && bun run build` verdes no commit do release.
- [ ] Release `vX.Y.Z` conferido (`gh release view`): título = tag, grupos Keep a Changelog, links de commit válidos, `0.x` pre-release.
- [ ] `CHANGELOG.md` com a seção da versão datada e `[Unreleased]` vazio.
- [ ] Docs afetados atualizados (gdd/visual/audio/architecture/balancing Parte B/site) e sem links quebrados.
- [ ] Saldos PixelLab/ElevenLabs registrados se o marco gastou assets.
- [ ] Relatório `docs/reports/audit-m8-<data>.md` gravado (tabela tarefa · status · evidência).

## 11. M9 — Lançamento 1.0 (até 2027-04-30)

- [ ] **T9.1** Congelamento: só `fix` e `balance` por 2 semanas; `ccgs-release-checklist` e `gd-steam-publish` executadas · Resp.: orquestrador · Assert: checklists em `docs/reports/release-1.0.md` 100%.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [ ] **T9.2** Preço US$ 4,99 + regional; desconto de lançamento 10% (hipótese); data e hora · Resp.: dev · Assert: Steamworks "release ready".
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [ ] **T9.3** Trailer ≤ 2 min publicado na página e no site (`docs/site.md` §6) · Resp.: dev (captura) + orquestrador (roteiro) · Assert: `<video>` do site aponta para o arquivo final.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [ ] **T9.4** Release **`1.0.0`** (`bun scripts/release.ts 1.0.0`, sem `--prerelease`) · Assert: `gh release view v1.0.0` não é pre-release; `package.json.version === '1.0.0'`.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [ ] **T9.5** Publicar na Steam; Android em produção até 2027-05-15 · Resp.: dev · Assert: páginas públicas com "Comprar".
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.
- [ ] **T9.6** Site: CTA vira "Comprar"; press kit `/press/` · Resp.: senior · Assert: Lighthouse ≥ 95; links das lojas 200.
  - [ ] Auditoria: re-executar o assert e conferir a evidência anotada.

### Auditoria do marco M9

Marque conforme a auditoria avança: `[ ]` não feita · `[~]` parcial (anote o que falta) · `[x]` feita (data e quem auditou).

- [ ] Todos os asserts das tarefas `[x]` re-executados e conferidos (Auditoria de cada tarefa marcada).
- [ ] SDDs do marco em "Aprovada" e implementação sem contradizer nenhum RF (grep pelos arquivos/funções citados).
- [ ] `bun run lint && bun run typecheck && bun test && bun run build` verdes no commit do release.
- [ ] Release `vX.Y.Z` conferido (`gh release view`): título = tag, grupos Keep a Changelog, links de commit válidos, `0.x` pre-release.
- [ ] `CHANGELOG.md` com a seção da versão datada e `[Unreleased]` vazio.
- [ ] Docs afetados atualizados (gdd/visual/audio/architecture/balancing Parte B/site) e sem links quebrados.
- [ ] Saldos PixelLab/ElevenLabs registrados se o marco gastou assets.
- [ ] Relatório `docs/reports/audit-m9-<data>.md` gravado (tabela tarefa · status · evidência).

## 12. Pós-1.0

- Patches de balanceamento a cada 2 semanas no máximo (Parte A7), `1.0.x`.
- Linux/macOS (Electron), `1.1.0`; iOS avaliar.
- Bioma 4 + boss como DLC a ~US$ 3,99 (hipótese, `web-research.md` §8), `1.2.0`.
- SKU free com rewarded ads no Android se o premium não tracionar (ADR-011 deixa a camada isolada).
- Co-op local (Brotato fez junto com a DLC): avaliar após 6 meses.

## 13. Orçamento de assets

**PixelLab** (Tier 2, 5.000 gerações/mês, renova dia 14; saldo em 2026-11-08: **2.320**). **ElevenLabs** (Creator, renova dia 14; saldo em 2026-11-08: **58.198 créditos**).

| Lote | Marco | Gerações | Créditos | Saldo PixelLab após (estimado) |
|---|---|---|---|---|
| Nov (até 14/11): nada planejado antes de M1 | — | 0 | 0 | 2.320 → renova 5.000 |
| M4 tileset + bordas Antártida | M4 | 80 | — | 4.920 |
| M4 props (4) | M4 | 5 | — | 4.915 |
| M4 lojista | M4 | 10 | — | 4.905 |
| M4 tiers II–IV (9 armas) | M4 | 30 | — | 4.875 |
| M4 ícones (~55) | M4 | 55 | — | 4.820 |
| M4 refações do QA (teto) | M4 | 300 | — | 4.520 |
| M4 VFX Jack | M4 | 50 | — | 4.470 |
| M4 SFX loja/elementos + música da loja | M4 | — | ~420 | — |
| M7 tilesets biomas 2–3 + props | M7 | 180 | — | (ciclo de fev/mar) |
| M7 tiers restantes + ícones | M7 | 95 | — | |
| M7 kraken/abominação/voadores/ataques | M7 | 185 | — | |
| M7 VFX Bob/Lucia | M7 | 100 | — | |
| M7 músicas biomas + SFX restantes | M7 | — | ~1.200 | |
| M7 key art + capsules Steam | M7 | 400 | — | |
| **Total planejado** | | **~1.490** | **~1.620** | cabe em um único ciclo mensal; folga > 3.000 gerações e > 50.000 créditos |

Regras: `GET /balance` antes de cada lote; piloto; registrar saldo em `docs/visual.md` §10 e `docs/audio.md` §7; 🛑 qualquer lote > 200 gerações ou > 2.000 créditos fora desta tabela.

## 14. Riscos

| # | Risco | Prob. | Impacto | Mitigação | Gatilho de corte |
|---|---|---|---|---|---|
| R1 | Prazo: M1–M5 em 13 semanas com ~20 h/semana | alta | alto | ordem estrita dos marcos; demo = recorte do completo (B-30) | se M3 não fechar até 2027-01-10: adiar ES/ZH e Android, manter EN/PT-BR na demo |
| R2 | Delegação bloqueada pelo plugin `context-mode` no auto mode | certa hoje | médio | desativar o hook ou sair do auto mode; orquestrador implementa sozinho enquanto isso | — |
| R3 | Sem página da Steam em dezembro → poucas wishlists no Next Fest | média | alto | T15.1 até 15/12; demo web no site antes do fest; devlogs | se a página sair só em janeiro, reforçar livestreams |
| R4 | WebView Android fraco em aparelhos médios | média | médio | `tier` baixo (SDD-007 RF-05); medir cedo em M8 | se < 45 FPS: cortar luzes e decalques no mobile |
| R5 | PixelLab muda preço/limite ou API | baixa | médio | pipeline por scripts; saldo registrado por lote | — |
| R6 | Balance 1.0 não fecha em 3 passadas | média | médio | metas com tolerância; exceções documentadas | lançar com exceções registradas e patch em 2 semanas |
| R7 | Classificação 16+ limita Android | alta | baixo | aceito (B-20) | — |
| R8 | Reescrita de UI em React introduz regressões de input (gamepad/toque) | média | médio | gerenciador de foco com testes; E2E por fluxo | — |

## 15. Pendências do desenvolvedor

| # | Pendência | Prazo | Bloqueia |
|---|---|---|---|
| T15.1 | Criar conta Steamworks (US$ 100), app do jogo e app da demo; App IDs no repo (`steam_appid.txt` gitignored) | 2026-12-15 | T3.11, T5.4, T5.8, T5.9, T7.7 |
| T15.2 | Inscrever no Next Fest fev/2027 | 2027-01-10 | M6 |
| T15.3 | Aprovar prancha de QA (T4.1), lojista (T4.4), capsules (T7.9) | por lote | M4, M7 |
| T15.4 | Confirmar versões exatas de React/Tailwind/Electron/Capacitor/Astro no dia da instalação | M3/M5 | T3.1, T5.4, T5.6 |
| T15.5 | Conta Google Play Console (US$ 25) + IARC | 2027-01-31 | M8 |
| T15.6 | DNS do site (CNAME) | após T5.7 | só domínio |
| T15.7 | Trailer (captura) | M9 | T9.3 |
| T15.8 | Girar o secret do PixelLab exibido em print em 2026-11-08 | imediato | segurança |
| T15.9 | Desativar o hook do plugin `context-mode` (ou sair do auto mode) para permitir subagentes | próxima sessão | R2 |
| T15.10 | Renovar PixelLab/ElevenLabs nos dias 14 de cada mês até abril | mensal | M4, M7 |

## 16. Como auditar um marco

1. Abrir a seção do marco e, para cada `[x]`, **rodar o assert** anotado na linha (comando, teste ou métrica); divergência → voltar a `[ ]` com comentário.
2. Conferir que a SDD da frente está em "Aprovada" e que a implementação não contradiz nenhum RF (grep pelos nomes de arquivos/funções citados).
3. `bun run lint && bun run typecheck && bun test && bun run build` verdes no commit do release do marco.
4. `gh release view vX.Y.Z`: título igual à tag, corpo com grupos Keep a Changelog e links de commit válidos; `0.x` como pre-release.
5. `CHANGELOG.md`: seção da versão com data; `[Unreleased]` vazio após o release.
6. Documentos afetados atualizados no mesmo marco (gdd/visual/audio/architecture/balancing Parte B); nenhuma referência a arquivos removidos (`rg -n "game-design\.md|ui-hud\.md|balancing\.md\b" docs` vazio, exceto notas históricas).
7. Saldos de PixelLab/ElevenLabs registrados se o marco gastou assets.
8. Registrar a auditoria em `docs/reports/audit-<marco>-<data>.md` (tabela tarefa · status · evidência).
