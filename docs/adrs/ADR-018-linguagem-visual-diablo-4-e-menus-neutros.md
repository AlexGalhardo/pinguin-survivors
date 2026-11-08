# ADR-018 — Linguagem visual Diablo 4, pausa com o layout da loja e menus neutros

**Data** 2026-11-08 · **Status** Aceito · **Decisão de origem** respostas do desenvolvedor · **Complementa** ADR-002, ADR-006

## Contexto

As telas de UI foram construídas uma a uma, com estilos próximos mas não unificados, e a arte do menu inicial aparecia por trás de menus que exigem leitura. O desenvolvedor definiu a direção visual e a regra de fundo.

## Decisão

- **Pausa** usa o mesmo layout da loja nova (status do jogador e itens equipados), **sem o NPC**, com **três botões**: Continuar, Configurações e Sair.
- **Conquistas, configurações, oficina, histórico e Escolha seu Pinguim** seguem a mesma linguagem visual **Diablo 4** da loja: painéis escuros com moldura metálica, raridade por cor (I–V, ADR-017), tipografia Roboto, textos de ajuda curtos.
- **Todos os menus, exceto o inicial, têm fundo preto ou neutro**, sem a arte do menu; responsivos, fáceis e didáticos (o menu inicial é o único com a key art).
- A raridade usa uma só fonte de cores (`rarityColor`, ADR-017).

## Alternativas

- Manter a arte do menu atrás de todas as telas: ruído visual em telas de leitura. Rejeitada.
- Pausa própria com layout distinto: duas telas parecidas para manter. Rejeitada.

## Consequências

- A UI nova é feita depois (SDD-004 RF-10 e RF-11); nesta etapa só a spec e os dados que a UI vai consumir (`describeOffer`, `rarityColor`).
- `MenuScreen` já usa o fundo neutro (commit `a9c5c1d`).
