# Workflow — sessões de agentes, git, versionamento e ferramentas

> **Versão** 2.1 · **Data** 2026-11-08 · Substitui `agent-workflow.md`, `git-and-versioning.md` e `tooling.md`. Plano de trabalho: [../ROADMAP.md](../ROADMAP.md) (o `PLAN.md` é histórico). Decisões: [adrs/](adrs/README.md).

## Índice

1. [Protocolo de sessão](#1-protocolo-de-sessão)
2. [Papéis dos agentes](#2-papéis-dos-agentes)
3. [Convenções de código](#3-convenções-de-código)
4. [Definição de pronto](#4-definição-de-pronto)
5. [Git e Conventional Commits](#5-git-e-conventional-commits)
6. [Versionamento e releases (padrão vukem)](#6-versionamento-e-releases-padrão-vukem)
7. [Gates](#7-gates)
8. [Ferramentas, skills e APIs](#8-ferramentas-skills-e-apis)
9. [Comandos](#9-comandos)

## 1. Protocolo de sessão

1. Ler `CLAUDE.md` → **`ROADMAP.md`** (marco atual e próxima tarefa `[ ]`) → a SDD da frente → os docs citados por ela ([gdd.md](gdd.md), [visual.md](visual.md), [audio.md](audio.md), [architecture.md](architecture.md), [balancing-and-simulation.md](balancing-and-simulation.md)).
2. Pegar **uma** tarefa do ROADMAP (ou um grupo coeso) na ordem do marco. Não pular marcos sem pedido do desenvolvedor.
3. Implementar seguindo a SDD; se a spec precisar mudar, **editar a SDD primeiro** e registrar a decisão (ADR novo se for arquitetural).
4. **Verificar** com o assert da tarefa (comando/teste/métrica do ROADMAP) e os gates (§7). Mudança visível → `bun run dev` + agent-browser com os query params de debug.
5. Atualizar o **ROADMAP.md**: `[x]` feito com a evidência (comando + resultado em uma linha) · `[~]` bloqueado com o motivo · `[ ]` pendente.
6. `CHANGELOG.md` `[Unreleased]` para mudanças relevantes (Keep a Changelog 1.1.0). Números → `balancing-and-simulation.md` Parte B. Arte → `visual.md` §11. Áudio → `audio.md`.
7. Micro-commits em Conventional Commits; **push após cada commit** (depois dos gates). Release ao fechar um marco (§6).
8. Gates de aprovação do desenvolvedor (🛑 no ROADMAP): concepts de arte, gasto de créditos > 200 gerações ou > 2.000 créditos ElevenLabs, retag/apagar tags, publicação em loja, mudança de escopo.

## 2. Papéis dos agentes

| Papel | Modelo | Faz |
|---|---|---|
| **Orquestrador** (sessão principal) | o escolhido no início da sessão (Fable/Opus) | planeja, escreve o briefing (objetivo, arquivos, critério de aceite, o que já foi descartado), revisa **todo** diff que volta, roda a validação, corrige os últimos bugs, faz push/release |
| **Sênior** (`senior`) | Sonnet | implementações técnicas: features, refatorações, migrations, testes |
| **Estagiário** (`estagiario`) | Haiku | i18n, rodar testes/lint/build e reportar, relatórios de balanceamento, pesquisas web, reproduzir bugs |

Relatório de agente é alegação, não evidência: conferir diff, testes e CI antes de marcar `[x]`. Até 3 subagentes em paralelo, sem worktrees (B-31). Com o plugin `context-mode` ativo, chamadas `Agent` são bloqueadas pelo auto mode; desative o hook ou saia do auto mode para delegar.

## 3. Convenções de código

- **Bun** (`bun add`, `bun run`, `bunx`); node/npm só se uma ferramenta exigir (registrar).
- TypeScript strict; sem `any` (use `unknown` + narrowing); tipos de retorno explícitos em funções exportadas.
- **Biome v2** (TAB largura 4, LF, UTF-8); sem ESLint/Prettier. YAML usa espaços.
- Nomes em inglês; `PascalCase.ts` para classes/cenas/componentes, `kebab-case.ts` para módulos.
- Lógica pura em `src/logic/` (sem Phaser e sem React), testada com `bun:test`; números só em `src/data/`; textos só em `src/i18n/` (4 idiomas juntos); cores só em `src/config/palette.ts`; chaves de assets só em `src/art/manifest.ts`.
- UI em React + Tailwind v4 (`src/ui/`); Phaser só no mundo (`src/world`, `src/entities`, `src/systems`, `src/scenes/{Boot,Game,Hud}Scene`; menus, HUD e loja são React).
- Phaser **4** (API ≠ v3): confira as skills em `.agents/skills/` antes de copiar exemplos da web.
- Dependências: sempre a última versão **estável**, fixada (sem `^`); nunca `latest`/`next`/`beta`. Não adicionar dependência sem a SDD listar.
- Comentários só para o porquê, edge cases e workarounds (com motivo).

## 4. Definição de pronto

- Assert da tarefa do ROADMAP passa (comando/teste/métrica) e a evidência está na linha da tarefa.
- Lógica nova coberta por `bun:test`; componente React com lógica coberto por teste de componente.
- Funciona no Chrome em 1920×1080 sem scroll e sem erros de console; mudanças de UI conferidas também em 1280×720 e 844×390 (celular paisagem) e comparadas ao wireframe da tela (`docs/wireframes/`), com texto ≥ 22 px (18 px no celular), contraste AA e padding ≤ 20 px (checklist da skill `pinguin-ui-hud`).
- Textos nos 4 idiomas; chaves de assets no manifest; números espelhados na Parte B.
- CHANGELOG e docs afetados atualizados; gates verdes; commit em Conventional Commits; push feito.

## 5. Git e Conventional Commits

Remoto `origin` → `git@github.com:AlexGalhardo/pinguin-survivors.git`, branch principal **`main`**. Branches históricas: `legacy-voices` (iso + vozes, 2026-11-08), `starfall-survivors-legacy`, `pinguin-survivors-legacy`. Não commitar nelas.

Conventional Commits 1.0.0 (`commitlint.config.js`; hooks Husky vazios por escolha do desenvolvedor, valide com `echo "<msg>" | bunx commitlint`):

```
<type>(<scope>)<!>: <descrição em inglês, imperativo, minúscula, sem ponto, ≤ 72 chars>
```

Tipos: `feat` (MINOR), `fix` (PATCH), `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`; `!` ou `BREAKING CHANGE:` → MAJOR. Escopos: `arena`, `weapons`, `shop`, `cards`, `economy`, `danger`, `ui`, `hud`, `i18n`, `save`, `platform`, `desktop`, `mobile`, `site`, `art`, `audio`, `balance`, `sim`, `demo`, `release`, `docs`, `deps`. Um commit por mudança lógica; nada de "WIP".

**Micro-commits obrigatórios** (decisão do desenvolvedor, 2026-11-08): um commit por mudança lógica — uma feature, uma correção, um ajuste de dados, um lote de arte, um doc — com o teste dela no mesmo commit. **Nunca** um "super commit" que junta frentes diferentes (ex.: árvore + saves + loja + docs num commit só). Quando vários agentes entregam juntos, o orquestrador separa o working tree em commits por frente (`git add <arquivos>` ou `git add -p`), cada um com o código verde (typecheck e testes passando naquele ponto), e faz push após cada um. A release é o "merge rebase" desses commits: o corpo dela cita cada micro-commit (o `release.ts` gera uma linha por commit, com escopo, descrição e link), então o histórico precisa contar a história commit a commit.

## 6. Versionamento e releases (padrão vukem)

Referência: <https://github.com/AlexGalhardo/vukem/releases> (ADR-015).

- **SemVer sem pré-release**: `0.0.x` = alpha (refatoração top-down até a demo jogável), `0.1.x` = beta (demo pública, Next Fest, polimento), **`1.0.0`** = lançamento comercial; depois MAJOR (save incompatível ou remoção de conteúdo), MINOR (conteúdo/feature), PATCH (correções e balanceamento).
- `package.json.version` = tag sem `v`. Versão atual: **0.10.1** publicada (Latest).
- **Release como merge rebase**: o corpo da release lista **cada micro-commit** desde a tag anterior (uma linha por commit, agrupada por tipo), como se a branch tivesse sido integrada com rebase. Um super commit apaga essa história e é proibido.
- **Release GitHub** por tag: título `vX.Y.Z`; corpo em grupos Keep a Changelog (`### Added`, `### Changed`, `### Deprecated`, `### Removed`, `### Fixed`, `### Security`, só os não vazios), linhas `- **escopo:** Descrição ([abc1234](…/commit/sha))`; `0.x` marcados **pre-release**.
- **Fluxo ao fechar um marco**: micro-commits → `docs(roadmap): close <marco>` → `bun scripts/release.ts X.Y.Z` (gates, bump, CHANGELOG, commit `chore(release): X.Y.Z`, tag anotada, `git push --follow-tags`, `gh release create`). Detalhes em [sdds/SDD-011](sdds/SDD-011-releases-vukem.md).
- **Uma release por marco** (decisão do desenvolvedor, 2026-11-08): o marco inteiro vai numa release só (M1 → `0.0.12`, M2 → `0.0.13`). Nunca uma release por tarefa.
- **Latest**: releases `0.x` saem como pre-release. A partir da `0.2.0` o release sai com `--stable` (`bun scripts/release.ts 0.2.0 --stable`), e o GitHub marca como Latest.
- **Cada release leva os assets** de Windows e Android:
  1. `bun run build:desktop` e `bun run build:desktop:demo` geram `apps/desktop/dist/full/win-unpacked/` e `apps/desktop/dist/demo/win-unpacked/`.
  2. Zipar cada pasta `win-unpacked` (completo e demo), com o número da versão no nome.
  3. Android: `cd apps/mobile && bun run sync` e depois `cd android && ./gradlew assembleDebug`, que gera o APK debug.
  4. Anexar ao release existente: `gh release upload vX.Y.Z <zips> <apk>`, sem `--clobber` (ele substitui assets de mesmo nome).
  Esse é o processo manual, usado como fallback. A automação pelo workflow `release-assets.yml` (abaixo) faz os mesmos passos.
- **Assets do release** (SDD-011 RF-07): publicar o release dispara `release-assets.yml`, que anexa os zips do Windows (completo e demo) e o APK debug do Android. Para uma tag existente: `gh workflow run release-assets.yml -f tag=vX.Y.Z` (atenção: `--clobber` substitui assets de mesmo nome). Releases criados com o `GITHUB_TOKEN` de um workflow não disparam outros workflows; `bun scripts/release.ts` usa o seu login do `gh`, então dispara.
- `CHANGELOG.md` (Keep a Changelog 1.1.0): `[Unreleased]` no topo; seções `## [X.Y.Z] - AAAA-MM-DD`; frases para humanos em inglês; links de comparação no fim.
- Histórico: tags `v0.1.0-alpha.1…v0.1.0-beta.8` retagueadas como `v0.0.1…v0.0.10` (tabela no CHANGELOG); as tags do Starfall foram apagadas. Regra: **uma tag por release**, nada mais.

## 7. Gates

| Momento | Comandos |
|---|---|
| Antes de commitar | `bun run lint` → `bun run typecheck` → `bun test` |
| Antes de pushar | `bun run lint` → `bun run typecheck` → `bun test` → `bun run build` |
| Antes de release | tudo acima + `bun run e2e` e `bun run e2e -- --demo` + `bun scripts/qa-browsers.ts` (com `bun run dev` na porta 5173; o build de produção não expõe `window.__GAME__`, que o script usa) + `bun scripts/perf.ts --round 40` (≥ 58 FPS) + `bun scripts/pack-atlas.ts --check` se a arte mudou |
| Site (`site/`) | `cd site && bun run build` + Lighthouse ≥ 95 |

Nunca `--no-verify`. Gate falhou → corrigir a causa.

**Testes, E2E, sim, perf e bot rodam sem som** (`SOUND_MUTED=true bun run dev`; navegadores com `--mute-audio`, já nos scripts). `bun test tests/ui` roda isolado quando a suíte inteira mistura ambientes. `bun run e2e -- --demo` sobe o próprio servidor com `VITE_DEMO=1` (porta 5199).

**Arte (regra permanente do desenvolvedor)**: nunca apague nem substitua frames ou atlas de heróis e inimigos existentes. Variantes e refações ficam em `art-src/pixellab/anim-v2/` sem ligação ao jogo; animação nova (`fly`, `attack`) entra como animação adicional no mesmo atlas `enemy.<id>`, e `bun scripts/pack-heroes.ts` só reempacota quando os frames antigos continuam idênticos (confira antes de commitar; `git status --short | grep '^ D'` deve ficar vazio). Detalhes em [visual.md](visual.md) e na skill `pinguin-art-assets`.

## 8. Ferramentas, skills e APIs

- **Skills do projeto** (`.agents/skills/`, provider-agnostic; regras em `.agents/rules/`): `pinguin-art-assets` (PixelLab), `pinguin-audio-assets` (ElevenLabs), `pinguin-ui-hud` (menus e HUD no Estilo D: design system v2, wireframes, checklist de revisão), 26 skills Phaser 4 oficiais, `agent-browser` (QA), `graphify`, `grilling`, e 26 skills de gamedev de terceiros auditadas em 2026-11-08 (`gd-*`, `gc-*`, `ccgs-*`; origem e remoções em `.agents/skills/THIRD_PARTY.md`; em conflito, este projeto vence). Tabela "quando usar": juice → `gd-game-feel`; IA → `gd-game-ai`; RPG/save → `gd-rpg`, `gd-roguelike`, `gd-save-systems`; procedural/props → `gd-procedural-gen`; menus/HUD deste jogo → `pinguin-ui-hud` (antes de tudo); câmera/input/UI genérica → `gd-camera-systems`, `gd-input-systems`, `gd-game-ui-ux`; perf → `gd-performance-optimization`, `ccgs-perf-profile`; shaders/luz → `gd-shader-programming`; áudio → `gd-audio-design`; arte → `gd-create-game-assets`; design → `gc-game-designer`; review → `gc-review-game`; balance → `ccgs-balance-check`; QA/bugs → `gc-game-qa`, `ccgs-qa-plan`, `ccgs-bug-report`, `ccgs-playtest-report`; escopo → `ccgs-scope-check`; i18n → `ccgs-localize`; release → `ccgs-release-checklist`, `ccgs-launch-checklist`, `gd-steam-publish`; Phaser 4 extra → `gd-phaser-core`. Relatórios das `ccgs-*` vão para `docs/reports/`.
- **PixelLab**: API v2 (`scripts/lib/pixellab.ts`, `PIXELLAB_API_TOKEN` no `.env`), plano Tier 2 (5.000 gerações/mês, renova dia 14). O MCP `pixellab` do usuário usa um token expirado: não usar. `GET /balance` antes de lotes.
- **ElevenLabs**: `ELEVENLABS_API_KEY` no `.env`; plano Creator (renova dia 14). Scripts `scripts/el-*.ts`.
- **GitHub**: `gh` CLI para releases e Actions. **Steamworks** e **Google Play Console**: contas pendentes do desenvolvedor.
- Segredos só no `.env`; `TODO.md` e `STATUS.md` são locais (gitignored). Nunca colar chaves em docs ou prints.

## 9. Comandos

```
bun install                      # dependências do jogo
bun run dev                      # Vite dev
bun run build                    # tsc --noEmit + vite build (dist/)
bun run build:demo               # VITE_DEMO=1, base /demo/ (dist-demo/)
bun run build:desktop            # Electron completo (apps/desktop/dist/full/)
bun run build:desktop:demo       # Electron demo (apps/desktop/dist/demo/)
bun run lint:i18n · bun scripts/i18n-check.ts   # textos JSX literais e paridade dos idiomas
bun test · bun run typecheck · bun run lint (Biome) · bun run lint:fix
bun run e2e                      # Playwright (com bun run dev)
bun scripts/qa-browsers.ts       # Chrome/Edge/Firefox (com bun run dev; o build de produção não expõe __GAME__)
bun scripts/perf.ts --round 40   # orçamento de performance
bun scripts/sim.ts 20            # simulação headless
bun scripts/playtest-bot.ts …    # bot no jogo real
bun scripts/balance-report.ts    # relatório de balanceamento
bun scripts/release.ts X.Y.Z     # release padrão vukem
bun scripts/build-site.ts        # demo + Astro → site/dist
bun scripts/pl-*.ts · bun scripts/el-*.ts · bun scripts/pack-*.ts   # arte e áudio
```
