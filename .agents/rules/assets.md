# Arte (PixelLab) e áudio (ElevenLabs)

- Siga as skills `.agents/skills/pinguin-art-assets/SKILL.md` e `.agents/skills/pinguin-audio-assets/SKILL.md`; direção e contratos em `docs/visual.md` e `docs/audio.md`; pendências e orçamento em `docs/sdds/SDD-012-arte-topdown-e-vfx.md` e `ROADMAP.md` §13.
- **Reaproveitar primeiro** (ADR-004): heróis e inimigos existentes (vista `low top-down`) ficam; regenerar só o que o QA visual aprovado pelo desenvolvedor marcar.
- **Nunca apague nem substitua arte existente** (regra permanente do desenvolvedor): refações e alternativas vão para `art-src/pixellab/anim-v2/` sem ligação ao jogo; animação nova (`fly` dos voadores, `attack` de ranged, charger e chefes) entra como animação adicional no mesmo atlas `enemy.<id>`, sem alterar os frames `walk`. Personagens legados (criados por outro token) não podem ser reanimados pela API (404): gere com `/animate-with-text-v3` a partir da rotação existente (`scripts/pl-fly.ts`). Antes de fechar um lote: `git status --short | grep '^ D'` vazio e `bun scripts/pack-atlas.ts --check`.
- **Personagem novo**: concept em 4 direções (S, E, N gerados; W espelhado) → 🛑 aprovação do desenvolvedor → animação template (8 frames heróis, 6 inimigos). Nunca animar sem aprovação.
- Armas são sprites separados em 4 linhas de arte (`weapon.<id>.t1…t4`, usadas pela raridade I–IV; a V reaproveita a IV, ADR-017), animadas por código (`src/logic/weapon-anim.ts`); heróis sem arma nos frames.
- Chão: tileset top-down 64×64 por bioma + bordas; props `high top-down`.
- PixelLab pela **API v2** com `PIXELLAB_API_TOKEN` do `.env` (`scripts/lib/pixellab.ts`). O MCP `pixellab` do usuário está com token expirado: não dependa dele. `GET /balance` antes de cada lote; piloto de 1 direção/1 tile; lotes > 200 gerações só com aviso ao desenvolvedor. Registre o saldo após o lote em `docs/visual.md` §10 e o lote em §13.
- ElevenLabs: só **SFX e música** (sem vozes, ADR-009). Nunca cite jogos, bandas ou artistas nos prompts de música. Registre em `art-src/elevenlabs/log.jsonl` e em `docs/audio.md`.
- Assets são proprietários (`LICENSE.md`): nenhuma arte ou áudio de terceiros entra no repositório.
