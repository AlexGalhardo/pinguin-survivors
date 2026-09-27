# Áudio

## Estratégia por fase

| Fase | SFX | Música |
|---|---|---|
| Alpha | **jsfxr** procedural em runtime (Web Audio), sem arquivos | nenhuma |
| Beta | jsfxr com parâmetros refinados + variação de pitch | **loop chiptune simples** (sequenciador Web Audio próprio ou faixa CC0) |
| 1.0 | SFX finais (jsfxr exportado para WAV/OGG, ou gerados por IA) | trilha gerada por IA (verificar se o Higgsfield gera música; se não, escolher outra ferramenta) `[~]` |

## Catálogo de SFX (chaves do manifest)

| Chave | Quando toca | Preset jsfxr de partida |
|---|---|---|
| `sfx.blade` | golpe do Warrior | `hitHurt` curto, agudo |
| `sfx.blaster` | tiro do Ranger | `laserShoot` |
| `sfx.psi` | orbe do Mage | `synth` grave |
| `sfx.enemy_hit` | inimigo atingido | `hitHurt` |
| `sfx.enemy_die` | inimigo morre | `explosion` curto |
| `sfx.player_hurt` | jogador toma dano | `hitHurt` grave |
| `sfx.gold` | coleta de ouro | `pickupCoin` |
| `sfx.heal` | medkit/regen | `powerUp` suave |
| `sfx.card_pick` / `sfx.buy` | escolher carta / comprar | `powerUp` |
| `sfx.ui_click` / `sfx.ui_hover` | UI | `blipSelect` |
| `sfx.wave_start` / `sfx.wave_end` | início/fim de onda | `powerUp` / `synth` |
| `sfx.boss_warn` | telegraph do boss | `tone` grave pulsante |
| `sfx.revive` / `sfx.game_over` | | `powerUp` longo / `explosion` longo |

## Regras do AudioSystem

- **Pré-renderizar** cada som do jsfxr uma vez para um `AudioBuffer` (no Boot) e tocar a partir do cache. Não sintetizar por frame.
- **Limitar vozes**: no máximo N instâncias do mesmo som ao mesmo tempo (ex.: `enemy_hit` ≤ 4) e intervalo mínimo de 40 ms entre repetições.
- **Variação de pitch** de ±8% em sons repetitivos.
- Volumes separados de SFX e música (Settings), persistidos no localStorage.
- **Desbloqueio de áudio**: o browser exige um gesto do usuário, então o `AudioContext` é iniciado no primeiro clique/tecla do menu.
- Skill de referência: `audio-and-sound`.
