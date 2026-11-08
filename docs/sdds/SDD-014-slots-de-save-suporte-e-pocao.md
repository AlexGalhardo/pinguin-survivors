# SDD-014 — Slots de save, itens de suporte e poção de cura

**Versão** 1.0 · **Data** 2026-11-08 · **Status** Aprovada · **ADR** [020](../adrs/ADR-020-save-em-tres-slots.md) · **GDD** §9, §12, §18

Três frentes independentes entre si, especificadas juntas porque mexem nos mesmos contratos de UI (menu inicial, loja, painel do jogador, HUD).

## Requisitos: slots de save

- RF-01 Um único documento (`save.json` no Electron, `localStorage` na web, Preferences no Android, sempre pela `Platform`): `{ version, settings, slots: [SlotData | null × 3], active }`. `SlotData` é o `SaveData` inteiro do jogador **sem** `settings` (nível, XP, árvore, desbloqueios, conquistas, itens, run em andamento, histórico, telemetria). Configurações globais (idioma, volume, vídeo, controles, telemetria ligada ou não) ficam fora dos slots e valem para os três.
- RF-02 **Sem compatibilidade**: arquivo de versão anterior (v1, v2), corrompido ou de versão futura começa vazio, sem erro e sem migração; o arquivo ilegível é copiado para `save.backup` antes de ser sobrescrito. `SAVE_VERSION = 3`. Dentro de um slot, campo inválido cai no padrão campo a campo (como já era).
- RF-03 O jogo mantém um único `SaveData` em memória, ligado ao slot ativo; carregar outro slot troca o conteúdo **no lugar** (o objeto é compartilhado com a cena). Toda escrita grava o slot ativo e as configurações. Enquanto nenhum slot estiver ligado (primeira execução, ou o slot ativo foi apagado), só as configurações são gravadas.
- RF-04 Menu inicial: **Novo jogo** (sempre), **Carregar** (se houver ao menos um slot usado), e Jogar/Continuar/Heróis/Oficina/Conquistas/Histórico só com um slot ligado.
- RF-05 Tela `save-slots` (`SaveSlots.tsx`), três linhas: herói, nível, melhor round, tempo jogado, data da última gravação, "run em andamento", marca de ativo. Modo **carregar**: Carregar e Apagar por slot. Modo **novo**: "Começar aqui" por slot; em slot usado pede confirmação de sobrescrita; ao confirmar (ou em slot vazio) cria o slot vazio, o liga e abre a seleção de herói.
- RF-06 Apagar sempre pede confirmação. Apagar o slot ativo desliga o slot (volta ao estado "sem slot").
- RF-07 Export/import `.json` das configurações continua pelo slot ativo; importar sem slot ligado cria o jogo no primeiro slot livre.

## Requisitos: sem mochila (equipamento)

- RF-30 `RunGear.bag` e as ações equipar/desequipar da pausa saem. **Comprar equipamento equipa na hora** no slot dele; o item que estava no slot é **vendido automaticamente** por `gearSellValue(raridade, round)` (metade do preço de prateleira da raridade dele, como as armas). `describeOffer` ganha o resultado `replace` (`worn`, `wornRarity`, `sellFish`) e os `statChanges` já são o líquido (novo menos o vendido); a loja diz "Substitui {nome} {raridade}: equipa na hora e o antigo é vendido por {n} Fish".
- RF-31 Mesma regra para equipamento pego no chão (drops comuns, IV e V). Decisão de implementação: se o item usado no slot tem raridade **maior** que a do drop, o usado fica e é o drop que é vendido (`keepBetter`); raridade igual ou maior no drop substitui. Sem isso um drop comum trocaria um item V.
- RF-32 Armas: sem mudança (compra num slot livre; com 6 cheias só se houver fusão; sem guardar). A pausa é só visualização (stats, armas e equipamento com raridade e afixos); a loja só tem Comprar, Vender (armas) e Fundir. Sem compatibilidade de save para o formato antigo da run.

## Requisitos: itens de suporte

- RF-10 Categoria nova da loja (`kind: 'support'`, raridade I). Comprar de novo o mesmo item sobe o nível, de 1 a 5; no nível 5 o item deixa de ser oferecido.
- RF-11 Quatro slots próprios, separados dos 6 de arma: um item novo exige slot livre; um item já possuído sempre pode subir de nível.
- RF-12 Números em `src/data/support.ts`: preço de um nível = `SUPPORT_PRICE` + `pricePerRound × round` (igual para todos os níveis; ver riscos), `MAGNETIC` (raio e puxada por nível) e `SUPPORT_STATS` (bônus acumulado por nível).
- RF-13 **Magnético**: puxa as bolinhas de XP **e os Fish** (nunca equipamento nem packs de vida). Raio extra de coleta por nível: 40, 75, 110, 150, 200 u (soma-se ao alcance de coleta do herói, 60 u de base); velocidade da puxada ×1,25, ×1,5, ×1,8, ×2,2, ×2,8.
- RF-14 **Botas Ligeiras** (`swift`): velocidade de movimento +4, +8, +12, +16, +20. **Amuleto da Sorte** (`lucky`): sorte +3%, +6%, +9%, +12%, +15%. Ambos aplicam só a diferença entre níveis no `PlayerStats` da run (o snapshot da run já guarda os stats).
- RF-15 Propostas **não** implementadas (decisão de produto pendente): **Escudo de Gelo** (absorve X% da vida máx. e recarrega a cada round), **Ressonância** (+área dos ataques por nível) e **Pele Grossa** (reduz dano de contato).
- RF-16 Contratos: `ShopOfferView` ganha `kind` `support` e `healPotion` com `description.outcome` `support` (`from`, `to`, `value`) ou `healPotion` (`from`, `to`, `healShare`); `PlayerPanelView` ganha `support` (id, nível, máx., valor), `supportSlots` e `healPotion`. A loja mostra a oferta com o texto do que a compra faz; o painel do jogador (loja e pausa) lista os itens e a poção.

## Requisitos: poção de cura

- RF-20 Comprada no lojista (`kind: 'healPotion'`, id `healPotion`, preço `HEAL_POTION.price` + `pricePerRound × round`). Nível 1 = carrega 1 poção; cada compra sobe um nível até 10 (= 10 poções) e põe uma poção no bolso na hora. Recarga **por round** (decisão do desenvolvedor, 2026-11-08, substitui a recarga por 100 abates): cada compra soma 1 à capacidade, fixa até o fim da run (máximo 10 compradas no lojista), e **todo round começa com todas as poções cheias** (`refillHealPotion` em `startRound`).
- RF-21 Cura por raridade (`HEAL_POTION.heal`): I 25%, II 30%, III 35%, IV 40%, V 50% da vida máx. O lojista vende só a raridade I; a raridade sobe por **drop de melhoria**: Elite (12% por abate) dropa II ou III, Boss (sempre) dropa IV ou V (sorteio 50/50). Só dropa se o jogador tem a poção e ela não está na V. Ao pegar: a raridade vira a do drop se for maior, senão sobe **um** degrau (máx. V); o drop é um brilho no chão (cor da raridade) que se pega ao pisar, como equipamento. A raridade vale pela run.
- RF-22 Uso **automático** quando a vida ≤ 50%, uma poção por vez, recarga de 2 s entre poções (`tickHealPotion`, lógica pura). Conta em `potionsUsed`.
- RF-23 **Substitui** as poções Cura e Mega Cura e os gambits de cura: `heal` e `megaHeal` saem de `POTION_TYPES`, preços, efeitos, chaves de i18n e do bot. Ficam Escudo, Fúria, Antídoto e Pressa nos gambits. Não são cura de poção (e ficam): packs de vida do chão, carne do Açougueiro e regeneração.
- RF-24 HUD: `HudSnapshot.healPotion` (`charges`, `level` = máximo, `rarity`; `null` antes da primeira compra), desenhado sob a barra de vida (canto superior esquerdo): frasco SVG cheio na cor `rarityColor` da raridade quando há carga e apagado quando vazia, e `cargas/máx.`. Sem arte nova.

## Especificação

- `src/logic/save.ts`: `SaveFile`, `SlotData`, `parseSaveFile`, `serializeSaveFile`, `composeSave`, `toSlot`, `newSlot`, `summarizeSlot`; `parseSave` (um `SaveData`) segue valendo para export/import e rejeita versão diferente da atual.
- `src/core/storage.ts`: estado do arquivo e do slot ligado; `loadSave`, `writeSave`, `loadSlot`, `startNewSlot`, `deleteSlot`, `slotSummaries`, `activeSlot`, `hasActiveSlot`.
- `src/data/support.ts`, `src/data/potions.ts` (`HEAL_POTION`), `src/logic/support.ts`, `src/logic/heal-potion.ts`; `RunState.support` e `RunState.healPotion`; `shopPool(hero, round, run)` inclui só o que ainda sobe de nível.
- `PickupSystem`: tipo `potion` (valor = raridade) e `update(..., magnet)`.
- UI: `SaveSlots.tsx`, `MainMenu.tsx`, bloco de suporte no `PlayerPanel.tsx`, oferta no `Shop.tsx`, frasco no `Hud.tsx`. Textos em `src/i18n/slots.*.ts` e `support.*.ts` (4 idiomas). Sem arte nova: suporte usa os ícones de equipamento (`item.amulet.magnet`, `item.legs.hermes`, `item.amulet.clover`), a poção usa `icon.potion.heal`.

## Critérios de aceite

| # | Assert | Verificação |
|---|---|---|
| A1 | Arquivo vazio, corrompido, v1 ou v2 → três slots vazios, sem lançar; slots round-trip inteiros; `active` aponta para slot usado | `bun test tests/save-slots.test.ts` |
| A2 | Escrita só vai para o slot ligado; trocar de slot troca o `SaveData` no lugar e mantém as configurações; apagar o ativo desliga | `bun test tests/platform-web.test.ts` |
| A3 | Menu: sem slot só "Novo jogo"; novo jogo em slot vazio liga e abre a seleção; sobrescrever e apagar pedem confirmação | `bun test tests/ui/menus.test.tsx tests/ui/menu-controller.test.ts` |
| A4 | Suporte: nível 1–5, 4 slots, Magnético cresce, stat só pela diferença; loja oferece e esconde no máx. | `bun test tests/support-potion.test.ts` |
| A5 | Poção: níveis 1–10 (compras), cheia em todo início de round, bebe a ≤ 50% com 2 s de recarga, regra de subida de raridade, drops só de Elite (II/III) e Boss (IV/V) | `bun test tests/support-potion.test.ts` |
| A7 | Equipamento: comprar equipa e vende o item do slot (Fish certos), `describeOffer` diz o que é vendido, drop pior não troca item melhor, pausa sem mochila | `bun test tests/equipment.test.ts tests/rarity.test.ts tests/run-state.test.ts` e `bun run e2e` |
| A6 | No jogo: orbe a 150 u só é puxada com Magnético; poção bebe, recarrega e sobe de raridade; HUD e loja mostram | `bun run e2e` e capturas 1920×1080 |

## Riscos e decisões

- Preço fixo por nível: o preço da oferta é sorteado com a loja, então um item travado cujo nível mudou mantém o preço antigo. Se virar problema, o preço passa a depender do nível na compra.
- Regra aplicada pelo orquestrador (2026-11-08): o "+1" de um drop de Elite para no III — IV e V só vêm de Bosses, como o desenvolvedor definiu; Elites não dropam melhoria quando a poção já é III ou maior.
- A sim (`bun scripts/sim.ts`) não modela loja nem poções: os números novos (cura, preços, taxas de drop) valem pelo bot (`scripts/playtest-bot.ts`) e por playtest.

## Fora de escopo

Mais de três slots; nuvem por slot; copiar slot; os itens de suporte propostos em RF-15; arte própria para suporte e poção (hoje reaproveitada).
