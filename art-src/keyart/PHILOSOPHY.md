# Cold Horizon — filosofia visual do logo e da key art

Um mundo frio visto de cima, e o calor que cai sobre ele. Toda a composição vive dessa tensão: o
planeta é uma massa lenta de azuis e noite, o calor é raro, estreito e em movimento. O ouro existe só
onde algo está chegando — o título, a estrela, as cabeças dos meteoros —, e por isso o olho sempre
encontra primeiro o que cai.

A forma é a grade. Cada pixel é colocado de propósito, na paleta Endesga 32, sem nenhum meio-tom
fora dela: gradientes são construídos com dither ordenado (Bayer 4×4), como quem trabalha pedra por
pedra. As letras são o próprio 5×7 do jogo em blocos 3×3, em faixas de metal fundido (branco, amarelo,
âmbar, laranja, ferrugem), fechadas por um contorno de noite e uma sombra ameixa que as tira do fundo.

O espaço é generoso e silencioso: a curva do planeta é uma única linha contínua de atmosfera que se
apaga ao entrar no lado da noite. Crateras são poucas, achatadas pela perspectiva, com a parede
sombreada no alto e uma borda de luz embaixo. Rastros longos e tênues, cabeças curtas e quentes — o
movimento é sempre para baixo e para a direita.

Tudo é gerado por código determinístico (`src/art/placeholders/keyart.ts`), trabalhado em várias
passadas de revisão ampliada ×4 até cada borda ficar limpa. `bun scripts/render-keyart.ts` exporta os
PNGs desta pasta para lojas e divulgação.
