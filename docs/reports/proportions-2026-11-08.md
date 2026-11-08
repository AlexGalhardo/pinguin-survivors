# Auditoria de proporções (2026-11-08)

Objetivo: padronizar a escala visual como no Brotato. Referência: herói e inimigos comuns com alturas parecidas (~1 tile; inimigos comuns 0,8 a 1,1× o herói), elites ~1,3×, bosses 2 a 3×, câmera mostrando ~15 tiles de largura.

## Método

- Altura = linhas de pixels opacos (alpha > 10) do frame sul (`idle.s.00` nos heróis, `walk.s.00` nos inimigos), medida nos atlas de `public/assets/`. O jogo desenha 1 pixel de sprite = 1 unidade de mundo (`setScale(1)`), então altura em pixels = altura em unidades.
- Tile = 64 u. Vista lógica 960×540 u (zoom ×2 em 1920×1080): 15 tiles de largura por 8,4 de altura, igual à referência. Nada a mudar na câmera.
- Hitboxes (`EnemyDef.radius`) e todo número de gameplay não mudam: só o tamanho desenhado.

## Antes

- Jack 83 u (1,30 tile), Bob 86 u, Lucia 80 u: heróis grandes demais para o tile.
- Inimigos comuns 37 a 57 u (0,58 a 0,89 tile): **0,5 a 0,7× o herói**, abaixo da faixa de 0,8 a 1,1×.
- Bosses: urso 127 u (1,5× o herói), kraken 148 u e abominação 149 u (1,8×): abaixo de 2 a 3×.
- Props da Antártida: 30 a 38 u (0,5 a 0,6 tile), ok para decoração.

## Proposta aplicada (`src/data/sprite-scale.ts`)

- Heróis: `HERO_SPRITE_SCALE` leva os 3 a **72 u** (1,13 tile): 0,84 (Bob), 0,9 (Lucia). O Jack foi regerado já em canvas 80 (71 a 72 u de altura nas 5 direções, `docs/visual.md` §13), então a escala dele é 1 (pixels inteiros).
- Inimigos comuns: `ENEMY_SPRITE_SCALE` sobe os pequenos até 1,3× para ficarem entre 48 e 68 u (0,67 a 0,94× o herói; a maioria 0,8 a 0,9×). O `zombieBrute` (68 u) fica como está.
- Bosses: urso ×1,25 (159 u, 2,2×) e kraken ×1,1 (163 u, 2,3×); a abominação fica em 149 u (2,1×).
- Elites: continuam `ROUNDS.elite[tier].scale` (×1,25 e ×1,4) sobre a escala nova, o que dá 1,0 a 1,3× o herói; sem mudança.
- Reversível: remover as duas tabelas (ou pôr 1) devolve o tamanho anterior.

| Sprite | Altura atual (u) | Tiles | Escala | Altura nova (u) | Tiles | × herói (72) |
|---|---|---|---|---|---|---|
| hero.jack (anterior) | 83 | 1.30 | 0.87 | 72 | 1.13 | 1,00 |
| hero.jack (novo, canvas 80) | 71 | 1.11 | 1 | 71 | 1.11 | 0,99 |
| hero.bob | 86 | 1.34 | 0.84 | 72 | 1.13 | 1,00 |
| hero.lucia | 80 | 1.25 | 0.9 | 72 | 1.13 | 1,00 |
| enemy.zombiePenguin | 53 | 0.83 | 1.1 | 58 | 0.91 | 0,81 |
| enemy.bloaterPenguin | 53 | 0.83 | 1.1 | 58 | 0.91 | 0,81 |
| enemy.acidBloater | 51 | 0.80 | 1.2 | 61 | 0.95 | 0,85 |
| enemy.fuelBloater | 50 | 0.78 | 1.2 | 60 | 0.94 | 0,83 |
| enemy.zombieCitizen | 53 | 0.83 | 1.1 | 58 | 0.91 | 0,81 |
| enemy.zombieGull | 54 | 0.84 | 1.1 | 59 | 0.92 | 0,82 |
| enemy.zombieMedic | 52 | 0.81 | 1.15 | 60 | 0.94 | 0,83 |
| enemy.zombieNarwhal | 40 | 0.63 | 1.3 | 52 | 0.81 | 0,72 |
| enemy.zombiePigeon | 57 | 0.89 | 1.05 | 60 | 0.94 | 0,83 |
| enemy.zombieRat | 42 | 0.66 | 1.3 | 55 | 0.86 | 0,76 |
| enemy.zombieRiotCop | 55 | 0.86 | 1.1 | 61 | 0.95 | 0,85 |
| enemy.zombieSailor | 52 | 0.81 | 1.15 | 60 | 0.94 | 0,83 |
| enemy.zombieScientist | 54 | 0.84 | 1.1 | 59 | 0.92 | 0,82 |
| enemy.zombieSeaLion | 37 | 0.58 | 1.3 | 48 | 0.75 | 0,67 |
| enemy.zombieSeal | 52 | 0.81 | 1.15 | 60 | 0.94 | 0,83 |
| enemy.zombieSkua | 57 | 0.89 | 1.05 | 60 | 0.94 | 0,83 |
| enemy.zombieSoldier | 56 | 0.88 | 1.05 | 59 | 0.92 | 0,82 |
| enemy.zombieWalrus | 51 | 0.80 | 1.2 | 61 | 0.95 | 0,85 |
| enemy.zombieBrute | 68 | 1.06 | 1 | 68 | 1.06 | 0,94 |
| enemy.polarBear | 127 | 1.98 | 1.25 | 159 | 2.48 | 2,21 |
| enemy.kraken | 148 | 2.31 | 1.1 | 163 | 2.55 | 2,26 |
| enemy.abomination | 149 | 2.33 | 1 | 149 | 2.33 | 2,07 |

## Sobra

- zombieNarwhal (52 u) e zombieSeaLion (48 u) continuam abaixo de 0,8× o herói porque são animais longos e baixos; subir mais que 1,3× deixaria a arte borrada. Se o desenvolvedor quiser exatamente 0,8×, vale refazer o sprite.
- Heróis e inimigos escalados por fração (0,87 etc.) ficam com pixels de tamanhos desiguais a ×2. Se incomodar em QA visual, a alternativa é regerar Bob e Lucia já em ~72 px de altura, como foi feito com o Jack neste lote (`docs/visual.md` §13).
- Os 11 bosses e inimigos dos biomas 2 e 3 não foram vistos em jogo; a tabela vale para o que existe nos atlas.

## Screenshots (1920×1080, `?skipMenu=1&hero=jack&round=3&seed=1&god=1`, sem som)

- Antes: `proportions-before.png`; depois: `proportions-after.png` (pasta de scratchpad da sessão; não versionadas).
