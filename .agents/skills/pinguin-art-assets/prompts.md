# Prompts de arte (PixelLab API v2) — base fixa e blocos por tipo

Antes de gerar, monte o prompt por este arquivo: **BASE + bloco do tipo + campos variáveis**. Só os campos entre `{chaves}` mudam entre assets; o resto é copiado. Fontes: [visual.md](../../../docs/visual.md) §1–§5 e §13 (sufixos e registro de produção), [SDD-012](../../../docs/sdds/SDD-012-arte-topdown-e-vfx.md) (lotes e requisitos), logs `art-src/pixellab/log.jsonl`. Itens marcados **(proposta)** não têm exemplo aprovado no log e precisam de teste piloto antes de lote.

## 1. Base fixa (vale para todo asset)

Texto que entra em todo prompt, nesta ordem:

```
{subject}. pixel art, top-down 3/4 view like Brotato, {palette_hint}, {outline}, {light}, {style_suffix}, no text, no watermark, no background
```

| Campo | Valor | Origem |
|---|---|---|
| `{palette_hint}` | `desaturated blue-grey polar night palette with warm highlights` (cenário) ou `saturated colors` (herói e itens) | visual.md §1 (**proposta** do texto exato) |
| `{outline}` | `single color black outline` (personagens, armas, props); vazio em tiles | visual.md §1 e §3; `outline` do v3 no log |
| `{light}` | `soft shading, one light source from the top left` | **proposta**; log usa `detailed shading`, `highly detailed` nas armas |
| `{style_suffix}` | ver §2 abaixo, por família de asset | visual.md §3 |
| fim fixo | `no text, no watermark, no background` | **proposta** (o log não tem campo de negativo) |

**Evitar no texto** (proposta, o schema da API não foi conferido para um campo `negative_prompt`): `isometric`, `isometric action RPG`, `Diablo`, `perspective tilt`, `side-scroller`, `gradient background`, `text`, `frame`, `multiple objects` (exceto em props e tiles). Sufixos legados com `isometric` estão em `docs/visual.md` §13 e não devem ser copiados.

**Paleta**: os nomes de cor vêm de `src/config/palette.ts` (noite polar, sangue, auras roxo e laranja, raridades comum/rara/épica/lendária, 4 elementos). Limite de cores por sprite: **(proposta) ≤ 32**.

## 2. Sufixos de estilo por família (copiar literal)

| Família | Sufixo (visual.md §3) |
|---|---|
| Herói | `cute but battle-worn, scars and bandages, dirty worn gear, zombie apocalypse survivor, top-down action roguelite hero like Brotato, readable silhouette, chibi proportions` |
| Inimigo | `zombie apocalypse monster, pale greenish rotting skin or feathers, open red wounds, glowing eyes, dripping blood, top-down action roguelite enemy, readable silhouette` |
| Boss | `(proposta) massive zombie apocalypse boss, same rotting palette as enemies, top-down action roguelite boss, readable silhouette` |
| Arma | `game weapon item sprite, side view` (log) + `detailed shading, highly detailed` (visual.md §13) |
| Tile e borda | `seamless tileable ground texture seen from directly above, uniform, no objects, lineless, high top-down` (log `tex.antarctica.0`) |
| Prop | `game prop sprite, high top-down, single color black outline, transparent background` (**proposta**) |
| VFX | `(proposta) animated magic or blood effect, bright core, transparent background, no outline` |
| Ícone de item | `game UI item icon, centered, dark fantasy RPG inventory icon, {rarity} glowing quality` (log `item.helmet.miner`) |

## 3. Parâmetros da API v2 por tipo

| Tipo | Endpoint | Tamanho | View / direções | Outline / detalhe | Seed e consistência | Custo medido |
|---|---|---|---|---|---|---|
| Herói | `/create-character-v3` (pro: `create_with_style`) | 96×96 (~88 px de altura) | `low top-down`, 8 rotações | `single color black outline`, `high detail` | seeds por herói (101, 202, 303); referência do approved `character_id` | ~3 (96 px); 5 (160) |
| Animação herói | `/characters/animations` `mode: template` | mesmo canvas | 5 geradas + 3 espelhadas | — | `breathing-idle` 4, `walking-8-frames` 8, `taking-punch` 6, `falling-back-death` 7 | 1 por direção |
| Inimigo | `/create-character-v3` | 64–80 (~56–64 px) | 8 rotações | igual herói | seed da variante aprovada; concept em 4 direções antes da animação | ~3 |
| Animação inimigo | template | canvas do inimigo | 5 geradas | — | `scary-walk` 8 frames (existentes); **novos com 6** (visual.md §3) | 1 por direção |
| Boss | `/create-character-v3` | 160 | 8 | igual herói | seed da variante aprovada | ~5 |
| Arma (tier I–IV) | `/create-image-pixflux` | 64×32, 72×32, 80×32 (linha); 48×24 ou 32×32 (secundária) | `side`, apontando para a direita, empunhadura à esquerda (origem 0,15) | `detailed shading, highly detailed`, `black outline` | **mesma seed por linha de arma** (log: 22 para as escopetas e cajados) | ~1 |
| Tile de chão | `/create-topdown-tileset` ou `/create-tiles-pro` com `view: top-down` (lote de 16) | 64×64 | `top-down` | sem outline | `seed` fixa por bioma (log: 12); 4–6 variantes | 25–40 por lote |
| Prop | `/create-image-pixflux` | 48×48 (carro 64×64) | `high top-down` | `black outline` | seed fixa por bioma (log: 11) | ~1 |
| VFX | `/create-1-direction-object` + `/objects/{id}/animations` | 128–192 | 1 direção | sem outline | ≥ 12 frames (visual.md §6, SDD-012 RF-07) | não medido |
| Ícone 32×32 | `/create-image-pixflux` | 32×32 | — | `black outline` (proposta) | seed fixa por lote (log: 11) | ~1 |
| Badge e moeda | `/create-image-pixflux` | 64×64 | — | `black outline` | seed 33 escolhida no `ui.achievement` | ~1 |
| Lojista NPC | `/create-character-v3` | 96×96 | 1 direção (sul) | igual herói | concept aprovado, depois `breathing-idle` template | ~3 + ~1 |
| Key art | `/generate-image-v2` | 688×384 (maior 16:9) | cena | — | seeds 7 e 42 | ~30 (visual.md §10) |

Schema oficial: `https://api.pixellab.ai/v2/openapi.json`. Antes de cada lote, `GET /balance`.

## 4. Blocos por tipo (campos variáveis)

### 4.1 Personagem e inimigo

```
{subject}, {silhouette}, {detail}. {style_suffix}
```

- `{subject}`: frase curta com a criatura ou herói. Ex.: `a zombie penguin shambling forward with torn flippers, one eye hanging, fast horde enemy`.
- `{silhouette}`: traço que deixa a forma legível no celular. Ex.: `hunched back, wide flippers`.
- `{detail}`: 2–3 marcas de guerra. Ex.: `open red wounds, glowing green eyes`.

### 4.2 Boss

Mesmo bloco de 4.1, com `{scale}` (`massive`, `towering`) e `{attack_pose}` (`mid-roar`, `raised claws`). Canvas 160.

### 4.3 Arma por tier

```
a single {weapon_name} weapon lying horizontally, blade or head pointing to the right, {grip} on the left, {material} with {damage_detail}, game weapon item sprite, side view, {tier_detail}
```

- `{tier_detail}`: I = `simple, clean metal`; II = `(proposta) light wear and a thin colored edge`; III = `(proposta) reinforced parts and a visible glow along the edge`; IV = `(proposta) strongest glow, extra parts, sharpest detail`.
- Mesmo enquadramento e tamanho do tier I (SDD-012 RF-05). Ver a divergência com visual.md §4 no relatório.

### 4.4 Tile e borda

```
seamless tileable ground texture seen from directly above, {surface} at night, {wear}, uniform, no objects, lineless, high top-down
```

- `{surface}`: `packed grey-blue snow` (Antártida), `worn dark steel deck plates with rivets and frost` (estação), `cracked dark asphalt` (ruínas). Os dois últimos são os prompts do log (`station-12`, `ruins-12`).
- `{wear}`: `trampled footprints` ou `small ice cracks`.
- Borda: `{edge_element}` (parede, gelo, contêiner, entulho) com cantos; **(proposta)** o texto exato da borda ainda não está no log.

### 4.5 Prop

```
{prop_name}, {material_detail}, game prop sprite, high top-down, single color black outline, transparent background
```

Ex.: `a dark grey boulder half covered in snow` (log `deco.antarctica.1`). Sem `isometric: true`.

### 4.6 VFX

```
{effect_name}: {shape}, {color_core}, {color_edge}, animated loop, transparent background, no outline
```

Usar `create-1-direction-object` com ≥ 12 frames. Efeitos dos superpoderes (visual.md §6): tornado de sangue (Jack), bombardeio com sinalizador e crateras (Bob), vórtice de 4 cores com meteoro e pilares (Lucia). Todos **(proposta)** até o primeiro lote.

### 4.7 Ícone (carta, item, poção, moeda, danger)

```
game UI {icon_kind} icon: {object}, {rarity} glowing quality, dark fantasy RPG inventory icon, centered
```

- `{icon_kind}`: `item`, `stat`, `potion`, `coin` (**proposta**), `danger` (**proposta**).
- `{rarity}`: `common`, `rare`, `epic`, `legendary` (cores de `palette.ts`).
- Ícone de carta de stat (proposta): `{object}` = símbolo do stat (coração, escudo, bota). Canvas 32×32.

### 4.8 UI

Molduras, painéis e botões são CSS/SVG, não PixelLab (visual.md §7). Gerar só ícones (4.7) e retratos.

### 4.9 Lojista (NPC)

```
old penguin merchant with a fish cart, patched coat, lantern, {silhouette}. {style_suffix}
```

Concept 96×96, 1 direção (sul), depois `breathing-idle` template. Gate: aprovação do desenvolvedor antes da animação.

## 5. Checklist antes de gastar créditos

1. Bloco e sufixo da família copiados literalmente; nenhum `isometric`, `iso` ou `Diablo` no prompt.
2. Tamanho, view e direções conferidos com a tabela da §3. Alterar tamanho só com ADR (regra 5 do SKILL).
3. Seed fixa da família (armas, tiles, props, personagem) anotada no prompt ou no registro.
4. Fundo transparente, outline só onde a tabela manda (tiles sem outline).
5. `GET /balance`. Piloto de 1 direção ou 1 item antes do lote. Lote > 200 gerações ou regeneração de personagem: OK do desenvolvedor.
6. Concept de personagem novo: prancha `bun scripts/pack-sheet.ts` e aprovação do desenvolvedor antes da animação (gate 🛑).
7. Após cada geração: linha em `art-src/pixellab/log.jsonl`; resumo em `docs/visual.md` §13 (registro) e saldo em §10.
8. Token só no `.env` (`PIXELLAB_API_TOKEN`); nada de token em prompt ou log.

## 6. Exemplos preenchidos

### 6.1 Inimigo do bioma 1: zombiePenguin (concept, variante de teste)

Campos: `{subject}` = `a zombie penguin shambling forward with torn flippers, one eye hanging, fast horde enemy`; `{silhouette}` = `hunched back, short wide flippers`; `{detail}` = `open red wounds, glowing green eyes`.

```
a zombie penguin shambling forward with torn flippers, one eye hanging, fast horde enemy, hunched back, short wide flippers, open red wounds, glowing green eyes. pixel art, top-down 3/4 view like Brotato, desaturated blue-grey polar night palette with warm highlights, single color black outline, soft shading, zombie apocalypse monster, pale greenish rotting skin or feathers, open red wounds, glowing eyes, dripping blood, top-down action roguelite enemy, readable silhouette, no text, no watermark, no background
```

- Endpoint `/create-character-v3`, `size` 64, `view` `low top-down`, 8 rotações, `outline` `single color black outline`, `detail` `high detail`, seed de teste 22 (a variante aprovada `zombiePenguin-22` está em `art-src/pixellab/concepts/enemies/`).
- Custo ~3 gerações. Animação `scary-walk` com 8 frames já existente; novos com 6.
- Obs.: a descrição aprovada de `zombiePenguin-22` ainda tem o sufixo "isometric action RPG enemy like Diablo 2"; o prompt acima substitui esse sufixo e precisa de piloto antes de virar lote.

### 6.2 Machete tier III (proposta de detalhe, enquadramento do tier I)

```
a single bloody machete weapon lying horizontally, blade pointing to the right, wrapped leather handle on the left, reinforced steel blade with a bright red glow along the edge and extra rivets on the grip, detailed shading, highly detailed, black outline, game weapon item sprite, side view
```

- Endpoint `/create-image-pixflux`, `size` 64×32 (mesmo do tier I), seed 22 (família de armas), 1 geração.
- Base de comparação: o prompt do tier I já gerado (log `weapon.machete`: "a single bloody machete weapon lying horizontally, blade pointing to the right, wrapped leather handle on the left, chipped steel blade with red blood stains, game weapon item sprite, side view").
- Tier III: `{tier_detail}` = `reinforced parts and a visible glow along the edge` (proposta). Aceitar só depois de ver o tier II e III lado a lado na prancha.

### 6.3 Tile da Antártida (variante de chão)

```
seamless tileable ground texture seen from directly above, packed grey-blue snow at night, trampled footprints and small ice cracks, uniform, no objects, lineless, high top-down
```

- Endpoint `/create-topdown-tileset` (ou `/create-tiles-pro` com `view: top-down`), 64×64, 4–6 variantes sem costura, seed fixa do bioma (log: 12 em `art-src/pixellab/tiles/antarctica-12/`).
- Base do log (`tex.antarctica.0`, seed 11): `packed dark blue-grey snow at night with subtle footprints and small ice cracks`. A versão acima junta a paleta de visual.md §5 (neve pisoteada cinza-azulada).
- Custo: lote de 16 = 25–40 gerações. Validar com `bun scripts/pack-sheet.ts --tile 3x3` (SDD-012 A2).

### 6.4 Ícone de item (exemplo de formato)

```
game UI item icon: a miner hard hat with a headlamp, rare blue glowing quality, dark fantasy RPG inventory icon, centered. pixel art, black outline, transparent background, no text, no background
```

Mesmo formato do log `item.helmet.miner` (seed 11, 32×32), com o fim fixo da §1.
