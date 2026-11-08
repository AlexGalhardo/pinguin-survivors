# AGENTS.md — Pinguin Survivors

Instruções para qualquer agente de código (Claude Code, Codex, Cursor, Gemini, etc.).

**Projeto:** arena survivor roguelite **top-down 2D em pixel art**, estilo Brotato, para **Steam (Windows, Electron)** e **Google Play (Android, Capacitor)** com demo web em `/demo`. Jack (melee), Bob (fogo) e Lucia (magia): rounds cronometrados → loja no fim do round → próximo round; 6 slots de arma automáticos; cartas de stat no level-up; boss a cada 10; Danger 0–5; endless; level 1–100 persistente; gore estilo DOOM com toggle.
**Stack:** TypeScript · Vite 8 · Phaser 4.2.x (só o mundo, sem física de engine) · React 19 + Tailwind CSS v4 (toda a UI) · **Bun 1.4.x** (`bun:test`) · Electron · Capacitor · Astro 7.4 (site estático). Arte **PixelLab API v2**, áudio **ElevenLabs** (SFX e música; sem vozes). UI em EN, PT-BR, ES, ZH-CN; docs em PT-BR.
**Marco:** demo no Steam Next Fest de 22/02 a 01/03/2027; 1.0 depois.
**Legado:** `legacy-voices` (iso + vozes) e `starfall-survivors-legacy` (jogo anterior).

## Fonte da verdade

- **[ROADMAP.md](ROADMAP.md)**: marcos e tarefas com responsável, DoD, assert e auditoria. Leia primeiro, sempre. (`PLAN.md` é histórico.)
- **[docs/README.md](docs/README.md)**: índice da documentação.

| Preciso de… | Leia |
|---|---|
| Como trabalhar numa sessão, papéis, git, releases, gates, ferramentas | [docs/workflow.md](docs/workflow.md) |
| Regras do jogo, heróis, armas, loja, cartas, economia, danger, UI, demo | [docs/gdd.md](docs/gdd.md) |
| Fórmulas, números, metodologia de balanceamento e simulação | [docs/balancing-and-simulation.md](docs/balancing-and-simulation.md) |
| Camadas, arena, React sobre o canvas, pastas, builds, debug | [docs/architecture.md](docs/architecture.md) |
| Arte, pipeline PixelLab, chaves, orçamento, registro de produção | [docs/visual.md](docs/visual.md) · skill `.claude/skills/pinguin-art-assets` |
| Som e pipeline ElevenLabs | [docs/audio.md](docs/audio.md) · skill `.claude/skills/pinguin-audio-assets` |
| Especificação de uma frente antes de codar | [docs/sdds/](docs/sdds/README.md) |
| Por que algo foi decidido | [docs/adrs/](docs/adrs/README.md) · [docs/brainstorming.md](docs/brainstorming.md) |
| Mercado, concorrentes, Next Fest, monetização | [docs/web-research.md](docs/web-research.md) |
| Site comercial | [docs/site.md](docs/site.md) |

## Comandos

`bun install` · `bun run dev` · `bun run build` · `bun test` · `bun run typecheck` · `bun run check` (Biome) · `bun run e2e` · `bun scripts/qa-browsers.ts` · `bun scripts/perf.ts` · `bun scripts/sim.ts` · `bun scripts/playtest-bot.ts`. Use Bun, não npm/node. Scripts previstos nas SDDs e ainda não criados estão marcados no ROADMAP.

## Regras

1. Tarefas na ordem do ROADMAP.md. Ao concluir: rodar o assert, anotar a evidência na linha, `[x]`; `[Unreleased]` do CHANGELOG.md se relevante. Bloqueado: `[~]` + motivo.
2. Nenhuma implementação sem a SDD aprovada; spec mudou → edite a SDD primeiro; decisão arquitetural → ADR novo.
3. Phaser **4** (API diferente do v3). Skills de referência em `.claude/skills/`. Phaser só no mundo; UI em React (`src/ui/`).
4. Mundo em coordenadas cartesianas, câmera top-down, arena quadrada crescente (ADR-003). Sem Arcade Physics, sem iso.
5. Regras em `src/logic/` (TS puro, testado); números em `src/data/`; textos em `src/i18n/` (4 idiomas juntos); cores em `src/config/palette.ts`; chaves de assets em `src/art/manifest.ts`.
6. Arte: reaproveitar sprites existentes; personagem novo = concept 4 direções → **aprovação do desenvolvedor** → animação template (8 frames heróis, 6 inimigos). Armas = sprites separados em 4 tiers. API v2 com o token do `.env`; `GET /balance` antes de lotes. Áudio sem vozes.
7. Tela cheia sem scroll, zoom inteiro pela altura 540 no canvas. Pooling. Meta: 60 FPS com 300 inimigos.
8. Valide visualmente no browser (agent-browser) com os query params de debug.
9. Segredos só no `.env`. `TODO.md` e `STATUS.md` são locais e ignorados pelo git. Dependências estáveis e fixas; nenhuma fora do que a SDD lista.
10. Conventional Commits 1.0.0 + SemVer padrão vukem (`0.0.x` → `0.1.x` → `1.0.0`, sem sufixos); gates manuais (hooks Husky vazios por escolha do desenvolvedor); nunca `--no-verify`; push após cada commit; release por `bun scripts/release.ts`.
11. `CHANGELOG.md` no padrão Keep a Changelog 1.1.0 (seção `[Unreleased]` durante o trabalho).
12. Skills de gamedev de terceiros (`gd-*`, `gc-*`, `ccgs-*`): use quando a tarefa bater (tabela em `docs/workflow.md` §8); as regras deste projeto vencem em conflito. Relatórios das `ccgs-*` vão para `docs/reports/`.
13. Gates de aprovação do desenvolvedor: concepts de arte, gasto > 200 gerações PixelLab ou > 2.000 créditos ElevenLabs, retag/apagar tags, publicar em loja, mudar escopo.
