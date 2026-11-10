# Página da Steam — textos nos 4 idiomas (T5.8)

> **Versão** 1.0 · **Data** 2026-11-08 · **Status** rascunho para aprovação do desenvolvedor · Coerente com o jogo na versão 0.9.0 (`package.json`). Só descreve o que existe; o que falta está marcado **(TBD)**.

## Índice

1. [Nome, preço e plataforma](#1-nome-preço-e-plataforma)
2. [Requisitos mínimos](#2-requisitos-mínimos)
3. [Tags sugeridas](#3-tags-sugeridas)
4. [EN](#4-en)
5. [PT-BR](#5-pt-br)
6. [ES](#6-es)
7. [ZH-CN](#7-zh-cn)

## 1. Nome, preço e plataforma

- **Nome**: `Pinguin Survivors` nos quatro idiomas (nome próprio, não traduzir).
- **Preço**: US$ 4,99 (ADR-011). Confirmar na publicação.
- **Plataforma**: Windows, pela Steam (Electron, ADR-012). Android fica na Google Play, fora desta página.
- **Demo**: prevista para o Steam Next Fest, 22/02 a 01/03/2027 (AGENTS.md). Marcar como planejado até a inscrição.
- **Idiomas da interface**: EN, PT-BR, ES e ZH-CN (ADR-010), todos ativos na build (`bun scripts/i18n-check.ts` com 0 faltando em cada idioma, 2026-11-08).
- **Classificação**: 16+ / Mature (IARC, GDD §2). **(TBD)** até a emissão.

## 2. Requisitos mínimos

**(TBD)**. Nenhum doc define requisitos mínimos ou recomendados. Medir antes de publicar, na build Electron Windows x64 (`apps/desktop`):

- Sistema operacional: **(proposta)** Windows 10 e 11 de 64 bits.
- Processador, memória e placa: **(TBD)**. Medir com o `scripts/perf.ts` (60 FPS com 300 inimigos, 2.000 decalques, 1920×1080) numa máquina de referência de baixo custo.
- Armazenamento: **(TBD)** pelo tamanho do instalador do build de release.
- A Steam exige os campos "mínimo" e "recomendado" preenchidos; sem medição, não publicar.

## 3. Tags sugeridas

**(proposta)**. A Steam traduz as tags para o idioma da loja, mas a equipe deve escolher as mais próximas do jogo:

| EN | PT-BR | ES | ZH-CN |
|---|---|---|---|
| Action Roguelite | Roguelite de ação | Roguelite de acción | 动作肉鸽 |
| Survivor-like | Sobrevivência | Supervivencia | 幸存者类 |
| Top-Down | Visão de cima | Vista cenital | 俯视角 |
| Pixel Graphics | Gráficos pixelados | Gráficos de píxeles | 像素风格 |
| Zombies | Zumbis | Zombis | 僵尸 |
| Gore | Gore | Gore | 血腥 |
| Dark Fantasy | Fantasia sombria | Fantasía oscura | 黑暗奇幻 |
| Character Customization | Personalização de personagem | Personalización de personaje | 角色定制 |
| Endless | Infinito | Infinito | 无尽 |
| Single-player | Um jogador | Un jugador | 单人 |

## 4. EN

### Descrição curta (≤ 300 caracteres)

Three penguins against the zombie apocalypse. Six auto-firing weapons, a shop after every round, a skill tree for each penguin and endless rounds. Blood on the snow, gore on demand.

### Descrição longa

Pinguin Survivors is a top-down arena survivor with pixel art. Jack, Bob and Lucia fight through hordes of zombies in rounds against the clock. Your weapons fire on their own, and you choose where to be.

After each round, a shop opens with weapons, equipment and items. Fuse two identical weapons to raise their rarity. Each level-up offers stat cards. Each penguin has its own skill tree, and your progress carries from run to run.

Raise the danger from 0 to 5 for stronger enemies and better rewards, or keep going in endless rounds. Gore comes with an on/off toggle, from maximum to reduced to green goo.

### Features

- Three penguins: Jack (melee), Bob (firearms) and Lucia (magic).
- Six weapon slots that fire automatically.
- Weapon rarity from I to V; fusion raises it up to level III in the shop, and IV and V come from elites and bosses.
- A shop after every round, with weapons, equipment and healing items.
- A skill tree for each penguin, and level-up cards during the run.
- Danger 0–5, and endless rounds after the campaign.
- Bosses every 5 rounds.
- Three save slots.
- Gore with a toggle: maximum, reduced or green goo.
- English, Português (BR), Español and 简体中文.

## 5. PT-BR

### Descrição curta (≤ 300 caracteres)

Três pinguins contra o apocalipse zumbi. Seis armas automáticas, uma loja após cada round, uma árvore de habilidades para cada pinguim e rounds infinitos. Sangue na neve, gore quando você quiser.

### Descrição longa

Pinguin Survivors é um arena survivor top-down em pixel art. Jack, Bob e Lucia enfrentam hordas de zumbis em rounds contra o relógio. Suas armas disparam sozinhas, e você escolhe onde ficar.

Ao fim de cada round, abre uma loja com armas, equipamentos e itens. Funda duas armas iguais para subir a raridade. Cada subida de nível oferece cartas de atributo. Cada pinguim tem sua própria árvore de habilidades, e o progresso passa de uma partida para a outra.

Suba o Danger de 0 a 5 para inimigos mais fortes e recompensas melhores, ou continue nos rounds infinitos. O gore tem interruptor: do máximo ao reduzido, ou gosma verde.

### Recursos

- Três pinguins: Jack (corpo a corpo), Bob (armas de fogo) e Lucia (magia).
- Seis slots de arma que disparam sozinhos.
- Raridade de armas de I a V; a fusão sobe até o nível III na loja, e IV e V vêm de elites e chefes.
- Uma loja após cada round, com armas, equipamentos e itens de cura.
- Uma árvore de habilidades para cada pinguim, e cartas de subida de nível durante a partida.
- Danger 0–5, e rounds infinitos depois da campanha.
- Chefes a cada 5 rounds.
- Três slots de save.
- Gore com interruptor: máximo, reduzido ou gosma verde.
- Inglês, Português (BR), Espanhol e Chinês simplificado.

## 6. ES

### Descripción corta (≤ 300 caracteres)

Tres pingüinos contra la apocalipsis zombi. Seis armas automáticas, una tienda después de cada round, un árbol de habilidades para cada pingüino y rounds infinitos. Sangre en la nieve, gore cuando tú quieras.

### Descripción larga

Pinguin Survivors es un arena survivor de vista cenital en pixel art. Jack, Bob y Lucia enfrentan oleadas de zombis en rounds contra el reloj. Tus armas disparan solas, y tú decides dónde estar.

Al final de cada round se abre una tienda con armas, equipo y objetos. Fusiona dos armas idénticas para subir su rareza. Cada subida de nivel ofrece cartas de estadísticas. Cada pingüino tiene su propio árbol de habilidades, y tu progreso pasa de una partida a otra.

Sube el Danger de 0 a 5 para enemigos más fuertes y mejores recompensas, o sigue en rounds infinitos. El gore tiene interruptor: del máximo al reducido, o gosma verde.

### Características

- Tres pingüinos: Jack (cuerpo a cuerpo), Bob (armas de fuego) y Lucia (magia).
- Seis ranuras de arma que disparan solas.
- Rareza de armas de I a V; la fusión sube hasta el nivel III en la tienda, y IV y V vienen de élites y jefes.
- Una tienda después de cada round, con armas, equipo y objetos de curación.
- Un árbol de habilidades para cada pingüino, y cartas de subida de nivel durante la partida.
- Danger 0–5, y rounds infinitos después de la campaña.
- Jefes cada 5 rounds.
- Tres slots de guardado.
- Gore con interruptor: máximo, reducido o gosma verde.
- Inglés, portugués (BR), español y chino simplificado.

## 7. ZH-CN

### 简短描述（不超过 300 个字符）

三只企鹅对抗僵尸末日。六件自动开火的武器，每回合结束后一次商店，每只企鹅一棵技能树，以及无尽回合。雪地上的血，血腥效果可随时开关。

### 详细描述

《Pinguin Survivors》是一款像素风俯视角竞技场生存游戏。Jack、Bob 和 Lucia 在限时回合中与成群的僵尸战斗。你的武器会自动开火，而你决定站在哪里。

每回合结束后，会打开一家商店，出售武器、装备和道具。合成两件相同的武器可提升其稀有度。每次升级会提供属性卡。每只企鹅都有自己的技能树，你的成长会延续到下一局。

将危险等级（Danger）从 0 提升到 5，可以面对更强的敌人，获得更好的奖励；你也可以继续挑战无尽回合。血腥效果有开关，可以选择最大、减少，或绿色黏液。

### 功能

- 三只企鹅：Jack（近战）、Bob（火器）和 Lucia（魔法）。
- 六个自动开火的武器槽。
- 武器稀有度从 I 到 V；商店中的合成最高升到 III 级，IV 和 V 来自精英怪和首领。
- 每回合结束后的商店，出售武器、装备和治疗道具。
- 每只企鹅一棵技能树，局内有升级属性卡。
- 危险等级 0–5，战役之后有无尽回合。
- 每 10 回合一个首领。
- 三个存档槽位。
- 血腥效果可开关：最大、减少或绿色黏液。
- 英语、葡萄牙语（巴西）、西班牙语和简体中文。

## 8. Pendências antes de publicar

- Requisitos mínimos e recomendados: medir (§2).
- Confirmar os idiomas da build de release (ES e ZH-CN, §1).
- Classificação etária emitida pela IARC (§1).
- Confirmar nomes de biomas e chefes propostos antes de citá-los (ADR-016). Esta página não cita nomes de biomas de propósito.
- Preço final e data de demo (§1).
