# Registro de decisões (ADR-lite)

Decisões tomadas com o usuário na entrevista (`grill-me`, 2026-09-25). Para mudar uma decisão, adicione uma entrada nova que substitua a antiga. Não apague a antiga.

| ID | Decisão | Motivo |
|---|---|---|
| D-01 | Tema **sci-fi retrô**; nome provisório **Starfall Survivors** | Escolha do usuário |
| D-02 | Ataque e mira **automáticos**; o jogador só se move | Fiel às referências; foco em decisões entre ondas |
| D-03 | Input: **teclado WASD** (+ setas); menus com mouse e teclado. Sem gamepad e sem toque | Escolha do usuário |
| D-04 | **Ondas cronometradas** (20 s +5 s/onda, teto de 60 s) | "A cada rodada, 3 cartas" |
| D-05 | Fluxo: **3 cartas grátis → loja → próxima onda** | Q17 |
| D-06 | **Moeda (ouro), loja, re-roll e itens** existem; entram no **final do Alpha** | Q5/Q16: validar combate e cartas primeiro |
| D-07 | Cartas = stats/habilidades (grátis). Itens = passivos com trade-off (ouro), sem limite de slots | Q18 |
| D-08 | 1 arma inicial + até **6 habilidades**, nível 1–5; evoluções e sinergias no Beta | Q6 |
| D-09 | 3 personagens: **Warrior** (corpo a corpo, tanque), **Ranger** (distância, rápido), **Mage** (distância, habilidades fortes, frágil). Tudo em versão sci-fi; "magias" = "Abilities" | Q7/Q15 |
| D-10 | TypeScript + Vite + **Phaser 4.2.x** + Arcade Physics + Vitest | Q8 |
| D-11 | Phaser desde o Alpha; **placeholders desenhados por código** (sem arquivos de imagem no Alpha) | Q9: evita reescrever o jogo |
| D-12 | **Não usar o Phaser MCP** (Game Agent: pago e só em projetos na nuvem da Phaser). Usar as 28 skills oficiais | Q10, `research.md` |
| D-13 | **Higgsfield só no final** (1.0); o MCP não é configurado antes disso | Q11 |
| D-14 | **Tudo em inglês** (UI, código, strings). Docs de projeto em PT-BR | Q12 |
| D-15 | Versionamento com **git local**, sem remoto por enquanto | Q13 |
| D-16 | Pixel art **32 px**, resolução lógica 480×270, zoom inteiro, tela cheia (RESIZE) | Q14 |
| D-17 | 4 raridades + atributo Luck; Legendary a partir da onda 5 | Q19 |
| D-18 | Revive: no máximo 1 carga; 50% de HP + 2 s de invulnerabilidade + onda de choque. Sem carga = permadeath | Q20 |
| D-19 | **Arena fechada** (~2×2 telas), câmera segue o jogador | Q21 |
| D-20 | Inimigos do Alpha: Chaser, Runner, Shooter, Tank + Elite a cada 5 ondas + Boss a cada 10 | Q22 |
| D-21 | Armas iniciais: Energy Blade / Blaster / Psi Orb | Q23 |
| D-22 | Meta-progressão gradual: recorde (Alpha) → desbloqueios (Beta) → árvore pequena (1.0) | Q24 |
| D-23 | Áudio: jsfxr (Alpha) → chiptune (Beta) → música de IA (1.0) | Q25 |
| D-24 | Meta de performance: 60 FPS, 300 inimigos + 500 projéteis; pooling | Q26 |
| D-25 | ESC pausa; Settings: volumes, fullscreen, shake, números de dano | Q27 |
| D-26 | Inimigos dropam **só ouro** (+ chance rara de medkit); sem XP | Q28 |
| D-27 | Paleta **Endesga 32** | Q29 |
| D-28 | **Biome v2** como linter e formatter (remove ESLint/Prettier); TAB com largura 4 + `.editorconfig` | Pedido do usuário (2026-09-25) |
| D-29 | **Conventional Commits 1.0.0** obrigatórios, validados por commitlint no hook `commit-msg` | Pedido do usuário |
| D-30 | **SemVer 2.0.0**: `0.1.0` (fase 0) → `1.0.0-alpha.N` → `1.0.0-beta.N` → `1.0.0` | Pedido do usuário; ver git-and-versioning.md |
| D-31 | Husky: pre-commit (Biome + typecheck + testes), pre-push (Biome ci + typecheck + testes + build) | Pedido do usuário |
| D-32 | Remoto GitHub `origin` (substitui D-15); micro-commits e push para `main` ao fim de cada seção do PLAN | Pedido do usuário |
| D-33 | **Bun 1.4.2** no lugar de node/npm (runtime, pacotes, scripts). node/npm só quando uma ferramenta não suportar Bun | Pedido do usuário |
| D-34 | **`bun:test`** no lugar do Vitest (substitui o test runner de D-10) | Pedido do usuário; funcionou sem problemas |
| D-35 | **Som mudo** por `.env` (`SOUND_MUTED=true`, arquivo local fora do git) nos testes até o fim da fase 3 | Pedido do usuário (PC precisa ficar em silêncio) |
| D-36 | **Suporte a gamepad** (Gamepad API/Phaser; alvo: DualSense do PS5). Substitui a parte "sem gamepad" de D-03 | Pedido do usuário (2026-09-25) |
| D-37 | Blaster 5→10, Psi Orb 4→6 e cooldown 1.0→0.8 s; taxa de spawn conta inimigos (não grupos) | Simulação de 1.12 (Ranger/Mage morriam nas ondas 4–6) |
| D-38 | agent-browser usado via `bunx agent-browser@0.38.1` (o CLI global não está no PATH) e teclas simuladas com `__GAME__.hold/press` (o CLI envia `keyCode` 0) | Achado de QA |
| D-39 | Venda de itens **implementada** (reembolso de 50% do preço atual, clique no item possuído na loja); lock mantém o item no re-roll e na próxima loja | Decisão do agente (usuário pediu para seguir o caminho recomendado); dá saída para builds erradas, como a reciclagem do Brotato |
| D-40 | **Velocidade de jogo 1×/2×** nas Settings (e `?speed=N` só para testes) | Pedido do usuário |
| D-41 | **Moeda meta "Cores"** ganha ao fim de cada run: `2·onda + abates/50 + 10·bosses` (arredondado para baixo) | Decisão do agente (3.4; usuário pediu o caminho recomendado) |
| D-42 | **Árvore de upgrades permanentes** em trilhas lineares de até 5 níveis: Vitality (+3 Max HP), Firepower (+3% Damage), Reflexes (+3% Attack Speed), Plating (+1 Armor, máx. 3), Fortune (+5 Luck), Magnet (+10 Pickup), Funding (+10 ouro inicial) e Second Wind (começa com 1 revive, 1 nível). Custos crescentes; bônus pequenos para não quebrar o balanceamento | Decisão do agente; modelo Brotato/VS de meta leve (D-22) |
| D-43 | **Conquistas locais** (10), salvas no save v2 e mostradas na tela Records + toast na HUD | Decisão do agente (3.4) |
| D-44 | **Elites só de tipos lentos/pesados** (Chaser, Shooter, Tank, Splitter), elite ×1.25 de dano e `fast` ×1.2; inimigo é repelido ao acertar; i-frames 0.5 s; Ranger 22 HP e Mage 18 HP | Playtest com bot: elite de Runner na onda 5 era impossível de despistar |
| D-45 | **Retro Diffusion** vira a ferramenta padrão de arte (API v2 + `scripts/rd-generate.ts`/`rd-slice.ts`), com paleta Endesga 32 forçada, heróis em `rd_animation__small_sprites` e inimigos em `rd_plus__topdown_item`; PixelLab como fallback; Scenario, pixel-mcp e Higgsfield adiados | Pedido do usuário (testar RD/pixel-mcp/Scenario, ignorar Higgsfield); piloto de US$0,50 aprovado |
| D-46 | **Buff Warrior** (+50% HP, dano, atk speed e alcance da Energy Blade), **buff Mage** (+25% HP, dano, atk speed e habilidades ×1.25), **nerf Ranger** (−20% HP, dano e atk speed) | Playtest humano do usuário |
| D-47 | **Limite de 5 min por boss** (conta desde o spawn; o timer da HUD mostra o tempo do boss); tempo esgotado = game over "TIME UP" | Pedido do usuário |
| D-48 | Gamepad aprovado no playtest real do usuário; seção "Backlog" removida do PLAN | Pedido do usuário |
| D-49 | **Cura total no início de cada onda** (`WAVE.waveStartHeal = 1`, fração do Max HP), estilo Brotato | Reduz a punição acumulada entre ondas; ajustável para cura parcial no balanceamento |
| D-50 | **Acertos de projéteis pela grade espacial** do EnemySystem e Arcade com `useTree: false` (overlaps restantes são 1×grupo); projéteis atravessam Burrowers enterrados | Profiling no estresse (300 inimigos + 500 projéteis): CPU ocupada 41% → 26% do frame |
| D-51 | **Sem tremor de tela na loja** (compra sem ouro suficiente não sacode mais a câmera; o botão desabilitado já sinaliza) | Pedido do usuário |
| D-52 | **Sem créditos de IA, a arte que falta fica por código** (projéteis, efeitos, pickups, bosses 2/3, splitling, decorações, UI, ícones); a fonte 5×7 vira a fonte final; logo e key art do menu desenhados por código (`keyart.ts`) | Pedido do usuário (RD e PixelLab sem saldo) |
| D-53 | **Fechamento da 3.5 como `1.0.0-rc.1`**, só build + tag, sem publicação; o `1.0.0` sai quando a arte final estiver pronta | Pedido do usuário |
| D-54 | **Áudio final (3.3) adiado**: ficam os SFX jsfxr e o chiptune atuais | Pedido do usuário |

## Em aberto (decidir quando a fase chegar)

- [ ] Nome final do jogo (hoje é "Starfall Survivors").
- [ ] Ferramenta de música no 1.0 (o Higgsfield gera música? Se não, qual ferramenta?).
- [x] Conteúdo exato da árvore de upgrades permanentes (1.0): decidido em D-42.
- [ ] Onde publicar o jogo no 1.0 — pesquisa em [game-market.md](game-market.md) (recomendação: itch.io primeiro).
- [ ] Orçamento de créditos para arte (Retro Diffusion: ~US$3–4 cobrem o resto dos assets).
