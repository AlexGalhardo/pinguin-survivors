# AGENTS.md — Pinguin Survivors

Instruções para qualquer agente de código (Claude Code, Codex, Cursor, Gemini, Copilot, etc.). Regras detalhadas em [`.agents/rules/`](.agents/rules/README.md); skills em [`.agents/skills/`](.agents/skills/THIRD_PARTY.md). Nenhuma ferramenta carrega essas pastas sozinha: **leia os arquivos pelo caminho** conforme a tarefa.

**Projeto:** arena survivor roguelite **top-down 2D em pixel art**, estilo Brotato, para **Steam (Windows, Electron)** e **Google Play (Android, Capacitor)** com demo web em `/demo`. Jack (melee), Bob (fogo) e Lucia (magia): rounds cronometrados → loja no fim do round → próximo round; 6 slots de arma automáticos que atacam o alvo (raridade I–V com afixos, ADR-017); cartas de stat no level-up; boss a cada 10; Danger 0–5; endless; level 1–100 persistente com **árvore de habilidades por herói** (ADR-019; substituiu a Oficina e os pontos de stat); loja e pausa estilo Diablo 4 (ADR-018); gore estilo DOOM com toggle. Versão atual: **0.3.0** (Latest); 0.4.0 em preparação.
**Stack:** TypeScript · Vite 8 · Phaser 4.2.x (só o mundo, sem física de engine) · React 19 + Tailwind CSS v4 (toda a UI) · **Bun 1.4.x** (`bun:test`) · Electron · Capacitor · Astro 7.4 (site estático). Arte **PixelLab API v2**, áudio **ElevenLabs** (SFX e música; sem vozes). UI em EN, PT-BR, ES, ZH-CN; docs em PT-BR.
**Marco:** demo no Steam Next Fest de 22/02 a 01/03/2027 (inscrição até 10/01/2027); 1.0 depois.
**Legado:** branches `legacy-voices` (iso + vozes) e `starfall-survivors-legacy` (jogo anterior). `PLAN.md` é histórico e não está versionado.

## Fonte da verdade

- **[ROADMAP.md](ROADMAP.md)**: marcos datados e tarefas com responsável, DoD, assert e auditoria (checkbox próprio). Leia primeiro, sempre.
- **[docs/README.md](docs/README.md)**: índice da documentação.

| Preciso de… | Leia |
|---|---|
| Como trabalhar numa sessão, papéis, git, releases, gates, ferramentas | [docs/workflow.md](docs/workflow.md) |
| Regras do jogo, heróis, armas, loja, cartas, economia, danger, UI, demo | [docs/gdd.md](docs/gdd.md) |
| Fórmulas, números, metodologia de balanceamento e simulação | [docs/balancing-and-simulation.md](docs/balancing-and-simulation.md) |
| Camadas, arena, React sobre o canvas, pastas, builds, debug | [docs/architecture.md](docs/architecture.md) |
| Cores, tipografia, componentes e telas da UI (Estilo D, Diablo 4 orgânico) | [docs/design-system.md](docs/design-system.md) · [docs/wireframes/](docs/wireframes/README.md) · [`.agents/skills/pinguin-ui-hud`](.agents/skills/pinguin-ui-hud/SKILL.md) |
| Arte, pipeline PixelLab, chaves, orçamento, registro de produção | [docs/visual.md](docs/visual.md) · [`.agents/skills/pinguin-art-assets`](.agents/skills/pinguin-art-assets/SKILL.md) |
| Som e pipeline ElevenLabs | [docs/audio.md](docs/audio.md) · [`.agents/skills/pinguin-audio-assets`](.agents/skills/pinguin-audio-assets/SKILL.md) |
| Especificação de uma frente antes de codar | [docs/sdds/](docs/sdds/README.md) |
| Por que algo foi decidido | [docs/adrs/](docs/adrs/README.md) · [docs/brainstorming.md](docs/brainstorming.md) |
| Mercado, concorrentes, Next Fest, monetização | [docs/web-research.md](docs/web-research.md) |
| Site comercial | [docs/site.md](docs/site.md) |

## Regras

Leia sempre [`.agents/rules/agents-workflow.md`](.agents/rules/agents-workflow.md). Depois, conforme a tarefa:

| Tarefa | Regra |
|---|---|
| Commitar, versionar, publicar release | [commits.md](.agents/rules/commits.md) · [changelog.md](.agents/rules/changelog.md) |
| Escrever código | [typescript.md](.agents/rules/typescript.md) · [testing.md](.agents/rules/testing.md) |
| Mundo do jogo (`src/world`, `entities`, `systems`, `scenes`) | [phaser4.md](.agents/rules/phaser4.md) |
| UI (`src/ui`) | [react-ui.md](.agents/rules/react-ui.md) |
| Números, textos, cores, chaves de assets | [game-data-and-i18n.md](.agents/rules/game-data-and-i18n.md) |
| Arte ou áudio | [assets.md](.agents/rules/assets.md) |
| Qualquer número de gameplay | [balance.md](.agents/rules/balance.md) |
| `.env`, tokens, prints, logs | [secrets.md](.agents/rules/secrets.md) |
| Documentação | [markdown-docs.md](.agents/rules/markdown-docs.md) |

Resumo das regras inegociáveis:

1. Tarefas na ordem do ROADMAP; `[x]` só com o assert executado e a evidência anotada; auditoria é checkbox separado.
2. Nenhuma implementação sem SDD aprovada; spec mudou → edite a SDD primeiro; decisão arquitetural → ADR novo.
3. Phaser **4** só no mundo; toda UI em React; sem Arcade Physics; câmera top-down e arena quadrada (ADR-003).
4. Lógica pura em `src/logic/` (testada); números em `src/data/`; textos em `src/i18n/` (4 idiomas juntos); cores em `src/config/palette.ts`; chaves de assets em `src/art/manifest.ts`.
5. Arte: reaproveitar sprites e **nunca apagar nem substituir arte existente** (variantes em `art-src/pixellab/anim-v2/`; animação nova `fly`/`attack` entra como extra no mesmo atlas, sem tocar o `walk`); personagem novo = concept 4 direções → **aprovação do desenvolvedor** → animação; armas com 4 linhas de arte (`t1…t4`, raridade I–IV; a V reaproveita a IV); API v2 com o token do `.env`. Áudio sem vozes.
6. Tela cheia sem scroll (menus paginam listas longas), zoom inteiro pela altura 540 no canvas; pooling; 60 FPS com 300 inimigos. UI nova segue o [design system](docs/design-system.md) v2 no Estilo D, Diablo 4 orgânico (ADR-022, skill `pinguin-ui-hud`): texto secundário ≥ 22 px, padding 12–16 px, nada de cards/botões com cara de web; menus (exceto o inicial) com fundo neutro.
7. Segredos só no `.env`; dependências estáveis e fixas; nenhuma fora do que a SDD lista.
8. **Micro-commits** (um por mudança lógica, com o teste; nunca um super commit que junta frentes) + Conventional Commits + SemVer padrão vukem (`0.0.x` → `0.1.x` → `1.0.0`); gates manuais; nunca `--no-verify`; push após cada commit; release por `bun scripts/release.ts X.Y.Z`, cujo corpo cita cada micro-commit como num merge rebase (`--stable` a partir da 0.2.0, que sai como Latest; o CI anexa os zips do Windows e o APK debug); uma release por marco; exatamente uma tag por release. Save sem compatibilidade retroativa antes da 1.0.
9. Gates do desenvolvedor (🛑): concepts de arte, gasto > 200 gerações ou > 2.000 créditos, apagar/retaguear tags, publicar em loja, mudar escopo.

## Skills

`.agents/skills/`: 26 skills Phaser 4 oficiais, `pinguin-art-assets`, `pinguin-audio-assets`, `pinguin-ui-hud`, `agent-browser` (QA no browser), `graphify`, `grilling`, e 26 skills de gamedev de terceiros (`gd-*`, `gc-*`, `ccgs-*`; tabela "quando usar" em [docs/workflow.md](docs/workflow.md) §8; origem e remoções em [`.agents/skills/THIRD_PARTY.md`](.agents/skills/THIRD_PARTY.md)). As regras deste projeto vencem em conflito.

## Comandos

Testes, E2E, sims, perf e bot rodam **sem som**: dev server com `SOUND_MUTED=true bun run dev` e browsers com `--mute-audio` (já nos scripts). `bun install` · `bun run dev` · `bun run build` · `bun test` · `bun run typecheck` · `bun run lint` (Biome) · `bun run lint:md` · `bun run e2e` · `bun scripts/qa-browsers.ts` · `bun scripts/perf.ts` · `bun scripts/sim.ts` · `bun scripts/playtest-bot.ts` · `bun scripts/release.ts X.Y.Z`. Use Bun, não npm/node. Scripts previstos nas SDDs e ainda não criados estão marcados no ROADMAP.

## Agentes

Orquestrador (sessão principal) planeja, delega, **revisa todo diff**, corrige e faz push/release. `senior` (Sonnet) implementa; `estagiario` (Haiku) faz i18n, testes, relatórios e pesquisa. Até 3 em paralelo, sem worktrees. Relatório de agente é alegação: confira antes de marcar `[x]`.
