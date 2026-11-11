# SDD-021 — Polimento de UI 1.0

**Versão** 1.1 · **Data** 2026-11-11 · **Status** Aprovada (2026-11-11, desenvolvedor no chat: "plano + rico", ícones existentes na árvore, execução pelo orquestrador) · **Depende de** [SDD-015](SDD-015-ui-diablo-4-organica.md), [SDD-020](SDD-020-ui-plana.md) · **ADR** [022](../adrs/ADR-022-ui-diablo-4-organica.md), [027](../adrs/ADR-027-ui-plana.md) · **Design system** [v2.1](../design-system.md)

Passada de polimento sobre a UI plana. O ganho vem de composição, ícones já existentes no atlas e correção de inconsistências; nenhuma regra do ADR-027 muda (sem sombra, sem moldura, um estilo de botão por função). Lógica de jogo, contratos (`store.ts`, views, comandos) e números não mudam.

Origem: capturas de 2026-11-11 em 1920×1080, 2560×1440 e 844×390 (Playwright), listadas no chat da sessão.

## Requisitos

- **RF-01 Plurais.** Nenhum texto mostra um número colado a um substantivo no plural ("1 kills", "Cost: 1 points"). O fim de run usa números com rótulo (RF-02) e os textos de pontos da árvore foram reescritos sem depender do número ("Point cost: 1", "Points: 0"), nos 4 idiomas. Sem helper de plural: v1.1, a reescrita resolve com menos chaves.
- **RF-02 Fim de run.**
  - Desistir pela pausa mostra `over.quit` ("RUN ENDED") em `gold-bright`, não "YOU DIED".
  - Os números da run viram colunas rotuladas (abates, tempo, dano; XP, Fish, níveis, Pérolas) com valor grande e rótulo `secondary`, no lugar de duas frases com "·".
- **RF-03 HUD.**
  - Chefe: nome acima da barra, numa linha (`whitespace-nowrap`), em `section` no celular; a barra mostra a vida em porcentagem dentro dela.
  - Barras do HUD ganham borda de 1 px `snow-dark`, para o trilho vazio (XP zerado, Super Magia vazia) continuar visível sobre fundo escuro.
  - Super Magia: rótulo numa linha só em qualquer resolução.
  - Abates com o mesmo peso visual do Fish (rótulo + número), sem quebra.
  - FPS só aparece com `?debug=1` ou em build de desenvolvimento.
- **RF-04 Atributos com ícone.** `StatLine` (novo primitivo em `ItemViews.tsx`, junto de `statIconFrames`): ícone `icon.<stat>` do atlas (24 px, escala inteira) + rótulo capitalizado + valor `tabular-nums`. Sem ícone no atlas, só o rótulo. Usado na faixa de atributos da loja, na coluna da pausa e nos atributos da escolha do pinguim. Os rótulos `gstat.*` aparecem sempre capitalizados. Abaixo de ~970 px de altura a faixa da loja fica sem ícone (o ícone de 32 px não reduz).
- **RF-05 Loja.**
  - As linhas de oferta crescem para ocupar a coluna (altura máxima por linha), em vez de ficarem empilhadas no topo.
  - Comparação de equipamento: o papel de cada carta ("À VENDA", "EQUIPADO") vai na linha de tipo da carta e as mudanças de atributo ficam em duas colunas; abaixo de ~970 px de altura só a carta à venda aparece (a frase e o antes → depois fazem a comparação).
  - Slots de equipamento vazios ocupam uma linha só ("Vazio: Pernas · Anel · Amuleto").
  - Celular (altura ≤ 500 px): fala do lojista numa linha e rodapé sem quebra, para 4 ofertas e as ações caberem em 800×360.
  - Continua sem cortar no pior caso (`qa-menus`: `noClip` sem erros em 1920×1080, 2560×1080 e 1280×720; `qa-mobile` em 844×390, 915×412, 1280×720 e 800×360).
- **RF-06 Pausa.**
  - Os três números de destaque (HP, Armadura, Dano) viram três blocos `value-hero` numa linha, sem quebra.
  - Slots de equipamento e de arma numa grade só, em duas colunas com título ("EQUIPAMENTO", "ARMAS 6/6") e alinhadas linha a linha, vazios incluídos.
- **RF-07 Escolha do pinguim.** Nenhum rótulo de atributo quebra linha em 1920×1080; os atributos ficam em uma coluna com ícone; dificuldade e arma inicial ficam cada uma sob o próprio título, com a escolha (‹ NORMAL ›, melhor round embaixo) seguida do que ela muda; a Super Magia vai para baixo do herói.
- **RF-08 Heróis e poções.** Cada linha de arma inicial e de poção tem o nome à esquerda e o preço à direita, numa linha; os três encaixes de gambit ganham o título "GAMBITS" com a explicação (que estava sob as poções).
- **RF-09 Árvore de habilidades.** Cada nó mostra o ícone `icon.<stat>` do atributo que concede (escala inteira); nós sem ícone no atlas mantêm a sigla. Nó bloqueado mostra o ícone em cinza; o nível (0/5) fica no canto do nó.
- **RF-10 QA e site.**
  - `scripts/qa-mobile.ts` usa um round sem boss para chegar à loja; `scripts/qa-menus.ts` abre o histórico pelo menu inicial. Os cortes de 1–2 px que ele acusava eram reais e foram corrigidos na origem (`line-height` 1,3 nos títulos Cinzel e `box-sizing` na carta de item).
  - A landing troca "Danger 0–5" pelas três dificuldades nos 4 idiomas.

## Fora do escopo

Molduras, texturas ou sombras (ADR-027 mantido); arte nova; números de balanceamento; telas não citadas (menu inicial, slots de save, conquistas, histórico, controles, cartas de level-up, desbloqueio, fim da demo), que só recebem o que vier dos primitivos.

## Aceite

- **A1** `bun run typecheck`, `bun run lint`, `bun run lint:i18n`, `bun scripts/i18n-check.ts` (0/0/0) e `bun test` verdes.
- **A2** `bun scripts/qa-menus.ts` e `bun scripts/qa-mobile.ts` terminam com `issues` vazio.
- **A3** `bun run e2e` e `bun run e2e -- --demo` passam.
- **A4** Capturas depois, nas mesmas resoluções das capturas de origem, sem texto quebrado nos pontos de RF-03, RF-06, RF-07 e RF-08.
- **A5** `bun scripts/perf.ts --round 40` ≥ 58 FPS (o HUD mudou).

## Evidência (2026-11-11)

- A1: `bun run typecheck` sem erros (399 arquivos), `bun run lint` limpo (590 arquivos), `bun run lint:i18n` 0 literais, `bun scripts/i18n-check.ts` 0/0/0, `bun test` 638 pass.
- A2: `bun scripts/qa-menus.ts` → `issues []`; `bun scripts/qa-mobile.ts` → `issues none`.
- A3: `bun run e2e` → `E2E passed`; `bun run e2e -- --demo` → `E2E (demo) passed`.
- A4: capturas depois em 1920×1080 e 844×390 conferidas na sessão (HUD com boss, pausa, loja, escolha do pinguim, heróis e poções, árvore, fim de run).
- A5: `bun scripts/perf.ts --round 40` → 298 inimigos, 74 FPS em média, p95 13,4 ms, 0 erros.

## Não feito

- Ícones para Marcas de Elite e Núcleos de Boss: não há arte no atlas; continuam como texto ao lado do Fish.
- Herói no centro da pausa: `PauseData` não leva o id do herói (mesma pendência da T3.17).
- No celular, o nome da oferta ainda trunca ("Ring …") ao lado dos botões COMPRAR e TRAVAR.
