# QA cross-browser (2026-11-08)

Fluxo React (menu, jogar, seleção, run de ~20 s, loja forçada, próximo round, pausa, desistir, game over, menu) por `bun scripts/qa-browsers.ts` contra o dev server mudo (`http://localhost:5173`), 1366×768, save novo por navegador. Chrome e Edge com `--mute-audio`; Firefox com `media.volume_scale 0`.

| Navegador | Fluxo | Erros de console/página | Respostas 4xx/5xx | FPS | Sem scroll | WebGL |
|---|---|---|---|---|---|---|
| chrome 156.0.8078.80 | ok | 0 | 0 | 49.1 | yes | yes |
| edge 157.0.4341.42 | ok | 0 | 0 | 49 | yes | yes |
| firefox 159.0 | ok | 0 | 0 | 47.3 | yes | yes |

Resultado: zero erros e zero 4xx/5xx nos 3 navegadores.

## Resoluções (Chrome)

| Resolução | DPR | Sem scroll | Canvas preenche a janela | Erros |
|---|---|---|---|---|
| 1366x768 | 1 | yes | yes | 0 |
| 1920x1080 | 1 | yes | yes | 0 |
| 2560x1080-ultrawide | 1 | yes | yes | 0 |
| 2560x1440 | 1 | yes | yes | 0 |
| 3840x2160 | 1 | yes | yes | 0 |
| 1440x900-retina | 2 | yes | yes | 0 |
