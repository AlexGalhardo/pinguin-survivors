# Decisões do usuário — Pinguin Survivors

Registro das decisões de produto tomadas com o usuário (entrevista de 2026-09-27, 36 perguntas).
Quando uma decisão mudar, **edite a linha** e registre a data. As decisões do jogo anterior (Starfall Survivors, D-01…D-56) ficam na branch `starfall-survivors-legacy`.

| # | Decisão | Motivo / nota |
|---|---|---|
| P-01 | **Refundação**: manter a infraestrutura (Bun, Vite, Phaser 4, Biome, commitlint, `logic/` puro, RNG com seed, spatial grid, gamepad) e **reescrever a camada de jogo** | A fundação era sólida; iso + mapa infinito + RPG mudam todo o resto |
| P-02 | Histórico do Starfall preservado na branch **`starfall-survivors-legacy`** (e tag `v1.0.0-rc.1`); Pinguin Survivors é desenvolvido na `main` | Pedido do usuário |
| P-03 | Repo renomeado para `git@github.com:AlexGalhardo/pinguin-survivors.git`; versão recomeça em **`2.0.0-alpha.N`** | Quebra total de jogo, mesmo histórico |
| P-04 | Perspectiva **2.5D isométrica clássica 2:1** (estilo Diablo 2), tiles de **64×32**, sprites em vista **"low top-down"** | "Iso pixel estilo Diablo" |
| P-05 | Herói com **~64 px de altura** (canvas 96), inimigos ~48 px, elites ~56 px, bosses 128–192 px | Legibilidade, custo de geração e 300 inimigos na tela |
| P-06 | Tela lógica com **altura 540** e largura livre, **zoom inteiro** (`floor(innerHeight/540)`). 2560×1080 → zoom 2, vê 1280×540 | Ultrawide do usuário; pixel-perfect sem escala fracionária |
| P-07 | **8 direções para tudo** (heróis, inimigos, bosses); animações com **≥ 12 frames** | Pedido do usuário |
| P-08 | Clima **escuro estilo Diablo 4**: noite polar, vinheta, **luzes dinâmicas** (tiros, magia, auras), bloom; heróis coloridos contra mundo sombrio | P-35 |
| P-09 | Heróis **fofos, mas marcados pela guerra** (cicatrizes, curativos, equipamento sujo) | Contraste com o gore |
| P-10 | **Gore nível DOOM**: jorros, gibs, poças que **persistem a run inteira**; opção em Settings para reduzir ou trocar por "gosma verde" | Diversão frenética + portais que restringem gore |
| P-11 | Mapa **infinito procedural** em chunks, **só decoração visual** no alpha; obstáculos sólidos leves na beta | Depth sorting e pathfinding de 300 inimigos |
| P-12 | **Biomas mudam a cada boss**: Antártida zumbi (1–10) → estação de pesquisa/porto (11–20) → cidade em ruínas (21–30) → ciclo | Variedade |
| P-13 | Antártida: **6 inimigos comuns + boss** (urso polar zumbi) | Escopo do alpha |
| P-14 | Rounds: **20 s no round 1, +5 s por round, teto de 60 s**. Boss a cada **10 rounds**, com **3 min** para matar, senão **game over** | Brainstorm do usuário |
| P-15 | **Endless**: pool rotativo de bosses que ficam mais fortes a cada ciclo de 10 rounds; escala sem teto | |
| P-16 | **Elites** nos rounds múltiplos de 3 que não são boss: **aura roxa = 2×**; após o 1º boss aparecem também **aura laranja = 3×** | Esclarecimento da regra "3× / 2×" |
| P-17 | Desbloqueio: só **Jack** no início → vencer o boss do round 10 libera **Bob** → vencer o boss do round 20 libera **Lucia** | Brainstorm |
| P-18 | Ataques **100% automáticos**; **sem dash** (esquiva é stat) | Fiel ao Brotato |
| P-19 | Mira **por tipo de arma**: melee = arco/área ao redor; fogo = inimigo mais próximo; magia = área/aleatório/corrente | |
| P-20 | **1 arma assinada + até 3 secundárias**. A assinada é **desenhada no sprite do herói** em **3 tiers** (T1/T2/T3 = 9 variantes animadas); secundárias são sprites separados | "Pinguim usando a arma" sem explodir o custo |
| P-21 | Jack (melee, rockhopper): **machete → katana → espada-motosserra**. Bob (fogo, imperador): **escopeta cano duplo → escopeta automática → escopeta-foguete**. Lucia (magia, gentoo): **cajado dos 4 elementos** (fogo/terra/gelo/energia) → evoluções | |
| P-22 | Animações do herói: **idle, walk, attack, hurt, death** (× 8 dir × 3 tiers) | |
| P-23 | **3 cartas por round** (tempo pausado), tipos: **stats**, **armas/magias secundárias**, **efeitos on-hit** (sangramento, veneno, elementos, lifesteal), **evolução da arma assinada** | |
| P-24 | **Level 1–100 persistente por herói** (XP acumula entre runs) | Meta-progressão |
| P-25 | Level up = **crescimento automático** (curva da classe) + **1 ponto** para distribuir em stats | |
| P-26 | Morrer mantém **todo o XP e toda a moeda**; perde-se só o build da run | |
| P-27 | Economia: **cartas na run + moeda persistente ("Fish" 🐟)** gasta no menu (poções e upgrades); **sem loja na run** | Ritmo frenético |
| P-28 | **Poções estilo gambits (FFXII)**: 3 slots, cada um = **tipo + condição** configurável (ex.: "HP < 30%", "envenenado", "boss na tela"), **comprados no menu** com Fish antes da run | |
| P-29 | Mecânicas: **crítico, dodge, parry, sangramento, veneno**; stats de **velocidade de ataque, regen/s, defesa física, defesas elementais (fogo, terra, gelo, energia)** | Brainstorm |
| P-30 | Plataforma: **browser desktop** (teclado + gamepad), input abstraído para **mobile no futuro** | |
| P-31 | **i18n EN + PT-BR** desde o início (UI e vozes); docs em PT-BR | |
| P-32 | Arte: **PixelLab** (API v2 / MCP) para todos os visuais. Concepts dos 3 heróis **aprovados pelo usuário antes** de qualquer animação | Pedido do usuário |
| P-33 | Áudio: **ElevenLabs** para **SFX, música (metal/industrial estilo DOOM) e vozes EN + PT-BR** dos pinguins | |
| P-34 | Ordem: **concepts → loop jogável com placeholders iso → animações/assets finais em paralelo** | |
| P-35 | Sem Arcade Physics: **simulação em espaço de mundo cartesiano** (TS puro, testável) + **projeção iso só na renderização**; colisões via spatial grid | Decisão técnica do agente (iso + 300 corpos) |
| P-36 | Os hooks do Husky estão **vazios por escolha do usuário** (commit "save work"); os gates (`check`, `typecheck`, `test`, `build`) são rodados manualmente antes de commitar/pushar | Não restaurar sem pedido |
| P-37 | **Identidade forte por herói**: Jack = muita vida/armadura, parry alto, lento, magia fraca; Bob = mais rápido, crítico e dodge altos, vida mediana, melee fraco, magia mediana; Lucia = velocidade mediana, pouca vida, magia muito forte. Multiplicadores de dano por tag (melee/fogo/magia) por herói | Pedido do usuário (2026-09-27) |
| P-38 | **6 cartas/magias exclusivas por herói** (lista em game-design §5.1) | Pedido do usuário: ≥ 5 diferenças por herói |
| P-39 | **Superpoder** por herói, libera no **level 5**; carrega com **100 abates**; carga persiste entre rounds da run; uso 1× com **Espaço** (gamepad △/Y), zera ao usar. Jack: Colheita Rubra · Bob: Bombardeio · Lucia: Cataclismo Elemental | Pedido do usuário |
| P-40 | Superpoderes têm **animação própria do herói** (`super`, 8 dir × 3 tiers) e **VFX exclusivos** (≥ 12 frames) | Pedido do usuário |
