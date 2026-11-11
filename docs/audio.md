# Direção de Som — Penguin Survivors

> **Versão** 2.2 · **Data** 2026-11-08 · Ferramenta única: **ElevenLabs** (`ELEVENLABS_API_KEY` só no `.env`). Pipeline na skill `.agents/skills/pinguin-audio-assets`; log bruto em `art-src/elevenlabs/log.jsonl`; decisão de remover vozes em [adrs/ADR-009](adrs/ADR-009-remover-vozes.md).

## Índice

1. [Direção](#1-direção)
2. [Engenharia de som](#2-engenharia-de-som)
3. [Catálogo e prompts (SFX)](#3-catálogo-e-prompts-sfx)
4. [Música](#4-música)
5. [Vozes (removidas na 1.0)](#5-vozes-removidas-na-10)
6. [Pendências para a 1.0](#6-pendências-para-a-10)
7. [Orçamento](#7-orçamento)

## 1. Direção

- **Música**: metal/industrial pesado estilo DOOM (riffs graves, bateria agressiva, sintetizadores sujos). Faixas: menu (lenta, sombria), round (loop 45–60 s, intensidade média), round tardio (≥ 21, mais pesada), boss (máxima), loja (ambiente curto, calmo, com vento polar), game over (sting).
- **SFX** "carnudos": impacto em carne, corte, escopeta com eco, 4 elementos, explosão, jorro, gib, coleta, level up, carta, loja (compra, reroll, lock, fusão), poção, UI.
- **Sem vozes** na 1.0 (ADR-009). O lojista fala por texto.

## 2. Engenharia de som

- Formato: **MP3 44,1 kHz 128 kbps** (saída da API). Música em loop com crossfade de 800 ms (`src/core/music.ts`); SFX via `sfx(scene, key)` (`src/core/audio.ts`) com volume por chave, limite de instâncias simultâneas por chave (`polyphony`, `src/logic/sfx-limiter.ts`) e variação de pitch ±5% (`src/data/sfx.ts`).
- Loudness alvo: SFX −14 LUFS, música −18 LUFS (normalização offline ao gerar).
- Mixagem: canais master, música, SFX (voz removido). Ducking de −6 dB na música durante o superpoder e o rugido do boss.
- Variações: hit, shotgun, splat, zombieDeath (3 takes), swing (2) sorteados por `SFX_VARIANTS`.
- Mobile/WebView: destravar o `AudioContext` no 1º toque; pausar ao perder o foco.

## 3. Catálogo e prompts (SFX)

Pipeline: antes de gerar, monte o prompt por [`.agents/skills/pinguin-audio-assets/prompts.md`](../.agents/skills/pinguin-audio-assets/prompts.md) (base fixa, blocos de SFX e música, exemplos).

Endpoint `POST /v1/sound-generation` (`text`, `duration_seconds`, `prompt_influence`), 1 take cada salvo o indicado. Custo medido ~4 créditos por SFX curto.

| Chave | Prompt (resumo) |
|---|---|
| `sfx.achievement` | triumphant achievement unlocked sting for a brutal heavy metal video game: short distorted guitar power chord with a bright metallic chime |
| `sfx.hit` (3 takes) | wet meaty flesh impact of a blade hitting a zombie, short and punchy |
| `sfx.swing` (2) | fast machete whoosh swing through the air, sharp |
| `sfx.shotgun` (3) | powerful double barrel shotgun blast with punchy low end and short echo |
| `sfx.cast` | magic staff casting an elemental bolt, crackling energy whoosh |
| `sfx.explosion` | brutal explosion with debris and fire, heavy boom |
| `sfx.splat` (3) | gory splatter of blood and guts hitting snow, wet squelch |
| `sfx.zombieDeath` (3) | zombie animal dying groan cut short with a gurgle, creepy, short |
| `sfx.heroHurt` | small penguin grunting in pain, cartoonish but gritty, short |
| `sfx.pickupXp` | tiny bright crystal chime pickup, sparkly, very short |
| `sfx.pickupFish` | wet fish slap pickup with a coin clink, short, cartoonish |
| `sfx.levelUp` | epic level up fanfare with distorted guitar riff and choir hit, short |
| `sfx.card` | card selection whoosh with a heavy metallic stamp |
| `sfx.potion` | drinking a potion gulp followed by a magical healing shimmer |
| `sfx.bossRoar` | huge zombie polar bear roar, monstrous, rotten and terrifying |
| `sfx.super` | massive superpower activation: bass drop, distorted guitar chug and a whooshing blast wave |
| `sfx.uiSelect` | short crisp menu select click with a metallic tick |
| `sfx.gameOver` | dark game over sting: slow heavy distorted guitar chord fading with a low drone, doom metal |
| `sfx.shopOpen` | old wooden shop door bell chime with a short metallic latch click, arctic merchant stall opening |
| `sfx.shopBuy` | metal coins dropping into a cash box and a short register bell, ka-ching |
| `sfx.shopReroll` | cards shuffling fast with a metallic rattle and a short whoosh, dice roll |
| `sfx.shopLock` | heavy iron padlock clicking shut, short metallic clack |
| `sfx.weaponFuse` | two metal weapons forging together: hammer clang on an anvil with a sparks sizzle and a short power-up shimmer |
| `sfx.shopNoFish` | empty cash drawer denied buzzer, dull wooden thud with a short negative error tone |
| `sfx.knife` / `sfx.boomerang` / `sfx.pistol` / `sfx.crossbow` / `sfx.molotov` / `sfx.mine` / `sfx.totem` / `sfx.flameRing` | fast throwing knife whoosh; spinning fish boomerang; small pistol crack; heavy crossbow twang; glass shatter with a fiery whoosh; mine arming beep and click; crackling lightning totem zap; ring of flames igniting ("cartoon gritty", 0,5–1 s) |
| `sfx.uiHover` / `sfx.uiConfirm` / `sfx.uiBack` | very short soft metallic hover tick; crisp confirm click with a low thud; soft back click with a dull wooden tap (0,5 s, a API exige ≥ 0,5 s) |
| `sfx.mooseKingRoar` / `sfx.colossusRoar` / `sfx.bossDown` | huge antlered zombie moose king roar; biomechanical alien colossus roar with metallic screech; boss defeated sting with a heavy collapse and a rising metal chime (1,5–2 s) |
| `sfx.krakenInk` / `sfx.abominationAcid` | giant kraken tentacle spitting a volley of black ink; bubbling green acid pool splashing and sizzling (1 s) |
| `sfx.pearls` / `sfx.dangerUnlock` / `sfx.equip` / `sfx.demoEnd` | handful of pearls clinking into a pouch; ominous danger-unlocked sting; armor strap buckling with a clasp click; short triumphant demo-complete sting |
| `sfx.fire` / `sfx.ice` / `sfx.earth` / `sfx.lightning` / `sfx.freeze` | magic staff casting a fire bolt / an ice bolt / an earth spell / a lightning bolt; enemies freezing solid (1 s each, "cartoon gritty") |

Prompts completos e parâmetros em `art-src/elevenlabs/log.jsonl`.

## 4. Música

Endpoint `POST /v1/music` (`force_instrumental: true`), ~560 créditos por 45 s (~750/min). **Nunca citar jogos, bandas ou artistas** no prompt (a API recusa). Faixas existentes em `public/assets/audio/music/`:

| Chave | Duração | Uso |
|---|---|---|
| `music.menu` | 40 s | menu principal |
| `music.round.1` a `music.round.9` | — | rounds normais: sorteia uma das nove |
| `music.boss.<id>` (10: `leopardSeal`, `polarBear`, `rotTreant`, `mooseKing`, `hiveQueen`, `biomechColossus`, `drownedDiver`, `kraken`, `plagueHierophant`, `abomination`) | — | luta contra aquele boss (no endless, o boss sorteado) |
| `music.shop.theme` | — | loja (toca ao abrir, volta à música do round ao fechar) |
| `music.round`, `music.late`, `music.boss`, `music.shop`, `music.forest`, `music.city` | 30–45 s | faixas antigas: continuam carregadas, mas fora do sorteio; só servem de reserva |

`musicForRound(round, seed, bossId)` em `src/core/music.ts`: round de boss toca `music.boss.<id>` do boss em campo; round normal toca `music.round.N`, com N sorteado por `roundTrack(seed, round)` (`src/logic/music.ts`, determinístico por seed e round, nunca igual ao do round normal anterior; ver SDD-019 não: regra do desenvolvedor de 2026-11-10). Se um arquivo faltar: `music.boss.<id>` cai em `music.boss`, `music.round.N` em `music.round` e `music.shop.theme` em `music.shop`.

Loops de reserva feitos pelo endpoint de SFX em `art-src/elevenlabs/music/*-loop.mp3`.

## 5. Vozes (removidas na 1.0)

Histórico, mantido para referência (arquivos e código na branch `legacy-voices`): 1 voz por herói via Voice Design (`/v1/text-to-voice`, 3 prévias, 1 escolhida), mesma voz para EN e PT-BR com `eleven_multilingual_v2`; 7 eventos × 2 takes × 3 heróis × 2 idiomas = 84 falas. Prompts de voz: Jack "young adult male, cocky and brash action-hero energy, slightly raspy"; Bob "middle-aged male war veteran, deep gravelly baritone, dry humor"; Lucia "adult female mystic sorceress, calm and low, mysterious and elegant". Removidas por custo de i18n (4 idiomas) e peso no build.

## 6. Pendências para a 1.0

Nenhuma. Tudo o que estava listado foi gerado, normalizado e ligado (loja, elementos, armas, bosses, UI/meta e músicas; ver §7). Os dez temas de boss, os nove de round e o tema da loja (commit 3f7e6c7, `scripts/el-music.ts`) estão ligados desde 2026-11-10. Sons novos entram aqui antes de gerar.

## 7. Orçamento

Plano **Creator** (ativo), 124.333 créditos no ciclo atual, 66.135 usados em 2026-11-08. Regra: gerar 1 take, ouvir, só então variações; registrar tudo no `log.jsonl`.

### Registro de 2026-11-08 (T4.8)

- Saldo antes: 58.198 créditos; depois: 57.679. **Gasto total: 519** (11 SFX de 0,5 a 1,2 s, 1 take cada, + `music.shop` de 30 s, 1 take). Isso passou do teto duro de 450 do lote em 69 créditos: a estimativa de ~20 para os SFX e ~380 para a música estava abaixo do real; o custo por faixa não foi medido separadamente. Nada mais foi gerado depois de notar.
- Loudness: os takes saíram fora do alvo (`music.shop` a −33 LUFS, `sfx.shopLock` a −39). Normalizados offline, sem créditos, por `bun scripts/el-normalize.ts <chaves>` (SFX −14, música −18 LUFS; originais em `art-src/elevenlabs/`). Em clipes de 0,5–1 s o `loudnorm` de um passe não acerta o alvo (ficaram entre −14 e −21 LUFS); o ajuste fino fica no volume por chave de `src/data/sfx.ts`. `music.shop` ficou a −17,7 LUFS.
- Saldo: `bun --env-file=.env scripts/el-quota.ts`.

### Registro de 2026-11-08 (T7.5)

- Teto duro do lote: 1.200 créditos. **Gasto 1.142**, medido pela diferença de uso (uso de 66.654 para 67.796; saldo 57.679 → 56.537).
  - `music.forest` e `music.city`: 495 créditos cada (36 s, ~13,75 créditos/s). Reduzi de 45 s para 36 s para caber no teto junto com os SFX.
  - 8 SFX de armas novas: ~67 (~8,4 cada); 3 de UI e 3 de boss (`sfx.mooseKingRoar`, `sfx.colossusRoar`, `sfx.bossDown`): ~85.
  - A API recusa `duration_seconds` < 0,5: o hover e o back ficaram em 0,5 s.
  - O saldo da API atualiza com alguns segundos de atraso; conferir de novo antes de somar.
- Normalizados com `bun scripts/el-normalize.ts` (música −18 LUFS: forest −18,4 e city −18,1; SFX −14 LUFS: entre −14,4 e −16,4 nos medidos).
- Ligação: SFX de arma tocam pelo callback do `SecondarySystem` (`WEAPON_SFX` em `GameScene`, com `grenadeBelt` → `sfx.explosion` e `poisonCloud` → `sfx.cast`); rugido por boss em `bossRoarSfx`; `sfx.bossDown` no abate do boss; sons de menu em `src/ui/focus.tsx` via `src/ui/ui-sound.ts` (ligado em `main.ts`).

### Registro de 2026-11-08 (fecho das pendências)

- Teto duro: 150 créditos. Gerados e ligados `sfx.krakenInk` (volley do kraken), `sfx.abominationAcid` (poças ácidas dos bosses), `sfx.pearls` (fim de run com Pérolas), `sfx.dangerUnlock` (Danger liberado), `sfx.equip` (equipar e desequipar na pausa, gear comprado na loja) e `sfx.demoEnd` (tela de fim da demo). 1 take cada, normalizados a −14 LUFS.
- Gasto: 76 créditos (uso 67.796 → 67.872; saldo 56.537 → 56.461).

### Registro de 2026-11-10 (músicas novas)

- Geradas e ligadas: dez temas de boss, nove temas de round e `music.shop.theme`. Saldo do plano: cerca de 11,1 mil créditos gastos no ciclo e 45.317 restantes; o ciclo reseta em 14/11.
