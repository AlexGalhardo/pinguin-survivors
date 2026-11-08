# Dados de gameplay, textos, cores e chaves de assets

- **Números de gameplay só em `src/data/*.ts`**, espelhados em `docs/balancing-and-simulation.md` Parte B. Mudou um, atualize o outro no mesmo commit. Nenhum número mágico em `src/logic`, `src/systems` ou `src/ui`.
- **Textos só em `src/i18n/`**, sempre nos 4 idiomas juntos (`en`, `pt-BR`, `es`, `zh-CN`), um arquivo por domínio e idioma. Teste de paridade de chaves e placeholders (`bun test tests/i18n.test.ts`; `bun scripts/i18n-check.ts`). Glossário em `docs/i18n-glossary.md` (termos fixos: Fish, Pérolas/Pearls, Danger, nomes de heróis, armas e bosses).
- **Cores só em `src/config/palette.ts`** (exportadas para o CSS do Tailwind).
- **Toda textura, animação e som tem chave em `src/art/manifest.ts`** (contrato em `docs/visual.md` §9); placeholders por código e assets finais compartilham a chave.
- Regras de design (loop, armas, loja, cartas, economia, danger) vêm do `docs/gdd.md`; se o código precisar divergir, edite o GDD/SDD antes.
- RNG com seed em todo sorteio de gameplay (`src/logic/rng.ts`); `?seed=` reproduz a run.
