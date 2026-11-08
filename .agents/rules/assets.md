# Arte (PixelLab) e áudio (ElevenLabs)

- Siga as skills `.agents/skills/pinguin-art-assets/SKILL.md` e `.agents/skills/pinguin-audio-assets/SKILL.md`; direção e contratos em `docs/visual.md` e `docs/audio.md`; pendências e orçamento em `docs/sdds/SDD-012-arte-topdown-e-vfx.md` e `ROADMAP.md` §13.
- **Reaproveitar primeiro** (ADR-004): heróis e inimigos existentes (vista `low top-down`) ficam; regenerar só o que o QA visual aprovado pelo desenvolvedor marcar.
- **Personagem novo**: concept em 4 direções (S, E, N gerados; W espelhado) → 🛑 aprovação do desenvolvedor → animação template (8 frames heróis, 6 inimigos). Nunca animar sem aprovação.
- Armas são sprites separados em **4 tiers**, animadas por código; heróis sem arma nos frames.
- Chão: tileset top-down 64×64 por bioma + bordas; props `high top-down`.
- PixelLab pela **API v2** com `PIXELLAB_API_TOKEN` do `.env` (`scripts/lib/pixellab.ts`). O MCP `pixellab` do usuário está com token expirado: não dependa dele. `GET /balance` antes de cada lote; piloto de 1 direção/1 tile; lotes > 200 gerações só com aviso ao desenvolvedor. Registre o saldo após o lote em `docs/visual.md` §10 e o lote em §13.
- ElevenLabs: só **SFX e música** (sem vozes, ADR-009). Nunca cite jogos, bandas ou artistas nos prompts de música. Registre em `art-src/elevenlabs/log.jsonl` e em `docs/audio.md`.
- Assets são proprietários (`LICENSE.md`): nenhuma arte ou áudio de terceiros entra no repositório.
