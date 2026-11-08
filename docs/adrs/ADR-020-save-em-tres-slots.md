# ADR-020 — Save em três slots, sem compatibilidade com saves antigos

**Status** Aceito · **Data** 2026-11-08 · **Contexto** [SDD-014](../sdds/SDD-014-slots-de-save-suporte-e-pocao.md), [SDD-005](../sdds/SDD-005-danger-e-save-v2.md), [SDD-007](../sdds/SDD-007-ports-electron-capacitor.md)

## Decisão

- O save passa a ser **um documento com três slots** (estilo Hades 2): `{ version: 3, settings, slots: [SlotData | null × 3], active }`. O slot é o `SaveData` do jogador inteiro menos as configurações; as configurações (idioma, volume, vídeo, controles, telemetria) são globais.
- O jogo continua com **um único `SaveData` em memória**, ligado ao slot ativo. Trocar de slot substitui o conteúdo desse objeto no lugar, porque cena, menus e bridges guardam a mesma referência. Nada no código de jogo precisa saber de slots; só `core/storage.ts` e as telas de menu.
- O arquivo continua passando pela `Platform` com a mesma chave (`pinguin-survivors.save`): `save.json` no `userData` do Electron (Steam Cloud sincroniza o arquivo inteiro, três slots juntos), `localStorage` na web, Preferences no Android. Nenhuma mudança nos shells.
- **Sem compatibilidade** (decisão do desenvolvedor): arquivo das versões 1 e 2, corrompido ou de versão futura começa vazio. As migrações v1→v2 foram removidas. O arquivo ilegível é guardado em `save.backup` antes de ser sobrescrito. Isto vale até a 1.0, como já dizia o GDD §18.

## Consequências

- `SAVE_VERSION` sobe para 3; qualquer jogador com save v2 começa do zero (aceito pelo desenvolvedor, o jogo ainda não foi publicado).
- Sem slot ligado (primeira execução ou slot ativo apagado) o progresso não é gravado: o menu esconde tudo que depende de progresso e o jogo só segue por "Novo jogo". Rodar com `?skipMenu=1` sem slot joga sem persistir; os scripts de QA semeiam um slot (`scripts/lib/seed-save.ts`).
- Três slots dividem a cota de `localStorage` (~5 MB): cada slot é pequeno (histórico de 20 runs, telemetria limitada a 200 eventos).
- Alternativa descartada: um arquivo por slot. Quebra a chave única da `Platform`, exige mudança nos três shells e nega a sincronização atômica do Steam Cloud.
