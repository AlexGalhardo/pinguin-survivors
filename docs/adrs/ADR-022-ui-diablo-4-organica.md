# ADR-022 — UI Diablo 4 orgânica (Estilo D) em todos os menus e no HUD

**Data** 2026-11-09 · **Status** Aceito (2026-11-09, desenvolvedor: com Cinzel) · **Decisão de origem** escolha do desenvolvedor entre os wireframes A, B, C e D · **Complementa** ADR-018 · **Substitui em parte** ADR-018 (tipografia só Roboto)

## Contexto

O ADR-018 definiu a linguagem Diablo 4 (painéis escuros, moldura metálica, raridade por cor), mas as telas implementadas ficaram com cara de interface web: grades de cards, uma caixa com borda em cada elemento e botões retangulares. Em 2026-11-09 foram desenhados no OpenPencil quatro estilos para as 16 telas (`docs/wireframes/pinguin-survivors-wireframes.fig`). O desenvolvedor escolheu o **Estilo D**, mais orgânico, e pediu duas regras extras: texto secundário grande e legível, e pouco padding, com o texto ocupando o espaço das caixas.

## Decisão

- Todas as telas e menus (2.1 a 2.16 de `docs/wireframes/README.md`, incluindo o HUD) seguem o **Estilo D**, especificado no [design system v2](../design-system.md):
  - o conteúdo flutua sobre o fundo escuro, agrupado por luz, vinheta e espaço, não por caixas;
  - listas são texto em caixa alta, e o foco é um losango com brilho `#ffd84a`, em vez de botões-retângulo;
  - a profundidade vem em camadas: vinheta, sombra interna e no máximo 3 camadas com blur por tela;
  - os ornamentos de RPG são filetes de ouro que afinam, losangos, cantos ornamentados e molduras recortadas.
- **Legibilidade:** o texto secundário tem no mínimo 22 px em 1920×1080 (18 px em 844×390), os itens de lista 30 px, e todo texto precisa de contraste AA. `text-dim` só aparece em texto desabilitado de 22 px ou mais.
- **Padding:** o padding interno fica entre 12 e 16 px (no máximo 20) e as caixas se ajustam ao conteúdo. O respiro fica fora dos painéis.
- **Tipografia:** os títulos usam **Cinzel** (`@fontsource/cinzel` 5.3.0, versão exata) e o texto continua em Roboto. Em ZH-CN o fallback é Noto Sans SC (já instalada). A Cinzel é uma dependência nova e só entra com a aprovação do desenvolvedor. Sem aprovação, os títulos ficam em Roboto 900 com tracking 0,25em, e o resto do estilo vale igual.
- Continuam valendo: as cores só de `src/config/palette.ts`, `rarityColor` como fonte única da raridade (ADR-017), os menus neutros (ADR-018), a regra de paginar em vez de rolar, as três entradas (teclado, gamepad e toque) e alvos de toque de pelo menos 44 px.

## Alternativas

- **Estilo A** (colunas, próximo do atual): o mais barato de implementar, mas mantém a cara de interface web que motivou a mudança. Rejeitado.
- **Estilo B** (três colunas com o herói ao centro): denso; a grade 2D complica a navegação pelo gamepad. Rejeitado.
- **Estilo C** (abas e assistentes): ótimo no gamepad, mas deixa mais lento o "jogar de novo". Rejeitado.
- **Estilo D sem Cinzel:** possível, e é o fallback desta decisão. Perde parte da identidade dos títulos.

## Consequências

- **SDD-015:** especifica a migração tela a tela, e o ROADMAP ganha as tarefas T3.13 a T3.18.
- **Componentes base:** os de `src/ui/components/` (`Panel`, `Btn`, `MenuScreen`, `Lists`, `ItemViews`) ganham as variantes D. As telas passam a usar só essas variantes.
- **Tokens de efeito:** passam a ser variáveis CSS do `@theme`, ao lado das cores geradas de `palette.ts`: vinheta, elevações, filetes, ornamentos SVG e escala tipográfica.
- **Custo de desempenho:** sombras largas e blur pesam no Android. Por isso a vinheta e o brilho ficam em camadas estáticas e há o limite de camadas com blur por tela.
- **Testes e capturas:** os testes de UI e os E2E continuam sendo o assert. As capturas de 1920×1080, 1280×720 e 844×390 passam a ser comparadas com os wireframes do D.
