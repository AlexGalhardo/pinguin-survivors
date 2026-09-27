# Histórico de prompts de arte (PixelLab)

Log bruto e completo em `art-src/pixellab/log.jsonl` (gerado pelos scripts). Aqui fica o resumo legível: o que foi gerado, custo, resultado e decisão do usuário.

## 2026-09-27 — Concepts dos 3 heróis (`bun scripts/pl-concepts.ts`)

- Vista `low top-down`, 8 rotações, 96×96, fundo transparente, template `mannequin`.
- Sufixo de estilo: `cute but battle-worn, scars and bandages, dirty worn gear, zombie apocalypse survivor, isometric action RPG hero like Diablo 2, readable silhouette, chibi proportions`.
- v3: `outline: single color black outline`, `detail: high detail`, seeds 101 (a) e 202 (b). Pro: `method: create_with_style`, seed 303.
- Custo: v3 = 3 gerações cada; Pro = 25 cada → **93 gerações** no total (saldo 2.386 → 2.293).
- Contact sheet: `art-src/pixellab/concepts/sheet.png`.

| id | Prompt do herói | character_id |
|---|---|---|
| jack-v3-a / b / pro | Jack, a rockhopper penguin with a spiky yellow crest, red bandana tied on the forehead, leather shoulder pad, bandaged flipper, holding a bloody machete in the right flipper, melee brawler | 74719afa… / 0fa9bed3… / dfc1aeb5… |
| bob-v3-a / b / pro | Bob, a chubby emperor penguin wearing a green military tactical vest with shotgun shells on an ammo belt, knitted beanie, eyepatch, holding a double-barrel shotgun with both flippers | 61a0d0eb… / 59b8b1c8… / d821c16a… |
| lucia-v3-a / b / pro | Lucia, a small gentoo penguin mage wearing a tattered purple hooded cloak with runes, holding a crooked wooden staff topped with a glowing crystal with four small gems (red, green, cyan, yellow) | 342e689e… / 68a38f74… / 2287c3c3… |

(IDs completos em `art-src/pixellab/concepts/<id>/meta.json`.)

**Observações**: os v3 ocupam quase todo o canvas (~88 px de altura, acima da meta de ~64 px); os Pro saíram menores (~55–60 px) e com menos detalhe. As rotações v3 são consistentes nas 8 direções.

**Status**: ✅ **aprovados pelo usuário em 2026-09-27** ("pode aprovar e seguir com esses concept arts na versão final"). Variantes escolhidas pelo agente (o usuário pode trocar):

| Herói | Concept | character_id (PixelLab) | Seed |
|---|---|---|---|
| Jack | `jack-v3-a` | `74719afa-d601-4428-8510-d199eef347de` | 101 |
| Bob | `bob-v3-a` | `61a0d0eb-21f7-4bc9-ac2d-69f42c8bcbd3` | 101 |
| Lucia | `lucia-v3-b` | `68a38f74-4a05-4de5-a38b-d990780b7414` | 202 |

Tamanho final aceito como gerado: **~88 px de altura num canvas de 96** (P-05 atualizado). Os tiers T2/T3 saem desses personagens via `/create-character-state`.

## 2026-09-27 — Key art do menu (`bun scripts/pl-keyart.ts`)

- Pedido do usuário: 2 concepts inspirados no clima de duas artes de DOOM enviadas no chat (vermelho, laranja, verde, preto), um com o **Jack** e outro com o **Bob**, para fundo animado do menu. As imagens de DOOM **não** foram enviadas à API (arte de terceiros): só a descrição de clima/composição no prompt, com o sprite aprovado do herói como referência de personagem.
- Endpoint `/generate-image-v2`, **688×384** (maior 16:9 suportado), seeds 7 e 42 por herói → 4 imagens, **120 gerações** (30 cada). Prompt completo em `scripts/pl-keyart.ts` e no log.
- Em uso: **50% de chance de cada uma** a cada abertura do menu (pedido do usuário): `jack-42` → `public/assets/menu/keyart.jack.png` e `bob-42` → `public/assets/menu/keyart.bob.png`. Alternativas: `jack-7`, `bob-7` em `art-src/pixellab/keyart/`.
- `src/ui/MenuBackground.ts`: imagem **fixa** (sem piscar, sem deriva, a pedido do usuário) com brasas subindo por cima. Escala inteira que cobre a tela.
- **Status**: ✅ as duas ficam, sorteadas 50/50.

## 2026-09-27 — Badge de conquista (`bun scripts/pl-image.ts ui.achievement 64 …`)

- Endpoint `/create-image-pixflux`, 64×64, fundo transparente, contorno preto, sombreamento detalhado. Seeds 11, 22, 33 (2 gerações no total).
- Prompt: `achievement unlocked badge icon: round golden medal with a small penguin silhouette emblem in the center, laurel wreath, red ribbon tails, shiny highlights, game UI icon`.
- **Escolhido: seed 33** (pinguim mais legível em tamanho pequeno) → `public/assets/ui/ui.achievement.png`. As outras ficam em `art-src/pixellab/images/ui.achievement/`.
- Obs.: a API do PixelLab ficou com erro 500 por algumas horas em 2026-09-27; o cliente agora repete com backoff.
