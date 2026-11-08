# Direção de Som — Pinguin Survivors

> **Versão** 2.0 · **Data** 2026-11-08 · Ferramenta única: **ElevenLabs** (`ELEVENLABS_API_KEY` só no `.env`). Pipeline na skill `.agents/skills/pinguin-audio-assets`; log bruto em `art-src/elevenlabs/log.jsonl`; decisão de remover vozes em [adrs/ADR-009](adrs/ADR-009-remover-vozes.md).

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

- Formato: **MP3 44,1 kHz 128 kbps** (saída da API). Música em loop com crossfade de 800 ms (`src/core/music.ts`); SFX via `sfx(scene, key)` (`src/core/audio.ts`) com volume por chave, limite de vozes simultâneas e variação de pitch ±5% (`src/data/sfx.ts`).
- Loudness alvo: SFX −14 LUFS, música −18 LUFS (normalização offline ao gerar).
- Mixagem: canais master, música, SFX (voz removido). Ducking de −6 dB na música durante o superpoder e o rugido do boss.
- Variações: hit, shotgun, splat, zombieDeath (3 takes), swing (2) sorteados por `SFX_VARIANTS`.
- Mobile/WebView: destravar o `AudioContext` no 1º toque; pausar ao perder o foco.

## 3. Catálogo e prompts (SFX)

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

Prompts completos e parâmetros em `art-src/elevenlabs/log.jsonl`.

## 4. Música

Endpoint `POST /v1/music` (`force_instrumental: true`), ~560 créditos por 45 s (~750/min). **Nunca citar jogos, bandas ou artistas** no prompt (a API recusa). Faixas existentes em `public/assets/audio/music/`:

| Chave | Duração | Uso |
|---|---|---|
| `music.menu` | 40 s | menu principal |
| `music.round` | 45 s | rounds 1–20 |
| `music.late` | 45 s | rounds ≥ 21 |
| `music.boss` | 45 s | rounds de boss |

Loops de reserva feitos pelo endpoint de SFX em `art-src/elevenlabs/music/*-loop.mp3`.

## 5. Vozes (removidas na 1.0)

Histórico, mantido para referência (arquivos e código na branch `legacy-voices`): 1 voz por herói via Voice Design (`/v1/text-to-voice`, 3 prévias, 1 escolhida), mesma voz para EN e PT-BR com `eleven_multilingual_v2`; 7 eventos × 2 takes × 3 heróis × 2 idiomas = 84 falas. Prompts de voz: Jack "young adult male, cocky and brash action-hero energy, slightly raspy"; Bob "middle-aged male war veteran, deep gravelly baritone, dry humor"; Lucia "adult female mystic sorceress, calm and low, mysterious and elegant". Removidas por custo de i18n (4 idiomas) e peso no build.

## 6. Pendências para a 1.0

| Item | Chaves | Estimativa |
|---|---|---|
| SFX da loja | `sfx.shopBuy`, `sfx.shopReroll`, `sfx.shopLock`, `sfx.weaponFuse`, `sfx.shopOpen` | ~20 créditos |
| SFX de armas novas | `sfx.knife`, `sfx.boomerang`, `sfx.pistol`, `sfx.crossbow`, `sfx.molotov`, `sfx.mine`, `sfx.totem`, `sfx.flameRing` | ~35 |
| SFX de elementos | `sfx.fire`, `sfx.ice`, `sfx.earth`, `sfx.lightning`, `sfx.freeze` | ~20 |
| SFX de bosses | `sfx.krakenInk`, `sfx.abominationAcid`, `sfx.bossDeath` | ~12 |
| SFX de UI/meta | `sfx.pearls`, `sfx.dangerUnlock`, `sfx.equip`, `sfx.demoEnd` | ~16 |
| Música da loja | `music.shop` (30 s) | ~380 |
| Música dos biomas 2–3 | `music.station`, `music.ruins` (45 s cada) | ~1.120 |
| Sting de boss derrotado | `sfx.bossDown` | ~4 |

Total estimado **~1.600 créditos** de 58.198 disponíveis (renova em 14/11/2026). Sobra para 2–3 takes de cada música.

## 7. Orçamento

Plano **Creator** (ativo), 124.333 créditos no ciclo atual, 66.135 usados em 2026-11-08. Regra: gerar 1 take, ouvir, só então variações; registrar tudo no `log.jsonl`.
