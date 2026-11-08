# ADR-007 — Fish como moeda da run e Pérolas como moeda persistente

**Data** 2026-11-08 · **Status** Aceito · **Decisão de origem** B-11, B-12 · **Supera** P-27 (Fish persistente)

## Contexto

Fish 🐟 era a moeda persistente (poções, Oficina). Com a loja na run (ADR-006) é preciso uma economia fechada por run para balancear preços e reroll, separada da meta-progressão, evitando o "forced failure" descrito em [web-research.md](../web-research.md) §6.

## Decisão

- **Fish**: dropado por inimigos e no fim do round, **zera a cada run**, paga loja e reroll. O Fish que sobra ao fim da run é convertido em Pérolas numa taxa fixa (`fishToPearls`, inicial 10:1).
- **Pérolas** (EN *Pearls*): moeda **persistente**, ganha por round concluído, boss, conquistas e conversão de Fish; paga Oficina, poções/gambits e desbloqueios de arma inicial.
- Stat `harvesting` (novo) aumenta Fish ganho no fim do round.

## Alternativas

- Fish persistente pagando tudo: inflação entre runs quebra a loja. Rejeitada.
- Nomes "Krill" e "Gemas de gelo": menos legíveis em EN/ZH. Rejeitados.

## Consequências

- `SaveData.fish` migra para `SaveData.pearls` (migração v1→v2 na taxa 1:1 para não punir o jogador; SDD-005).
- HUD mostra Fish da run; menu mostra Pérolas.
- i18n: chaves `currency.fish`, `currency.pearls` nos 4 idiomas.
