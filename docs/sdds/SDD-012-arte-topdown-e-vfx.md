# SDD-012 — Produção de arte top-down (tiles, props, lojista, tiers de arma, ícones, VFX)

**Versão** 1.1 · **Data** 2026-11-08 · **Status** Aprovada · **ADR** [004](../adrs/ADR-004-reaproveitar-arte-low-topdown.md) · **Art Bible** [../visual.md](../visual.md) · **Orçamento** [../../ROADMAP.md](../../ROADMAP.md) §Orçamento

## Requisitos

- RF-01 **QA visual primeiro**: prancha (`bun scripts/pack-sheet.ts`) dos 3 heróis e 19 inimigos na câmera top-down; lista do que refazer aprovada pelo desenvolvedor antes de qualquer geração de personagem.
- RF-02 **Tilesets top-down 64×64** por bioma: campanha Antártida, floresta (proposta) e cidade destruída (proposta, ADR-016); endless também usa estação de pesquisa e cidade em ruínas (legados, já gerados). 4–6 variantes de chão sem costura + borda com 4 lados e 4 cantos. `create_topdown_tileset` ou `create-tiles-pro` com `view: top-down`; validação de costura com `bun scripts/pack-sheet.ts --tile 3x3`.
- RF-03 **Props** `high top-down`, 4 por bioma, 32–64 px, transparentes.
- RF-04 **Lojista**: concept `create_character` 96 px, 1 direção (sul), prompt "old penguin merchant with a fish cart, patched coat, lantern" + sufixo de estilo; **aprovação**; `breathing-idle` template.
- RF-05 **Tiers de arma II–IV** para as 17 linhas (51 imagens pixflux, mesmo enquadramento do tier I; detalhe/brilho crescentes).
- RF-06 **Ícones 32×32** (pixflux): cartas de stat (~25), exclusivas (18), itens passivos (~30), poções (6), equipamentos restantes (~43), moedas (Fish, Pérolas), danger (6).
- RF-07 **VFX dos superpoderes** (3) via objeto animado (`create-1-direction-object` + animação, ≥ 12 frames, 128–192 px).
- RF-08 Pendências antigas: walks do kraken e da abominação (base limpa), voadores (skua, gaivota, pombo), ataques de inimigos à distância/charger e dos bosses.
- RF-09 **Key art Steam**: capsule header 920×430, capsule small 462×174, capsule main 616×353, library 600×900 e 1920×620, ícone 32/64 — composição a partir das key arts existentes (`generate-image-v2`/pixflux + edição) e retoques fora do PixelLab se preciso.
- RF-10 Todo lote: `GET /balance` antes, piloto, registro em `log.jsonl` e resumo em `visual.md` §11.
- RF-11 **Floresta e cidade destruída** (proposta, ADR-016): props `high top-down` e borda por bioma, mesmo critério do RF-03 (32–64 px, transparentes). Os nomes de chaves seguem `tile.<biome>.<n>` com ids `forest` e `city`.
- RF-12 **Concepts dos aliens** (proposta, ADR-016): 6 inimigos da cidade destruída e o boss Colosso Biomecânico, concept em 4 direções (S, E, N gerados; W espelhado). **Gate 🛑**: aprovação do desenvolvedor antes de qualquer animação. Os 6 inimigos da floresta e o Alce-rei zumbi seguem o mesmo gate.
- RF-13 **Endless** (ADR-016): assets legados de estação e cidade em ruínas (tiles, props, inimigos, bosses kraken e abominação) continuam no pool. Qualquer regeneração deles segue o RF-01 (QA visual antes).

## Orçamento estimado (gerações)

| Lote | Estimativa |
|---|---|
| Tilesets 3 biomas (2 lotes cada) | ~240 |
| Tilesets e props da floresta e cidade destruída (RF-11) | a medir com `GET /balance` antes do lote |
| Concepts dos aliens e do Alce-rei zumbi (RF-12) | a medir; concept v3 64 px ~3 gerações, boss 160 px ~5 (visual.md §10) |
| Props 12 | ~15 |
| Lojista (concept + idle) | ~10 |
| Tiers de arma 51 | ~55 |
| Ícones ~130 | ~130 |
| VFX superpoderes 3 (objeto + anim) | ~150 |
| Kraken/abominação base + walk, 3 voadores | ~120 |
| Ataques (10 inimigos + 3 bosses × 5 dir) | ~65 |
| Key art Steam (6 peças, 2 takes) | ~400 |
| Reserva para refações do QA (até 3 personagens) | ~300 |
| **Total** | **~1.485** (cabe nas 2.320 até 14/11 + 5.000/mês) |

## Critérios de aceite

| # | Assert | Verificação |
|---|---|---|
| A1 | Prancha de QA aprovada pelo desenvolvedor anexada ao ROADMAP (link do arquivo) | arquivo em `art-src/pixellab/qa/` |
| A2 | Tiles 3×3 de cada bioma sem costura visível a ×2 | prancha |
| A3 | Cada chave nova registrada no manifest tem arquivo no atlas (`bun scripts/pack-atlas.ts --check`) | script |
| A4 | `installPlaceholders` não desenha nenhuma chave de `weapon.*.t2–t4`, `icon.*`, `tile.*`, `border.*`, `npc.merchant` em `?debug=1` (log de placeholders vazio) | agent-browser |
| A5 | Saldo PixelLab após cada lote registrado em `visual.md` §10 | arquivo |
