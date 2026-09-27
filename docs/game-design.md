# Game Design Document — Starfall Survivors

> Nome provisório. Top-down arena shooter roguelite para browser, pixel art 32px, tema sci-fi retrô.
> Inspirações: **Brotato** (ondas cronometradas, loja, itens com trade-off) + **Vampire Survivors** (ataque automático, hordas, habilidades que evoluem).
> Números concretos ficam em [`balancing.md`](balancing.md). Decisões e o motivo de cada uma estão em [`decisions.md`](decisions.md).

## 1. Pitch

Um sobrevivente cai num planeta alienígena. Preso numa arena fechada, enfrenta ondas infinitas de aliens, robôs e insetoides. Ele ataca sozinho; o jogador só **se move** (WASD). No fim de cada onda, escolhe **1 de 3 cartas** de melhoria e depois gasta o **ouro** coletado na **loja**. A run termina quando ele morre sem uma carga de ressurreição.

## 2. Pilares

1. **Um input, muitas decisões**: combate só com movimento; a profundidade está nas escolhas entre as ondas (cartas, loja, re-roll).
2. **Poder cresce visivelmente**: o jogador sente cada upgrade (mais projéteis, números maiores, efeitos novos).
3. **Pressão infinita e justa**: a dificuldade sobe a cada onda sem teto, mas sempre é possível ler o que está acontecendo (arena fechada, spawns telegrafados).
4. **Tudo em pixel art**: jogo, HUD, menus e fontes.

## 3. Core loop

```
Menu → Seleção de personagem → [ Onda N (combate) → 3 Cartas (grátis, escolhe 1) → Loja (ouro) ] → Onda N+1 …
                                         ↘ morte sem carga de revive → Game Over (estatísticas) → Menu
```

- **Onda**: dura `min(20 + 5·(N−1), 60)` segundos. Quem sobrevive até o timer zerar vence a onda. Os inimigos restantes morrem (efeito "purge") e o ouro no chão é coletado automaticamente.
- **Cartas**: 3 opções com raridade. Pode fazer **re-roll** pagando ouro. Teclas 1/2/3 ou mouse.
- **Loja**: 4 itens com raridade, comprar, re-roll pago, "Continue".
- **Game Over**: onda alcançada, tempo, abates, dano causado, ouro total, build final. Recorde salvo em localStorage.

## 4. Controles

- **WASD** / setas: mover. **ESC**: pausar. Menus: mouse **e** teclado (setas/WASD + Enter/Espaço, 1/2/3 nas cartas).
- Ataque e mira **automáticos**: cada arma mira no inimigo mais próximo dentro do alcance.
- Sem gamepad e sem toque no escopo atual.

## 5. Personagens (3)

| Classe | Fantasia sci-fi | Estilo | Arma inicial | Pontos fortes / fracos |
|---|---|---|---|---|
| **Warrior** | Soldado com armadura pesada e lâmina de energia | Corpo a corpo | **Energy Blade**: golpe em arco automático no inimigo mais próximo, curto alcance, dano alto, knockback | + muita vida, + armor / − alcance |
| **Ranger** | Batedor ágil com blaster | Distância, cadência alta | **Blaster**: tiro rápido, projétil único, alcance longo | vida e habilidades medianas, + velocidade |
| **Mage** | Psiônico / tecnomago | Distância, habilidades | **Psi Orb**: orbe lento que perfura; dano base baixo | **+50% Ability Power**, − pouca vida |

Desbloqueio: Alpha tem os 3 liberados (para testes). No Beta, Ranger e Mage passam a ser desbloqueados por conquista (ver `balancing.md` §9).

## 6. Atributos (stats) do jogador

| Stat | Efeito |
|---|---|
| Max HP | Vida máxima |
| HP Regen | HP por segundo |
| Lifesteal % | Chance de curar 1 HP por acerto |
| Damage % | Multiplicador de todo dano |
| Attack Speed % | Reduz o cooldown das armas |
| Crit Chance % / Crit Damage % | "Attack Power": críticos |
| Ability Power % | Multiplicador do dano e efeito das habilidades |
| Range % | Alcance das armas e habilidades |
| Move Speed % | Velocidade de movimento |
| Armor | Redução de dano percentual com retorno decrescente |
| Dodge % | Chance de ignorar um golpe (teto de 60%) |
| Pickup Range | Raio do ímã de ouro |
| Luck | Melhora a raridade de cartas e itens e a chance de cura dropar |
| Projectiles / Pierce | +projéteis por disparo / +inimigos atravessados |
| Revive | 0 ou 1 carga |

## 7. Cartas (grátis, 3 por onda)

Tipos:
1. **Stat card**: +X em um atributo; o valor depende da raridade. Ex.: "Reinforced Plating: +10 Max HP".
2. **Ability card**: ganha uma **habilidade nova** (nível 1) ou **sobe uma que já tem** (até nível 5). Máximo de **6 habilidades**. Quando os 6 slots estão cheios, só aparecem cartas de habilidades que o jogador já tem.
3. **Special card**: **Revive** (1 carga: volta com 50% de HP + 2s de invulnerabilidade + onda de choque que empurra os inimigos; não aparece enquanto o jogador já tem uma carga), cura total, +1 projétil (Epic+).

Raridades: **Common / Rare / Epic / Legendary**, com molduras coloridas em pixel art. Legendary só a partir da onda 5. A probabilidade depende da onda e do **Luck**.

## 8. Habilidades ("Abilities", as magias)

Disparam sozinhas e escalam com **Ability Power**. Alpha: 6 habilidades.

| Habilidade | Comportamento | Escala por nível |
|---|---|---|
| **Orbital Drones** | Drones orbitam o jogador e causam dano por contato | +1 drone, +dano |
| **Chain Lightning** | Raio que salta entre N inimigos | +saltos, +dano |
| **Plasma Nova** | Explosão circular periódica em volta do jogador | +raio, −cooldown |
| **Cryo Field** | Aura que causa lentidão e dano leve contínuo | +raio, +lentidão |
| **Homing Missiles** | Mísseis que perseguem alvos aleatórios | +mísseis, +dano |
| **Laser Beam** | Feixe em linha reta na direção do inimigo mais denso | +largura, +duração |

Beta: **evoluções** (habilidade no nível 5 + item específico → versão evoluída) e **sinergias** (tags como `energy`, `cryo` e `psi` somam bônus em conjunto).

## 9. Itens (loja, pagos com ouro)

- Passivos e permanentes durante a run. Muitos têm **trade-off** no estilo Brotato (ex.: *Overclocked Core*: +25% Attack Speed, −10% Max HP).
- Raridade igual à das cartas. O preço sobe a cada onda. **Sem limite de slots**.
- A loja tem 4 slots, re-roll pago (o custo sobe a cada re-roll dentro da mesma loja) e botão "Continue".
- Alpha: ~12 itens. Beta: ~40 itens. Lista inicial em `balancing.md` §7.

## 10. Inimigos

| Tipo | Papel | Aparece a partir de |
|---|---|---|
| **Chaser** (alien rastejante) | Persegue o jogador em linha reta | Onda 1 |
| **Runner** (inseto veloz) | Rápido e frágil, em enxames | Onda 2 |
| **Shooter** (drone sentinela) | Fica a distância e atira projéteis lentos | Onda 3 |
| **Tank** (bruto blindado) | Lento, muita vida, empurra | Onda 4 |
| **Elite** | Versão grande de um tipo, com modificador (rápido / escudo / explode ao morrer) | A cada 5 ondas |
| **Boss** (sprite 64×64) | 2 padrões no Alpha: rajada radial de projéteis + investida telegrafada | A cada 10 ondas |

- **Spawn**: pelas bordas da arena e em pontos aleatórios longe do jogador. Um **telegraph** (marcador piscando 0,8s) aparece antes de cada inimigo surgir, para evitar dano injusto.
- **Drops**: só **ouro**, mais uma chance pequena de **medkit** (cura) influenciada pelo Luck.

## 11. Arena

- Fechada, com paredes, com aproximadamente 2×2 telas lógicas (960×540 px lógicos). A câmera segue o jogador com deadzone e fica limitada às bordas da arena.
- Chão em tiles de 32 px (placeholder gerado por código no Alpha). Beta: pequenas variações e decoração que não bloqueia.

## 12. Progressão infinita

- A cada onda sobem a quantidade, a vida, o dano e a velocidade dos inimigos (fórmulas em `balancing.md`).
- A quantidade de inimigos tem teto de performance (300 vivos). Acima dele, a dificuldade cresce por **HP e dano**.
- O jogador cresce por cartas, habilidades e itens. A curva do jogador precisa acompanhar a dos inimigos até ~onda 20–30 com uma boa build e depois perder, para que runs "infinitas" terminem.

## 13. Meta-progressão

- **Alpha**: recorde e estatísticas por personagem (localStorage).
- **Beta**: desbloqueio de personagens por conquista.
- **1.0**: pequena árvore de upgrades permanentes (a definir; ver `decisions.md`).

## 14. Game feel ("juice")

Alpha (o básico): flash branco ao tomar hit, knockback, números de dano, tremor de tela leve, SFX em toda ação.
Beta: hit-stop curto, partículas, squash/stretch, morte com explosão em pixels, transições de cena.

## 15. Fora do escopo (por enquanto)

Multiplayer, mobile/toque, gamepad, ranking online, conta de usuário, monetização.
