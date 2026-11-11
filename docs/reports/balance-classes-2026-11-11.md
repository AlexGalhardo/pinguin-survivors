# Balance das classes por herói — 2026-11-11

Passada 1 da [SDD-024](../sdds/SDD-024-classes-por-heroi.md) (ROADMAP F5.4), com o simulador headless.

- **Comando:** `bun scripts/sim.ts 200 --classes` (200 runs por célula, dificuldade Normal, velocidade 1×, seeds 1–200).
- **Leitura:** cada classe é comparada com a classe base do mesmo herói, no nível que a destrava e no nível 30. A meta é a razão do round médio de morte ficar entre 0,67 e 1,5.
- **Por que a média:** as mortes se concentram nos rounds de boss (12, 18, 24), então a mediana quase não muda entre classes; a média distingue.

| Classe | Nível | Round médio | Base | Razão | Mediana (classe / base) | Meta 0,67–1,5 |
|---|---|---|---|---|---|---|
| jack.berserker | 5 | 18.4 | 16.8 | 1.09 | 18 / 18 | ok |
| jack.berserker | 30 | 25.2 | 27.1 | 0.93 | 24 / 24 | ok |
| jack.butcher | 10 | 19.4 | 19.0 | 1.02 | 18 / 18 | ok |
| jack.butcher | 30 | 28.1 | 27.1 | 1.03 | 24 / 24 | ok |
| jack.bulwark | 20 | 21.2 | 21.5 | 0.99 | 18 / 18 | ok |
| jack.bulwark | 30 | 26.5 | 27.1 | 0.98 | 24 / 24 | ok |
| bob.pyro | 5 | 14.7 | 15.3 | 0.96 | 12 / 18 | ok |
| bob.pyro | 30 | 24.4 | 25.0 | 0.98 | 24 / 24 | ok |
| bob.sharpshooter | 10 | 17.5 | 16.7 | 1.04 | 18 / 18 | ok |
| bob.sharpshooter | 30 | 28.2 | 25.0 | 1.13 | 24 / 24 | ok |
| bob.scavenger | 20 | 19.1 | 19.3 | 0.99 | 18 / 18 | ok |
| bob.scavenger | 30 | 25.6 | 25.0 | 1.03 | 24 / 24 | ok |
| lucia.stormcaller | 5 | 14.5 | 14.1 | 1.03 | 12 / 12 | ok |
| lucia.stormcaller | 30 | 20.0 | 19.6 | 1.02 | 18 / 18 | ok |
| lucia.frostweaver | 10 | 14.7 | 15.3 | 0.96 | 18 / 18 | ok |
| lucia.frostweaver | 30 | 19.2 | 19.6 | 0.98 | 18 / 18 | ok |
| lucia.glassCannon | 20 | 16.3 | 18.3 | 0.89 | 18 / 18 | ok |
| lucia.glassCannon | 30 | 17.6 | 19.6 | 0.90 | 18 / 18 | ok |

## Veredito

- As 9 classes novas ficam entre **0,89** (Canhão de Vidro, nível 20) e **1,13** (Atirador de Elite, nível 30) da classe base: todas dentro da meta, nenhum número ajustado nesta passada.
- **Canhão de Vidro** é a mais fraca (0,89–0,90): −30% de vida máxima pesa mais que +35% de dano mágico no modelo. Fica como está, porque a sim joga sem desviar; rever com o bot real.
- **Atirador de Elite** cresce com o nível (1,04 → 1,13): crítico escala com as armas de raridade alta. Dentro da meta; observar no endless.
- **Berserker** inverte com o nível (1,09 → 0,93): sem armadura, perde para o dano dos rounds 25+.

## Limites desta medida

- A sim não modela esquiva do jogador nem posicionamento: classes de vida baixa parecem piores do que são na mão de um jogador.
- Sorte, alcance de coleta e bônus de Fish do Catador entram só pela economia do modelo.
- Falta o bot real (`bun scripts/playtest-bot.ts` com `?class=<id>`), que é a auditoria da fase F5.
