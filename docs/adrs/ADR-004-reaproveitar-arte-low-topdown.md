# ADR-004 — Reaproveitar os sprites `low top-down`; personagens novos em 4 direções

**Data** 2026-11-08 · **Status** Aceito · **Decisão de origem** B-06, B-14 · **Complementa** P-54, P-56, P-60

## Contexto

Heróis (idle, walk 8 frames, hurt, death × 8 direções) e 19 inimigos (walk) já foram gerados no PixelLab em vista `low top-down` (3/4), que é exatamente a vista usada por Brotato e pela maioria dos top-down 2D. O que é realmente isométrico são o chão (tiles 64×32) e as decorações `isometric: true`. Orçamento: 2.320 gerações até 14/11/2026 e 5.000/mês depois.

## Decisão

1. **Reaproveitar** todos os sprites de personagens existentes após QA visual na câmera top-down (`?skipMenu=1&debug=1`, prancha com `scripts/pack-sheet.ts`). Só é refeito o que ficar visivelmente errado.
2. **Refazer**: chão (tileset top-down 64×64 por bioma via `create_topdown_tileset`/`create-tiles-pro`), decorações (vista `high top-down`), bordas da arena, NPC lojista (pinguim velho mercador com carrinho de peixes, 1 direção, idle).
3. **Personagens novos** (lojista, inimigos ou heróis futuros): concept em **4 direções** (S, E, N gerados; W espelhado de E) → **aprovação do desenvolvedor** → animação template com **8 frames para heróis** e **6 frames para inimigos**.
4. Armas continuam sprites separados animados por código (P-56), agora até 6 ao redor do herói (ADR-005).

## Alternativas

- Recriar tudo em 4 direções geradas: ~1.500 gerações e perda das animações prontas. Rejeitada.
- Recriar com W espelhado: mesmo custo de concept, sem necessidade. Rejeitada.

## Consequências

- Economia estimada de ~1.500 gerações, que vão para chão, VFX dos superpoderes e ícones.
- 8 direções continuam no motor (5 geradas + 3 espelhadas); o `Enemy`/`Hero` escolhem o frame pela direção do movimento sem rotação iso.
- Checklist de QA visual entra no ROADMAP como gate antes de qualquer regeneração.
