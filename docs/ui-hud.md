# UI, HUD e telas

Toda a UI é em pixel art e **em inglês**. No Alpha, é desenhada por código (`src/ui/`). Os textos ficam centralizados em `src/config/strings.ts`.

## Fluxo de telas

```
MainMenu ─► CharacterSelect ─► Game (+ HUD em paralelo)
   │                              │  ESC ─► Pause ─► Settings / Resume / Quit run
   └─► Settings                   │  fim da onda ─► CardPick ─► Shop ─► Game (próxima onda)
                                  └─ morte ─► GameOver ─► MainMenu / Retry
```

## HUD (durante o combate)

```
┌──────────────────────────────────────────────────────────┐
│ [HP ███████░░░ 24/30]  (♥ revive)        WAVE 7   0:34   │
│ [◆ 128 gold]                                             │
│                                                          │
│                        (arena)                           │
│                                                          │
│ [drone 3][chain 1][nova 2][ ][ ][ ]            FPS (debug)│
└──────────────────────────────────────────────────────────┘
```

- Barra de HP com número; ícone de revive quando há carga.
- Onda + timer grande no topo e no centro; pisca em vermelho nos últimos 5 s. Quando há boss, aparece a barra de HP dele.
- Ouro com ícone.
- 6 slots de habilidade com ícone 16×16 e nível (1–5); habilidades com cooldown mostram um preenchimento.
- Números de dano flutuantes (críticos maiores e amarelos), podem ser desligados em Settings.

## CardPick

- Título "WAVE N CLEARED — CHOOSE AN UPGRADE".
- 3 cartas lado a lado: moldura na cor da raridade, ícone, nome, descrição curta com o valor final já calculado, e a tag "NEW" ou "LV 2→3" nas habilidades.
- Input: mouse (hover levanta a carta) ou teclas **1/2/3**, ou setas + Enter.
- Botão **Reroll (X gold)**. Fica desabilitado se o ouro não for suficiente.
- Painel lateral de stats atuais (opcional, pode ser recolhido).

## Shop

- 4 slots de item (moldura de raridade, preço, efeitos em verde/vermelho).
- **Reroll (X gold)**, **Continue ▶**. Beta: botão de "lock" num item (mantém o item no próximo re-roll).
- Painel de stats atuais + lista de itens possuídos.

## Pause / Settings

- Resume, Settings, Quit run (com confirmação).
- Settings: volume de SFX e de música, Fullscreen (Scale Manager), Screen shake on/off, Damage numbers on/off. Tudo persistido.

## GameOver

- "YOU DIED — WAVE N", tempo total, abates, dano causado, ouro total, habilidades e itens da build, recorde ("NEW BEST!").
- Retry (mesmo personagem) / Main Menu.

## Regras de UI

- Escala sempre inteira, alinhada ao grid lógico (480×270). Ancorar pelas bordas visíveis e recalcular no `resize`.
- Toda tela navegável por teclado **e** mouse. O foco visível é uma seta ou borda piscando.
- Feedback sonoro em hover e clique.
- Pausar a física e os timers do GameScene enquanto CardPick, Shop ou Pause estão abertos.
