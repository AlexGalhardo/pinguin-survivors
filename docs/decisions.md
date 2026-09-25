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

## Em aberto (decidir quando a fase chegar)

- [ ] Nome final do jogo (hoje é "Starfall Survivors").
- [ ] Ferramenta de música no 1.0 (o Higgsfield gera música? Se não, qual ferramenta?).
- [ ] Conteúdo exato da árvore de upgrades permanentes (1.0).
- [ ] Onde publicar o jogo no 1.0 (itch.io? GitHub Pages?).
- [ ] Orçamento de créditos no Higgsfield.
