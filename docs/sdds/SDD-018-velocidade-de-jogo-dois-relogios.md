# SDD-018 — Velocidade de jogo com dois relógios (movimento e relógio do round)

**Versão** 1.0 · **Data** 2026-11-10 · **Status** Aprovada (2026-11-10, pedido explícito do desenvolvedor no chat) · **Depende de** SDD-001, SDD-016 · **ADR** [024](../adrs/ADR-024-dois-relogios-de-velocidade.md)

## Contexto

O pedido: o padrão do jogo passa a ser o antigo 2× (movimento e ataques mais rápidos) e o jogador pode subir até o antigo 4×, mas os **segundos do round descem em tempo real** no 1× novo e 2× mais rápido no 2× novo. Antes, `GAME_SPEEDS = [1, 2, 3, 4]` multiplicava tudo, inclusive o relógio do round.

## Requisitos

- **RF-01 Velocidades.** `GAME_SPEEDS = [1, 1.5, 2]`, rótulos `1x`, `1.5x`, `2x`; padrão `1`. TAB e Configurações ciclam 1 → 1,5 → 2 → 1.
- **RF-02 Dois fatores.** Para a velocidade `s`: `motion = 2·s` e `clock = s` (`speedFactors`, `src/logic/speed.ts`). No 1× novo tudo se move como o antigo 2× e o relógio anda em tempo real; no 2× novo move como o antigo 4× e o relógio anda 2× mais rápido.
- **RF-03 Atribuição.** Tabela abaixo; tudo que não está em `clock` segue `motion`.
- **RF-04 Save.** `settings.gameSpeed` inválido vira `1`; valores `> 2` do esquema antigo (3 e 4) viram `2`. O load nunca quebra; sem compatibilidade retroativa antes da 1.0.
- **RF-05 Feat `bossAt2x`.** Dispara com `speed >= 2` (o novo 2×).
- **RF-06 Subpassos.** O passo fixo continua sujeito a `MAX_STEP` (1/30 s): `ceil(dt_motion / MAX_STEP)` subpassos por frame, cada um com a fatia correspondente de `clock`.

## Atribuição item a item

| Item | Relógio | Motivo |
|---|---|---|
| Movimento do herói, inimigos, projéteis (herói e hostis), boomerangues, empurrões | `motion` | é a velocidade pedida |
| Cadência e cooldown das armas, secundárias, ataques corpo a corpo, cooldown de golpes de boss e elite, IA e preparo (`windup`) dos inimigos | `motion` | "ataques" do pedido; mantém a sincronia com a animação |
| Animações, tweens e `time.timeScale` do Phaser, partículas de combate, números de dano (`FxSystem`) | `motion` | sincronia visual |
| Status e DoT (sangramento, veneno, queimadura, congelar), poções ativas, perks, veneno no herói | `motion` | dano e duração andam com o combate; senão o DoT valeria metade |
| Duração e carga do superpoder | `motion` | é combate; sua duração real cai com o ritmo, como o resto |
| Regeneração de HP, poção de cura da run, ímã e drops voando até o herói | `motion` | o dano recebido por segundo real dobra; a cura acompanha |
| Cura de fim de round, ouro/Fish por drop | n/a | instantâneos, não dependem de relógio |
| Relógio do round (`timeLeft`, `elapsed`) e o HUD | `clock` | pedido explícito |
| Limite de tempo do boss (`bossTimeout`) | `clock` | é o `timeLeft` |
| Orçamento de spawn por segundo (`spawnRate · dt`) | `clock` | o número de inimigos por round não pode dobrar |
| Marcas vermelhas de boss e elite (`BossHazardSystem`, `EliteHazardSystem`: aviso, intervalos e clarão) | `clock` | telegraph real ≥ 0,8 s no 1× novo (1 s e 0,9 s hoje); com `motion` cairia a 0,5 s |
| Marca de nascimento de inimigo (`ARENA.spawnTelegraph`, 0,5 s) | `motion` | só visual e sem dano; fica sincronizada com o `FxSystem` |
| Atraso da morte (`DEATH_DELAY`) | `clock` | tempo de leitura, não combate |
| Janela de afinidade (`ATTUNEMENT_WINDOW`) e fim do round | `clock` | usam `run.elapsed` |
| Hit-stop, clima, luz do ambiente | tempo real | efeitos de apresentação, já ignoravam a velocidade |

Consequência de balanceamento: com o orçamento de spawn em `clock`, cada segundo de round contém o dobro de combate (movimento e ataques) para o mesmo número de inimigos, no 1× novo. Isso muda a curva de dificuldade e exige uma passada de balanceamento (ver `docs/balancing-and-simulation.md` A8); não é feita aqui.

## Fora de escopo

Rebalancear números de dados, mudar `speedMul` dos inimigos, o `src/logic/sim` (não usa velocidade de jogo).

## Asserts

- `bun test tests/speed.test.ts`: fatores por velocidade; round de 30 s dura 30 s reais no 1× e 15 s no 2×; distância por segundo real é 2× (1×) e 4× (2×) a do antigo 1×; spawn por round igual; migração do save.
- `bun run typecheck`, `bunx biome check`.
- Browser (1920×1080, `?skipMenu=1&hero=jack&round=1&seed=1&debug=1&god=1`): timer da HUD contra o relógio real por ~10 s em 1× e 2×; rótulo "TAB · VELOCIDADE …".
