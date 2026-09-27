# UI, HUD e telas

UI em pixel art, **EN + PT-BR** (`src/i18n/`; nenhum texto fora de lá). Fonte pixel com acentos latinos (escolher na fase 1: precisa de á, ã, ç, é, ê, í, ó, õ, ú). Placeholders por código até a UI do PixelLab (`/create-ui-asset`) entrar.

## Fluxo de telas

```
MainMenu ─► HeroSelect ─► Hero (pontos de stat · poções/gambits · upgrades com Fish) ─► Game (+ HUD)
   │                                                                                     │ ESC ─► Pause ─► Settings / Resume / Quit
   ├─► Settings (idioma, volumes, gore, shake, números de dano)                          │ fim do round ─► CardPick ─► Game
   └─► Records / Credits                                                                 └ morte/timeout do boss ─► GameOver ─► Menu / Retry
```

## HUD

```
┌─────────────────────────────────────────────────────────────────────────┐
│ JACK Lv 12  [HP ████████░░ 96/120]            ROUND 7     0:34          │
│ [XP ▰▰▰▰▱▱▱]  🐟 214                        (ELITE ROUND — roxo)         │
│                                                                         │
│                            (mundo iso)                                  │
│                                                                         │
│ [T1 machete] [sec1 3][sec2 1][ ]              [🧪1 HP<30%][🧪2][🧪3]    │
└─────────────────────────────────────────────────────────────────────────┘
```

- HP com número; XP do herói (persistente) com level; Fish.
- Round + timer grande no topo; últimos 5 s piscam. **Boss**: barra de HP do boss + timer de 3:00 em vermelho.
- Aviso de round de elite (roxo/laranja).
- Arma assinada (tier) + 3 slots de secundárias com nível; 3 poções com a condição resumida e estado (usada/pronta).
- Números de dano (crítico maior e amarelo; sangramento vermelho escuro; veneno verde; elementos com cor própria), desligáveis.

## CardPick (tempo pausado)

"ROUND N CLEARED — CHOOSE ONE" / "ROUND N CONCLUÍDO — ESCOLHA UMA". 3 cartas com moldura de raridade, ícone, nome, descrição com valor final calculado, tag "NEW"/"LV 2→3"/"EVOLVE". Input: mouse, 1/2/3, setas + Enter, gamepad.

## Hero (menu, fora da run)

- Level, XP, **pontos de stat** para distribuir (com prévia do stat final).
- **Gambits de poção**: 3 slots, cada um com tipo (comprado com Fish) + condição (lista).
- Upgrades permanentes com Fish.

## GameOver

Round alcançado, tempo, abates, dano, XP ganho (+ levels), Fish ganho, build (arma/tier, secundárias, cartas), recorde. Retry / Menu.

## Regras

- Escala inteira; ancorar pelas bordas visíveis (largura lógica variável) e recalcular no `resize`.
- Tudo navegável por teclado, mouse e gamepad; foco visível.
- Pausar simulação e timers durante CardPick/Pause.
- Textos longos em PT-BR: layouts testados nos dois idiomas.
