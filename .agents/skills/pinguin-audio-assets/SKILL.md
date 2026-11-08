---
name: pinguin-audio-assets
description: Use when creating or replacing any sound of Pinguin Survivors (SFX, DOOM-style metal music) with the ElevenLabs API, or when touching scripts/el-*.ts, public/assets/audio or the audio keys in src/art/manifest.ts. Voices were removed (ADR-009); do not generate voice lines.
---

# Pinguin Survivors — audio with ElevenLabs

Read `docs/audio.md` first (direction, engineering, catalog with prompts, pending list, budget).

Antes de gerar, monte o prompt por [prompts.md](prompts.md) (base fixa, blocos de SFX e música, checklist e exemplos).

## Rules

1. Key `ELEVENLABS_API_KEY` only in `.env` (header `xi-api-key`). Never commit or print it. Check the quota (`GET /v1/user/subscription`) before batches and record it in `docs/audio.md` §7.
2. **No voices** (ADR-009): no Text to Speech, no Voice Design. The merchant speaks through text. Everything voice-related lives in branch `legacy-voices`.
3. **Check the current endpoint/params in the official docs before coding** (https://elevenlabs.io/docs/api-reference): Sound Effects `POST /v1/sound-generation` (`text`, `duration_seconds`, `prompt_influence`), Music `POST /v1/music` (`force_instrumental: true`).
4. Scripts live in `scripts/el-<kind>.ts` (`el-sfx.ts`, `el-music.ts`), are idempotent (skip existing files) and append `{key, endpoint, prompt, params, at}` to `art-src/elevenlabs/log.jsonl`.
5. Output MP3 in `public/assets/audio/<group>/<key>.mp3`; register the key in `src/art/manifest.ts` (`sfx.*`, `music.*`) and the mix entry in `src/data/sfx.ts` (volume, max voices, pitch variation). Play only through `sfx(scene, key)` / `music.play(key)`.
6. Music: heavy metal/industrial, **never name games, bands or artists in prompts** (the API rejects them). ~560 credits per 45 s: keep tracks 30–60 s, generate one take, listen, then variations. Keep tracks loop-friendly (no long intro/outro).
7. SFX: ~4 credits each; generate 1 take, then 2–3 variations only for hot sounds (hit, shot, splat, death, swing) and register them in `SFX_VARIANTS`.
8. Loudness targets: SFX −14 LUFS, music −18 LUFS. Pending list and estimates in `docs/audio.md` §6; stay inside the recorded budget.
