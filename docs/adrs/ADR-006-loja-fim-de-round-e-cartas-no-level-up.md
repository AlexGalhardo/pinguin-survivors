# ADR-006 — Loja no fim de cada round e cartas de stat no level-up

**Data** 2026-11-08 · **Status** Aceito · **Decisão de origem** B-09, B-10, B-13, B-14 · **Supera** P-23, P-27 ("sem loja na run")

## Contexto

Hoje o fim do round abre 3 cartas (stats, secundárias, on-hit, evolução). Com 6 slots e armas em tiers (ADR-005) é preciso um canal para comprar/fundir armas e itens; o Brotato resolve com loja entre waves.

## Decisão

1. **Loja ao fim de cada round** (tempo pausado), em tela estilo ARPG (Diablo): à esquerda o **paper doll** do herói com stats da run e 5 slots de equipamento; à direita o **NPC lojista** (pinguim velho mercador) com **4 ofertas** (armas e itens), **reroll** com preço crescente dentro da loja (base cresce por round) e **lock** grátis por oferta, persistente entre lojas. Botão "Próximo round".
2. **Level-up** abre **4 cartas** de **stats e exclusivas do herói** (sem armas/itens). Vários level-ups no mesmo round enfileiram as escolhas antes da loja.
3. A loja vende também **equipamento** (5 slots, P-66) e **fusões** acontecem automaticamente ao comprar a 2ª arma igual (com confirmação).
4. Moeda da loja: **Fish** (ADR-007). Preços e reroll em `src/data/economy.ts` (espelho em `balancing-and-simulation.md` Parte B §8).

## Alternativas

- Loja substitui cartas: perde o ritmo de micro-decisão a cada level. Rejeitada.
- Cartas continuam com armas e loja só vende itens: duas fontes de arma competindo. Rejeitada.
- 6 ofertas/3 ofertas: 4 é o padrão que o público conhece.

## Consequências

- `CardPickScene` → componente React `LevelUpCards`; novo componente `Shop` (SDD-003, SDD-004).
- `RunState` ganha `fish` da run, `shop.locks`, `shop.rerolls`, fila de level-ups pendentes.
- Autosave passa a acontecer ao sair da loja (início do round), não ao fim da carta.
- Novo asset: lojista (ADR-004) e molduras de UI em React (sem PixelLab).
