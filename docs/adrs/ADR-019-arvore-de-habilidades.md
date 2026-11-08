# ADR-019 — Árvore de habilidades por herói substitui a Oficina e os pontos de stat

**Data** 2026-11-08 · **Status** Aceito · **Decisão de origem** feedback do desenvolvedor ("retire a Oficina e crie uma árvore de habilidades completa igual à do Path of Exile 2 para cada um dos 3 personagens") · **Supera** a Oficina (GDD §12, balancing §8b) e os pontos de stat por nível (P-25)

## Contexto

A meta-progressão tinha duas peças soltas: pontos de stat (1 por nível, gastos em 11 stats fixos na tela do herói) e a Oficina (10 upgrades compartilhados, pagos com Pérolas). O desenvolvedor pediu uma árvore de passivas no estilo do Path of Exile 2, uma por herói. A pesquisa está em [docs/research/poe2-passive-tree.md](../research/poe2-passive-tree.md).

## Decisão

- **Uma árvore por herói**, gerada a partir de dados (`src/data/skill-tree.ts`): nó inicial no centro e **três ramos temáticos a 120°** (Jack: Lâmina, Baluarte, Caçador; Bob: Atirador, Demolição, Agilidade; Lucia: Fogo, Gelo, Tempestade). Cada ramo tem uma espinha de 12 nós, **4 notáveis** em grupos laterais e **1 pedra-chave** na ponta. **Dois anéis de caminho** ligam os ramos, para builds híbridas. São 109 nós por herói.
- **Tipos de nó** (como no PoE2): passiva menor (1 stat, 1,5× o valor de um antigo ponto de stat), nó de caminho (stat genérico), **notável** (2–4 stats, ou 1 troca de cartas por run) e **pedra-chave** (bônus forte com um custo real, ex.: Frenesi de Sangue +35% de dano corpo a corpo, +10% de sangramento, −40 de vida).
- **Pontos**: 1 por nível acima do 1 (até 99). Há mais nós que pontos, então a escolha importa até o nível máximo.
- **Alocar** um nó aloca o **caminho mais curto** até ele (pathfinding na árvore), se houver pontos. **Devolver** um nó custa 2 Pérolas e só vale se nenhum outro nó alocado ficar desconectado; **reiniciar** a árvore custa 1 Pérola por nó.
- **Save**: `heroes[h].tree: string[]`. Saem `heroes[h].points` e `upgrades`. Sem migração de saves antigos (decisão do desenvolvedor); ids inválidos ou desconectados são descartados ao ler (`sanitizeAllocation`).
- **Lógica pura** em `src/logic/skill-tree.ts` (`pathTo`, `allocate`, `canRefund`, `treeStats`, `autoAllocate`); `heroStats(hero, level, tree)` soma os nós. A simulação e o bot usam `autoAllocate` com a ordem de ramos `SIM_BRANCH_ORDER` (sobrevivência primeiro para Jack e Lucia).
- **Tela** `SkillTree.tsx`: nós como botões sobre uma camada SVG de ligações (a navegação de foco existente cobre teclado, gamepad e toque), prévia do caminho em dourado tracejado, busca, zoom e **câmera própria sem barra de rolagem** (arrastar, roda e foco animam um `transform`). O menu principal troca "Oficina" por "Árvore de habilidades"; a tela do herói ganha o botão da árvore.

## Alternativas

- Manter a Oficina e acrescentar a árvore: duas progressões permanentes competindo pelo mesmo papel. Rejeitada.
- Uma árvore única compartilhada pelos três heróis, como no PoE2: com só 3 heróis e builds muito diferentes, árvores próprias dão identidade mais clara. Rejeitada para a 1.0.
- Ascendência e joias (jewel sockets): fora do escopo agora; a pesquisa lista como evolução possível.

## Consequências

- Balanceamento: com a árvore automática, a sim fica dentro das metas #1–#6 (2026-11-08: #1 18/18/17, #3 33/33/32, #4 D0 58 / D1 31 / D5 10, #6 0,888). Os perfis A4 #2/#3 passam a ser "L10/L20 com árvore automática" em vez de "Oficina all:2/all:4".
- `src/data/upgrades.ts`, `src/logic/upgrades.ts` e os textos da Oficina foram removidos; as Pérolas seguem para gambits, poções e armas iniciais, e agora também para devolver nós.
