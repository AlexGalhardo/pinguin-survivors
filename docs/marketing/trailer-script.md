# Roteiro do trailer — Pinguin Survivors (T9.3)

> **Versão** 1.0 · **Data** 2026-11-08 · **Status** rascunho para aprovação do desenvolvedor · Segue [gdd.md](../gdd.md) e [site.md](../site.md) §6 (até 2 min; estrutura sugerida).

## Índice

1. [Regras de produção](#1-regras-de-produção)
2. [Beats por segundo](#2-beats-por-segundo)
3. [Planos a capturar](#3-planos-a-capturar)
4. [Textos na tela (EN)](#4-textos-na-tela-en)
5. [Música](#5-música)
6. [Pendências antes de gravar](#6-pendências-antes-de-gravar)

## 1. Regras de produção

- **Duração**: 110–120 s, nunca mais de 2 min (site.md §6).
- **Formato**: MP4 H.264 1080p60 + WebM (site.md §6). Legendas EN embutidas; PT-BR, ES e ZH-CN opcionais.
- **Só o que existe**: a 0.8.0 tem árvore de habilidades por herói, três slots de save, raridade I–V, itens de suporte, poção de cura, três heróis, Danger 0–5 e endless. Nada de conteúdo prometido sem data.
- **Loja**: a loja vende só armas, equipamentos e poções de velocidade, com raridades **I a III** (ADR-017). Raridades IV e V aparecem em drops de elites e bosses. O trailer não deve mostrar compra de IV ou V.
- **Chefes na campanha**: urso polar (round 10), alce-rei zumbi (round 20) e colosso biomecânico (round 30), os dois últimos propostos (ADR-016). Kraken do Porto e Abominação são **só do endless**; não mostrar como chefes da campanha.
- **Biomas**: Antártida (1–10), floresta (11–20) e cidade destruída com aliens (21–30), nomes propostos em ADR-016 até aprovação. Confirmar antes de gravar.
- **Capturas**: usar a build com `god=1` para planos de ação. Em capturas finais, **não** usar `debug=1` (esconde o overlay de depuração).
- **Só dev**: `window.__GAME__` existe apenas no dev server. Usar esse handle para abrir a loja (`finishRound()`) apenas em captura de dev, nunca em build de release.

## 2. Beats por segundo

| Tempo | Beat | Plano | Áudio |
|---|---|---|---|
| 0–5 s | **Gancho**: horda e gore | round 8, Jack, 300 inimigos, corte em câmera lenta no primeiro esguicho | `music.round` (intensidade média) + sfx de golpe |
| 5–12 s | **Título** | logo sobre o key art do menu (`MenuBackground`) | `music.menu` (fade in) |
| 12–30 s | **Loop de round** | round 3, Jack andando, seis armas orbitando, cartas de level-up | `music.round` |
| 30–45 s | **Loja** | fim do round, loja com painel de stats, cards de item com cores I–III, reroll e lock | `music.shop` |
| 45–52 s | **Fusão e raridade** | fusão de duas armas iguais, subindo até o nível III; arma V aparece como drop (sem compra) | sfx de fusão |
| 52–62 s | **Heróis** | Jack, Bob e Lucia, 3 s cada, com o nome e o papel na tela | `music.round` (troca no corte) |
| 62–72 s | **Árvore de habilidades** | tela do herói com a árvore de passivas de Jack; zoom e destaque de caminho | `music.menu` |
| 72–82 s | **Superpoderes** | Colheita Rubra (Jack), Bombardeio (Bob), Cataclismo Elemental (Lucia), um de cada | sfx de superpoder + ducking |
| 82–92 s | **Biomas** | Antártida → floresta → cidade destruída, transição no round 11 e 21 | `music.forest` e `music.city` |
| 92–104 s | **Chefes** | urso polar (10), alce-rei (20, proposto), colosso (30, proposto), um plano curto cada | `music.boss` |
| 104–110 s | **Gore com toggle** | tela de configurações: máximo, reduzido, gosma verde, mesmo plano em cada modo | sfx de splat |
| 110–115 s | **Endless e Danger** | round 35, sorteio de bioma por seed; seletor de Danger 0–5 | `music.late` |
| 115–120 s | **CTA** | logo, "Wishlist on Steam", "Demo: Steam Next Fest, 22 Feb – 1 Mar 2027" | `music.menu` (fim) |

## 3. Planos a capturar

Todas as URLs usam a build de dev. Para o trailer final, a build deve ser a de release com o mesmo seed.

| Plano | URL (dev) | Observação |
|---|---|---|
| Gancho: horda e gore | `/?skipMenu=1&hero=jack&round=8&seed=1&god=1` | tirar `debug=1`; câmera lenta na pós-produção |
| Título e key art | `/` (menu) | `MenuBackground` sorteia o key art (Jack ou Bob) |
| Loop de round | `/?skipMenu=1&hero=jack&round=3&seed=1&god=1` | captura de cartas exige jogar até o level-up |
| Loja | `/?skipMenu=1&hero=jack&round=3&seed=1&god=1`, depois `__GAME__.scene.getScene('Game').finishRound()` | dev apenas (ver §1) |
| Bob | `/?skipMenu=1&hero=bob&round=5&seed=1&god=1` | Bob desbloqueado no jogo completo (demo só tem Jack) |
| Lucia | `/?skipMenu=1&hero=lucia&round=5&seed=1&god=1` | idem |
| Árvore de habilidades | menu → herói → árvore (sem URL) | a árvore vem da save; usar save de teste com pontos |
| Superpoderes | `/?skipMenu=1&hero=jack&round=12&seed=1&god=1` | superpoder exige nível 5: a URL não tem flag de nível; usar save de teste |
| Antártida | `/?skipMenu=1&hero=jack&round=5&seed=1&god=1` | |
| Floresta | `/?skipMenu=1&hero=jack&round=15&seed=1&god=1` | biomas 2 é proposta (ADR-016) |
| Cidade destruída | `/?skipMenu=1&hero=jack&round=25&seed=1&god=1` | biomas 3 é proposta (ADR-016) |
| Urso polar | `/?skipMenu=1&hero=jack&round=10&seed=1&god=1` | |
| Alce-rei e colosso | `/?skipMenu=1&hero=bob&round=20&seed=1&god=1` e `round=30` | propostos; checar se o boss aparece no round |
| Gore: máximo, reduzido, gosma | menu → configurações → gore | mesmo plano nos três modos |
| Endless e Danger | `/?skipMenu=1&hero=bob&round=35&seed=1&god=1&danger=3` | `danger` é lido pela URL; o sorteio de bioma por seed |
| Arena grande | `/?skipMenu=1&hero=jack&round=5&seed=1&arena=40&god=1` | para planos de câmera aberta |
| CTA | site (`site/`) ou poster | link da Steam com UTM (site.md §3) |

## 4. Textos na tela (EN)

Curtos, em caixa-alta no título e em caixa normal na legenda. Máximo de 8 palavras por texto.

1. (0–5 s) `THREE PENGUINS. THREE HUNDRED ZOMBIES.`
2. (5–12 s) `PINGUIN SURVIVORS`
3. (12–30 s) `SIX WEAPONS FIRE ON THEIR OWN.`
4. (30–45 s) `A SHOP AFTER EVERY ROUND.`
5. (45–52 s) `FUSE TWO WEAPONS. RARITY I TO V.`
6. (52–62 s) `JACK · BOB · LUCIA.`
7. (62–72 s) `A SKILL TREE FOR EACH PENGUIN.`
8. (72–82 s) `SUPERPOWERS, ONE PER PENGUIN.`
9. (82–92 s) `THREE BIOMES. THEN ENDLESS.`
10. (92–104 s) `BOSSES EVERY 10 ROUNDS.`
11. (104–110 s) `GORE: YOUR CHOICE.`
12. (110–115 s) `DANGER 0–5. ENDLESS ROUNDS.`
13. (115–120 s) `WISHLIST ON STEAM.` / `DEMO AT STEAM NEXT FEST, 22 FEB – 1 MAR 2027.`

**Atenção**: o texto 5 diz "rarity I to V", mas a loja vende só I–III. A frase é verdadeira para o jogo (V existe, vem de bosses), mas a imagem deve mostrar a loja com I–III e o drop de IV/V separado.

## 5. Música

Faixas em `public/assets/audio/music/` (mesmos nomes das chaves):

| Chave | Uso no trailer | Observação |
|---|---|---|
| `music.menu` | título, árvore de habilidades, CTA | lenta e sombria |
| `music.round` | gancho, loop de round, heróis | intensidade média, 140 BPM |
| `music.shop` | loja | ambiente calmo com vento polar |
| `music.forest` | floresta | faixa proposta (ADR-016), confirmar arquivo |
| `music.city` | cidade destruída | faixa proposta (ADR-016), confirmar arquivo |
| `music.boss` | chefes | 170 BPM |
| `music.late` | endless e Danger | rounds 21+, 155 BPM |

Mixagem: a música abaixa 6 dB durante o superpoder e o rugido do boss (audio.md §2). Não usar voz (ADR-009).

## 6. Pendências antes de gravar

- Confirmar os nomes de biomas 2 e 3 e dos chefes propostos (ADR-016). Sem aprovação, gravar sem nomes na tela.
- Confirmar a data do Next Fest no texto final (AGENTS.md: 22/02 a 01/03/2027, marco planejado).
- Gravar a árvore de habilidades com dados reais (save de teste), após a tela estar fechada.
- Traduzir as legendas para PT-BR, ES e ZH-CN depois de travar o inglês (tradução do glossário, docs/i18n-glossary.md).
- Decidir se o trailer tem narração (não: ADR-009 proíbe voz de personagem; narração de narrador seria uma nova decisão).
