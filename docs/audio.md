# Áudio

> Ferramenta: **ElevenLabs** (chave `ELEVENLABS_API_KEY` no `.env`, nunca no git). Scripts `scripts/el-*.ts` (a criar) geram os arquivos em `public/assets/audio/` e registram prompt + parâmetros em `art-src/elevenlabs/log.jsonl`. Siga a skill **`pinguin-audio-assets`**.
> Confirme os endpoints na documentação oficial antes de implementar (https://elevenlabs.io/docs): Sound Effects (`POST /v1/sound-generation`), Music (`POST /v1/music`), Text to Speech (`POST /v1/text-to-speech/{voice_id}`), Voice Design (`/v1/text-to-voice/...`).

## Direção

- **Música**: metal/industrial estilo DOOM (djent, riffs graves, bateria agressiva). Faixas: menu (sombria, lenta), round (loop 90–120 s, intensidade média), round tardio (≥ 20, mais pesada), boss (máxima), game over (curta).
- **SFX**: pesados e "carnudos": golpe de machete, katana, motosserra, tiro de escopeta (com eco), foguete, 4 elementos (fogo, terra, gelo, energia), impacto em carne, jorro de sangue, gib, explosão, coleta de XP/Fish, level up, carta, poção, UI.
- **Vozes** (EN + PT-BR, seguem o idioma): frases curtas por herói — início de run, level up, HP baixo, poção usada, boss aparece, vitória no boss, morte. Timbre: Jack (jovem, marrento), Bob (grave, veterano), Lucia (calma, mística).

## Regras técnicas

- Formato: **OGG** (e MP3 de fallback se precisar), 44,1 kHz; SFX normalizados em −14 LUFS, música em −18 LUFS.
- Chaves no `src/art/manifest.ts` (`sfx.*`, `music.*`, `vo.<hero>.<evento>.<lang>.<n>`).
- `VoiceLimiter` (herdado) limita vozes simultâneas por chave; variação de pitch ±5% em SFX repetidos.
- Volumes separados (master, música, SFX, voz) em Settings. `SOUND_MUTED=true` no `.env` silencia tudo no dev.
- Música com crossfade entre faixas (round → boss).
