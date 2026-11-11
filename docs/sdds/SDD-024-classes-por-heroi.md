# SDD-024 — Classes por herói

**Versão** 1.0 · **Data** 2026-11-11 · **Status** Aprovada (2026-11-11: decisão B-34 do desenvolvedor, "Classes por herói, sem arte nova"; a lista e os números são a recomendação do orquestrador, aplicada sem nova pergunta por ordem de seguir o ROADMAP sem interrupções; todos os números são provisórios até a passada de balance) · **Depende de** SDD-002, SDD-005, SDD-013 · **Decisão** [brainstorming B-34](../brainstorming.md)

Três heróis são pouca variedade para o gênero. Cada herói ganha **quatro classes**: a primeira é o herói como ele é hoje, as outras três trocam uma vantagem por um custo. São 12 formas de jogar sobre os 3 sprites atuais, sem arte nova e sem regra nova no motor: uma classe é só um conjunto de modificadores de atributo aplicado no início da run.

## Requisitos

- **RF-01 Dados.** `src/data/classes.ts` lista as classes. Cada uma tem `id` (`<herói>.<nome>`), `hero`, `unlockLevel` e modificadores: somas (`add`, na mesma unidade dos atributos: `damage` 0,25 = +25%) e multiplicadores (`mul`, só para `maxHp`, `armor` e `regen`, aplicados depois das somas).

  | Herói | Classe | Destrava no nível | Vantagem | Custo |
  |---|---|---|---|---|
  | Jack | Sobrevivente (`jack.survivor`) | 1 | o Jack de hoje | — |
  | Jack | Berserker | 5 | +25% dano, +10% velocidade de ataque | sem armadura, −15% vida máxima |
  | Jack | Açougueiro | 10 | +3% roubo de vida, +20% dano corpo a corpo | −30% dano de arma de fogo e de magia |
  | Jack | Baluarte | 20 | +30% vida máxima, +8 armadura | −15% dano, −8 velocidade de movimento |
  | Bob | Artilheiro (`bob.gunner`) | 1 | o Bob de hoje | — |
  | Bob | Piromaníaco | 5 | +15% chance de queimar, +20% área | −10% velocidade de ataque |
  | Bob | Atirador de elite | 10 | +10% chance de crítico, +50% dano crítico | −20% velocidade de ataque |
  | Bob | Catador | 20 | +15% sorte, +40 alcance de coleta, +10% bônus de Fish | −12% dano |
  | Lucia | Arcanista (`lucia.arcanist`) | 1 | a Lucia de hoje | — |
  | Lucia | Invocadora de tempestades | 5 | +15% chance de choque, +15% velocidade de ataque | −20% vida máxima |
  | Lucia | Tecelã do gelo | 10 | +20% chance de congelar, +15% área | −6 velocidade de movimento, −10% dano |
  | Lucia | Canhão de vidro | 20 | +35% dano mágico | −30% vida máxima, sem regeneração |

- **RF-02 Lógica.** `src/logic/classes.ts` (puro, testado): `classesOf(hero)`, `classUnlocked(def, level)`, `applyClass(stats, id)` e `classLines(def)` (o que mostrar). `heroStats(hero, level, tree, classId?)` aplica a classe por último; sem `classId`, ou com a classe base, o resultado é idêntico ao de antes desta SDD.
- **RF-03 Escolha.** A escolha do pinguim ganha a seção "CLASSE" com `‹ nome ›`, as linhas de vantagem (verde) e custo (laranja) e, quando há classe ainda travada, "Próxima classe no nível N". Só as classes destravadas pelo nível do herói entram no ciclo. A classe vai no pedido de início da run (`StartRunRequest.heroClass`); o jogo recusa uma classe de outro herói ou ainda travada e usa a base.
- **RF-04 Run.** A classe vale só no cálculo dos atributos iniciais; uma run retomada usa os atributos salvos. `?class=<id>` na URL força a classe (QA).
- **RF-05 Demo.** Na demo só existe a classe base; a seção não aparece.
- **RF-06 Textos** nos 4 idiomas: nome de cada classe e os rótulos da seção. As linhas de vantagem e custo saem dos rótulos de atributo que já existem (`gstat.*`), sem texto novo por classe.
- **RF-07 Sim.** `SimConfig.heroClass` e `bun scripts/sim.ts --class <id>`; o relatório de balance compara a mediana de round de cada classe com a da classe base do mesmo herói.

## Fora do escopo

Regras novas de arma (restrição de tipo, arma inicial própria), arte ou retrato por classe, conquistas por classe (ficam para depois da passada de balance, ROADMAP F5.5) e save da última classe escolhida.

## Aceite

- **A1** `bun test tests/classes.test.ts`: 4 classes por herói, a base não muda nenhum atributo, cada classe muda exatamente os atributos da tabela, `mul` depois de `add`, classe travada ou de outro herói cai na base.
- **A2** `bun test tests/ui`: a seção mostra a classe, troca só entre as destravadas e manda `heroClass` no pedido.
- **A3** `bun scripts/i18n-check.ts` 0/0/0 e `bun run lint:i18n` 0.
- **A4** `bun scripts/sim.ts --class <id>` roda; relatório `docs/reports/balance-classes-<data>.md` com a mediana de round por classe. Meta: nenhuma classe acima de 1,5× nem abaixo de 0,67× a base do herói; o que ficar fora vira ajuste de número anotado no relatório.
- **A5** `bun run e2e` passa; captura da escolha do pinguim com a seção em 1920×1080.
