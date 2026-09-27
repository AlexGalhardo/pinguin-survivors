# Arte e assets

> Ferramenta única de arte: **PixelLab** (API v2 `https://api.pixellab.ai/v2`, docs em `/v2/llms.txt` e `/v2/openapi.json`; MCP `pixellab` configurado no usuário). Siga a skill **`pinguin-art-assets`** e registre todo prompt em [art-prompts.md](art-prompts.md).

## Direção de arte

- **2.5D isométrico clássico 2:1** (Diablo 2) com **atmosfera Diablo 4**: noite polar, neve cinza-azulada dessaturada, vinheta, luzes quentes de tiros/fogo, bloom em magias.
- Heróis **fofos, mas marcados pela guerra**: saturados e legíveis contra o fundo escuro. Inimigos zumbis: pele/penas pálidas esverdeadas, feridas vermelhas, olhos brilhantes.
- **Sangue**: vermelho vivo saturado (destaca na neve). Modo "gosma" troca o vermelho por verde-neon.
- Contorno: **preto de 1 px** (single color black outline) em personagens; tiles sem contorno.
- Vista dos sprites: **`low top-down`** (combina com o chão 2:1).

## Tamanhos (P-05/P-06)

| Asset | Canvas PixelLab | Conteúdo aprox. | Direções | Frames/anim |
|---|---|---|---|---|
| Herói (por tier) | 96×96 | ~88 px de altura (concepts aprovados) | 8 | 12–16 |
| Inimigo comum | 64–80 | ~56–64 px | 8 | 12 |
| Elite | mesmo sprite do inimigo, escala 1,25/1,4 + aura | — | 8 | 12 |
| Boss | 160–256 | 160–256 px | 8 | 12–16 |
| Tile de chão iso | 64×32 (tile) | — | — | — |
| Decoração / objeto | 32–128 | — | 1 | — |
| Arma secundária / projétil | 16–48 | — | 1 ou 8 | 8–12 |
| Badge de conquista (`ui.achievement`) | 64×64 | — | 1 | — |
| VFX (sangue, explosão, magia) | 32–128 | — | 1 | ≥ 12 |

Tela lógica: altura 540, zoom inteiro (2560×1080 → ×2).

## Animações

- **Heróis**: `idle`, `walk`, `attack`, `hurt`, `death`, **`super`** (conjuração do superpoder) × 8 direções × **3 tiers** de arma assinada (T1/T2/T3).
- **VFX dos superpoderes** (exclusivos, ≥ 12 frames, 128–256 px): Colheita Rubra (tornado de sangue e aço), Bombardeio (sinalizador, bombas caindo, explosões, crateras), Cataclismo Elemental (vórtice de 4 elementos, meteoro, pilares de gelo, raios).
- **VFX das cartas exclusivas**: redemoinho de lâminas, pisão sísmico, drone-sentinela, granada, corrente arcana, nova glacial, meteoros, barreira arcana, nuvem tóxica.
- **Inimigos**: `walk`, `attack`, `death` (+ `idle` opcional) × 8 direções.
- **Bosses**: `idle`, `walk`, `attack` (1–2 golpes), `special`, `death` × 8 direções.
- **Mínimo 12 frames** (PixelLab v3 aceita 4–16, par). Loops (idle/walk) em 12; ataques 12–16.

## Pipeline PixelLab

1. **Concept** (`bun scripts/pl-concepts.ts`): cria o personagem com 8 rotações (`/create-character-v3` ou `/create-character-pro`), baixa em `art-src/pixellab/concepts/<id>/` e monta `sheet.png`. **O usuário aprova** antes de qualquer animação.
2. **Tiers da arma**: a partir do personagem aprovado, `/create-character-state` (mesma identidade, "holding a katana") para T2/T3.
3. **Animações**: `/characters/animations` (modo `v3`, `frame_count` 12–16, uma requisição por direção; ou `template` para movimentos padrão). Poll em `/background-jobs/{id}`.
4. **Exportação**: `/characters/{id}/zip` → `art-src/pixellab/<key>/` → fatiar/normalizar → `art-src/processed/` → `bun scripts/pack-atlas.ts` → `public/assets/atlas*.png/json`.
5. **Tiles e objetos**: `/create-isometric-tile`, `/create-tiles-pro`, `/map-objects`, `/create-1-direction-object` (+ animações de objeto para VFX).
6. Registrar em `art-src/pixellab/log.jsonl` (automático) e resumir em [art-prompts.md](art-prompts.md).

### Pipeline em uso (P-58, 2026-09-27)

Sem `PIXELLAB_API_TOKEN` no checkout, a geração é feita pelo **MCP `pixellab`** e os resultados são baixados pelas URLs públicas:

| Etapa | Comando | Saída |
|---|---|---|
| Imagens (armas, ícones, pickups, props) | MCP `create_image_pixflux` → `bun scripts/pl-save.ts lote.json` | `art-src/pixellab/images/<key>/<seed>.png` + `log.jsonl` |
| Personagens (concepts e animações) | MCP `create_character`/`animate_character` → `bun scripts/pl-fetch-char.ts --char <id> (--concept <dir> \| --key <key>)` | rotações em `concepts/…/<dir>.png`; frames em `anim/<key>/<anim>/<dir>/<nn>.png` |
| Escolha | editar `art-src/selection.json` (`key → { src, group?, trim?, crop? }`) | — |
| Normalização | `bun scripts/pack-process.ts` (recorta o transparente) | `art-src/processed/<group>/<key>.png` (gitignored) |
| Atlas | `bun scripts/pack-atlas.ts` | `public/assets/atlas/<group>.png/json` |
| Heróis animados | `bun scripts/pack-heroes.ts hero.<id>` | `public/assets/heroes/hero.<id>.png/json` |
| Revisão / aprovação | `bun scripts/pack-sheet.ts saida.png [--cols N] [--scale N] <arquivos\|pastas>` | prancha com rótulos |

O `BootScene` carrega todos os atlas de `public/assets/atlas/` e registra **cada frame como uma textura com a chave do manifest** (compartilhando a textura da GPU do atlas), então `scene.add.image(x, y, 'weapon.machete')` funciona igual ao placeholder; `installPlaceholders` só desenha as chaves que faltam. Heróis: o atlas `hero.<id>` (sem arma, P-56) vale para os 3 tiers; `hero.<id>.t<n>` sobrescreve um tier se existir.

## Chaves (contrato `src/art/manifest.ts`)

- Personagem: `hero.<id>.t<n>` · `enemy.<id>` · `boss.<id>`.
- Animação: `<chave>.<anim>` (ex.: `hero.jack.t1.walk`), frames `<chave>.<anim>.<dir>.<nn>` com `dir` ∈ `s, se, e, ne, n, nw, w, sw`.
- Tiles: `tile.<biome>.<nome>` · decoração: `deco.<biome>.<nome>` · VFX: `fx.<nome>` · UI: `ui.<nome>` · ícones: `icon.<nome>`.
- Placeholders por código usam **as mesmas chaves** até a arte final entrar.

## Custos medidos (piloto de 2026-09-27, Jack T1 `walk`, 1 direção)

| Modo `/characters/animations` | Frames | Custo real | Qualidade |
|---|---|---|---|
| `v3` (ação em texto, `frame_count` 12) | 12 | **45 gerações** | Melhor: movimento expressivo, identidade estável, canvas cresce para 132 px |
| `template` (`walking`) | 6 | **1 geração** | Boa: identidade perfeita, movimento mais contido |
| `skeleton-v3` (`walking`) | 6 | **3 gerações** | Boa, igual ao template no teste |
| Key art `/generate-image-v2` 688×384 | — | 30 por imagem | Excelente |
| Imagem `/create-image-pixflux` 64×64 | — | ~0,7 por imagem | Boa para ícones |
| Personagem `v3` 96 px / `pro` | — | 3 / 25 | v3 melhor para os heróis |

Frames: `art-src/pixellab/anim/hero.jack.t1/{walk,walk-template,walk-skeleton}/south/`.

## Orçamento (plano Tier 2: 5.000 gerações/mês)

| Item | Estimativa |
|---|---|
| Personagem v3 a 96 px | ~3 gerações (1 pixen + ceil(96²·8/65536)) |
| Personagem Pro | 20–40 gerações |
| Animação v3 | 1 job por direção (custo exato medido no piloto e anotado aqui) |
| Heróis completos | 3 heróis × 3 tiers × 6 anims × 8 dir = **432 jobs** |
| Inimigos bioma 1 | 6 × 3 anims × 8 dir = **144 jobs** |
| Boss bioma 1 | 5 anims × 8 dir = **40 jobs** |

Antes de lotes grandes: `GET /balance` e piloto com 1 direção.

## Referências de estilo

Diablo 2 (layout iso, 8 direções), Diablo 4 (luz/escuridão/sangue), Halls of Torment (survivors iso em pixel), Hyper Light Drifter (pixel + luz), Brotato (ritmo e cartas).
