# Pinguin Survivors — CLAUDE.md

Arena survivor roguelite **top-down 2D em pixel art**, estilo Brotato, vendido na **Steam (US$ 4,99, Windows via Electron)** e no **Google Play (Android premium, Capacitor)**, com demo web em `/demo`. Três pinguins sobreviventes de um apocalipse zumbi: Jack (melee), Bob (fogo), Lucia (magia). Rounds cronometrados, **loja no fim de cada round**, **6 slots de arma** automáticos, cartas de stat no level-up, boss a cada 10 rounds, Danger 0–5, endless, gore nível DOOM, level 1–100 persistente.
Stack: **TypeScript + Vite 8 + Phaser 4.2.x** (só o mundo; sem Arcade: simulação própria) + **React 19 + Tailwind CSS v4** (toda a UI) sobre **Bun 1.4.x** (`bun:test`). Arte **PixelLab API v2**, áudio **ElevenLabs** (sem vozes). UI em **EN, PT-BR, ES, ZH-CN**; docs em PT-BR. Site estático **Astro 7.4** em `site/` (GitHub Pages).
**Marco**: demo no **Steam Next Fest de 22/02 a 01/03/2027** (inscrição até 10/01/2027); 1.0 depois.
Histórico: `legacy-voices` (iso + vozes, 2026-11-08), `starfall-survivors-legacy` (jogo anterior). Não use nada de lá sem pedido.

## Comece aqui (toda sessão)

1. Leia **[ROADMAP.md](ROADMAP.md)**: marcos, tarefas `[ ]`/`[x]`/`[~]` com responsável, DoD, assert e auditoria. É a fonte da verdade do trabalho. (`PLAN.md` é histórico.)
2. Siga o protocolo em [docs/workflow.md](docs/workflow.md) (sessão, papéis, convenções, DoD, git, releases padrão vukem, gates).
3. Antes de codar, leia a **SDD** da frente em [docs/sdds/](docs/sdds/README.md) e os docs que ela cita:
   - Design → [docs/gdd.md](docs/gdd.md) · Números e balanceamento → [docs/balancing-and-simulation.md](docs/balancing-and-simulation.md)
   - Técnica → [docs/architecture.md](docs/architecture.md) · Arte → [docs/visual.md](docs/visual.md) · Som → [docs/audio.md](docs/audio.md)
   - Decisões → [docs/adrs/](docs/adrs/README.md) · Entrevista de 2026-11-08 → [docs/brainstorming.md](docs/brainstorming.md)
   - Mercado → [docs/web-research.md](docs/web-research.md) · Site → [docs/site.md](docs/site.md)

## Comandos

```
bun install · bun run dev · bun run build · bun test · bun run typecheck · bun run check (Biome; check:fix corrige)
bun run e2e                      # Playwright (com bun run dev)
bun scripts/qa-browsers.ts       # QA do build (com vite preview --port 4173)
bun scripts/perf.ts --round 40   # 300 inimigos + 2.000 decalques
bun scripts/sim.ts 20            # simulação headless · bun scripts/playtest-bot.ts … # bot no jogo real
bun scripts/pl-*.ts · el-*.ts · pack-*.ts   # arte e áudio (skills pinguin-art-assets / pinguin-audio-assets)
```

Scripts previstos pelas SDDs e ainda não criados: `build:demo`, `build-site.ts`, `release.ts`, `balance-report.ts` (ver ROADMAP).

## Regras essenciais

- **Phaser 4, não 3.** Use as skills Phaser em `.claude/skills/` antes de confiar em exemplos da web. Phaser só renderiza o mundo; **toda UI é React** (`src/ui/`).
- **Mundo cartesiano, câmera top-down** (`screenX = x`, `screenY = y`, depth `y`). Arena quadrada `min(10 + (N−1), 40)` tiles de 64 px. Nada de Arcade Physics; nada de iso.
- Lógica pura em `src/logic/` (sem Phaser e sem React) com teste `bun:test`. Números só em `src/data/` (espelhados em `docs/balancing-and-simulation.md` Parte B). Textos só em `src/i18n/` (**4 idiomas sempre juntos**). Cores em `src/config/palette.ts`. Toda textura/animação/som tem chave em `src/art/manifest.ts`.
- Tela cheia sem scroll, **zoom inteiro pela altura 540** no canvas; overlay React independente do zoom. Alvos: 1920×1080, 2560×1440, 2400×1080 (celular landscape).
- Object pooling para tudo que nasce em massa. Meta: 60 FPS com 300 inimigos + 2.000 decalques.
- **Arte**: reaproveitar os sprites existentes (`low top-down`); personagem novo = concept em 4 direções → **aprovação do desenvolvedor** → animação template (8 frames heróis, 6 inimigos). Armas são sprites separados em 4 tiers, animados por código. Chamadas via API v2 com o token do `.env` (o MCP `pixellab` do usuário está com token expirado). `GET /balance` antes de lotes; > 200 gerações só com aviso.
- **Áudio**: só SFX e música; **sem vozes** (ADR-009).
- Chaves (`PIXELLAB_API_TOKEN`, `ELEVENLABS_API_KEY`) **só no `.env`**; `TODO.md`/`STATUS.md` locais (gitignored). Nunca imprima ou commite chaves.
- Dependências: última versão **estável**, fixada; nunca `latest`/`beta`/`rc`. Nenhuma dependência nova fora do que a SDD lista.
- Verifique mudanças visíveis com **agent-browser** (`?skipMenu=1&hero=jack&round=5&seed=1&debug=1`).
- Ao terminar uma tarefa: assert do ROADMAP executado e evidência anotada na linha; `[Unreleased]` do CHANGELOG.md; decisão nova → ADR em `docs/adrs/`; spec mudou → edite a SDD primeiro.
- **Conventional Commits 1.0.0** e **SemVer padrão vukem** (`0.0.x` alpha → `0.1.x` beta → `1.0.0`; sem sufixos). Micro-commits; gates manuais (`check`, `typecheck`, `test`; `build` antes de push); **push após cada commit**; nunca `--no-verify`. Release = tag `vX.Y.Z` + GitHub Release com grupos Keep a Changelog (`bun scripts/release.ts`).
- Gates de aprovação do desenvolvedor (🛑): concepts de arte, gasto > 200 gerações ou > 2.000 créditos, retag/apagar tags, publicar em loja, mudar escopo.
- **Bun** no lugar de npm/node. **Biome v2**, TAB largura 4.

## Agentes

Orquestrador (esta sessão) planeja, delega, **revisa todo diff**, corrige e faz push/release. `senior` (Sonnet) implementa; `estagiario` (Haiku) faz i18n, testes, relatórios e pesquisa. Até 3 em paralelo, sem worktrees. Com o plugin `context-mode` ativo, chamadas `Agent` são recusadas pelo auto mode: desative o hook ou saia do auto mode para delegar. Relatório de agente é alegação: confira antes de marcar `[x]`.

## Skills úteis

Phaser 4 (28), `pinguin-art-assets`, `pinguin-audio-assets`, `agent-browser` (QA), `graphify`, `grilling`, `interview-me`, e 40 skills de gamedev de terceiros (`gd-*`, `gc-*`, `ccgs-*`): tabela "quando usar" em [docs/workflow.md](docs/workflow.md) §8. Em conflito, este CLAUDE.md vence (ex.: `gc-phaser` é Phaser 3).
