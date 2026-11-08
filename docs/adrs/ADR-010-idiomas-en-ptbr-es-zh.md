# ADR-010 — Idiomas da 1.0: EN, PT-BR, ES e ZH simplificado

**Data** 2026-11-08 · **Status** Aceito · **Decisão de origem** B-21 · **Estende** P-31

## Contexto

UI em EN + PT-BR com teste de paridade de chaves. O desenvolvedor quer ampliar o alcance comercial: espanhol para LATAM e chinês simplificado, mercado grande para survivors na Steam.

## Decisão

- 4 idiomas na 1.0: `en`, `pt-BR`, `es`, `zh-CN`. Textos só em `src/i18n/` (um arquivo por idioma por domínio: ui, cards, achievements, gear, shop).
- ES e ZH traduzidos por IA (agente `text-editor`) a partir do EN, com revisão humana antes do release; glossário de termos fixos (Fish, Pérolas, Danger, nomes de heróis) em `docs/i18n-glossary.md`.
- Teste `tests/i18n.test.ts` exige o mesmo conjunto de chaves nos 4 idiomas e detecta placeholders `{var}` faltando.
- Fonte: Rubik cobre latino; para ZH entra uma fonte CJK (Noto Sans SC via `@fontsource`) carregada só quando o idioma for `zh-CN`.
- Página da Steam e site nos 4 idiomas.

## Alternativas

- Só EN + PT-BR: menor alcance. Rejeitada.
- EN + PT-BR + ES: sem o mercado chinês. Rejeitada.

## Consequências

- ~+2 arquivos por domínio de i18n; build com split de fontes por idioma.
- Layouts testados em ZH (textos curtos, glifos altos) e ES (textos ~20% mais longos que EN).
