# Prompts de áudio (ElevenLabs) — base fixa e blocos por tipo

Antes de gerar, monte o prompt por este arquivo: **BASE + bloco do tipo + campos variáveis**. Só os campos entre `{chaves}` mudam. Fontes: [audio.md](../../../docs/audio.md) §1–§6 (direção, catálogo de SFX, músicas, pendências) e logs `art-src/elevenlabs/log.jsonl` (prompts e parâmetros que já deram certo). Itens marcados **(proposta)** não têm exemplo no log e precisam de um take de teste antes de lote.

## 1. Regras fixas (valem para todo som)

- **Sem voz**: nada de fala, grito articulado, canto, Text to Speech ou Voice Design (ADR-009). Sons de criatura ("groan", "gurgle") são permitidos porque o log já os usa, mas sem palavras (**proposta** de regra explícita).
- **Sem nomes** de jogos, bandas ou artistas no prompt. A API recusa (SKILL, regra 6).
- **Tom**: `cartoon gritty` (pedido do desenvolvedor): gráfico e exagerado, mas com peso de metal e carne. Os SFX do log já seguem isso ("cartoonish but gritty" no `sfx.heroHurt`, "wet meaty" no `sfx.hit`).
- **Uma take** por padrão; variações (2–3) só para sons quentes (hit, shotgun, splat, zombieDeath, swing), registradas em `SFX_VARIANTS` (SKILL, regra 7).
- **Loudness**: SFX −14 LUFS, música −18 LUFS, MP3 44,1 kHz 128 kbps (audio.md §2).

## 2. Blocos de SFX

Prompt final: `{sound}, {character}, {tone}`, com `durationSeconds` do bloco.

| Bloco | `{sound}` (modelo) | `{character}` | `durationSeconds` | Exemplo do log |
|---|---|---|---|---|
| Impacto em carne | `wet meaty flesh impact of a {weapon} hitting a zombie` | `short and punchy` | 0,5 | `sfx.hit` |
| Corte / arco | `fast {weapon} whoosh swing through the air` | `sharp` | 0,5–0,8 | `sfx.swing` |
| Tiro | `powerful {weapon} blast` | `punchy low end and short echo` | 1,0 | `sfx.shotgun` |
| Elemento | `magic staff casting an {element} bolt` | `crackling energy whoosh` | 1,0 | `sfx.cast` (elemento genérico) |
| Explosão / sangue | `brutal {event} with debris and fire` / `gory splatter of blood hitting {surface}` | `heavy boom` / `wet squelch` | 1,0–1,5 | `sfx.explosion`, `sfx.splat` |
| Criatura morrendo | `{creature} dying groan cut short with a gurgle` | `creepy, short` | 0,8 | `sfx.zombieDeath` |
| Coleta e UI | `{object} pickup` / `short crisp menu {action} click` | `tiny bright chime` / `metallic tick` | 0,5–0,8 | `sfx.pickupXp`, `sfx.uiSelect` |
| Meta e sting | `{event} sting for a brutal heavy metal video game` | `short distorted guitar power chord with a bright metallic chime` | 2,0–2,5 | `sfx.achievement`, `sfx.levelUp` |
| Boss | `huge {boss} roar, monstrous, rotten and terrifying` | `short` (até 2 s) | 2,0 | `sfx.bossRoar` |

Campos: `{weapon}` (`machete`, `shotgun`, `staff`), `{element}` (`fire`, `ice`, `earth`, `lightning`), `{surface}` (`snow`), `{creature}` (`zombie animal`), `{event}`, `{boss}`.

## 3. Blocos de música

Prompt final, no mesmo padrão dos quatro faixas já geradas:

```
Instrumental {genre} track for {context}: {instrumentation}, {mood}, {bpm} bpm, loopable, no vocals
```

- `{genre}`: `heavy metal and industrial` (round, boss, late), `doom metal` (menu), `ambient` (loja, **proposta**).
- `{context}`: texto curto de cena, sem nome de jogo. Ex.: `a brutal zombie horde survival video game` (log) ou `a shop screen in a brutal zombie horde game` (**proposta**).
- `{instrumentation}`: guitarras, bateria, sintetizador, vento, drone.
- `{mood}`: `relentless`, `brooding`, `intense`, `calm`.
- `{bpm}`: campo obrigatório, como no log.
- `{length_ms}`: 30 000 a 60 000 (regra da SKILL). Loop sem intro/outro longo.

### 3.1 Referência por bioma e uso (do log e de audio.md §4)

| Chave | BPM (log) | Duração | Instrumentação do log |
|---|---|---|---|
| `music.menu` | (doom, sem BPM no prompt) | 40 s | guitarras lentas, drone grave, tambores distantes, vento ártico |
| `music.round` | 140 | 45 s | djent com riffs drop-tuned, bumbo duplo, baixo sintetizado |
| `music.late` | 155 | 45 s | death metal industrial, sintetizador dissonante, cidade em chamas |
| `music.boss` | 170 | 45 s | blast beats, tremolo, industrial, baixo rugindo |
| `music.forest` (pendente) | **(proposta)** 110 | 45 s | floresta: drone de vento entre pinheiros, cordas graves, percussão de madeira e tambores lentos (ADR-016) |
| `music.city` (pendente) | **(proposta)** 150 | 45 s | cidade destruída: industrial sujo com percussão de metal e pulsos sintéticos alienígenas (ADR-016) |
| `music.station` (legado, endless) | (sem uso na campanha) | 45 s | estação e porto: metal industrial com sirene e vento de mar (ADR-016) |
| `music.ruins` (legado, endless) | (sem uso na campanha) | 45 s | cidade em ruínas: industrial sujo com percussão de metal (ADR-016) |

### 3.2 Parâmetros da API

- Música: `POST /v1/music`, `force_instrumental: true`, `lengthMs`. Custo ~560 créditos por 45 s (SKILL, regra 6).
- Loop de reserva (fallback): `POST /v1/sound-generation` com `loop: true`, 24–28 s (log: `music.round`, `music.menu`, `music.boss`, em `art-src/elevenlabs/music/*-loop.mp3`).
- SFX: `POST /v1/sound-generation` com `text` e `durationSeconds`; ~4 créditos por SFX curto.

## 4. Checklist antes de gastar créditos

1. Base da §1 respeitada: sem voz, sem nome, `cartoon gritty` no tom.
2. Duração do bloco escolhida pela tabela; música entre 30 e 60 s com `loopable`.
3. `GET /v1/user/subscription` antes do lote; saldo anotado em `docs/audio.md` §7.
4. Uma take; ouvir; só então variações.
5. Loudness alvo e registro em `art-src/elevenlabs/log.jsonl` (`{key, endpoint, prompt, params, at}`).
6. Chave `sfx.*` ou `music.*` registrada em `src/art/manifest.ts` e mix em `src/data/sfx.ts`.
7. `ELEVENLABS_API_KEY` só no `.env`.

## 5. Exemplos preenchidos

### 5.1 `sfx.shopBuy` (compra na loja)

- Bloco: Meta/UI (proposta, o item está pendente em audio.md §6).
- Texto: `metal coins dropping into a cash box and a short register bell, ka-ching, short and clean, cartoon gritty`
- `durationSeconds`: 0,8. 1 take.

### 5.2 `sfx.fire` (elemento fogo, pendente em audio.md §6)

- Bloco: Elemento.
- Texto: `magic staff casting a fire bolt, crackling flame burst with a short roaring whoosh, cartoon gritty`
- `durationSeconds`: 1,0. 1 take. (**proposta**: o texto não está no log.)

### 5.3 `music.shop` (loja, 30 s, pendente em audio.md §6)

- Bloco: Música, uso de loja ("ambiente curto, calmo, com vento polar", audio.md §1).
- Texto:

```
Instrumental ambient track for a shop screen in a brutal zombie horde game: low wind over arctic silence, soft distant metal clank, slow minor drone, melancholic and calm, 70 bpm, loopable, no vocals
```

- `lengthMs`: 30 000, `force_instrumental: true`. Custo estimado ~380 créditos (audio.md §6).
- 70 bpm é **proposta**; o log não tem música calma. Ouvir e ajustar antes de variações.
