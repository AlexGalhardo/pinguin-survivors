# ADR-021 — Loja de evolução com raridades I–V e materiais de Elite e Boss

**Data** 2026-11-08 · **Status** Aceito · **Decisão de origem** feedback do desenvolvedor (mudança de escopo) · **Supera em parte** ADR-017 (loja só I–III, IV e V só por drop)

## Contexto

A loja sorteava armas e equipamentos ao acaso entre as raridades I a III, então oferecia muitas vezes itens piores do que o jogador já usava. O desenvolvedor pediu uma loja que só mostre o que faz a build evoluir: itens que o jogador ainda não tem e versões melhores dos que já tem, com as raridades IV e V também à venda, mas presas a materiais que só Elites e Bosses dão.

## Decisão

- **Pool de evolução** (`upgradePool`): a loja só oferece o que melhora a build.
  - **Arma que o jogador não tem**: qualquer raridade I a V, só enquanto houver slot livre.
  - **Arma que o jogador já tem**: só raridades acima da melhor cópia. Comprar substitui a cópia de menor raridade dessa arma no mesmo slot (a antiga é vendida pelo valor de venda), sem precisar de slot livre.
  - **Equipamento**: slot vazio aceita qualquer item daquele slot em qualquer raridade; slot ocupado só recebe itens daquele slot com raridade acima da do item vestido.
  - Itens de suporte e poção de velocidade seguem como antes; nada pior do que o que se tem aparece.
  - Sem candidatos, a oferta fica vazia em vez de repetir item inútil.
- **IV e V à venda**: IV custa Fish + 1 **Marca de Elite**; V custa Fish + 1 **Núcleo de Boss**. Toda Elite morta dá 1 Marca e todo Boss dá 1 Núcleo (100%, um por inimigo), creditados na hora com texto flutuante, sem arte nova. Valem pela run (`RunState.materials`). A oferta sem o material aparece bloqueada dizendo o que falta.
- **Poção de cura**: o card de compra só aparece até a primeira compra. Depois, um botão fixo "+1 poção" no rodapé da loja soma uma à capacidade até 10, sem ocupar oferta.
- Os drops IV e V de Elites e Bosses (ADR-017) continuam; a fusão continua.

## Alternativas

- Só filtrar itens piores e manter I–III: não atende o pedido de vender IV e V. Rejeitada.
- Materiais como drop no chão com arte própria: pede concept e aprovação de arte. Adiado; o crédito direto não muda a regra.

## Consequências

- `SHOP.maxRarity` vai a 5 e `tierWeights` ganha as colunas IV e V; `SHOP.materialCost` liga raridade a material.
- O bot e a sim de loja precisam respeitar os materiais (ofertas IV e V sem material não são compráveis).
- A loja fica mais curta no fim da run, quando quase tudo está em V; isso é esperado.
