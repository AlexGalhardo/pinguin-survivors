# SDD-009 — Idiomas ES e ZH simplificado

**Versão** 1.0 · **Data** 2026-11-08 · **Status** Aprovada · **ADR** [010](../adrs/ADR-010-idiomas-en-ptbr-es-zh.md)

## Requisitos

- RF-01 `LANGS = ['en', 'pt-BR', 'es', 'zh-CN']`; arquivos `src/i18n/<dominio>.<lang>.ts` para `ui`, `cards`, `achievements`, `gear`, `shop`, `weapons`.
- RF-02 Teste de paridade: mesmas chaves nos 4 idiomas; mesmos placeholders `{var}`; nenhuma string vazia.
- RF-03 Glossário fixo em `docs/i18n-glossary.md` (nomes de heróis, Fish, Pérolas, Danger, nomes de armas e bosses) — **termos do glossário não são traduzidos livremente**.
- RF-04 Tradução por IA (agente `text-editor`) a partir do EN com instrução de registro (ES neutro latino-americano; ZH simplificado, tom de jogo de ação), seguida de revisão humana marcada em `docs/i18n-glossary.md` (tabela de status por domínio).
- RF-05 Fonte CJK `@fontsource/noto-sans-sc` carregada só quando `locale === 'zh-CN'`; fallback do sistema até carregar.
- RF-06 Layouts validados em ES (textos ~20% mais longos) e ZH (glifos altos, textos curtos) em 1920×1080 e 2400×1080; sem overflow em HUD, loja, cartas e menus.
- RF-07 Detecção inicial por `navigator.language` (zh*→ zh-CN, es* → es, pt* → pt-BR, senão en); troca em Configurações; persistida no save.
- RF-08 Site (SDD-008) e página da Steam usam o mesmo glossário.

## Especificação

- `src/i18n/index.ts`: `LANGS`, `t()`, `detectLocale()`; `src/i18n/*.es.ts`, `*.zh-CN.ts`.
- `scripts/i18n-check.ts`: paridade + placeholders + strings vazias (também usado pelo teste).
- `scripts/lint-i18n.ts`: proíbe literais com letras em JSX fora de `t()` (SDD-004 A5).

## Critérios de aceite

| # | Assert | Verificação |
|---|---|---|
| A1 | `bun test tests/i18n.test.ts` verde com 4 idiomas | teste |
| A2 | `bun scripts/i18n-check.ts` imprime `0 missing, 0 extra, 0 placeholder mismatch` | script |
| A3 | Screenshot da loja e das cartas em `?lang=zh-CN` e `?lang=es` sem overflow (1920×1080 e 2400×1080) | agent-browser |
| A4 | Tabela de status do glossário com todos os domínios em "revisado" antes do release 1.0 | docs/i18n-glossary.md |
| A5 | Fonte Noto Sans SC não é baixada em `?lang=en` (network tab) | chrome-devtools |
