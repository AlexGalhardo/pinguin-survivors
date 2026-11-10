# ADR-024 — Dois relógios de velocidade: movimento e relógio do round

**Data** 2026-11-10 · **Status** Aceito (desenvolvedor, 2026-11-10, no chat) · **SDD** [018](../sdds/SDD-018-velocidade-de-jogo-dois-relogios.md)

## Contexto

O multiplicador de velocidade (1×–4×) escalava um único `dt` no laço do `GameScene`, então o relógio do round, o spawn e o movimento andavam juntos. O desenvolvedor quer o antigo 2× como padrão de movimento e ataques, mas com os segundos do round descendo em tempo real.

## Decisão

O laço calcula dois deltas a partir do tempo real: `dt = real · 2s` (movimento e ataques, também `time.timeScale` e `tweens.timeScale`) e `clockDt = real · s` (relógio do round, limite do boss, orçamento de spawn, marcas vermelhas de boss e elite). A lógica pura é `speedFactors(s)` em `src/logic/speed.ts`; a atribuição item a item está na SDD-018.

## Alternativas

- Um único `dt` e reduzir só o relógio por fora: o timer da HUD ficaria certo, mas spawn e telegraphs dobrariam a pressão sem controle.
- Manter 1×–4× e só mudar rótulos: não entrega "1× novo = tempo real".
- Todo telegraph em `motion`: cai abaixo de 0,8 s reais no 1× novo e fere a legibilidade.

## Consequências

- Cada sistema escolhe explicitamente qual `dt` recebe; novo sistema de combate usa `dt` de movimento, nova regra de tempo de round usa `clockDt`.
- A dificuldade efetiva sobe (mais combate por segundo de round com o mesmo número de inimigos); requer passada de balanceamento.
- Saves antigos com 3×/4× viram 2×.

## Status

Aceito.
