# ADR-011 — Preço US$ 4,99, Android premium, integrações Steam da 1.0

**Data** 2026-11-08 · **Status** Aceito · **Decisão de origem** B-20, B-22, B-23

## Contexto

Preço de referência do gênero: US$ 4,99 (Brotato, 20 Minutes Till Dawn) a US$ 9,99 (Megabonk). No celular a norma é free + rewarded ads + IAP, mas exige SDK de anúncios e muda a classificação. Ver [web-research.md](../web-research.md) §8.

## Decisão

- **Steam**: US$ 4,99 com preço regional sugerido pela Steam, revisado trimestralmente; desconto de lançamento de 10% (hipótese a validar). Sem DLC na 1.0.
- **Android**: app **premium** no mesmo patamar (sem ads, sem IAP). A camada de monetização fica isolada (`src/core/platform/`) para permitir uma SKU free depois.
- **Integrações Steam na 1.0**: conquistas (mapeadas das 131 existentes), Steam Cloud (save) e leaderboards (melhor round por herói e danger). Via `steamworks.js` no Electron.
- **Gore**: máximo por padrão com toggle; classificação declarada **16+/Mature** com honestidade.

## Alternativas

- US$ 9,99: pixel art 2D sem IP não sustenta. Rejeitada.
- Android F2P com ads: rejeitada para a 1.0.

## Consequências

- Dependências de plataforma só no pacote Electron (SDD-007); o build web não importa Steamworks.
- Leaderboards exigem anti-trapaça mínimo (validação server-side não existe; aceitar risco e registrar).
