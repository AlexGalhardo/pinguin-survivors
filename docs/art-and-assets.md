# Arte e assets — guia de estilo e pipeline

## Direção de arte

- **Pixel art** em tudo: jogo, HUD, menus e fontes. Sem anti-aliasing, sem sub-pixel, sem escala fracionária.
- **Tema**: sci-fi retrô. Planeta alienígena hostil, neon sobre fundo escuro, tecnologia gasta.
- **Paleta**: **Endesga 32** ([lospec](https://lospec.com/palette-list/endesga-32)). Toda cor do jogo sai dela (`src/config/palette.ts`). Exceção: `#FF00FF` como chroma key durante o pipeline, nunca no jogo final.
- **Grid**: personagens, inimigos e itens em **32×32**; boss em **64×64**; ícones de UI em **16×16**; tiles em **32×32**; projéteis de 8×8 a 16×16.
- **Leitura em combate**: jogador com contorno claro e cores quentes; inimigos em tons frios/roxos/verdes; projéteis inimigos sempre em **vermelho/laranja brilhante** (regra de legibilidade).
- **Contorno** escuro de 1 px (cor mais escura da paleta) em sprites de gameplay.
- Vista **top-down 3/4** (levemente de cima e de frente).

## Fases da arte

| Fase | Fonte da arte |
|---|---|
| **Alpha** | 100% gerada por código (canvas / `Graphics.generateTexture`): formas simples em pixels, cores da paleta, fonte bitmap 5×7 desenhada por código. **Nenhum arquivo de imagem.** |
| **Beta** | Placeholders melhores (ainda por código: silhuetas com sombreamento, frames de animação simples) + **art spike** opcional no Higgsfield para validar o pipeline `[~]`. |
| **1.0** | Assets finais gerados por IA (**Retro Diffusion**, D-45) já no grid de pixels, recortados/quantizados e trocados pelo contrato de chaves (`src/art/manifest.ts`). Higgsfield adiado. |

## Contrato de chaves (manifest)

Toda textura, animação e som usa uma chave estável. O placeholder e o asset final usam **a mesma chave**. Exemplos:

```
player.warrior | player.ranger | player.mage          (frames: idle_0..1, walk_0..3, hit_0)
enemy.chaser | enemy.runner | enemy.shooter | enemy.tank | enemy.boss
proj.blaster | proj.psi_orb | proj.enemy | fx.blade_arc
ability.drone | ability.missile | fx.lightning | fx.nova | fx.cryo | fx.laser
pickup.gold | pickup.medkit
tile.floor_0..3 | tile.wall
ui.panel | ui.button | ui.card.common|rare|epic|legendary | icon.<stat|ability|item id>
font.pixel
```

## Lista de assets do 1.0 (checklist de produção)

- Personagens (3) × {idle 2f, walk 4f, hit 1f} = 21 frames
- Inimigos (4) × {walk 2–4f, hit 1f} + Boss 64×64 {idle 2f, attack 2f, charge 1f}
- Projéteis e efeitos: ~10
- Pickups: 2
- Tileset da arena: 4 variações de chão + parede + 3–5 decorações
- UI: painel 9-slice, botão (normal/hover/pressed), 4 molduras de carta, barra de HP, ícones 16×16 (stats ~15, habilidades 6–10, itens 12–40)
- Logo "Starfall Survivors" (`ui.logo`, 176×58) + key art do menu (`ui.keyart`, 640×150, horizonte do planeta ancorado no rodapé): pixel art por código determinístico em `src/art/placeholders/keyart.ts` (filosofia em `art-src/keyart/PHILOSOPHY.md`); `bun scripts/render-keyart.ts` exporta os PNGs para lojas

## Pipeline Retro Diffusion → atlas (padrão desde 2026-09-25)

O Retro Diffusion gera pixel art **nativa** (32 px de verdade, paleta forçada), então não precisa do downscale do pipeline abaixo. Passo a passo completo, estilos e preços na skill `.claude/skills/starfall-art-assets`.

1. `bun scripts/rd-generate.ts --key <chave> --style <estilo> --size <px> --palette [--no-bg] [--sheet] --seed <n> --prompt "..."` → `art-src/rd/<chave>/` + `art-src/rd-log.jsonl`.
2. Receita em `art-src/rd-slices.json` (células `[col,row]`, `flip`, `anchor`, `outline`, `replace`) → `bun scripts/rd-slice.ts` → `art-src/processed/<chave>.png`.
3. `bun scripts/pack-atlas.ts` → `public/assets/atlas.{png,json}`; a `PreloadScene` troca o placeholder chave a chave.
4. Registrar o prompt em [art-prompts.md](art-prompts.md) e conferir no jogo (agent-browser).

## Pipeline Higgsfield/Scenario → sprite pronto (imagens que não estão no grid)

A IA gera imagens "no estilo pixel art", mas **não** gera pixels num grid exato. Por isso todo asset passa por pós-processamento automático:

1. **Gerar** no Higgsfield (MCP `generate_image`). Modelos a testar no spike: Nano Banana Pro, Flux 2 e GPT Image 2 (Soul V2 para manter consistência de personagem). Pedir **fundo sólido magenta #FF00FF** e 1 sujeito centralizado.
2. **Remover o fundo** (chroma key magenta, com tolerância) e cortar (trim) as bordas vazias.
3. **Downscale nearest-neighbor** até o grid alvo (32/64/16 px). Detectar o tamanho do "pixel" da IA para amostrar pelo centro de cada bloco (moda das cores do bloco).
4. **Quantizar para Endesga 32** (cor mais próxima em espaço Lab) e remover pixels órfãos.
5. **Adicionar contorno** de 1 px e alinhar a âncora (pés no centro inferior).
6. **Revisão humana**: ajustes finos no Aseprite (plugin opcional [pixel-plugin](https://github.com/willibrandon/pixel-plugin)).
7. **Empacotar** em atlas (PNG + JSON no formato Phaser) com as chaves do manifest → `public/assets/`.

Script previsto: `scripts/pixelize.ts` (Bun + `sharp`) + `scripts/pack-atlas.ts`. Guardar os brutos em `art-src/raw/` (fora do build) e os processados em `art-src/processed/`.

### Animação e consistência

- Gerar primeiro a **pose base** do personagem e usá-la como **imagem de referência** nos frames seguintes.
- Preferir poucos frames + animação por código (bob, squash/stretch, flash, rotação) a muitos frames inconsistentes.

### Template de prompt (Higgsfield)

```
Pixel art game sprite, 32x32 pixel grid, top-down 3/4 view, [SUBJECT — ex.: armored sci-fi soldier with glowing energy blade],
[POSE/FRAME — ex.: walking, frame 2 of 4, facing down-right], limited palette (Endesga 32),
1px dark outline, flat shading with 2-3 tones per color, no anti-aliasing, no blur, crisp hard pixels,
single character centered, solid flat magenta #FF00FF background, no shadow, no text, no border.
```

Variações: para tiles, trocar por `seamless tileable 32x32 floor tile, alien metal ground`; para ícones, `16x16 icon, [object], centered, high contrast`.

Registrar em `art-src/prompts.md` o prompt, o modelo e a seed de cada asset aprovado (reprodutibilidade).

## UI em pixel art (Alpha: por código)

- Painéis: retângulo com borda de 1 px clara + 1 px escura (bisel) + cantos cortados de 1 px, desenhados via `Graphics` e cacheados como textura 9-slice.
- Fonte: bitmap 5×7 gerada em canvas (A–Z, 0–9, pontuação) → `RetroFont`/BitmapText. Escala sempre inteira.
- Cores das raridades: Common = cinza, Rare = azul, Epic = roxo, Legendary = laranja/dourado (tons da Endesga 32).
