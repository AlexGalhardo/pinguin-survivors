# SDD-016 — Dez bosses, 5 biomas e ataques em área

**Versão** 1.0 · **Data** 2026-11-10 · **Status** Aprovada (2026-11-10, desenvolvedor no chat: orçamento até 600 gerações, novos bosses nos rounds 5/15/25/35/45, temas da lista, campanha de 50 rounds) · **ADR** [023](../adrs/ADR-023-campanha-50-rounds-10-bosses.md) · **Depende de** SDD-012, SDD-013

## Requisitos

- **RF-01 Campanha de 5 biomas.** `BIOME_IDS` = antarctica, forest, city, station, ruins. `CAMPAIGN_ROUNDS` = 50. O endless começa no 51 e sorteia um bioma por bloco de 10 (determinístico pela seed). Os inimigos da Estação e das Ruínas passam a ter `fromRound` entre 31–36 e 41–46.
- **RF-02 Boss por round.** Uma tabela `BOSS_ROUNDS` em `src/data/enemies.ts` define o boss de cada round múltiplo de 5 até o 50 (ordem do ADR-023). `bossForRound(round, seed)` usa a tabela na campanha e sorteia entre os 10 no endless. Nenhum boss se repete até o round 50.
- **RF-03 Ataques em área (`BossHazard`).** São 4 padrões com aviso vermelho no chão. O aviso se preenche durante o `telegraph`, e o dano é aplicado uma vez na detonação. Lógica pura e testada em `src/logic/boss-hazard.ts`, desenho em `src/systems/BossHazardSystem.ts`:
  - `circles`: N marcas circulares (raio R) sobre o herói e à frente dele, com detonação em sequência (chuva de golpes);
  - `ring`: anéis concêntricos que saem do boss em ondas; ficar no vão entre dois anéis salva;
  - `lines`: K raios retos saindo do boss (o primeiro mira o herói), com largura W e alcance L;
  - `tiles`: piso em xadrez de células de 96 u ao redor do herói. Detona primeiro uma cor e depois a outra; parar numa casa toma dano.
- **RF-04 Perfil.** `BossProfile` ganha `hazards: HazardKind[]` e `hazardEvery` (segundos). Cada boss usa pelo menos 2 padrões, em rodízio. Os números (raio, telegraph, fração do dano) ficam em `BOSS_HAZARD` em `src/data/enemies.ts`. O telegraph mínimo é 0,8 s.
- **RF-05 Legibilidade.** As marcas usam `PALETTE.blood` com alfa crescente e borda mais forte, ficam abaixo dos personagens e acima do chão, e funcionam em tela cheia e no celular. A detonação dá flash e shake leve.
- **RF-06 Arte.**
  - Kraken e Abominação: `walk` de 8 frames gerado do frame atual, salvo em `anim/enemy.<id>/walk-anim`, e `attack` de 8 frames. O pacote usa `walk-anim` como `walk`, e o `walk/…/00.png` original não é apagado.
  - Bosses novos: concept de 2 seeds a 160 px → 🛑 aprovação → `walk` e `attack` v3 de 8 frames em 5 direções.
- **RF-07 Textos.** Nome do boss (`boss.<id>`) e `enemy.<id>.name/desc` nos 4 idiomas para os 5 novos.
- **RF-08 Balanceamento.** As simulações (`bun scripts/sim.ts`) cobrem até o round 50. Três estagiários revisam a curva dos bosses, a progressão dos rounds 31–50 e a economia, e entregam propostas com números. O orquestrador aplica as aprovadas.

## Fora de escopo

SFX novos por boss (usa `sfx.bossRoar`), música nova para Estação e Ruínas e tileset novo (usa o atlas legado).

## Asserts

- `bun test tests/biome.test.ts tests/boss-hazard.test.ts tests/round.test.ts`: os 10 bosses são distintos de 5 a 50, o endless sorteia entre os 10, a geometria dos 4 padrões acerta e erra onde deve, e o telegraph é ≥ 0,8 s.
- `bun run typecheck`, `bun run lint`, `bun scripts/pack-atlas.ts --check`.
- Browser: `?skipMenu=1&hero=jack&round=5&seed=1&debug=1` (e os rounds 15, 35, 40 e 50) com as marcas vermelhas visíveis antes do dano e sem erro de console.
