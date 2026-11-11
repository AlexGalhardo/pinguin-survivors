# SDD-023 — Fundo da arena por bioma

**Versão** 1.0 · **Data** 2026-11-11 · **Status** Aprovada (2026-11-11: decisão B-36 do desenvolvedor, "Onboarding + fundo da arena"; solução recomendada pelo orquestrador, aplicada sem nova pergunta por ordem de seguir o ROADMAP sem interrupções) · **Depende de** [SDD-001](SDD-001-arena-topdown.md), [SDD-017](SDD-017-ambiente-e-iluminacao.md)

Nos primeiros rounds a arena (640 unidades de lado) é menor que a tela: em 1920×1080 sobram faixas pretas dos dois lados, e em 2560×1440 ou ultrawide elas ocupam mais de um terço da imagem. É a primeira coisa que aparece na demo e no trailer. Esta SDD põe o terreno do bioma em volta da arena.

## Requisitos

- **RF-01 Terreno em volta.** Fora dos muros aparece o chão do próprio bioma (o tile `tile.<bioma>.0` repetido), escurecido por um `tint` da paleta (`PALETTE.snow`), para a área jogável continuar sendo a parte clara e os muros continuarem marcando o limite. Nenhuma arte nova: 0 gerações.
- **RF-02 Um objeto só.** O fundo é **um** `TileSprite` do Phaser 4 (aceita frame de atlas), com profundidade abaixo do chão da arena, criado uma vez e reaproveitado: ao crescer a arena ele muda de tamanho e posição, ao trocar de bioma muda de textura. Sem física, sem objetos por tile.
- **RF-03 Alinhado à grade.** O retângulo do fundo é a arena expandida em `ARENA.backdropTiles` tiles para cada lado (`backdropBounds` em `src/logic/arena.ts`, puro e testado), então o padrão continua a grade de 64 px do chão sem costura.
- **RF-04 Cobertura.** `ARENA.backdropTiles` = 12 (768 unidades por lado): cobre a sobra de tela até 32:9 no round 1, o pior caso (a câmera nunca mostra além dos muros quando a arena é maior que a tela, SDD-001 RF-05).
- **RF-05 Decalques e props** continuam só dentro da arena. Inimigos, tiros e pickups não usam a área de fora.

## Fora do escopo

Cenário próprio fora dos muros (mar, árvores, prédios), parallax e animação: ficam para depois da demo, se as capturas pedirem.

## Aceite

- **A1** `bun test tests/arena.test.ts`: `backdropBounds` expande 12 tiles por lado e mantém o alinhamento de 64 px.
- **A2** Capturas dos rounds 1, 11, 21, 31 e 41 em 2560×1440 (e do round 1 em 1920×1080) sem área preta em volta da arena.
- **A3** `bun scripts/perf.ts --round 40` ≥ 58 FPS; `bun run e2e` sem erro de console.
