# QA visual na câmera top-down (T4.1)

Prancha: `qa-top-down-antarctica.png`, gerada por `bun scripts/qa-sheet.ts` (não gasta gerações): 3 heróis (frame `idle` 0) e 7 inimigos do bioma 1 (frame `walk` 0) nas 5 direções geradas (S, SE, E, NE, N), a 2× sobre o chão placeholder da Antártida. É o que o jogo mostra em 1920×1080.

Status: **lista abaixo aguarda aprovação do desenvolvedor** (T4.7). Nada foi refeito.

## Veredito geral

- A vista `low top-down` (3/4) funciona: cabeça e tronco legíveis, silhueta clara contra o chão escuro. Heróis e inimigos **ficam** (ADR-004).
- O problema não é a câmera, é a **consistência entre direções** de alguns personagens (escala e proporção mudam de uma direção para outra).

## Candidatos a refação (por prioridade)

| # | Personagem | Direção | Problema | Proposta |
|---|---|---|---|---|
| 1 | Jack | NE | corpo fino e comprido, bem mais estreito que S, SE, E e N | regerar só a rotação NE (a partir do estado sem arma) |
| 2 | Bob | SE | a escopeta aparece na mão (os heróis são animados sem arma, P-56) | regerar só SE sem arma, ou limpar com `edit_image` |
| 3 | Lucia | S, NE, N | o cajado está desenhado na mão (mesma regra do P-56) | decidir: manter o cajado como parte do herói ou limpar as 3 direções |
| 4 | zombieScientist | E | sprite bem menor e mais estreito que S, SE, NE e N | regerar a rotação E |
| 5 | zombieSeal | SE | aparece menor que S, E, NE e N | regerar a rotação SE |
| 6 | polarBear (boss) | S, SE contra E, NE | S e SE são "de pé, ombros largos"; E e NE são curvados e esticados, o urso parece mudar de postura ao girar | regerar S e SE (ou E e NE) com a mesma pose |
| 7 | zombiePenguin | NE | silhueta mais gorda e azulada que as demais direções | regerar a rotação NE |

## Sem problema visível

zombieSkua, bloaterPenguin e zombieWalrus (consistentes nas 5 direções); Lucia E/SE; Bob S/E/NE/N; Jack S/SE/E/N.

## Fora do escopo desta prancha

- Chão: a prancha usa o checker placeholder porque o tileset top-down (T4.2) ainda não existe.
- Bosses kraken e abominação, inimigos dos biomas 2 e 3 e voadores novos: não entram no QA do bioma 1.
- Animações (walk, ataque, morte): a prancha só mostra o primeiro frame.

## Floresta (round 11): legibilidade dos inimigos legados

Avaliado em jogo (1920×1080, `?round=11`), sem gerar nada. Os inimigos que aparecem na floresta são os sprites legados (lobo/rato esverdeado e corvo/gaivota cinza):

- Os verde-amarelados (zumbis de pelo musgoso) se leem bem: contraste de matiz com o chão verde-azulado escuro e a silhueta fica nítida.
- Os cinza e pretos (corvos e gaivotas) são o ponto fraco: sobre o chão escuro perdem contorno, principalmente quando o brilho do herói não os alcança. Sugestão para o desenvolvedor: tingir os voadores com um tom mais claro/quente ou regenerar o voador da floresta com penas claras (`zombieCrow`, RF-12).
- O herói (barriga clara) fica legível sobre qualquer variante do chão.

## Aliens da cidade destruída (concepts): aprovação

`aliens-concepts.png`: 6 aliens e o boss (8 rotações geradas; a prancha mostra S, E, N, W), 2 seeds cada, **sem animação** (gate 🛑).

- Originalidade (ADR-016 §4): revisão visual dos concepts. Os primeiros `camoStalker` (seeds 11 e 22) saíram com cabeça alongada em cúpula costelada, corpo preto esguio e cauda, parecendo o xenomorfo; foram **descartados** (`art-src/pixellab/concepts/aliens-rejected/`) e refeitos como um camaleão atarracado de cabeça redonda (seeds 33 e 44), sem cauda alongada nem boca com dentes.
- O primeiro `armorGuard` seed 22 e os dois primeiros `biomechColossus` (seeds 11 e 22) saíram com cara de soldado em armadura motorizada (risco de lembrar fuzileiros espaciais de Warhammer): também descartados. O Colossus foi refeito (seeds 33 e 44); o seed 44 (corpo de caranguejo com pinças) é o mais distante de um soldado, o 33 ainda parece um mecha humanoide.
- Tamanho: comuns em canvas 64 (alvo da tabela de proporções, ~60 u); o boss em 160, mas as figuras ocupam ~100 a 130 px do canvas, abaixo do alvo de 2 a 3× o herói (144 a 216 u): se aprovado, pedir o boss maior na animação.
- Para aprovar: escolher 1 seed por criatura (armorGuard só tem o seed 11). Depois da aprovação vêm as animações (walk de 6 frames nos comuns).
