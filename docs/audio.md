# Áudio

> Ferramenta: **ElevenLabs** (chave `ELEVENLABS_API_KEY` no `.env`, nunca no git). Scripts `scripts/el-*.ts` (a criar) geram os arquivos em `public/assets/audio/` e registram prompt + parâmetros em `art-src/elevenlabs/log.jsonl`. Siga a skill **`pinguin-audio-assets`**.
> Confirme os endpoints na documentação oficial antes de implementar (https://elevenlabs.io/docs): Sound Effects (`POST /v1/sound-generation`), Music (`POST /v1/music`), Text to Speech (`POST /v1/text-to-speech/{voice_id}`), Voice Design (`/v1/text-to-voice/...`).

## Direção

- **Música**: metal/industrial estilo DOOM (djent, riffs graves, bateria agressiva). Faixas: menu (sombria, lenta), round (loop 90–120 s, intensidade média), round tardio (≥ 20, mais pesada), boss (máxima), game over (curta).
- **SFX**: pesados e "carnudos": golpe de machete, katana, motosserra, tiro de escopeta (com eco), foguete, 4 elementos (fogo, terra, gelo, energia), impacto em carne, jorro de sangue, gib, explosão, coleta de XP/Fish, level up, carta, poção, UI.
- **Vozes** (EN + PT-BR, seguem o idioma): frases curtas por herói — início de run, level up, HP baixo, poção usada, boss aparece, vitória no boss, morte. Timbre: Jack (jovem, marrento), Bob (grave, veterano), Lucia (calma, mística).

## Estado (2026-09-27)

- Plano **free** do ElevenLabs (P-55): 10 mil créditos/mês, uso não comercial. Custo medido: **17 SFX curtos ≈ 72 créditos** (~4 cada).
- Catálogo gerado (1 variação cada, `scripts/el-sfx.ts`): achievement, hit, swing, shotgun, cast, explosion, splat, zombieDeath, heroHurt, pickupXp, pickupFish, levelUp, card, potion, bossRoar, super, uiSelect, gameOver → `public/assets/audio/sfx/*.mp3`.
- Mixagem por chave em `src/data/sfx.ts` (volume, vozes simultâneas, variação de pitch); tocar sempre via `sfx(scene, key)` (`src/core/audio.ts`), que aplica volume geral × efeitos e o limitador.
- **A Music API não existe no plano free** (402). Solução: loops de 24–28 s pelo endpoint de SFX com `loop: true` (modelo `eleven_text_to_sound_v2`): `music.menu`, `music.round`, `music.boss` em `public/assets/audio/music/`, tocados por `src/core/music.ts` (crossfade 800 ms, volume geral × música). Se a qualidade não bastar, esse é o motivo para o upgrade (P-55).
- Pendente: vozes EN/PT-BR (TTS funciona no free; avaliar custo).

## Regras técnicas

- Formato: **MP3** 44,1 kHz 128 kbps (saída do ElevenLabs); SFX normalizados em −14 LUFS, música em −18 LUFS.
- Chaves no `src/art/manifest.ts` (`sfx.*`, `music.*`, `vo.<hero>.<evento>.<lang>.<n>`).
- `VoiceLimiter` (herdado) limita vozes simultâneas por chave; variação de pitch ±5% em SFX repetidos.
- Volumes separados (master, música, SFX, voz) em Settings. `SOUND_MUTED=true` no `.env` silencia tudo no dev.
- Música com crossfade entre faixas (round → boss).
