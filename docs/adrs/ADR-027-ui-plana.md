# ADR-027 — UI plana: sem sombras nem molduras, grupos por borda fina

**Data** 2026-11-10 · **Status** Aceito (2026-11-10, desenvolvedor no chat) · **Decisão de origem** pedido do desenvolvedor: "deixe todos os menus sem bordas ou sombras nos cards, deixe tudo plano, apenas com bordas finas para entender onde cada botão fica em qual grupo" · **Emenda** ADR-022

## Contexto

O Estilo D (ADR-022) ficou inconsistente entre as telas: cada uma resolveu a elevação do seu jeito (sombra interna no painel, brilho no foco, cartas chanfradas com borda tracejada e sombra projetada, botões ora sem borda, ora com borda). O desenvolvedor pediu uma UI plana, em que só uma borda fina mostre qual botão pertence a qual grupo.

## Decisão

O Estilo D continua (Cinzel, paleta, losango de foco, filete de título, textos grandes, menus sem rolagem). Muda só a elevação, as bordas e os cards:

- sem sombras, sem brilho e sem elevação (tokens `--shadow-*` removidos);
- sem molduras de card (chanfro, borda tracejada desgastada, cantos em L, gradiente de painel);
- todo grupo de botões ou de conteúdo tem **uma** borda de 1 px no token único `border-line`, com espaçamento consistente entre os itens;
- **um estilo de botão por função** (primário, secundário, perigo) em todas as telas, via `Btn`;
- o foco não depende de sombra: borda `crit`, faixa `gold-bright` a 12 % e losango `crit`.

Regra completa em [design-system v2.1, §5](../design-system.md#5-elevação-e-efeitos-regra-plano-v21). O menu inicial perde o subtítulo ("Os três últimos pinguins do apocalipse zumbi") e o rodapé de pérolas e pontos de conquista.

## Alternativas

- **Só remover as sombras e manter as molduras:** deixa as cartas com cara de card e não resolve a inconsistência de botões. Rejeitado.
- **Sem nenhuma borda:** o agrupamento voltaria a depender só de espaço e luz, que foi o que o desenvolvedor achou difícil de identificar. Rejeitado.

## Consequências

- **SDD-020** especifica a mudança nos tokens, nos primitivos e em cada tela.
- Os testes de tokens (`tests/ui/theme.test.ts`) deixam de exigir `--shadow-*` e passam a exigir `--color-line`.
- A prancha de elevação do design system (v2.0) fica como histórico.
- Texto sobre o mundo do jogo e sobre a arte do menu inicial mantém o contorno de texto para o contraste AA (exceção documentada).
