# ADR-013 — Demo: rounds 1–10, só Jack, save que migra

**Data** 2026-11-08 · **Status** Aceito · **Decisão de origem** B-26, B-30

## Contexto

Steam Next Fest de 22/02 a 01/03/2027 (inscrição até 10/01, itens até 08/02). Demos de 15–30 min com gancho e botão de wishlist convertem melhor ([web-research.md](../web-research.md) §7). A mesma demo roda na web (`/demo`, GitHub Pages) e na Steam (Electron).

## Decisão

- **Conteúdo**: rounds 1–10 (termina ao vencer ou perder para o urso polar), **só Jack**; Bob e Lucia aparecem bloqueados com "disponível no jogo completo". Danger 0–1 apenas. Oficina, poções e conquistas funcionam.
- **Fim da demo**: tela com resumo, "Bob desbloqueado no jogo completo", botão **Wishlist na Steam** (web e Electron) e "Jogar de novo".
- **Save**: mesmo schema; o jogo completo lê o save da demo (Steam: mesmo Cloud slot; web: export/import). Progresso de Jack, Pérolas e conquistas migram.
- **Build**: flag `VITE_DEMO=1` gera o bundle da demo (gating em `src/data/demo.ts`: `maxRound`, `heroes`, `dangers`). Um único código, dois builds.
- A demo é um **recorte do jogo completo** (B-30): não existe conteúdo exclusivo da demo.

## Alternativas

- 3 heróis na demo: dá o jogo inteiro de graça para quem joga 30 min. Rejeitada.
- Demo isolada sem migração: perde o incentivo de compra. Rejeitada.

## Consequências

- SDD-006 define o gating e a tela final; E2E cobre "round 10 → tela final → wishlist".
- Página da demo na Steam é um app separado (pendência do desenvolvedor: Steamworks).
