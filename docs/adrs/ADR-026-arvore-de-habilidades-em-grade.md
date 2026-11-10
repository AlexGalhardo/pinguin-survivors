# ADR-026 — Árvore de habilidades em grade de quadrados (emenda de apresentação do ADR-019)

**Data** 2026-11-10 · **Status** Aceito (pedido literal do desenvolvedor, 2026-11-10) · **Emenda** [ADR-019](ADR-019-arvore-de-habilidades.md) (só a apresentação) · **SDD** [015](../sdds/SDD-015-ui-diablo-4-organica.md) v1.1

## Contexto

O desenvolvedor pediu: "na árvore de habilidades, remova o estilo artístico igual do PoE2 e use quadrados enfileirados de outros RPGs; é mais fácil de ver as informações e mais simples de entender". A constelação com câmera, zoom, busca e linhas curvas (ADR-019) esconde o estado dos nós e obriga a arrastar.

## Decisão

- **Só a apresentação muda.** Nós, custos, ramos, pathfinding, devolver e reiniciar (`src/data/skill-tree.ts`, `src/logic/skill-tree.ts`) ficam como no ADR-019.
- A tela `SkillTree.tsx` vira uma **grade de quadrados**: uma faixa de 3 colunas por ramo (cluster à esquerda, espinha, cluster à direita) mais uma coluna estreita entre ramos para os nós de caminho; as linhas são o tier (profundidade na espinha, 1–13).
- Cada quadrado mostra a sigla do nó e `nível/máximo` quando tem mais de um nível; o estado (bloqueado, disponível, comprado, máximo) vem da cor e da borda e também do texto no painel de detalhes.
- Pré-requisito = linha reta entre quadrados vizinhos da mesma coluna ou linha; quando o elo não é vizinho (nós de caminho), o painel diz "Requer N nós antes".
- **Painel de detalhes fixo** à direita (nome, efeito atual → próximo nível, custo, requisitos), sempre no mesmo lugar; pontos disponíveis em destaque no topo.
- Setas movem o foco de célula em célula; fora da grade (sem célula na direção) o foco segue a navegação geométrica normal. Toque: primeiro toque seleciona, segundo aloca.
- **Saem** câmera arrastável, zoom, busca, pré-visualização tracejada do caminho e o tooltip ancorado ao nó.

## Alternativas

- Manter o grafo e só trocar o visual dos nós: continua exigindo câmera e linhas curvas. Rejeitada.
- Uma coluna por ramo com tudo empilhado (28 nós por coluna): fica alta demais e perde a leitura do tier. Rejeitada.

## Consequências

- O desenho do grafo (coordenadas `x`, `y` dos nós) deixa de ser usado pela UI; a grade é derivada dos ids dos nós em `src/ui/skill-grid.ts`.
- Textos novos em 4 idiomas; as chaves de busca e zoom saem.
- Sem mudança de balanceamento nem de save.

## Status

Aceito.
