# Game Design Document — Pinguin Survivors

> Endless roguelite frenético em **pixel art 2.5D isométrica** (estilo Diablo 2 com a atmosfera do Diablo 4), inspirado em **Brotato**. Browser desktop. UI em EN + PT-BR.
> Decisões de origem: [decisions.md](decisions.md). Números: [balancing.md](balancing.md).

## 1. Pitch

Jack, Bob e Lucia são os **3 últimos pinguins sobreviventes de um apocalipse zumbi** na Antártida. Sobreviva a rounds cronometrados contra hordas de animais e cientistas zumbis, escolha 1 de 3 cartas a cada round, derrote um boss a cada 10 rounds e pinte a neve de vermelho. Os ataques são automáticos; você só se move.

## 2. Pilares

1. **Frenético e sangrento**: hordas de até 300 inimigos, gore estilo DOOM (jorros, gibs, poças que ficam a run inteira), hit-stop e screen shake.
2. **Decisões rápidas e significativas**: 3 cartas por round, 1 arma assinada + 3 secundárias, gambits de poção.
3. **Progressão RPG persistente**: cada herói sobe do level 1 ao 100 entre runs; morrer nunca é tempo perdido.
4. **Contraste visual**: pinguins fofos e marcados pela guerra num mundo escuro iluminado por tiros, magias e auras.

## 3. Core loop

```
Menu (Fish: poções/upgrades · pontos de stat · gambits)
  → Escolhe herói → Run:
      Round N (timer) → mata hordas, coleta XP/Fish
      → fim do timer (ou boss morto) → 3 cartas (tempo pausado) → Round N+1
      → round 10k: BOSS (3 min; timeout = game over)
  → Morte / desistência → resumo → XP e Fish ficam salvos → Menu
```

- **Duração do round**: `min(20 + 5·(N−1), 60)` s → 20, 25, 30 … 60 s a partir do round 9.
- **Boss**: rounds 10, 20, 30… Barra de boss + timer de 3:00. Matar o boss encerra o round; o timer zerar = **game over**.
- **Elites** (rounds múltiplos de 3 que não são boss: 3, 6, 9, 12…): **roxo 2×**; a partir do round 11 também **laranja 3×**.
- **Endless**: sem fim; escala sem teto (ver balancing).

## 4. Controles

| Ação | Teclado | Gamepad |
|---|---|---|
| Mover (8 dir; input rotacionado 45° para o losango iso) | WASD / setas | Analógico esquerdo / D-pad |
| Confirmar / cartas | Enter / Espaço / 1-2-3 | ✕ / A |
| Pausa | Esc / P | Start |

Ataques são automáticos. Não há dash. Input abstraído (`src/core/input`) para um joystick virtual mobile no futuro.

## 5. Heróis

| Herói | Espécie / visual | Especialidade | Arma assinada T1 → T2 → T3 | Desbloqueio |
|---|---|---|---|---|
| **Jack** | Pinguim-saltador-da-rocha (crista amarela espetada), bandana vermelha, ombreira de couro, curativos | Armas brancas (melee): arcos largos, sangramento | Machete → Katana → Espada-motosserra | Inicial |
| **Bob** | Pinguim-imperador gordinho, colete tático, cinto de cartuchos, gorro, tapa-olho | Armas de fogo: espalhamento, crítico | Escopeta cano duplo → Escopeta automática → Escopeta-foguete | Vencer o boss do round 10 |
| **Lucia** | Pinguim-gentoo pequena, capa roxa rasgada com runas | Magias: 4 elementos, área, corrente, veneno | Cajado dos 4 elementos → Cajado arcano → Cajado das Quatro Tempestades | Vencer o boss do round 20 |

- A **arma assinada é desenhada no sprite** do herói (idle/walk/attack/hurt/death × 8 dir por tier).
- **Especialista**: +25% de dano em armas da própria tag (`melee`/`firearm`/`magic`), incluindo secundárias.
- **Evolução**: carta especial de T2 a partir do round 10 (após o boss) e de T3 a partir do round 20.

## 6. Atributos (stats)

| Grupo | Stats |
|---|---|
| Vida | HP máx., regeneração de HP/s, roubo de vida % |
| Ataque | dano % (geral e por tag), **velocidade de ataque %**, **chance de crítico**, dano crítico, alcance %, área % |
| Status on-hit | chance de **sangramento** (DoT físico, acumula), chance de **veneno** (DoT que ignora armadura, acumula), dano elemental % (fogo/terra/gelo/energia) |
| Defesa | **defesa física** (armadura), **defesas elementais** (fogo, terra, gelo, energia), **dodge %** (evita qualquer golpe), **parry %** (bloqueia golpe corpo a corpo e contra-ataca) |
| Utilidade | velocidade de movimento, alcance de coleta, sorte (raridade das cartas), ganho de XP % |

Elementos: **fogo** = queimadura (DoT); **gelo** = lentidão → congelamento com acúmulo; **terra** = knockback/atordoamento e quebra de armadura; **energia** = salta para inimigos próximos (corrente).

## 7. RPG persistente (level 1–100)

- Inimigos soltam **orbes de XP** (coletados na run). O XP vai para o **herói** e persiste.
- Cada level: **crescimento automático** pela curva da classe + **1 ponto de stat** para gastar no menu (tela "Hero").
- Morrer mantém todo o XP e todo o Fish.
- Level 100 é o teto por herói.

## 8. Cartas (3 por round, tempo pausado)

Raridade: comum, rara, épica, lendária (sorte e round aumentam a chance). Tipos:
1. **Stat**: ex. +12% velocidade de ataque, +3 armadura, +8% resistência a gelo.
2. **Arma/magia secundária**: adiciona uma nova (se houver slot livre, máx. 3) ou sobe o nível de uma existente (nível 1–5).
3. **On-hit**: +chance de sangramento/veneno/elemento, roubo de vida.
4. **Evolução**: sobe a arma assinada para T2/T3 (só aparece quando liberada).

## 9. Armas secundárias (pool inicial)

Sprites separados do herói (orbitando, arremessados, torres). Cada uma tem tag (`melee`/`firearm`/`magic`) e nível 1–5.
Exemplos: facas arremessáveis (melee), bumerangue de peixe (melee), pistola auxiliar (firearm), drone-torreta (firearm), molotov (firearm/fogo), mina terrestre (firearm), estilhaços de gelo orbitando (magic/gelo), anel de chamas (magic/fogo), totem de raios (magic/energia), nuvem de veneno (magic/terra). Lista final em `src/data/weapons.ts`.

## 10. Poções (gambits estilo FFXII)

- 3 slots por run. Cada slot = **tipo** + **condição**, montados no menu antes da run; cada poção é consumida uma vez.
- Tipos: Cura (40%), Mega Cura (70%), Escudo (absorve 30% do HP máx. por 8 s), Fúria (+50% dano 8 s), Antídoto (limpa veneno/sangramento, imune 5 s), Pressa (+40% vel. de ataque 8 s).
- Condições: HP < 25/50/75%, envenenado, sangrando, boss na tela, ≥ N inimigos por perto, início do round.
- Avaliadas em ordem (slot 1 → 3) a cada 0,25 s; comprar custa Fish.

## 11. Inimigos — bioma 1: Antártida zumbi

| Inimigo | Papel | Notas |
|---|---|---|
| Pinguim zumbi | Enxame rápido e frágil | Base da horda |
| Foca zumbi | Tanque lento | Rasteja; muito HP |
| Skua zumbi (ave) | Voador | Mergulha em linha reta, ignora obstáculos |
| Cientista zumbi | À distância | Cospe gosma tóxica (veneno) |
| Morsa zumbi | Investida | Carrega em linha e causa knockback |
| Pinguim inchado | Explosivo | Explode em nuvem de veneno ao morrer ou ao chegar perto |
| **Boss: Urso polar zumbi** | Boss round 10 | Patada em arco, investida, rugido que invoca pinguins |

Biomas seguintes (estação de pesquisa/porto, cidade em ruínas) trazem novos inimigos e bosses (pool rotativo). Elites usam o mesmo sprite, maiores, com aura roxa/laranja.

## 12. Mundo

- Mapa **infinito**: chunks de 16×16 tiles iso (64×32) gerados por seed + coordenada do chunk; decoração visual (pedras de gelo, carcaças, placas, barris, poças de óleo).
- Obstáculos sólidos leves só na beta.
- Clima escuro: noite polar, vinheta, luzes dinâmicas; **o sangue fica no chão** (carimbado na textura do chunk).

## 13. Meta-progressão

- **Fish 🐟**: moeda persistente (drop de inimigos, bônus por round e por boss). Compra poções e upgrades permanentes.
- **Desbloqueios**: Bob (boss 10) e Lucia (boss 20); conquistas e recordes por herói.

## 14. Game feel

Hit-stop em crítico/kill de elite, screen shake, flash branco no hit, números de dano, knockback, jorros de sangue, gibs com arco e sombra (eixo Z falso), poças persistentes, bloom em magias, luz dos tiros, zoom-punch em boss.

## 15. Fora do escopo (por enquanto)

Multiplayer, mobile (a arquitetura prevê), rotação de câmera, 3D real, Steam.
