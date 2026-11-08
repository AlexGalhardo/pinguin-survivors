# Feedback → hipóteses de balanceamento e UX (2026-11-08)

> **T6.4** do [ROADMAP](../../ROADMAP.md). Fonte: as sessões de jogo do desenvolvedor em 2026-11-08 (builds 0.2.0 a 0.4.0) e os relatórios de sim e bot do mesmo dia. Cada hipótese segue o fluxo da Parte A3 de [balancing-and-simulation.md](../balancing-and-simulation.md): hipótese → sim A/B → bot → aplicar ou descartar. O status de cada uma está na última coluna.

## Resumo do feedback

- Jogou até o **round 14** antes de morrer e gostou da experiência no geral (0.2.0).
- UI e HUD **crus e sem personalidade**; pediu a linguagem do Diablo 4, menus didáticos e fundo neutro.
- Pediu **velocidade de jogo até 4×**, armas com **cor própria** e mais **impacto em crítico, esquiva e aparo**.
- **Drops pouco visíveis** no chão.
- **Voadores** sem animação de voo; **obstáculos** pequenos demais em relação ao herói; inimigos **presos** atrás de pedras.
- **Rolagem** nas telas de loja, pausa e árvore incomoda; a HUD tinha **elementos demais** (molduras e ícones de arma).
- Pediu **progressão de longo prazo** mais rica (árvore estilo PoE2), **3 slots de save** e uma **poção de cura** com regras claras.

## Hipóteses

| # | Hipótese | Métrica | Teste | Status |
|---|---|---|---|---|
| H1 | A morte do desenvolvedor no round 14 (L1) está dentro da faixa da meta #1 (8–20), então a curva do começo não precisa mudar; o que pesou foi a leitura do combate, não os números. | mediana de morte L1 D1 (sim e bot) | sim 100 seeds + bot 13 runs (2026-11-08) | **Confirmada**: sim 18/18/17; bot jack 10, bob 24, lucia 6 → 14 após o ajuste dela. Nenhuma mudança de curva. |
| H2 | A Lucia morre cedo demais porque é frágil no começo (2 mortes no round 3 em 6 runs do bot), não por falta de dano. | mediana L1 da Lucia ≥ 8 sem regressão em Jack e Bob | A/B: HP base 85 → 100 e armadura 1 → 3 | **Aplicada** (commit da 0.4.0): bot da Lucia 6 → 14; sim sem regressão. |
| H3 | Com a poção de cura (cheia em todo início de round, uso automático ≤ 50% de vida), a curva do L1 fica fácil demais: o jogador médio passaria do round 20 com frequência. | meta #1: nenhum herói passa do 30 no L1; mediana ≤ 20 | bot com a política comprando a poção e o Magnético (tarefa em andamento do sênior) | **Aberta**: a sim não modela a loja nem a poção; só o bot mede. Se quebrar, subir o preço por nível antes de mexer na cura. |
| H4 | A meta-progressão nova (árvore de habilidades) mantém os perfis L10 e L20 dentro das metas #2 e #3 sem a Oficina. | metas #2 e #3 na sim | sim com `autoAllocate` (ordem `SIM_BRANCH_ORDER`) | **Confirmada**: #2 ✓ (Lucia 4% de mortes antes do 12), #3 33/33/32. Vigiar a Lucia no #2 (perto do limite de 5%). |
| H5 | Inimigos presos atrás de obstáculos baixam a pressão do round e deixam o jogo mais fácil do que a sim prevê; com o desvio (steering) e obstáculos 2–3× maiores com faixas livres, a pressão volta ao previsto. | dano recebido por round (bot × sim, `--rounds`) | comparar o perfil de dano do bot antes e depois do desvio | **Aberta**: reexecutar `bun scripts/sim.ts --rounds` e uma rodada do bot com o mesmo seed quando o bot da poção rodar. |
| H6 | Menus sem rolagem e didáticos (Loja e Pausa no estilo Diablo 4, botões na cor da raridade, comparação equipado × à venda) reduzem o tempo de loja e as compras erradas. | tempo médio na loja (telemetria local, `durationS` − tempo de jogo) e vendas logo após comprar | telemetria opt-in do próximo playtest do desenvolvedor | **Aberta**: precisa de sessão real; a meta #7 usa 45 s por loja como hipótese. |
| H7 | Velocidade 4× encurta a run percebida sem mudar a dificuldade, porque a lógica roda em passos fixos (sem atravessar colisões). | morte mediana a 1× × 4× no bot | bot `--speed 4` × `--speed 1` com os mesmos seeds | **Parcial**: o bot já roda a 4× e as medianas batem com a sim; falta a comparação direta a 1×. |

## Próximos passos

1. H3 e H5 entram na rodada do bot com poção e itens de suporte (em andamento).
2. H6 depende de uma sessão do desenvolvedor com a telemetria local ligada (Configurações → Dados locais das partidas).
3. Toda hipótese aplicada vai para a Parte B do balancing com o link deste relatório.
