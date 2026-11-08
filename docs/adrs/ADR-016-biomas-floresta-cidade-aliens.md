# ADR-016 — Bioma 2 vira floresta; bioma 3 vira cidade destruída com facção alienígena original

**Data** 2026-11-08 · **Status** Aceito (biomas e direção); **nomes e conceitos dos inimigos são propostas** até a aprovação do desenvolvedor · **Decisão de origem** pedido do desenvolvedor no chat de 2026-11-08 · **Supera** os biomas 2 e 3 de GDD §15 e de [ADR-000](ADR-000-decisoes-anteriores.md) (estação de pesquisa/porto e cidade em ruínas zumbi) · **Complementa** [ADR-004](ADR-004-reaproveitar-arte-low-topdown.md)

## Contexto

Os biomas 2 e 3 hoje são uma estação de pesquisa/porto (rounds 11–20, com Kraken do Porto) e uma cidade em ruínas zumbi (rounds 21–30, com Abominação). O desenvolvedor decidiu mudar o bioma 2 para floresta e o bioma 3 para uma cidade destruída com inimigos alienígenas, com inspiração em Warhammer, nos filmes Alien e Predator. Essa inspiração é de gênero: a mesma família de ideias não pode virar cópia de nomes, silhuetas ou marcas registradas de obras existentes.

A arte já gerada para estação e cidade (tiles, decorações e inimigos desses biomas) não é descartada: ela sai da campanha (rounds 11–30) e fica no pool do endless (rounds 31+), conforme ADR-004 (reaproveitar). A arte dos biomas 1 (Antártida) e dos heróis não muda.

## Decisão

1. **Bioma 2 (rounds 11–20) = floresta.** Substitui a estação de pesquisa/porto. Inimigos são animais e criaturas zumbis da floresta, nos mesmos seis papéis (enxame, voador, tanque, à distância, explosivo, investida). Boss: **Alce-rei zumbi** (proposta), no lugar do Kraken do Porto.
2. **Bioma 3 (rounds 21–30) = cidade destruída com facção alienígena original.** Substitui a cidade em ruínas zumbi. Os seis papéis passam a ser ocupados por seis aliens originais, e o boss vira o **Colosso Biomecânico** (proposta), no lugar da Abominação.
3. **Ids propostos** (para o código, a confirmar pelo desenvolvedor): bioma `forest` e bioma `city`. Inimigos da floresta: `zombieWolf`, `zombieCrow`, `zombieMoose`, `zombieFox`, `sporeBloater`, `zombieBoar`; boss `mooseKing`. Inimigos da cidade: `acidSwarmer`, `alienFlyer`, `armorGuard`, `camoStalker`, `cystBloater`, `clawCharger`; boss `biomechColossus`.
4. **Inspiração de gênero, sem cópia.** A facção alienígena é original. Permitido: biomecânico, caçador com camuflagem óptica, enxame com ácido, guerreiros blindados de ficção militar. **Proibido**: copiar nomes, designs, silhuetas icônicas ou marcas registradas de obras existentes, incluindo xenomorfo, yautja/Predador, facções e unidades de Warhammer (Tyranids, Space Marines, Necrons, Orks, Eldar, Chaos, Imperium e similares), máscaras e dreadlocks do caçador, cabeça dolicocéfala e cauda-lâmina do xenomorfo, e o conceito de "rainha/mãe de colmeia" com ovos.
5. **Arte**: concept em 4 direções (S, E, N gerados; W espelhado), depois **aprovação do desenvolvedor** (gate 🛑 de concepts), só então a animação. Nenhuma animação de alien começa antes dessa aprovação.
6. **Banner de chegada e música** nos rounds 11 e 21 continuam. As músicas dos biomas 2 e 3 passam a se chamar `music.forest` e `music.city` (ver audio.md §6).
7. **Endless (rounds 31+)**: usa todos os assets de inimigos e de bioma, incluindo os legados. A cada 10 rounds, o bioma (tileset, props, borda, pool de inimigos e boss) é sorteado pela seed da run entre: Antártida, floresta, cidade destruída, estação de pesquisa (legado) e cidade em ruínas (legado). O pool de inimigos do sorteio inclui todos os inimigos das campanhas, inclusive os zumbis legados de estação e cidade em ruínas. O boss de cada sorteio (rounds múltiplos de 10) é escolhido entre todos os bosses: urso polar zumbi, alce-rei zumbi, colosso biomecânico, kraken do porto e abominação. A campanha (rounds 1–30) segue a ordem fixa da decisão 1 e 2.

## Alternativas

- **Manter a estação e a cidade zumbis**, só trocando o boss: rejeitada, porque não atende ao pedido de mudança de bioma e de inimigos.
- **Usar os aliens de obras existentes** (xenomorfo, Predador, facções de Warhammer): rejeitada, por risco de marca registrada e de cópia de design, e porque o pedido é uma facção original.
- **Floresta com inimigos de fantasia** (goblins, ents, aranhas gigantes): rejeitada, para manter o tom de animais zumbis do jogo.
- **Adiar a decisão de nomes** e só mudar o bioma: parcialmente aceita. Os biomas e os papéis estão decididos; os nomes saem como proposta para aprovação antes de virar id no código.

## Consequências

- **Arte**: tileset, props e borda novos para floresta e cidade destruída; concepts novos de 6 aliens e 1 boss, mais os 6 inimigos da floresta e o boss da floresta. O orçamento é medido com `GET /balance` antes de cada lote; o registro fica em visual.md §10 e SDD-012. Os assets legados de estação e cidade em ruínas são mantidos para o endless.
- **Endless**: o sorteio de bioma e de boss por seed precisa ser reproduzível (`?seed=`). Os bosses kraken e abominação voltam a aparecer, só no endless.
- **Código**: ids de bioma e de inimigos mudam em `src/data/` e `src/i18n/`; o pool de rounds 11–30 e os papéis por bioma precisam ser reescritos. Quem altera o código deve seguir a SDD-012 atualizada.
- **Conquistas e textos**: `ach.feat.bossBiome2` e `ach.feat.bossBiome3` ("Defeat the boss of the research station", "Defeat the boss of the ruined city") e as chaves `biome.station`, `biome.ruins`, `boss.kraken`, `boss.abomination` precisam de texto novo nos quatro idiomas. Glossário e tabelas de i18n seguem o SDD-009.
- **Balanceamento**: os números dos novos inimigos são propostos e precisam de calibração com a sim e o bot (balancing-and-simulation.md Parte B §2). Os valores atuais dos biomas 2 e 3 não valem para os novos.
- **Docs**: GDD §14 e §15, SDD-012 (versão 1.1) e visual.md §2 e §5 descrevem o bioma novo. Textos antigos de estação e cidade zumbi ficam como histórico em ADR-000 e na Parte C de balancing-and-simulation.md.
- **Demo**: rounds 1–10 (Antártida) não mudam, então o escopo da demo continua o mesmo (ADR-013).
