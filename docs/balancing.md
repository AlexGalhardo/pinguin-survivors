# Balanceamento — fórmulas e números iniciais

> **Valores iniciais para playtest.** Todos ficam em `src/data/*.ts` e `src/logic/scaling.ts` (data-driven). Sempre que mudar um número no código, atualize aqui.
> Unidades: distância em **px lógicos** (resolução lógica 480×270, arena 960×540), tempo em segundos, velocidade em px/s.

## 1. Onda

| Grandeza | Fórmula (N = número da onda, começa em 1) |
|---|---|
| Duração | `min(20 + 5·(N−1), 60)` s |
| Taxa de spawn | `1.2 + 0.25·(N−1)` inimigos/s (distribuída entre os tipos liberados) |
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

| | Warrior | Ranger | Mage |
|---|---|---|---|
| Max HP | 30 | 20 | 15 |
| Armor | 3 | 0 | 0 |
| Move Speed | 90 | 105 | 95 |
| Ability Power | +0% | +0% | **+50%** |
| Pickup Range | 40 | 40 | 40 |
| Crit Chance | 5% | 8% | 5% |

| Arma inicial | Dano | Cooldown | Alcance | Especial |
|---|---|---|---|---|
| Energy Blade (Warrior) | 12 | 0.9 s | 45 (arco de 120°) | knockback 120, acerta todos no arco |
| Blaster (Ranger) | 5 | 0.35 s | 260 | projétil a 380 px/s |
| Psi Orb (Mage) | 4 | 1.0 s | 220 | projétil a 140 px/s, pierce 3 |

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

## 9. Ouro e meta

- Ouro dropado pelos inimigos (tabela §2). O ouro não coletado no fim da onda é coletado automaticamente.
- Chance de medkit por abate: `0.5% · (1 + Luck/100)`. Cura 20% do Max HP.
- Beta: Ranger desbloqueia ao chegar à onda 10 com o Warrior; Mage desbloqueia ao matar o primeiro Boss.

## 10. Metas de sanidade (verificar com simulação no `bun:test`)

- Warrior sem upgrades vence a onda 1 com folga (TTK de um Chaser ≤ 1 golpe).
- Build média (1 carta/onda, compras aleatórias) morre entre as ondas 12 e 18.
- Build boa chega à onda 25+. Nenhuma build passa da onda 60 (a progressão infinita precisa terminar).
