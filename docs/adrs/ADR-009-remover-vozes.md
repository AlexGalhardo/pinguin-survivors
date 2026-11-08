# ADR-009 — Remover vozes e legendas; snapshot em `legacy-voices`

**Data** 2026-11-08 · **Status** Aceito · **Decisão de origem** B-18, B-19 · **Supera** P-31 (vozes), P-33 (vozes)

## Contexto

Existem 84 falas (3 heróis × 7 eventos × 2 takes × EN/PT-BR), `VoiceDirector`, legendas e `src/i18n/voice*.ts`. Com 4 idiomas na 1.0 (ADR-010) o custo de manter vozes quadruplica, os MP3 pesam no build web e o loop frenético dá pouco espaço para falas.

## Decisão

Remover do `main`: `public/assets/audio/vo/`, `src/core/voice.ts`, `src/data/voice.ts`, `src/i18n/voice.*.ts`, legendas na HUD, opção de volume/legendas de voz, chaves `vo.*` do manifest e testes `voice.test.ts`. Antes disso, a branch **`legacy-voices`** foi criada a partir de `main` (2026-11-08) e enviada ao origin com o estado completo (iso + vozes).

## Alternativas

- Só desligar: código morto e 84 arquivos no repositório. Rejeitada.

## Consequências

- Áudio da 1.0: música + SFX + VFX (ADR-010 não afeta áudio).
- Créditos ElevenLabs restantes vão para música (bioma/boss) e SFX novos (loja, fusão, danger).
- `docs/audio.md` registra os prompts das vozes como histórico, marcados como removidos.
