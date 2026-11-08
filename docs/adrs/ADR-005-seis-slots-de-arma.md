# ADR-005 — Seis slots de arma iguais e arma inicial escolhida na seleção de herói

**Data** 2026-11-08 · **Status** Aceito · **Decisão de origem** B-07, B-08 · **Supera** P-20, P-21 (tiers por herói), P-63 (parcial), P-67 (limite de 4)

## Contexto

Hoje o herói tem 1 arma assinada com evolução T1→T2→T3 por carta mais até 3 secundárias (P-67). O Brotato, referência do público, usa 6 slots iguais, armas em 4 tiers, combinação de duas iguais e bônus por classe. A pesquisa ([web-research.md](../web-research.md) §2.3, §6) aponta "a arma não importa" como a crítica mais comum a concorrentes sem sinergia explícita.

## Decisão

1. **6 slots iguais**. Não existe mais arma assinada nem evolução por carta.
2. **Arma inicial**: na seleção de herói o jogador escolhe 1 arma de uma lista por herói (Jack: machete, facas, bumerangue; Bob: cano duplo, pistola, besta; Lucia: cajado elemental, estilhaços de gelo, anel de chamas). A lista cresce com desbloqueios.
3. As 9 armas "assinadas" viram armas normais da loja com **tiers I–IV** (machete I, katana II, chainsword III, etc.); cada arma tem variantes de tier com stats escalados.
4. **Classes** (tags): `melee`, `firearm`, `magic` (mantidas, com os multiplicadores por herói) + subclasses de set (ex.: `blade`, `blunt`, `gun`, `explosive`, `elemental`, `support`). Bônus de set por 2/4/6 armas da mesma classe.
5. **Fusão**: duas armas iguais do mesmo tier na loja/inventário podem ser fundidas numa do tier seguinte (grátis, como Brotato).
6. As antigas "secundárias" com comportamento de arma viram armas (facas, molotov, estilhaços, pistola, bumerangue, mina, anel, totem, nuvem, besta); as exclusivas por herói com comportamento passivo/ativo viram **cartas exclusivas** do level-up (ADR-006).

## Alternativas

- 4 slots com slot 1 fixo evoluindo T1→T3: mantém identidade, mas limita builds e não casa com a loja. Rejeitada pelo desenvolvedor.
- Arma inicial fixa por herói: menos decisão no início. Rejeitada.

## Consequências

- `src/data/weapons.ts` reorganizado por classe e tier; `src/data/secondaries.ts` dividido entre armas e cartas exclusivas.
- `WeaponRing`/`WeaponSystem` passam a posicionar até 6 armas ao redor do herói; cada arma mira o alvo mais próximo no alcance.
- Balanceamento refeito (sim e bot) para 6 armas; `balancing-and-simulation.md` Parte B §6 reescrito.
- Conquistas de "evolução T3" são substituídas por conquistas de set/fusão.
