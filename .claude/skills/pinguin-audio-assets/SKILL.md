---
name: pinguin-audio-assets
description: Use when creating or replacing any sound of Pinguin Survivors (SFX, DOOM-style metal music, EN/PT-BR penguin voice lines) with the ElevenLabs API, or when touching scripts/el-*.ts, public/assets/audio or the audio keys in src/art/manifest.ts.
---

# Pinguin Survivors — audio with ElevenLabs

Read `docs/audio.md` first (direction, formats, keys, loudness).

## Rules

1. Key `ELEVENLABS_API_KEY` only in `.env` (header `xi-api-key`). Never commit or print it.
2. **Check the current endpoint/params in the official docs before coding** (https://elevenlabs.io/docs/api-reference): Sound Effects `POST /v1/sound-generation` (`text`, `duration_seconds`, `prompt_influence`), Music `POST /v1/music`, Text to Speech `POST /v1/text-to-speech/{voice_id}`, Voice Design `/v1/text-to-voice/*`.
3. Scripts live in `scripts/el-<kind>.ts` (sfx, music, voice), are idempotent (skip existing files) and append `{key, endpoint, prompt, params, at}` to `art-src/elevenlabs/log.jsonl`.
4. Output OGG in `public/assets/audio/<group>/<key>.ogg`; register the key in `src/art/manifest.ts` (`sfx.*`, `music.*`, `vo.<hero>.<event>.<lang>.<n>`).
5. Voices: one designed voice per hero (Jack young and cocky, Bob deep veteran, Lucia calm mystic), **same voice for EN and PT-BR**; lines come from `src/i18n` so subtitles match.
6. Music: heavy metal/industrial, **never name games, bands or artists in prompts** (the API rejects them as copyrighted). ~560 credits per 45 s on the Starter plan: keep tracks short (40–60 s) and generate one take at a time.
7. Generate 2–3 variations of hot SFX (hit, shot, blood) for pitch/variation rotation.
