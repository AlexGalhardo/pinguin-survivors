# Balanceamento — fórmulas e números iniciais

> **Valores iniciais para playtest.** Todos ficam em `src/data/*.ts` e `src/logic/scaling.ts` (data-driven). Sempre que mudar um número no código, atualize aqui.
> Unidades: distância em **px lógicos** (resolução lógica 480×270, arena 960×540), tempo em segundos, velocidade em px/s.

## 1. Onda

| Grandeza | Fórmula (N = número da onda, começa em 1) |
|---|---|
| Duração | `min(20 + 5·(N−1), 60)` s |
| Taxa de spawn | `1.2 + 0.25·(N−1)` inimigos/s (distribuída entre os tipos liberados; um bando de Runners consome 1 unidade por inimigo) |
| Máximo de inimigos vivos | 300. O excedente vira bônus de HP: `hpMul *= 1 + excesso/300` |
| Multiplicador de HP | `hpMul(N) = (1 + 0.15·(N−1)) · 1.04^(N−1)` → onda 10 ≈ 3.3×, onda 20 ≈ 8.1×, onda 40 ≈ 32× |
| Multiplicador de dano | `dmgMul(N) = (1 + 0.08·(N−1)) · 1.02^(N−1)` → onda 10 ≈ 2.1×, onda 20 ≈ 3.7× |
| Multiplicador de velocidade | `spdMul(N) = min(1 + 0.02·(N−1), 1.6)` |
| Elite | Nas ondas múltiplas de 5, 1 elite (+1 a cada 10 ondas) |
| Boss | Nas ondas múltiplas de 10, surge aos 5 s da onda; a onda só termina quando o timer zera **e** o boss morre |

Pesos de spawn por tipo (normalizados entre os liberados): Chaser 50, Runner 25, Shooter 15, Tank 10.

## 2. Inimigos (valores base, antes dos multiplicadores)

| Tipo | HP | Dano de contato | Velocidade | Raio | Ouro | Notas |
|---|---|---|---|---|---|---|
| Chaser | 10 | 5 | 60 | 10 | 1 | Persegue direto |
| Runner | 5 | 3 | 110 | 7 | 1 | Surge em grupos de 3–5 |
| Shooter | 12 | 4 (tiro 6) | 45 | 10 | 2 | Mantém distância de 150; atira a cada 2.5s, projétil a 120 px/s |
| Tank | 40 | 10 | 35 | 16 | 3 | Resistente a knockback (×0.3) |
| Elite (×tipo) | ×8 | ×1.5 | ×1.1 | ×1.5 | 15 | Modificador aleatório: `fast` / `shielded` (escudo = 30% do HP) / `volatile` (explode ao morrer) |
| Boss | 400 | 15 | 40 | 28 | 50 | Rajada radial de 16 tiros a cada 4s; investida telegrafada (1s de aviso) a cada 7s |

Contato: o inimigo causa dano no máximo 1 vez a cada 0.5 s por inimigo. O jogador fica com **0.4 s de invulnerabilidade** depois de tomar dano.

## 3. Personagens (stats base)

> **Playtest humano (2026-09-25)**: Warrior fraco no começo (+50% em HP, dano, atk speed e alcance da Energy Blade),
> Mage morrendo cedo (+25% em HP, dano, atk speed e multiplicador de habilidades ×1.25: 1.5 → 1.875),
> Ranger forte demais após o 1º boss (−20% em HP, dano e atk speed do Blaster).
> "+X% de attack speed" = cooldown ÷ (1 + X). Os valores abaixo já incluem esses ajustes.

| | Warrior | Ranger | Mage |
|---|---|---|---|
| Max HP | **45** (era 30) | **18** (era 22) | **23** (era 18) |
| Armor | 3 | 0 | 0 |
| HP Regen | 0.4/s | 0 | 0 |
| Move Speed | 90 | 105 | 95 |
| Ability Power | +0% | +0% | **+87.5%** (era +50%) |
| Pickup Range | 40 | 40 | 40 |
| Crit Chance | 5% | 8% | 5% |

| Arma inicial | Dano | Cooldown | Alcance | Especial |
|---|---|---|---|---|
| Energy Blade (Warrior) | **18** (era 12) | **0.6 s** (era 0.9) | **78** (era 52), arco de 120° | knockback 120, acerta todos no arco |
| Blaster (Ranger) | **8** (era 10) | **0.44 s** (era 0.35) | 260 | projétil a 380 px/s |
| Psi Orb (Mage) | **7.5** (era 6) | **0.64 s** (era 0.8) | 220 | projétil a 180 px/s, pierce 3, teleguiado |

> Ajuste de 1.12: com os valores originais, a simulação mostrava Ranger e Mage morrendo nas ondas 4–6 (DPS inicial 2–4× menor que o da Energy Blade).
> Boss: o jogador tem **5 min** (300 s, `WAVE.bossTimeLimit`) para matar cada boss depois que ele aparece; se o tempo acabar é game over ("TIME UP").
> Playtest com bot pós-D-46 (seed 1, 4×): Warrior sobreviveu à onda 20; Ranger morreu na 4–5 e Mage na 5 (o bot desvia mal; o playtest humano é a referência).
> Início de onda: o jogador recupera `WAVE.waveStartHeal` × Max HP (hoje **1** = cura total, D-49), sem passar do Max HP.

### Detalhes implementados no Alpha (não estavam no plano original)

| Grandeza | Valor |
|---|---|
| Elite `fast` | velocidade ×1.4 extra |
| Elite `volatile` | explode 0.5 s depois de morrer, raio 48, dano 10 (× dmgMul do inimigo) |
| Elites na onda | o 1º aos 3 s, depois a cada 6 s |
| Boss: tiro da rajada | 8 de dano (× dmgMul), 110 px/s |
| Boss: investida | 280 px/s por 0.7 s, depois de 1 s de aviso (linha vermelha) |
| Banner "WAVE N" | 1.2 s com a física pausada |
| Revive | onda de choque de raio 140 e knockback 450 |
| Chance de família de carta | stat 55 · habilidade 35 · especial 10 |

## 4. Fórmulas de combate

```
damage     = base · (1 + Damage%) · (crit ? (1.5 + CritDamage%) : 1)
abilityDmg = abilityBase(level) · (1 + Damage%) · (1 + AbilityPower%)
cooldown   = baseCooldown / (1 + AttackSpeed%)          (Attack Speed mínimo −50%)
armorRed   = Armor / (Armor + 15)                       (Armor negativo aumenta o dano recebido)
taken      = max(1, round(raw · (1 − armorRed)))
dodge      = min(Dodge%, 60%)
lifesteal  = chance Lifesteal% de +1 HP por acerto (no máximo 10 curas/s)
regen      = HP Regen HP/s (acumula frações)
```

## 5. Raridade (cartas e itens)

Pesos base: Common 70 · Rare 22 · Epic 7 · Legendary 1 (Legendary = 0 antes da onda 5).
Ajuste: os pesos de Rare, Epic e Legendary são multiplicados por `(1 + 0.02·(N−1)) · (1 + Luck/100)`.
Multiplicador de valor por raridade: Common ×1 · Rare ×1.5 · Epic ×2.2 · Legendary ×3.

## 6. Cartas — valores base (Common)

| Carta | Valor base |
|---|---|
| Max HP | +5 |
| HP Regen | +0.3 HP/s |
| Lifesteal | +2% |
| Damage | +8% |
| Attack Speed | +8% |
| Crit Chance | +4% |
| Crit Damage | +15% |
| Ability Power | +10% |
| Range | +10% |
| Move Speed | +5% |
| Armor | +1 |
| Dodge | +3% |
| Pickup Range | +20 |
| Luck | +10 |
| +1 Projectile | só Epic/Legendary |
| +1 Pierce | Rare+ |
| Revive | Epic+; 1 carga no máximo |
| Full Heal | Rare+ |

Re-roll das cartas: `2 + N` de ouro (+1 a cada re-roll repetido na mesma tela).

## 7. Loja e itens (Alpha: 12 itens)

Preço: `basePrice · (1 + 0.1·(N−1))`, arredondado. Re-roll da loja: `1 + N` (+1 por re-roll).

| Item | Raridade | Preço base | Efeito |
|---|---|---|---|
| Nano Plating | Common | 15 | +3 Armor, −3% Move Speed |
| Overclocked Core | Rare | 30 | +25% Attack Speed, −10% Max HP |
| Glass Cannon Lens | Epic | 55 | +40% Damage, −25% Max HP |
| Medi-Gel Pack | Common | 12 | +1 HP Regen |
| Vampiric Circuit | Rare | 35 | +6% Lifesteal, −1 HP Regen |
| Gravity Magnet | Common | 10 | +60 Pickup Range |
| Lucky Clover Chip | Rare | 30 | +25 Luck |
| Heavy Boots | Common | 15 | +8 Max HP, −5% Move Speed |
| Psi Amplifier | Epic | 55 | +35% Ability Power, −10% Damage |
| Targeting Module | Rare | 30 | +12% Crit Chance |
| Ion Thrusters | Rare | 28 | +15% Move Speed, −2 Armor |
| Singularity Shard | Legendary | 90 | +1 Projectile, +1 Pierce, −15% Attack Speed |

## 8. Habilidades — nível 1 → 5 (dano base antes dos multiplicadores)

| Habilidade | Nv1 | Crescimento por nível | Cooldown |
|---|---|---|---|
| Orbital Drones | 2 drones, 4 dano/contato, raio 40 | +1 drone, +2 dano | contínuo (tick 0.3s por inimigo) |
| Chain Lightning | 8 dano, 3 saltos | +1 salto, +3 dano | 2.0 s → −0.15 s/nv |
| Plasma Nova | 10 dano, raio 60 | +10 raio, +4 dano | 3.0 s → −0.2 s/nv |
| Cryo Field | 1.5 dano/s, raio 50, lentidão 25% | +8 raio, +5% lentidão, +1 dps | contínuo |
| Homing Missiles | 2 mísseis, 7 dano | +1 míssil, +2 dano | 2.5 s |
| Laser Beam | 5 dano/tick, 0.8 s de duração, largura 6 | +0.2 s, +2 largura, +2 dano | 4.0 s |

Parâmetros extras das habilidades (`src/data/abilities.ts`): Orbital Drones orbitam a raio 40 (×Range), giro 3 rad/s, raio de acerto 7. Chain Lightning: alcance inicial 180, salto 90. Plasma Nova: knockback 80. Cryo Field: tick de dano a cada 0.5 s (sem flash nem número). Homing Missiles: 200 px/s, curva 6 rad/s, alcance 420, alvo até 300 px. Laser Beam: tick 0.15 s, comprimento 260 (×Range), mira no inimigo com mais vizinhos num raio de 48.

## 9. Ouro e meta

- Ouro dropado pelos inimigos (tabela §2). O ouro não coletado no fim da onda é coletado automaticamente.
- Chance de medkit por abate: `0.5% · (1 + Luck/100)`. Cura 20% do Max HP.
- Beta: Ranger desbloqueia ao chegar à onda 10 com o Warrior; Mage desbloqueia ao matar o primeiro Boss.

## 10. Metas de sanidade (verificar com simulação no `bun:test`)

- Warrior sem upgrades vence a onda 1 com folga (TTK de um Chaser ≤ 1 golpe).
- Build média (1 carta/onda, compras aleatórias) morre entre as ondas 12 e 18.
- Build boa chega à onda 25+. Nenhuma build passa da onda 60 (a progressão infinita precisa terminar).

### Resultado da simulação (1.12, `bun scripts/sim.ts 300`)

Modelo analítico por onda em `src/logic/sim` (constantes em `src/data/sim.ts`, ainda **não calibradas** com playtest humano).

| Classe | Build aleatória (mediana) | Build boa (mediana) |
|---|---|---|
| Warrior | 19 | 58 |
| Ranger | 13 | 55 |
| Mage | 15 | 55 |

- Build aleatória: dentro ou perto da faixa 12–18. ✔
- Build boa: passa da onda 25. ✔
- "Nenhuma build passa da onda 60": **não atendido** — algumas builds boas sobrevivem às 60 ondas. A escala tardia fica para o balanceamento final.
- Achado do playtest com bot: o boss da onda 10 (400 × 3.3 = 1338 HP) é tanque demais para builds fracas.


## 11. Beta (Fase 2) — conteúdo e ajustes

**Inimigos novos** (`src/data/enemies.ts`): Splitter (18 HP, divide em 2 Splitlings de 4 HP, onda 6), Bomber (8 HP, pavio 0.6 s a 28 px, explosão raio 44 e 12 × dmgMul, onda 7), Healer (16 HP, cura 20% do Max HP de aliados num raio de 70 a cada 3 s, onda 8), Burrower (20 HP, some por 0.8 s a cada 4 s e reaparece a 50–80 px do jogador, onda 9). Pesos no sorteio: 10 / 8 / 6 / 8.

**Bosses**: rotação a cada 10 ondas — Hive Queen (400 HP), Warden (450 HP: espiral de 2 tiros a cada 0.1 s por 3 s a cada 6 s; invoca 4 Chasers a cada 8 s), Void Titan (520 HP: 3 slams telegrafados de raio 36 e 16 × dmgMul a cada 3 s; leque de 5 tiros a cada 2 s).

**Modificadores de onda** (a partir da onda 6, 25%, nunca em onda de boss): Swarm (spawn ×1.6, HP ×0.65), Armored (spawn ×0.85, HP ×1.5, velocidade ×0.9), Fast (HP ×0.9, velocidade ×1.3).

**Sinergias** (`src/data/synergies.ts`, tiers 2/4/6 por tag de habilidades + itens): Energy +10/25/40% dano; Kinetic +10/25/35% atk speed (+1 projétil no tier 3); Cryo +1/3/5 armor e +5/10/15% dodge; Psi +15/35/60% ability power; Bio +0.5/1.5/2.5 regen (+3/6% lifesteal); Tech pickup/luck/crit.

**Evoluções**: nível 5 + item específico → dano ×1.75, +2 contagem (drones, saltos, mísseis, discos), área ×1.35, Cryo com 70% de lentidão.

**Habilidades novas** (nível 1 → +por nível): Arc Turret (5 → +2 dano, 1 torreta +0.5/nv, tiro a cada 0.7 s, dura 10 s, nova a cada 5 s); Saw Disc (6 → +3, 1 disco +0.5/nv, 2.2 s, perfura tudo); Gravity Well (3 → +1.5 por tick de 0.5 s, raio 60 → +8, 2.5 s a cada 5 s, puxa 90 px/s); Nanite Swarm (4 → +2 dps por 3 s, 1 alvo +0.5/nv, a cada 3 s).

**Loja**: 40 itens; lock mantém o item no re-roll e na próxima loja; venda devolve 50% do preço atual. Preço por onda: **+15%** (era +10%; o bot terminava a onda 30 com ~3.800 de ouro sobrando).

**Ajustes do playtest com bot (`scripts/playtest.sh`)**: elites só de Chaser/Shooter/Tank/Splitter; elite ×1.25 de dano (era ×1.5) e `fast` ×1.2 (era ×1.4); inimigo recua 160 ao acertar o jogador; i-frames 0.5 s (era 0.4); Ranger 22 HP (era 20), Mage 18 HP (era 15); Warrior +0.4 HP/s de regen base e lâmina com alcance 52 (era 45); Psi Orb a 180 px/s e teleguiado (3 rad/s); lifesteal limitado a 10 curas/s.

**Passivas de classe**: Warrior +1 armor por inimigo a até 60 px (máx. +5); Ranger +20% atk speed em movimento; Mage +1% ability power por abate na onda (máx. +30%).

**Meta (1.0)**: Cores por run = `2·onda + abates/50 + 10·bosses`. Upgrades permanentes pequenos (ver D-42) para não quebrar a curva.
