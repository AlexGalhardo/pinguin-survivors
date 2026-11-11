# SDD-022 — Onboarding: sistemas destravados aos poucos e dicas da primeira run

**Versão** 1.0 · **Data** 2026-11-11 · **Status** Aprovada (2026-11-11: decisão B-35 do desenvolvedor, "Destravar aos poucos + dicas"; os marcos abaixo são a recomendação do orquestrador, aplicada sem nova pergunta por ordem do desenvolvedor de seguir o ROADMAP sem interrupções) · **Depende de** SDD-004, SDD-005, SDD-015 · **Decisão** [brainstorming B-35](../brainstorming.md)

O jogador novo via de uma vez árvore de habilidades, Pérolas, poções, gambits, Marcas e Núcleos. Esta SDD esconde cada sistema até ele ter uso e avisa quando aparece. Nada é removido e nenhum número de jogo muda.

## Requisitos

- **RF-01 Marcos.** `src/logic/onboarding.ts` (puro, testado) deriva do save o que já está destravado, sem flag nova por sistema:

  | Sistema | O que fica escondido antes | Destrava quando |
  |---|---|---|
  | `tree` (árvore de habilidades) | Entrada "ÁRVORE DE HABILIDADES" do menu, botão da árvore na loja e na pausa | Algum herói está no nível 2 ou mais, ou tem nó alocado. Durante a run, vale o nível atual do herói |
  | `heroes` (heróis, poções e gambits) | Entrada "HERÓIS E POÇÕES" do menu | O save tem uma run no histórico, Pérolas ou alguma poção |
  | Marcas de Elite e Núcleos de Boss | O contador ao lado do Fish na loja | A run tem pelo menos 1 Marca ou 1 Núcleo |

- **RF-02 Aviso de destrave.** Quando um sistema de RF-01 passa a destravado e ainda não foi anunciado, a UI mostra um `Toast` de uma linha dizendo o que apareceu e onde. O anúncio acontece ao abrir o menu inicial e ao abrir a loja. `save.onboarding.seen` guarda o que já foi anunciado, para não repetir.
- **RF-03 Dicas da primeira run.** Três dicas de uma linha no HUD, uma por vez, na parte de baixo da tela, sem pausar o jogo e sem capturar entrada:

  | Dica | Aparece | Some (e nunca mais volta) |
  |---|---|---|
  | `move` | No início da run | O herói andou |
  | `auto` | Depois de `move` | 3 abates na run |
  | `super` | A Super Magia carregou pela primeira vez | A Super Magia foi usada |

  O texto de `move` e de `super` muda com a entrada (teclado ou toque). As dicas vistas ficam em `save.onboarding.seen` (`tip.move`, `tip.auto`, `tip.super`).
- **RF-04 Save.** `SaveData.onboarding = { seen: string[] }`, vazio por padrão; um save sem o campo é lido como vazio (sem mudar `SAVE_VERSION`). Um save antigo com tudo destravado recebe os avisos uma vez.
- **RF-05 Textos** nos 4 idiomas (`onboard.*`), via `t()`.
- **RF-06 Demo.** Vale igual na demo: a árvore e a tela de heróis aparecem depois da primeira run.

## Fora do escopo

Tutorial com passos obrigatórios, setas apontando para a tela, vídeo, e esconder cartas, armas ou itens da loja.

## Aceite

- **A1** `bun test tests/onboarding.test.ts`: marcos de RF-01, ordem e fim das dicas de RF-03, anúncio único de RF-02.
- **A2** `bun test tests/ui`: o menu inicial sem as duas entradas com save novo e com elas depois; loja e pausa sem o botão da árvore no nível 1; HUD mostra a dica.
- **A3** `bun test tests/save.test.ts`: save sem `onboarding` lido como vazio.
- **A4** `bun run lint:i18n` e `bun scripts/i18n-check.ts` 0/0/0; `bun run e2e` e `bun run e2e -- --demo` passam.
- **A5** Capturas em 1920×1080 e 844×390: menu de save novo, HUD com a dica `move`.
