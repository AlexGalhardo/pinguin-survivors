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

**Status**: ⏳ aguardando aprovação do usuário (escolher 1 por herói + tamanho final). Nenhuma animação antes disso.
