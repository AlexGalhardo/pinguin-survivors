# Histórico de prompts de arte (IA)

> Registro humano de **toda** geração de arte por IA: ferramenta, estilo/modelo, tamanho, seed, custo, prompt e o que foi aproveitado.
> O registro de máquina (append-only) fica em `art-src/rd-log.jsonl` (gravado pelo `scripts/rd-generate.ts`).
> Brutos: `art-src/rd/<chave>/`. Receitas de recorte: `art-src/rd-slices.json`. Processados: `art-src/processed/`. Atlas: `public/assets/atlas.{png,json}`.
> Guia de uso das ferramentas e do estilo: skill [`.claude/skills/starfall-art-assets`](../.claude/skills/starfall-art-assets/SKILL.md).

## Convenções que funcionaram

- **Sempre `--palette`** (Endesga 32 via `input_palette`): as cores já saem da paleta e a quantização quase não muda nada.
- Sujeito curto e concreto: `<tamanho> <cor principal> <criatura/objeto> with <1–2 detalhes marcantes>`. O RD expande o prompt sozinho; não precisa repetir "pixel art", "32x32" nem "top-down" nos estilos que já são top-down.
- Heróis: estilo `rd_animation__small_sprites` (32×32, sheet 5×4: linha 0 frente, linha 1 lado, linha 2 costas, linha 3 extras; o último quadro da linha 3 é um "caído" que pode virar frame de morte).
- Inimigos 32 px: `rd_plus__topdown_item` com `--no-bg`. Eles vêm **sem contorno**: o `rd-slice.ts` adiciona o contorno de 1 px (`"outline": true`).
- Boss 64 px: `rd_plus__low_res` 64×64 com `--no-bg` e "top-down 3/4 view, video game boss" no fim do prompt.
- Pisos: `rd_tile__single_tile` sai claro e com detalhes vermelhos; **vermelho é reservado a tiros inimigos**, então o recorte remapeia as cores (`"replace"`) para os tons navy da arena.
- Custos medidos (API v2, set/2026): small_sprites US$0,07 · topdown_item 32 px US$0,025 · low_res 64 px US$0,03 · single_tile 32 px US$0,025/imagem. `--check` mostra o preço antes, de graça.

## Sessão 2026-09-25 — piloto com Retro Diffusion (US$0,489 de US$0,50)

| Chave | Estilo | Tam. | Seed | Custo | Prompt | Resultado |
|---|---|---|---|---|---|---|
| `player.warrior` | rd_animation__small_sprites | 32 | 101 | 0,07 | sci-fi warrior in orange and steel power armor, glowing cyan energy sword, dark visor helmet | ✅ usado (idle = linha 0 col 0–1; walk = linha 1 col 0,1,0,2; lado já olha para a direita). A espada quase não aparece. |
| `player.ranger` | rd_animation__small_sprites | 32 | 102 | 0,07 | sci-fi ranger in green and tan scout armor, hooded, holding a compact blaster pistol, yellow goggles | ✅ usado (walk espelhado: o lado olha para a esquerda) |
| `player.mage` | rd_animation__small_sprites | 32 | 103 | 0,07 | sci-fi psionic mage in purple robe with glowing cyan psi orb floating over the hand, hood, silver trims | ✅ usado (walk espelhado); o orbe ciano aparece bem |
| `enemy.chaser` | rd_plus__topdown_item | 32 | 201 | 0,025 | small green alien slime blob monster with angry eyes and tiny claws | ✅ usado |
| `enemy.runner` | rd_plus__topdown_item | 32 | 202 | 0,025 | small fast magenta alien spider bug with thin legs and glowing eyes | ✅ usado (saiu vermelho/verde, lê bem) |
| `enemy.shooter` | rd_plus__topdown_item | 32 | 203 | 0,025 | hovering alien sentry drone, grey metal sphere with one glowing red eye and side antennas | ✅ usado |
| `enemy.tank` | rd_plus__topdown_item | 32 | 204 | 0,025 | large armored dark purple alien beetle with heavy spiked shell | ✅ usado (parece aranha blindada; escuro, depende do contorno) |
| `enemy.boss` | rd_plus__low_res | 64 | 205 | 0,03 | giant purple alien brain overlord monster with three yellow eyes, tentacles and a spiked crown, top-down 3/4 view, video game boss | ✅ usado |
| `tile.floor` (×2) | rd_tile__single_tile | 32 | 301 | 0,049 | dark navy blue sci-fi metal floor plate of an alien planet base, subtle scratches and rivets, low contrast | ✅ img 1 (placa) → `tile.floor_0..3` recolorida; img 0 (tijolos) → `tile.wall` recolorida |
| `enemy.splitter` | rd_plus__topdown_item | 32 | 206 | 0,025 | round teal alien jelly cell creature with a visible nucleus, about to divide in two | ✅ usado |
| `enemy.bomber` | rd_plus__topdown_item | 32 | 207 | 0,025 | small alien kamikaze bug carrying a glowing orange bomb sac on its back | ✅ usado |
| `enemy.healer` | rd_plus__topdown_item | 32 | 208 | 0,025 | floating alien medic jellyfish with glowing green cross markings and tentacles | ✅ usado (a cruz verde não apareceu; lê como água-viva) |
| `enemy.burrower` | rd_plus__topdown_item | 32 | 209 | 0,025 | brown alien burrowing worm head emerging from the ground with sharp mandibles | ✅ usado |

Comandos exatos (reproduzíveis):

```bash
bun scripts/rd-generate.ts --key player.warrior --style rd_animation__small_sprites --size 32 --palette --sheet --seed 101 --prompt "..."
bun scripts/rd-generate.ts --key enemy.chaser --style rd_plus__topdown_item --size 32 --palette --no-bg --seed 201 --prompt "..."
bun scripts/rd-generate.ts --key enemy.boss --style rd_plus__low_res --size 64 --palette --no-bg --seed 205 --prompt "..."
bun scripts/rd-generate.ts --key tile.floor --style rd_tile__single_tile --size 32 --n 2 --palette --seed 301 --prompt "..."
bun scripts/rd-slice.ts && bun scripts/pack-atlas.ts   # recorta, quantiza, contorna e empacota
```

### Ferramentas não usadas nesta sessão (e por quê)

- **pixel-mcp (Aseprite)**: o Aseprite não está instalado; o usuário escolheu pular. Setup documentado na skill.
- **Scenario MCP**: exige conta + OAuth; o usuário escolheu pular. Setup documentado na skill.
- **Retro Diffusion MCP** (`https://mcp.retrodiffusion.ai/mcp`): não foi registrado nesta sessão (adicionar um MCP exige reiniciar a sessão). Usamos a **API REST v2**, que é o mesmo backend, via `scripts/rd-generate.ts`. Setup do MCP na skill.
- **PixelLab MCP** (fallback autorizado): conectado, mas o trial estava esgotado (US$0,00, 42/40 gerações). Nada gerado.

### Ainda com placeholder por código (próximo lote)

`enemy.boss2`, `enemy.boss3`, `enemy.splitling`, projéteis e efeitos (`proj.*`, `fx.*`, `ability.*`), pickups, decorações (`deco.*`), UI (painel, botões, molduras de carta, seta) e ícones 16×16. Decisão do usuário (D-52): ficam por código até haver créditos. O logo e a key art do menu não são IA: são pixel art por código (`keyart.ts`). Estimativa com os preços acima: ~US$3–4 para cobrir tudo (ícones em lote de 16 com `rd_plus__skill_icon`/`rd_mini__topdown_item`).
