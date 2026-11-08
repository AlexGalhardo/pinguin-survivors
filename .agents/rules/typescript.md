# TypeScript

- `strict: true`. Sem `any`: use `unknown` + narrowing. Tipos de retorno explícitos em funções exportadas.
- Valide entrada externa (query params de debug, JSON de save importado, respostas de API nos scripts) na borda, com narrowing explícito; o save já tem parser tolerante e migrações em `src/logic/save.ts`.
- Runtime e pacotes: **Bun** (`bun add`, `bun run`, `bunx`). Node/npm só se uma ferramenta exigir (registre o motivo).
- Formatação e lint: **Biome v2**, TAB largura 4, LF, UTF-8, aspas simples. `bun run lint` verifica; `bun run lint:fix` corrige. Sem ESLint, sem Prettier.
- Nomes em inglês. `PascalCase.ts` para classes, cenas e componentes React; `kebab-case.ts` para módulos.
- Dependências: sempre a última versão **estável**, fixada no `package.json` (sem `^`); nunca `latest`, `next`, `beta`, `rc`. Nenhuma dependência nova que a SDD não liste; pergunte antes.
- Comentários só para o porquê, edge cases não óbvios e workarounds (com motivo). Nunca comente o que o código já diz.
- Corrija a causa raiz; nunca silencie erro, desative teste ou use `@ts-ignore` para "passar".
- Lógica pura em `src/logic/` não importa Phaser nem React; UI em `src/ui/` não importa Phaser; plataforma (`electron`, `@capacitor/*`, `steamworks.js`) só em `apps/*` via `window.platform`.
