# ADR-023 — Campanha de 50 rounds, 5 biomas e 10 bosses

**Data** 2026-11-10 · **Status** Aceito (desenvolvedor, 2026-11-10, no chat) · **SDD** [016](../sdds/SDD-016-dez-bosses-e-ataques-em-area.md) · **Substitui em parte** [ADR-016](ADR-016-biomas-floresta-cidade-aliens.md) (biomas legados só no endless)

## Contexto

A campanha tinha 3 biomas (Antártida 1–10, Floresta 11–20, Cidade 21–30) e endless a partir do 31, com Estação e Ruínas só no sorteio do endless. Havia boss a cada 5 rounds, mas só 5 bosses, e cada bioma repetia o mesmo boss duas vezes. Kraken e Abominação tinham 1 frame parado por direção. Os ataques de boss eram golpe, investida, rugido, rajada e poças, sem aviso de área legível.

## Decisão

1. **Campanha de 5 biomas e 50 rounds.** Antártida 1–10, Floresta 11–20, Cidade 21–30, Estação 31–40, Ruínas 41–50. A Estação e as Ruínas usam os atlas legados que já existem. Os inimigos desses biomas passam a ser o pool exclusivo do bioma (`fromRound` +20). O endless começa no round 51, com um bioma sorteado por bloco de 10 entre os 5.
2. **10 bosses, um diferente a cada 5 rounds até o 50.** Os 5 novos abrem cada bioma e os 5 atuais fecham:

   | Round | Boss | Bioma |
   |---|---|---|
   | 5 | Foca-Leopardo Matriarca (`leopardSeal`) | Antártida |
   | 10 | Urso Polar Zumbi (`polarBear`) | Antártida |
   | 15 | Ent Podre (`rotTreant`) | Floresta |
   | 20 | Rei Alce (`mooseKing`) | Floresta |
   | 25 | Rainha da Colmeia (`hiveQueen`) | Cidade |
   | 30 | Colosso Biomecânico (`biomechColossus`) | Cidade |
   | 35 | Mergulhador Afogado (`drownedDiver`) | Estação |
   | 40 | Kraken do Porto (`kraken`) | Estação |
   | 45 | Hierofante da Praga (`plagueHierophant`) | Ruínas |
   | 50 | A Abominação (`abomination`) | Ruínas |

   Do round 55 em diante (endless), o boss de cada round múltiplo de 5 é sorteado entre os 10, de forma determinística pela seed.
3. **Ataques em área com aviso vermelho no chão**, no estilo dos roguelites de ação: 4 padrões (círculos, anel, linhas e piso). Cada boss usa pelo menos 2 desses padrões, além dos ataques que já tinha.
4. **Arte.** Kraken e Abominação ganham `walk` e `attack` animados a partir do frame atual (`/animate-with-text-v3`). O frame original continua no disco. Os 5 novos seguem o fluxo concept → aprovação → animação (160 px, `walk` + `attack`).

## Consequências

- A demo (até o round 10) passa a ter 2 bosses: a Foca-Leopardo no round 5 e o Urso no round 10.
- O scaling do endless passa a ciclar a cada 50 rounds (`loopRounds`). A curva de HP dos bosses precisa ser revista pela simulação, porque a regra de dobrar o HP a cada boss leva o boss do round 50 a ×512.
- As conquistas e os textos que citam "3 biomas" ou "round 31 = endless" mudam.
- Custo PixelLab aprovado: até 600 gerações neste lote.
