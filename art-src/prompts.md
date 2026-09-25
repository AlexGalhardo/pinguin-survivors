# Registro de prompts de arte (Higgsfield → pipeline)

> **Desde 2026-09-25 o histórico oficial está em [docs/art-prompts.md](../docs/art-prompts.md)** (Retro Diffusion, D-45). Este arquivo fica para imagens fora do grid (Higgsfield/Scenario → `pixelize.ts`).

> Um registro por asset **aprovado**: prompt, modelo, seed, data e a chave do manifest.
> Pipeline: `art-src/raw/<chave>@<tamanho>.png` → `bun scripts/pixelize.ts --all` → `art-src/processed/<chave>.png` → `bun scripts/pack-atlas.ts` → `public/assets/atlas.{png,json}` (carregado pela `PreloadScene`; o que faltar continua como placeholder por código).
> Sheets animadas (`player.<classe>.idle` 2f, `player.<classe>.walk` 4f) são tiras horizontais de quadros 32×32.

## Template de prompt

```
Pixel art game sprite, 32x32 pixel grid, top-down 3/4 view, [SUBJECT],
[POSE/FRAME], limited palette (Endesga 32), 1px dark outline, flat shading with 2-3 tones per color,
no anti-aliasing, no blur, crisp hard pixels, single character centered,
solid flat magenta #FF00FF background, no shadow, no text, no border.
```

## Assets aprovados

| Chave do manifest | Tamanho | Modelo | Seed | Prompt (resumo) | Data |
|---|---|---|---|---|---|
| _(nenhum ainda — o Higgsfield MCP não está configurado; ver Pendências no PLAN.md)_ | | | | | |

## Lista de chaves a produzir

Veja `src/art/manifest.ts` (`TEX`, `SFX`) e `src/art/placeholders/sheets.ts` (`SHEETS`). Ícones: `icon.<id>` (16×16) para stats, habilidades e itens (`src/art/placeholders/icons.ts`).
