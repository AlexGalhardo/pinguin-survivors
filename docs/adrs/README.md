# ADRs — Architecture Decision Records

Formato de cada ADR: **Contexto → Decisão → Alternativas → Consequências → Status**. Um arquivo por decisão, numerado, nunca editado depois de aceito (uma nova decisão supera a antiga com `Status: superado por ADR-NNN`).
Decisões de produto anteriores à virada comercial (P-01…P-68) estão em [ADR-000](ADR-000-decisoes-anteriores.md); a entrevista que originou estes ADRs está em [../brainstorming.md](../brainstorming.md).

| ADR | Título | Status |
|---|---|---|
| [ADR-000](ADR-000-decisoes-anteriores.md) | Registro das decisões anteriores (P-01…P-68) | Histórico |
| [ADR-001](ADR-001-stack-phaser4-typescript.md) | Stack: Phaser 4 + TypeScript, sem porte para Bevy | Aceito |
| [ADR-002](ADR-002-ui-react-tailwind-overlay.md) | Toda a UI em React + Tailwind v4 como overlay DOM | Aceito |
| [ADR-003](ADR-003-topdown-arena-quadrada.md) | Câmera top-down 2D e arena quadrada crescente | Aceito |
| [ADR-004](ADR-004-reaproveitar-arte-low-topdown.md) | Reaproveitar sprites low top-down; novos em 4 direções | Aceito |
| [ADR-005](ADR-005-seis-slots-de-arma.md) | Seis slots de arma iguais, arma inicial escolhida | Aceito |
| [ADR-006](ADR-006-loja-fim-de-round-e-cartas-no-level-up.md) | Loja no fim do round e cartas de stat no level-up | Aceito |
| [ADR-007](ADR-007-fish-na-run-perolas-meta.md) | Fish como moeda da run, Pérolas como moeda meta | Aceito |
| [ADR-008](ADR-008-danger-0-5-e-endless.md) | Danger 0–5 por herói e endless sem vitória | Aceito (Danger superado pelo ADR-025) |
| [ADR-009](ADR-009-remover-vozes.md) | Remover vozes e legendas; snapshot em `legacy-voices` | Aceito |
| [ADR-010](ADR-010-idiomas-en-ptbr-es-zh.md) | Idiomas da 1.0: EN, PT-BR, ES, ZH simplificado | Aceito |
| [ADR-011](ADR-011-preco-e-integracoes-steam.md) | Preço US$ 4,99, Android premium, conquistas/cloud/leaderboards | Aceito |
| [ADR-012](ADR-012-electron-windows-capacitor-landscape.md) | Electron Windows primeiro; Capacitor landscape only | Aceito |
| [ADR-013](ADR-013-demo-rounds-1-10-jack.md) | Demo: rounds 1–10, só Jack, save migra | Aceito |
| [ADR-014](ADR-014-site-github-pages.md) | Site e `/demo` no mesmo build Vite, GitHub Pages | Aceito |
| [ADR-015](ADR-015-versionamento-vukem.md) | Versionamento padrão vukem e retag do histórico | Aceito |
| [ADR-016](ADR-016-biomas-floresta-cidade-aliens.md) | Bioma 2 floresta, bioma 3 cidade destruída com aliens originais; endless sorteia biomas legados | Aceito (nomes propostos) |
| [ADR-017](ADR-017-raridade-unica-afixos-e-loja.md) | Raridade única I–V, afixos aleatórios, loja só I–III e drops IV (Elite) e V (Boss) | Aceito |
| [ADR-018](ADR-018-linguagem-visual-diablo-4-e-menus-neutros.md) | Linguagem visual Diablo 4, pausa com o layout da loja e menus neutros | Aceito |
| [ADR-019](ADR-019-arvore-de-habilidades.md) | Árvore de habilidades por herói (estilo PoE2; apresentação em grade pelo ADR-026) substitui a Oficina e os pontos de stat | Aceito |
| [ADR-020](ADR-020-save-em-tres-slots.md) | Save em três slots (documento único, `SaveData` no lugar), sem compatibilidade com saves antigos | Aceito |
| [ADR-021](ADR-021-loja-de-evolucao.md) | Loja de evolução: só itens novos ou melhores, I–V à venda, IV com Marca de Elite e V com Núcleo de Boss | Aceito |
| [ADR-022](ADR-022-ui-diablo-4-organica.md) | UI Diablo 4 orgânica (Estilo D) em todos os menus e no HUD; títulos em Cinzel | Aceito |
| [ADR-023](ADR-023-campanha-50-rounds-10-bosses.md) | Campanha de 50 rounds, 5 biomas e 10 bosses; endless a partir do 51 | Aceito |
| [ADR-024](ADR-024-dois-relogios-de-velocidade.md) | Dois relógios de velocidade: movimento (2×s) e relógio do round (s) | Aceito |
| [ADR-025](ADR-025-tres-dificuldades-e-teto-de-round.md) | Três dificuldades (Fácil/Normal/Difícil) no lugar do Danger 0–5 e teto de 2 min nos rounds comuns | Aceito |
| [ADR-026](ADR-026-arvore-de-habilidades-em-grade.md) | Árvore de habilidades em grade de quadrados (emenda de apresentação do ADR-019) | Aceito |
| [ADR-027](ADR-027-ui-plana.md) | UI plana: sem sombras nem molduras de card, grupos por borda fina de 1 px, um botão por função (emenda o ADR-022) | Aceito |
