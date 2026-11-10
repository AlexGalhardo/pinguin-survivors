# ADR-008 — Danger 0–5 por herói e endless sem condição de vitória

**Data** 2026-11-08 · **Status** Aceito · **Decisão de origem** B-15, B-16 · **Supera** P-62 (EASY/NORMAL/HARD)

> **Nota (2026-11-10)**: o Danger 0–5 foi substituído por Fácil/Normal/Difícil ([ADR-025](ADR-025-tres-dificuldades-e-teto-de-round.md)); o endless sem vitória segue válido.

## Contexto

A dificuldade atual é EASY/NORMAL/HARD global (±25%). O Brotato usa Danger 0–5 desbloqueado em sequência, o que dá rejogabilidade e conquistas por nível. O desenvolvedor quer endless puro, sem vitória.

## Decisão

- **Danger 0–5 por herói**, salvo em `progress.hero[h].danger`; vencer o boss do round 20 no danger D libera D+1 para aquele herói (20 e não 30 porque não existe vitória: o round 20 é o marco de "run completa" para efeito de desbloqueio).
- Multiplicadores por danger em `src/data/difficulty.ts`: HP/dano dos inimigos, drops de Fish/XP, waves de elite e horda (D0–1 nenhuma; D2–3 uma; D4–5 três), aviso na loja das próximas waves de elite/horda a partir do D2.
- **Endless**: sem tela de vitória; boss a cada 10 rounds; escala por volta de 30 rounds como hoje.

## Alternativas

- Vitória no round 30 + endless desbloqueável: rejeitada pelo desenvolvedor.
- Manter 3 dificuldades: menos rejogabilidade. Rejeitada.

## Consequências

- `difficulty.ts` e testes reescritos; `HeroSelect` mostra o danger por herói e o melhor round por danger.
- Conquistas novas: "round 20 no danger N" por herói; leaderboards Steam por herói e danger (ADR-011).
- Bot e sim recebem `--danger`.
