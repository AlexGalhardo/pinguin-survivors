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
- `src/ui/MenuBackground.ts`: imagem **fixa** (sem relâmpagos nem deriva, a pedido do usuário) com brasas subindo e um pulso suave de brilho da lava. Escala inteira que cobre a tela.
- **Status**: ✅ as duas ficam, sorteadas 50/50.

## 2026-09-27 — Badge de conquista (`bun scripts/pl-image.ts ui.achievement 64 …`)

- Endpoint `/create-image-pixflux`, 64×64, fundo transparente, contorno preto, sombreamento detalhado. Seeds 11, 22, 33 (2 gerações no total).
- Prompt: `achievement unlocked badge icon: round golden medal with a small penguin silhouette emblem in the center, laurel wreath, red ribbon tails, shiny highlights, game UI icon`.
- **Escolhido: seed 33** (pinguim mais legível em tamanho pequeno) → `public/assets/ui/ui.achievement.png`. As outras ficam em `art-src/pixellab/images/ui.achievement/`.
- Obs.: a API do PixelLab ficou com erro 500 por algumas horas em 2026-09-27; o cliente agora repete com backoff.

## 2026-09-27 — Frente de assets (P-58): armas, pickups e projéteis (MCP `create_image_pixflux`)

- Gerados pelo MCP (sem token no checkout), baixados com `bun scripts/pl-save.ts` (URLs e prompts completos em `log.jsonl`). Contorno preto, `detailed shading`, `highly detailed`, fundo transparente, vista `side` nas armas; 1 geração cada.
- **Armas** (apontando para a direita, empunhadura à esquerda — `WeaponView` usa origem 0,15): machete 64×32, katana 80×32, chainsword 80×32 (seed 22; a 11 parecia arma de fogo), doubleBarrel 64×32 (seed 22), autoShotgun 72×32 (seed 22; a 11 era preta demais contra o chão), rocketShotgun 80×32, elementStaff 64×32, arcaneStaff 72×32, stormStaff 80×32, auxPistol 32×32. Recortadas ficam com 60–75 px (pistola 23 px).
- **Pickups/projéteis** 32×32 reduzidos a 50% (nearest) no `pack-process`: `pickup.xp` (cristal ciano), `pickup.fish`, `pickup.meat`, `proj.orb` (lineless), `proj.spit`, `proj.bottle` (molotov), `proj.grenade`; `proj.meteor` em tamanho cheio. Faca e lâmina saíram na diagonal (projéteis orientados precisam apontar para a direita) e foram refeitas em canvas largo.
- Escolhas em `art-src/selection.json`; prancha de revisão com `bun scripts/pack-sheet.ts`.
- Custo do lote: ~25 gerações.

## 2026-09-27 — Heróis sem arma (P-56) e inimigos com arte estática (P-60)

- **Estados sem arma** (`create_character_state`, ~30 gerações cada, "empty flippers, not holding any weapon"): Bob `ae2516ed-dd60-4aa7-b951-985343592d27` e Lucia `452419ff-e4fd-4928-84e3-97b86cedb055` saíram limpos. Jack (`ab0dc2a5…` e a 2ª tentativa `1a3e6a0e-3cff-4827-8883-cac67209b633`, "unarmed") manteve o machete no sul e no nordeste; o sul foi corrigido com `edit_image` (~20 gerações, `art-src/pixellab/images/hero.jack.south-unarmed/south.png`) e virou referência de um personagem v3 novo (`7bdeb4d9-7432-49a7-bb33-7d897f4a04aa`, em geração) para as animações. Enquanto isso o Jack usa sul editado + se/e/n do estado `1a3e6a0e` (ne usa a vista norte).
- **Animações dos heróis** (template, 1 geração/direção): `idle` (`breathing-idle`) do Bob (5 direções) e da Lucia (4, norte pendente). Direções/animações que ainda faltam são preenchidas com a **rotação estática** do personagem (`bun scripts/pack-rotations.ts`), sem sobrescrever frames reais.
- **Inimigos aprovados (P-60)** — variantes escolhidas (concepts em `art-src/pixellab/concepts/enemies/`):

| Chave | Variante | character_id |
|---|---|---|
| `enemy.zombiePenguin` | `zombiePenguin-22` (mais gore) | `35eaad7c-3a33-4c39-bf5a-fb047d22fc65` |
| `enemy.bloaterPenguin` | `bloaterPenguin-11` (mais pus verde) | `199478b9-e973-462e-8316-2170525e0ede` |
| `enemy.zombieSeal` | `zombieSeal-11` | `10c28e4b-1df8-4aec-98fa-de855bb9141c` |
| `enemy.zombieSkua` | `zombieSkua-22` (única) | `5d6c5e76-92d5-4697-a08b-2f8b156074d7` |
| `enemy.zombieScientist` | `zombieScientist-11` (única) | `4195da5b-4174-417b-830f-bcb6402957c7` |
| `enemy.polarBear` (boss) | `polarBear-11` (costelas expostas) | `4caa325b-e9e8-444e-bcfb-8094414204c5` |
| `enemy.zombieMedic` | `zombieMedic-v3` | `5aeb2f3c-d64b-4389-bd59-437b7dbf3190` |

  Por enquanto entram como atlas `enemy.<id>` com a animação `walk` de 1 frame por direção (rotações); o `Enemy` vira para a direção do movimento (5 desenhadas + 3 espelhadas) e troca para `attack` no telegraph quando existir. As animações template (walk/attack) substituem os frames estáticos pelas mesmas chaves.
- **Concepts novos dos biomas 2–3** (v3 64 px, 2 gerações cada; bosses 160 px, 5): a 1ª leva de 9 falhou no servidor ("v3 generation failed") e foi reenviada; em geração: zombieSailor, fuelBloater, zombieGull, zombieRiotCop, zombieSoldier, acidBloater, zombieBrute (80 px), kraken, abomination; zombieWalrus (bioma 1, nunca teve concept) também.

## 2026-09-27 — Chão e decorações dos 3 biomas; walks animados

- **Tiles**: `/create-tiles-pro` isométrico 64×32 (`tile_depth_ratio 0`, `segmentation`, seed 12; ~25–40 gerações por lote de 16). Os tiles vêm com bordas/biséis e formas tortas, então não entram crus: `bun scripts/pack-iso-tile.ts <tile> <saida> --iso 31,12,31,12,0.8` lê a textura dentro do losango e a reprojeta no losango 64×32 exato com **amostragem espelhada** (as bordas sempre casam; sem costura entre tiles da mesma família).
  - Antártida (`art-src/pixellab/tiles/antarctica-12`, prompt "packed snow… trampled grey snow… powder… pebbles"): família texturizada `tile_01/05/09/13` → `tile.antarctica.0–3`. O 1º lote (`antarctica-11`, vista `top-down`) saiu em losango 1:1 com bisel e foi descartado.
  - Estação (`station-12`, "worn dark steel deck plates with rivets and frost…"): placas de aço `tile_00/04/08/12` → `tile.station.0–3` (o concreto rachado ficou manchado demais repetido).
  - Ruínas (`ruins-12`, "cracked dark asphalt…"): asfalto `tile_00/01/02/08` → `tile.ruins.0–3`.
- **Decorações** (`create_image_pixflux`, `isometric: true`, 48×48, carro 64×64, 1 geração cada): `deco.antarctica.0–2` (cristais de gelo, rocha com neve, caixote com mão de sangue), `deco.station.0–2` (barris de óleo, contêiner laranja, corrente de âncora + cabeço), `deco.ruins.0–2` (carro queimado, entulho, caçamba tombada). Atlas por bioma: `public/assets/atlas/{antarctica,station,ruins}.png`.
- **Walks** (template, 1 geração/direção): `enemy.zombiePenguin`, `enemy.bloaterPenguin`, `enemy.zombieScientist` com `scary-walk` (8 frames × 5 direções); Bob `walking-8-frames`. Observação: cada lote de animação template deixa às vezes um job "animation" preso em 95% que ocupa slot (os frames já estão prontos).
- Lote seguinte: Lucia `walking-8-frames` (5 direções); zombieMedic `scary-walk` só no sul por enquanto (demais direções com a rotação estática); zombieSeal `walk-8-frames` (template de quadrúpede) em geração; Jack sem arma por referência v3 reenviado (`6babb578-a611-40f8-8c4b-0c9ae55b91f6`). Lote pausado a pedido do usuário para estabilizar o main.

## 2026-09-27 — Walk dos 3 heróis (8 direções, 8 frames)

- Template `walking-8-frames` (1 geração/direção) em s/se/e/ne/n; sw/w/nw espelhados no motor. Bob (`ae2516ed…`) e Lucia (`452419ff…`) direto dos estados sem arma.
- **Jack**: o estado `1a3e6a0e…` ("unarmed") ainda desenha o machete em algumas direções; os frames com lâmina foram limpos com `edit_image` (4 frames por chamada, ~20 gerações cada): sul 0–7, nordeste 0–7, leste 4–7 e norte 0–7 (6 chamadas, ~120 gerações). Os originais com lâmina ficam em `art-src/pixellab/anim-raw/hero.jack/`. O personagem v3 limpo por referência (`6babb578…`) segue na fila do PixelLab; se sair, substitui essa base.
- `pack-heroes`: o `anchorY` agora é a linha mais baixa entre todos os frames do sul de cada animação (antes era só o frame 0, que no walk é meio passo e fazia o herói "flutuar").
- Verificado no navegador andando nas 8 direções com os 3 heróis, sem erros de console.

## 2026-09-27 — Jack v3 limpo, urso andando, fuelBloater e leão-marinho

- **Jack**: o personagem v3 por referência (`6babb578-a611-40f8-8c4b-0c9ae55b91f6`, sul editado sem machete → 8 rotações, 2 gerações) saiu limpo em todas as direções. Agora é a base do Jack: `breathing-idle` (4 frames), `walking-8-frames` (8) e `taking-punch` (sul) em template. O walk anterior (estado `1a3e6a0e` + `edit_image`) fica em `art-src/pixellab/anim-raw/hero.jack/state-walk8/`.
- **Urso polar (boss)**: `walk-8-frames` (template de quadrúpede) nas 5 direções.
- **Concepts novos (P-60, aprovados)**: `enemy.fuelBloater` (`5e242977-c023-4546-89b3-f3acf47fdc8a`) e `enemy.zombieSeaLion` (`fc3024ae-6eca-48e2-ad19-7fc1c3465a2c`), por ora estáticos (rotações). O v3 de personagem demora ~47 min por job hoje.
- Mais concepts v3 aprovados (P-60), por ora estáticos: `enemy.zombieNarwhal` (`eb982fea-2525-4a47-a311-7f1f1283f98b`), `enemy.zombieWalrus` (`6535a234-4f5b-498d-a2ec-d85b475fe365`), `enemy.zombiePigeon` (`c30c00e0-5758-4800-ba13-f9fc786b776b`), `enemy.zombieRiotCop` (`d198629e-5843-454f-9205-b7597429a6a0`), `enemy.zombieCitizen` (`200bd1c4-6ad6-4160-858b-d292a0f74dc0`), `enemy.zombieSoldier` (`b04b2893-99a2-439b-ade9-1e17c5552790`). Em geração: zombieRat, acidBloater, zombieBrute (80 px), kraken e abomination (160 px).
