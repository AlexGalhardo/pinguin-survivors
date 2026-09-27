# Decisões do usuário — Pinguin Survivors

Registro das decisões de produto tomadas com o usuário (entrevista de 2026-09-27, 36 perguntas).
Quando uma decisão mudar, **edite a linha** e registre a data. As decisões do jogo anterior (Starfall Survivors, D-01…D-56) ficam na branch `starfall-survivors-legacy`.

| # | Decisão | Motivo / nota |
|---|---|---|
| P-01 | **Refundação**: manter a infraestrutura (Bun, Vite, Phaser 4, Biome, commitlint, `logic/` puro, RNG com seed, spatial grid, gamepad) e **reescrever a camada de jogo** | A fundação era sólida; iso + mapa infinito + RPG mudam todo o resto |
| P-02 | Histórico do Starfall preservado na branch **`starfall-survivors-legacy`** (e tag `v1.0.0-rc.1`); Pinguin Survivors é desenvolvido na `main` | Pedido do usuário |
| P-03 | Repo renomeado para `git@github.com:AlexGalhardo/pinguin-survivors.git`; versão começa em **`0.1.0-alpha.N`** | Projeto novo; histórico do Starfall na branch legacy |
| P-04 | Perspectiva **2.5D isométrica clássica 2:1** (estilo Diablo 2), tiles de **64×32**, sprites em vista **"low top-down"** | "Iso pixel estilo Diablo" |
| P-05 | Herói com **~88 px de altura** (canvas 96, concepts aprovados), inimigos comuns ~56–64 px (canvas 64–80), elites ×1,25/×1,4, bosses 160–256 px | Meta inicial era ~64 px; o usuário aprovou os concepts v3 no tamanho gerado (2026-09-27) |
| P-06 | Tela lógica com **altura 540** e largura livre, **zoom inteiro** (`floor(innerHeight/540)`). 2560×1080 → zoom 2, vê 1280×540 | Ultrawide do usuário; pixel-perfect sem escala fracionária |
| P-07 | **8 direções para tudo** (heróis, inimigos, bosses) — 5 geradas + 3 espelhadas (P-54); animações com **≥ 12 frames** onde o orçamento permite (P-54) | Pedido do usuário |
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
| P-20 | **1 arma assinada + até 3 secundárias**, em **3 tiers** (T1/T2/T3). ~~Desenhada no sprite do herói~~ → sprite separado estilo Brotato (P-56) | Atualizado em 2026-09-27 |
| P-21 | Jack (melee, rockhopper): **machete → katana → espada-motosserra**. Bob (fogo, imperador): **escopeta cano duplo → escopeta automática → escopeta-foguete**. Lucia (magia, gentoo): **cajado dos 4 elementos** (fogo/terra/gelo/energia) → evoluções | |
| P-22 | Animações do herói: **idle, walk, hurt, death** (sem arma, × 8 dir, compartilhadas pelos tiers); o ataque é a arma animada por código (P-56) | |
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
| P-41 | **Conquistas globais** (131, compartilhadas entre heróis), **1 ponto de conquista** cada; loja de extras com pontos (itens a definir) | Pedido do usuário |
| P-42 | **TAB alterna velocidade 1×/2×** (padrão 1×) | Pedido do usuário |
| P-43 | **Save local** (localStorage) com autosave, **Continue** da run no início do próximo round, **histórico das últimas 20 partidas**, export/import `.json` | Pedido do usuário |
| P-44 | Alerta de conquista **centralizado no topo** com **badge exclusivo** (PixelLab) e **som exclusivo** (ElevenLabs) | Pedido do usuário |
| P-45 | **Versão do build (SemVer) centralizada no rodapé** do menu inicial e da HUD | Pedido do usuário |
| P-46 | Versionamento começa em **`0.1.0-alpha.N`** (alpha) → `0.1.0-beta.N` → `1.0.0-rc.N` → `1.0.0` | Pedido do usuário (arquivos atualizados; reescrever o histórico git antigo ficou bloqueado pela permissão) |
| P-47 | **`CHANGELOG.md` na raiz no padrão Keep a Changelog 1.1.0**, além do changelog curto do PLAN | Pedido do usuário |
| P-48 | **Push após cada commit** | Pedido do usuário |
| P-49 | Concepts aprovados: Jack `jack-v3-a`, Bob `bob-v3-a`, Lucia `lucia-v3-b` (ids em art-prompts) | Aprovação do usuário; variantes escolhidas pelo agente |
| P-50 | **Resolução** em Settings: Automática (pixels nativos, Retina incluso) ou SD 480p / HD 720p / Full HD / 2K / 3K / 4K; o canvas renderiza na resolução escolhida e é esticado para a janela (Scale.NONE + zoom) | Pedido do usuário (joga num Mac M1) |
| P-51 | **Menu inicial com key art** estilo DOOM (vermelho/laranja/verde/preto) gerada no PixelLab: Jack e Bob, **50% de chance cada** a cada abertura; imagem fixa com brasas e pulso suave da lava (sem relâmpagos) | Pedido do usuário |
| P-52 | Alcance das armas do Jack **+50%** em todos os tiers | Pedido do usuário |
| P-53 | Skills de terceiros **curadas** (40 de ~170) dos repositórios awesome-gamedev-agent-skills, game-creator e Claude-Code-Game-Studios, com prefixos `gd-`/`gc-`/`ccgs-`; sem hooks/settings/agentes deles | Pedido do usuário; curadoria para não poluir o contexto nem sobrescrever as regras do projeto |
| P-54 | **Animações com orçamento**: `template` do PixelLab (**6 frames**, 1 geração/direção) para idle/walk/hurt/death e para tudo nos tiers T2/T3; `v3` com **12 frames** só no **ataque** do T1 de cada herói; superpoder em **1 direção** (sul, virado para a câmera). Geramos **5 direções** (s, se, e, ne, n) e espelhamos sw/w/nw | Aceito pelo usuário em 2026-09-27 (substitui o "≥ 12 frames" de P-07 para esses casos); custo medido: v3 12 frames = 45 gerações/direção |
| P-55 | ElevenLabs: começou no plano free; **upgrade para Starter (US$ 6/mês, 35 mil créditos)** em 2026-09-27 para a Music API; economizar créditos (faixas curtas, 1 variação) | Decisão do usuário |
| P-56 | **Ataques estilo Brotato**: a arma é um **sprite separado** animado por código (giro de corte, recuo de tiro, brilho do cajado) ao lado do herói, **não** frames do personagem inteiro. Heróis animados **sem arma** (idle/walk/hurt/death, template) uma vez só e reaproveitados nos 3 tiers; tiers T2/T3 = nova imagem de arma; armas reaproveitáveis entre heróis. Substitui "arma desenhada no sprite" (P-20), a animação de ataque por herói/tier (P-22) e o v3 de ataque (P-54) | Pedido do usuário (2026-09-27): mais barato, mais rápido e reaproveitável |
| P-57 | **Assets só no fim da Fase 7**: primeiro todos os sistemas, testes e simulações com placeholders; produção e troca de arte/áudio finais apenas na seção 7.2 do PLAN | Pedido do usuário (2026-09-27) |
