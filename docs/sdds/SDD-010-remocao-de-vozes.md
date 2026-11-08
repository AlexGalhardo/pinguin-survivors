# SDD-010 — Remoção de vozes e legendas

**Versão** 1.0 · **Data** 2026-11-08 · **Status** Aprovada · **ADR** [009](../adrs/ADR-009-remover-vozes.md)

## Pré-condição

Branch `legacy-voices` criada a partir de `main` e enviada ao origin em 2026-11-08 (feito).

## Requisitos

- RF-01 Remover: `public/assets/audio/vo/**`, `src/core/voice.ts`, `src/data/voice.ts`, `src/i18n/voice.en.ts`, `src/i18n/voice.pt-BR.ts`, `scripts/el-voice.ts`, `tests/voice.test.ts`, `art-src/elevenlabs/voices/**` e `voices.json` (ficam na branch).
- RF-02 Remover do manifest as chaves `vo.*` e do `BootScene` o carregamento por idioma; remover `settings.voiceVolume`, `settings.subtitles` e a UI correspondente; remover legendas da HUD.
- RF-03 `VoiceLimiter` (`src/logic/voice-limiter.ts`) **fica**: é o limitador de vozes simultâneas de SFX; renomear para `sfx-limiter.ts` se a leitura confundir.
- RF-04 Save: campos de voz ignorados na migração v2 (SDD-005).
- RF-05 Lojista fala por texto (balões em React), sem áudio.

## Critérios de aceite

| # | Assert | Verificação |
|---|---|---|
| A1 | `rg -n "voice\|subtitle\|vo\." src tests scripts --glob '!**/voice-limiter*' --glob '!**/sfx-limiter*'` retorna vazio | grep |
| A2 | `ls public/assets/audio` não contém `vo/`; `du -sh public/assets` cai ≥ 3 MB | shell |
| A3 | `bun run lint && bun run typecheck && bun test && bun run build` verdes | gates |
| A4 | E2E completo sem erros de console após a remoção | `bun run e2e` |
| A5 | CHANGELOG `[Unreleased] → Removed` registra a remoção e aponta para `legacy-voices` | arquivo |
