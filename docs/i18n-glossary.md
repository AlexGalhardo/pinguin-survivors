# Glossário i18n — Pinguin Survivors

> **Versão** 1.0 · **Data** 2026-11-08 · **Status** revisado pelo orquestrador (2026-11-08); termos marcados "proposta" aguardam o desenvolvedor (`questions-to-dev.md` #6). Tabelas em `src/i18n/` (`*.en.ts`, `*.pt-BR.ts`, `*.es.ts`, `*.zh-CN.ts`); paridade de chaves e placeholders com `bun scripts/i18n-check.ts`. Regras de tradução em [.agents/rules/game-data-and-i18n.md](../.agents/rules/game-data-and-i18n.md). Decisão de idiomas em [ADR-010](adrs/ADR-010-idiomas-en-ptbr-es-zh.md) e [SDD-009](sdds/SDD-009-i18n-es-zh.md).

## Índice

1. [Tom e formato](#1-tom-e-formato)
2. [Termos fixos](#2-termos-fixos)
3. [Moedas, loja e fusão](#3-moedas-loja-e-fusão)
4. [Sets, tiers e raridades](#4-sets-tiers-e-raridades)
5. [Stats](#5-stats)
6. [Biomas, bosses e heróis](#6-biomas-bosses-e-heróis)

## 1. Tom e formato

- **Tom**: cartoon gritty — pinguins fofos e sujos de guerra, humor seco, sangue e metal sem exagero de gíria.
- **HUD conciso**: rótulos curtos; títulos de tela em maiúsculas (como o EN); botões no imperativo.
- **Largura**: ES pode passar do EN em até ~30%; ZH-CN ≤ EN. Textos de HUD (`hud.*`, `fx.*`) são os mais sensíveis.
- **Placeholders** `{n}`, `{hp}`, `{name}` etc. são idênticos ao EN em todos os idiomas (checado por `scripts/i18n-check.ts`).

## 2. Termos fixos

| EN | PT-BR | ES | ZH-CN | Nota |
|---|---|---|---|---|
| Danger | Danger | Danger | Danger | termo fixo, não traduzir (precedente no pt-BR) |
| Jack | Jack | Jack | Jack | nome próprio |
| Bob | Bob | Bob | Bob | nome próprio |
| Lucia | Lucia | Lucia | Lucia | nome próprio |
| Round | ROUND | ROUND | ROUND | mantido em todos os idiomas (HUD) |
| Superpower | Superpoder | Superpoder | 超能力 | |
| Gambit (slot de poção por condição) | Gatilho | Disparador | 触发器 | **proposta**; `hero.gambit` |
| Shop | Loja | Tienda | 商店 | |
| Merchant | Lojista | Comerciante | 商人 | |
| Fuse | Fundir | Fusionar | 合成 | |
| Level up | Subir de nível | Subir de nivel | 升级 | |
| Horde | Horda | Horda | 尸潮 | onda de horda |
| Elite | Elite | Élite | 精英 | |

## 3. Moedas, loja e fusão

| EN | PT-BR | ES | ZH-CN | Nota |
|---|---|---|---|---|
| Fish | Peixes | Peces | 鱼 | moeda da run; HUD `FISH {n}` (ES `PECES {n}`) |
| Pearls | Pérolas | Perlas | 珍珠 | moeda da meta, comprada com o save |
| Reroll | Reiniciar | Repetir | 刷新 | `shop.reroll`: "REROLAR" no pt-BR |
| Lock | Travar | Bloquear | 锁定 | |
| Sell | Vender | Vender | 出售 | |

## 4. Sets, tiers e raridades

| EN | PT-BR | ES | ZH-CN | Nota |
|---|---|---|---|---|
| Blade set | Lâmina | Filo | 利刃 | |
| Blunt set | Contundente | Contundente | 钝器 | |
| Thrown set | Arremesso | Arrojadizo | 投掷 | |
| Gun set | Arma de fogo | Armas de fuego | 火器 | |
| Explosive set | Explosivo | Explosivo | 爆炸 | |
| Elemental set | Elemental | Elemental | 元素 | |
| Support set | Suporte | Apoyo | 辅助 | |
| Tier / raridade I–V | I–V | I–V | I–V | numerais romanos, sem tradução (ADR-017; armas e equipamentos usam a mesma escala) |
| Common (I) | Comum | Común | 普通 | `rarity.1` |
| Uncommon (II) | Incomum | Poco común | 优秀 | `rarity.2` |
| Rare (III) | Raro | Raro | 稀有 | `rarity.3` |
| Epic (IV) | Épico | Épico | 史诗 | `rarity.4` |
| Legendary (V) | Lendário | Legendario | 传说 | `rarity.5` |
| Affix | Afixo | Afijo | 词缀 | bônus de stat sorteado em armas e equipamentos |
| Skill tree | Árvore de habilidades | Árbol de habilidades | 技能树 | ADR-019; substitui a Oficina |
| Notable | Notável | Notable | 重要天赋 | nó forte da árvore |
| Keystone | Pedra-chave | Piedra angular | 基石 | nó com custo real |

## 5. Stats

| EN | PT-BR | ES | ZH-CN | Nota |
|---|---|---|---|---|
| HP | HP | HP | 生命 | |
| HP regen | Regen de HP | Regen de HP | 生命恢复 | |
| Armor | Armadura | Armadura | 护甲 | |
| Attack speed | Vel. de ataque | Vel. de ataque | 攻速 | |
| Move speed | Vel. de movimento | Vel. de movimiento | 移动速度 | |
| Damage | Dano | Daño | 伤害 | |
| Melee / firearm / magic damage | Dano corpo a corpo / de arma de fogo / mágico | Daño cuerpo a cuerpo / de armas de fuego / mágico | 近战 / 火器 / 魔法伤害 | |
| Critical chance | Crítico | Crítico | 暴击 | |
| Dodge | Esquiva | Esquiva | 闪避 | |
| Parry | Aparar | Parar | 格挡 | |
| Area | Área | Área | 范围 | |
| Luck | Sorte | Suerte | 幸运 | |
| XP | XP | XP | 经验 | |
| Pickup range | Alcance de coleta | Alcance de recogida | 拾取范围 | |
| Lifesteal | Roubo de vida | Robo de vida | 吸血 | |
| Bleed | Sangramento | Sangrado | 流血 | |
| Poison | Veneno | Veneno | 中毒 | |
| Burn | Queimadura | Quemadura | 灼烧 | |
| Chill | Gelo | Hielo | 冰冻 | |
| Shock | Choque | Descarga | 电击 | |
| Fire / earth / ice / energy resist | Resist. fogo / terra / gelo / energia | Resist. fuego / tierra / hielo / energía | 火焰 / 大地 / 冰霜 / 能量抗性 | |

## 6. Biomas, bosses e heróis

| EN | PT-BR | ES | ZH-CN | Nota |
|---|---|---|---|---|
| Antarctica | ANTÁRTIDA | ANTÁRTIDA | 南极洲 | bioma 1 |
| The research station | A ESTAÇÃO DE PESQUISA | LA ESTACIÓN DE INVESTIGACIÓN | 研究站 | bioma 2 |
| The ruined city | A CIDADE EM RUÍNAS | LA CIUDAD EN RUINAS | 废墟之城 | bioma 3 |
| Zombie Polar Bear | URSO POLAR ZUMBI | OSO POLAR ZOMBI | 僵尸北极熊 | boss 10 |
| Harbor Kraken | KRAKEN DO PORTO | KRAKEN DEL PUERTO | 港口克拉肯 | boss 20 |
| The Abomination | A ABOMINAÇÃO | LA ABOMINACIÓN | 憎恶体 | boss 30 |
| Penguin (jogador) | pinguim | pingüino | 企鹅 | |

## Histórico

- 0.1 (2026-11-08): rascunho inicial com os termos usados nas tabelas `*.es.ts` e `*.zh-CN.ts`. Pendente: revisão do orquestrador (ZH-CN, fonte CJK, termos marcados como **proposta**).
