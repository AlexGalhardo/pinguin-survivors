# SDD-021 — Polimento de UI 1.0

**Versão** 1.0 · **Data** 2026-11-11 · **Status** Aprovada (2026-11-11, desenvolvedor no chat: "plano + rico", ícones existentes na árvore, execução pelo orquestrador) · **Depende de** [SDD-015](SDD-015-ui-diablo-4-organica.md), [SDD-020](SDD-020-ui-plana.md) · **ADR** [022](../adrs/ADR-022-ui-diablo-4-organica.md), [027](../adrs/ADR-027-ui-plana.md) · **Design system** [v2.1](../design-system.md)

Passada de polimento sobre a UI plana. O ganho vem de composição, ícones já existentes no atlas e correção de inconsistências; nenhuma regra do ADR-027 muda (sem sombra, sem moldura, um estilo de botão por função). Lógica de jogo, contratos (`store.ts`, views, comandos) e números não mudam.

Origem: capturas de 2026-11-11 em 1920×1080, 2560×1440 e 844×390 (Playwright), listadas no chat da sessão.

## Requisitos

- **RF-01 Plurais.** Contagens usam `tn(key, n)` (`src/i18n/index.ts`): escolhe `key.one` quando `n === 1` e `key.other` no resto, nos 4 idiomas. Vale para abates e level-ups do fim de run e para os pontos da árvore ("Cost: 1 point").
- **RF-02 Fim de run.**
  - Desistir pela pausa mostra `over.quit` ("RUN ENDED") em `gold-bright`, não "YOU DIED".
  - Os números da run viram colunas rotuladas (abates, tempo, dano; XP, Fish, níveis, Pérolas) com valor grande e rótulo `secondary`, no lugar de duas frases com "·".
- **RF-03 HUD.**
  - Chefe: nome acima da barra, numa linha (`whitespace-nowrap`), em `section` no celular; a barra mostra a vida em porcentagem dentro dela.
  - Barras do HUD ganham borda de 1 px `snow-dark`, para o trilho vazio (XP zerado, Super Magia vazia) continuar visível sobre fundo escuro.
  - Super Magia: rótulo numa linha só em qualquer resolução.
  - Abates com o mesmo peso visual do Fish (rótulo + número), sem quebra.
  - FPS só aparece com `?debug=1` ou em build de desenvolvimento.
- **RF-04 Atributos com ícone.** `StatLine` (novo primitivo em `Panel.tsx`): ícone `icon.<stat>` do atlas (24 px, escala inteira) + rótulo capitalizado + valor `tabular-nums`. Sem ícone no atlas, só o rótulo. Usado na faixa de atributos da loja, na coluna da pausa e nos atributos da escolha do pinguim. Os rótulos `gstat.*` aparecem sempre capitalizados.
- **RF-05 Loja.**
  - Marcas de Elite e Núcleos de Boss ao lado do Fish, cada um com rótulo e número próprios.
  - As linhas de oferta crescem para ocupar a coluna (altura máxima por linha), em vez de ficarem empilhadas no topo.
  - Continua sem cortar no pior caso (`qa-menus`: `noClip` sem erros em 1920×1080, 2560×1080 e 1280×720).
- **RF-06 Pausa.**
  - Os três números de destaque (HP, Armadura, Dano) viram três blocos `value-hero` numa linha, sem quebra.
  - Slots de equipamento e de arma com o mesmo tamanho de célula, vazios incluídos, em duas colunas alinhadas linha a linha; slot vazio mostra o nome do slot.
- **RF-07 Escolha do pinguim.** Nenhum rótulo de atributo quebra linha em 1920×1080; a dificuldade mostra o nome numa linha e o melhor round na linha de baixo (sem "·" pendurado); o texto de bloqueio fica centrado sob o nome do herói.
- **RF-08 Heróis e poções.** Cada linha de arma inicial e de poção tem o nome à esquerda e o preço à direita, numa linha; os três encaixes de gambit ganham o rótulo "GAMBITS".
- **RF-09 Árvore de habilidades.** Cada nó mostra o ícone `icon.<stat>` do atributo que concede (escala inteira); nós sem ícone no atlas mantêm a sigla. O painel de detalhes mostra o mesmo ícone ao lado do nome.
- **RF-10 QA e site.**
  - `scripts/qa-mobile.ts` usa um round sem boss para chegar à loja; `scripts/qa-menus.ts` não acusa corte de 1–2 px por arredondamento de `line-height` em títulos.
  - A landing troca "Danger 0–5" pelas três dificuldades nos 4 idiomas e mostra a versão do `package.json`.

## Fora do escopo

Molduras, texturas ou sombras (ADR-027 mantido); arte nova; números de balanceamento; telas não citadas (menu inicial, slots de save, conquistas, histórico, controles, cartas de level-up, desbloqueio, fim da demo), que só recebem o que vier dos primitivos.

## Aceite

- **A1** `bun run typecheck`, `bun run lint`, `bun run lint:i18n`, `bun scripts/i18n-check.ts` (0/0/0) e `bun test` verdes.
- **A2** `bun scripts/qa-menus.ts` e `bun scripts/qa-mobile.ts` terminam com `issues` vazio.
- **A3** `bun run e2e` e `bun run e2e -- --demo` passam.
- **A4** Capturas depois, nas mesmas resoluções das capturas de origem, sem texto quebrado nos pontos de RF-03, RF-06, RF-07 e RF-08.
- **A5** `bun scripts/perf.ts --round 40` ≥ 58 FPS (o HUD mudou).
