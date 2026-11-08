# Pesquisa de mercado — arena survivors, roguelite e bullet heaven

> **Versão** 1.0 · **Data** 2026-11-08 · **Autor** Game Director (sessão de agente, buscas web próprias; a delegação ao estagiário foi bloqueada pelo hook do plugin context-mode).
> Complementa [game-market.md](game-market.md) (portais web, herdado do Starfall). Alimenta o [gdd.md](gdd.md), o [brainstorming.md](brainstorming.md) e o [ROADMAP.md](../ROADMAP.md).
> **Honestidade**: todo número tem fonte e data de acesso. Estimativas de vendas vêm de trackers de terceiros (Raijin, VG Insights, Datahumble) e são **ordem de grandeza**, não dado oficial. O que não foi verificado está marcado **HIPÓTESE**.

## Índice

1. [Sumário executivo](#1-sumário-executivo)
2. [Brotato (referência principal)](#2-brotato)
3. [Vampire Survivors](#3-vampire-survivors)
4. [Arms of God](#4-arms-of-god)
5. [Outros concorrentes](#5-outros-concorrentes)
6. [Mecânicas do gênero e fontes de diversão](#6-mecânicas-do-gênero-e-fontes-de-diversão)
7. [Steam Next Fest de fevereiro de 2027](#7-steam-next-fest-de-fevereiro-de-2027)
8. [Monetização, preço e plataformas](#8-monetização-preço-e-plataformas)
9. [Tabela comparativa](#9-tabela-comparativa)
10. [Lições aplicáveis ao Pinguin Survivors](#10-lições-aplicáveis-ao-pinguin-survivors)
11. [Fontes](#11-fontes)

## 1. Sumário executivo

- O gênero paga bem a quem acerta **ritmo + build crafting + juice** a preço baixo: Brotato (US$ 4,99) passou de 2 mi de cópias na Steam no 1.0 e ~3 mi estimadas hoje; Halls of Torment (~US$ 6,66) ~826 mil; Megabonk (US$ 9,99) 1 mi em duas semanas. Fontes em §2, §5.
- **Brotato é o modelo direto** do nosso loop: waves de 20 s → 60 s, loja entre waves com reroll pago e lock grátis, 6 slots de arma, 4 tiers de arma/item, danger 0–5. Reproduzir a estrutura e diferenciar no tema (pinguins, gore, RPG persistente, superpoder, gambits).
- **Next Fest fev/2027**: 22/02–01/03; inscrição até **10/01/2027**; itens para revisão até **08/02/2027**. A variável que mais prevê o resultado é a **quantidade de wishlists antes do evento** (correlação ~0,8); quem entra com < 1.000 wishlists ganha mediana de ~322. Página na Steam e demo **meses antes** do evento, não durante.
- **Demo**: 15–30 min, terminar num gancho com botão de wishlist. Rounds 1–10 do Pinguin (~8–10 min de jogo + loja) cabem nessa janela.
- **Mobile**: tanto Brotato quanto Vampire Survivors são **free com anúncios opcionais (rewarded) + IAP** no celular; Brotato tem também um app Premium de US$ 4,99. Nossa escolha de Android premium é legítima, mas vai contra a norma do gênero (ver §8 e B-22).
- Classificação: gore explícito cai na faixa **16+/Mature** da IARC. Ratings são autodeclarados e pouco auditados, mas declarar errado é risco de remoção.

## 2. Brotato

Fonte principal: Brotato Wiki (brotato.wiki.spellsandguns.com), acessado em 2026-11-08.

### 2.1 Loop e ritmo

- **Waves**: a 1ª dura **20 s**; cada wave seguinte soma **5 s** até o teto de **60 s**; 20 waves na run padrão, com boss na wave 20; Endless continua depois. (Fonte: [Waves](https://brotato.wiki.spellsandguns.com/Waves), acessado em 2026-11-08.) O Pinguin já usa exatamente essa curva (P-14).
- **Danger 0–5**: Danger 0 e 1 não têm waves de elite nem de horda; 2 e 3 têm uma; 4 e 5 têm três. A loja avisa quais waves futuras terão elite/horda a partir do Danger 2. (Fonte: [Waves](https://brotato.wiki.spellsandguns.com/Waves), acessado em 2026-11-08.)
- Ataques automáticos; o jogador só se move. Sem dash.

### 2.2 Economia

- **Materiais** (drops verdes) são ao mesmo tempo **XP e moeda**; no fim de cada wave o stat **Harvesting** rende materiais extras. (Fonte: [Materials](https://brotato.wiki.spellsandguns.com/Materials), acessado em 2026-11-08.)
- **Loja** entre waves: 4 ofertas de armas e itens. **Reroll** custa materiais; o preço depende da wave e sobe a cada reroll na mesma loja, voltando a uma base (crescente) na loja seguinte. **Lock** é grátis e ilimitado; há opção de manter o lock entre lojas. (Fonte: [Shop](https://brotato.wiki.spellsandguns.com/Shop), acessado em 2026-11-08.)
- Existem itens que mexem na economia (ex.: personagem Entrepreneur). (Fonte: [Entrepreneur](https://brotato.wiki.spellsandguns.com/Entrepreneur), acessado em 2026-11-08.)

### 2.3 Armas, itens e personagens

- **Até 6 armas** por personagem (alguns personagens alteram isso). Armas em **4 tiers**; duas armas iguais do mesmo tier **combinam** numa do tier seguinte. Itens também em 4 tiers (I comum → IV raro). (Fonte: [Weapons](https://brotato.wiki.spellsandguns.com/Weapons), acessado em 2026-11-08.)
- **Classes de arma** (sets): bônus por quantidade de armas da mesma classe (Blade, Blunt, Primitive, Medical, Gun, Elemental, etc.); algumas armas têm duas classes. (Fonte: [Weapons](https://brotato.wiki.spellsandguns.com/Weapons); [bloxodes.com/wiki/brotato/weapons](https://bloxodes.com/wiki/brotato/weapons), acessados em 2026-11-08.)
- Patch **1.0.0.3** (saída do Early Access após 10 meses) adicionou 5 elites, 6 personagens, 7 armas, 6 itens e 12 desafios e a classe Legendary. (Fonte: [Patch 1.0.0.3](https://brotato.wiki.spellsandguns.com/Patch_1.0.0.3), acessado em 2026-11-08.)
- Contagens totais divergem entre fontes (66 armas/59 personagens/68 itens em uma; 202/197/50 em outra que conta variantes). **HIPÓTESE** de trabalho: no 1.0 (2023) o jogo tinha na casa de **40–60 armas base, ~40 personagens e ~150 itens**. (Fontes: [rogueranker.com/brotato-tier-list](https://rogueranker.com/brotato-tier-list/); [glama.ai spud-coach](https://glama.ai/mcp/servers/brendanlefebvre/spud-coach), acessados em 2026-11-08.)
- **DLC Abyssal Terrors**: 25/10/2024 no PC, **US$ 3,99**, novo mapa com 20 waves, 14 personagens, 16 armas, 30+ itens (contagens variam por fonte); junto veio **co-op local para 4** grátis. (Fontes: [SteamDB sub](https://steamdb.info/app/2868390/subs); [GamingOnLinux](https://www.gamingonlinux.com/2024/10/thats-the-weekend-sorted-brotato-adds-4-player-local-co-op-and-abyssal-terrors-dlc-out-now), acessados em 2026-11-08.)

### 2.4 Números comerciais

| Métrica | Valor | Fonte |
|---|---|---|
| Preço Steam | US$ 4,99 | [steambase.io/apps/brotato](https://steambase.io/apps/brotato), acessado em 2026-11-08 |
| Cópias Steam no 1.0 (jun/2023) | > 2 mi (oficial) | [Game Developer press release](https://www.gamedeveloper.com/press-release/brotato-10-release), acessado em 2026-11-08 |
| Cópias Steam hoje (estimativa) | ~3 mi, ~US$ 12,6 mi brutos | [raijin.gg](https://raijin.gg/app/1942280/Brotato), acessado em 2026-11-08 |
| Todas as plataformas | > 10 mi (2025) | [Wikipedia](https://en.wikipedia.org/wiki/Brotato), acessado em 2026-11-08 |
| Game Pass | > 1 mi de downloads | [LevelUp](https://www.levelup.com/noticias/este-juego-la-rompio-en-xbox-game-pass-devs-celebran-mas-de-1-millon-de-descargas/), acessado em 2026-11-08 |

### 2.5 Mobile (Erabit Studios)

- App **grátis** no Google Play e App Store com **anúncios (rewarded, opcionais) e IAP**; 4,6 estrelas em ~130 mil avaliações. Estimativa de terceiros: ~477 mil MAU e ~US$ 50 mil/mês, **73% IAP / 27% ads**. (Fontes: [apppricinglab.com](https://apppricinglab.com/app/google_play/com.brotato.shooting.survivors.action.roguelike); [appgoblin.info](https://appgoblin.info/apps/com.brotato.shooting.survivors.action.roguelike), acessados em 2026-11-08.)
- App separado **Brotato: Premium** a **US$ 4,99**, ainda com IAP. (Fonte: [appgoblin.info premium](https://appgoblin.info/apps/com.brotato.shooting.survivors.games.paid.android), acessado em 2026-11-08.)
- Reclamações recorrentes: anúncios que travam o jogo e grind "pay-to-progress" em upgrades meta (ex.: totem acima do nível 9). (Fonte: [App Store US](https://apps.apple.com/us/app/brotato/id6445884925), acessado em 2026-11-08.)

## 3. Vampire Survivors

- **Loop**: tempo fixo de run (30 min no mapa padrão), level-up com 3–4 escolhas, **evoluções** de arma (arma no nível máximo + item passivo específico → arma evoluída) e **Arcana** como modificadores de run; baús dropados por elites dão upgrades em cascata com apresentação de slot machine, herança do passado do autor em jogos de apostas. (Fontes: [The Conversation](https://theconversation.com/vampire-survivors-how-developers-used-gambling-psychology-to-create-a-bafta-winning-game-203613); [80.lv](https://80.lv/articles/vampire-survivors-developer-on-its-design-sudden-success), acessados em 2026-11-08.)
- Feito em **Phaser** (HTML5), com assets padrão da engine no início; inspiração declarada em *Magic Survival* (Android) e Castlevania. (Fontes: [Game Developer](https://gamedeveloper.com/design/vampire-survivors-development-sounds-like-an-open-source-fueled-fever-dream); [GoNintendo](https://gonintendo.com/contents/42432-vampire-survivors-dev-says-the-castlevania-influence-was-there-from-day-one), acessados em 2026-11-08.)
- **Números**: > 27 mi de jogadores (oficial, todas as plataformas); estimativas Steam entre 7,9 mi e 13,6 mi de unidades; > 1 mi vendidos nos 2–3 primeiros meses. (Fontes: [levvvel.com](https://levvvel.com/statistics/vampire-survivors/); [steampulse.org](https://steampulse.org/game/1794680); [GamesRadar](https://gamesradar.com/games/roguelike/before-selling-millions-of-copies-vampire-survivors-creator-says-hed-given-up-on-the-idea-of-success-and-hes-not-interested-in-making-something-just-to-be-successful), acessados em 2026-11-08.) Divergência grande entre trackers: tratar como ordem de grandeza.
- **Mobile** (dez/2022): lançado **grátis**, sem IAP, só anúncios **opcionais** (rewarded para ganhar ouro após o game over); a Poncle fez o porte sozinha por não achar parceiro "não predatório"; 3 mi de downloads nas primeiras semanas. Depois entraram DLCs pagas (~US$ 1,99 cada) como IAP. (Fontes: [PC Gamer](https://www.pcgamer.com/vampire-survivors-studio-says-it-couldnt-find-a-non-predatory-mobile-developer-so-it-did-the-job-itself); [TouchArcade review](https://toucharcade.com/2022/12/09/vampire-survivors-mobile-review-controller-cloud-save-sync-dlc-unlock-iphone-ipad-pro/); [mobilegamer.biz](https://mobilegamer.biz/vampire-survivors-mobile-hits-3m-downloads/); [App Store CA](https://apps.apple.com/ca/app/id6444525702?l=en-ca), acessados em 2026-11-08.)
- O autor reconhece sorte e alerta: hoje há centenas de clones baratos no mobile; é preciso **se destacar**. (Fonte: [GamesRadar](https://gamesradar.com/games/roguelike/vampire-survivors-creator-admits-his-success-was-lucky-amid-a-wave-of-cheap-mobile-knock-offs-for-everyone-else-they-have-to-stand-out-among-the-hundreds), acessado em 2026-11-08.)

## 4. Arms of God

- Existe: **Arms of God** (Steam app 3100310), bullet heaven "survivors-like" em **Early Access desde 08/06/2026**, desenvolvedor solo Dark Jay Studio, publishers Galaktus e Gamersky Games; demo disponível. Estrutura comparada ao **Brotato** (waves + loja), tema dark fantasy com braços mecânicos e armas sagradas; 10 personagens. Preço ~US$ 11,50. ~930 reviews a 90% positivo em junho/2026, ~1.580 depois. (Fontes: [Steam](https://store.steampowered.com/app/3100310); [mein-mmo.de](https://mein-mmo.de/en/new-arpg-on-steam-looks-like-warhammer-with-divine-powers-reminiscent-of-diablo-4,1573085/); [rogueliker.com](https://rogueliker.com/arms-of-god-early-access-impressions/); [wasdland.com](https://www.wasdland.com/game/arms-of-god-3100310/), acessados em 2026-11-08.)
- Relevância: prova que **estética sombria + estrutura Brotato** tem mercado em 2026 e que uma demo em Early Access sustenta a página. Diferença para nós: preço mais alto e visual 3D/HD.

## 5. Outros concorrentes

| Jogo | Loop / diferencial | Preço | Vendas (estimativa) | Reviews | Fonte (acesso 2026-11-08) |
|---|---|---|---|---|---|
| **Halls of Torment** | Survivors com estética Diablo 1, 5 "halls", quests como marcos de desbloqueio, equipamento e retrato de personagem | ~US$ 6,66 (promo) | ~826 mil Steam, ~US$ 4,7 mi brutos | 95,5% em 31,4 mil | [raijin.gg](https://raijin.gg/app/2218750/Halls_of_Torment); [datahumble](https://datahumble.com/halls-of-torment-2218750); [PC Gamer](https://www.pcgamer.com/games/action/halls-of-torment-review) |
| **20 Minutes Till Dawn** | Runs de 10/20 min, **mira manual** com tiro, runas e meta-upgrades; críticas: loop não evolui, escolha de arma pouco importante, muito difícil | US$ 4,99 | não encontrado | ~91% em 28,8 mil | [datahumble](https://datahumble.com/halls-of-torment-2218750); [Softpedia](https://www.softpedia.com/reviews/games/pc/20-minutes-till-dawn-review-537336.shtml) |
| **Deep Rock Galactic: Survivor** | IP forte, mineração/objetivos por mapa, 1.0 em 2025 | ~US$ 13 | 500 mil na 1ª semana de EA; ~1,2 mi (Raijin) a 3,27 mi (Vaporlens) | 86% em 47,9 mil | [Game World Observer](https://gameworldobserver.com/2024/02/22/deep-rock-galactic-survivor-sales-500k-copies-first-week); [raijin.gg](https://raijin.gg/app/2321470/Deep_Rock_Galactic_Survivor) |
| **Megabonk** | Survivors **3D**, humor "brain rot", dev solo (Vedinad), comunidade no Reddit antes do lançamento, explosão por streamers; lançou mesmo contra conselhos de adiar | US$ 9,99 | > 1 mi em 2 semanas (oficial); ~1,3 mi (VGI); pico 117 mil simultâneos | Very Positive, > 19 mil | [GamesRadar](https://www.gamesradar.com/games/roguelike/out-of-nowhere-roguelike-hit-megabonk-has-sold-1-million-copies-in-2-weeks-solo-creator-says-ill-be-eating-spaghetti-with-extra-sauce-tonight); [wnhub](https://wnhub.io/news/stores-and-publishing/item-49000); [Wikipedia](https://en.wikipedia.org/wiki/Megabonk) |
| **Soulstone Survivors** | Duas trilhas de progressão (run + meta), ARPG isométrico de alta densidade | — | — | — | [finalboss.io](https://finalboss.io/soulstone-survivors-1-0-hits-pc-consoles-why) |

## 6. Mecânicas do gênero e fontes de diversão

Síntese das fontes acima e das análises encontradas (nenhum GDC talk oficial da Poncle foi localizado; marcado como lacuna).

1. **Power fantasy em curva**: começa fraco e termina destruindo a tela; o prazer está na transição. Vampire Survivors e HoloCure encerram a run por **tempo**, não por escalar até matar o jogador. (Fonte: [itch.io post](https://itch.io/post/16161084), acessado em 2026-11-08.)
2. **Build crafting**: sinergias explícitas (sets/classes do Brotato, evoluções do VS) são o que dá rejogabilidade; a crítica ao 20 Minutes Till Dawn ("a arma não importa") mostra o custo de não ter isso. (Fonte: Softpedia, §5.)
3. **Ritmo em waves vs contínuo**: waves curtas + loja criam pausas de decisão e marcos claros (Brotato, Arms of God); contínuo (VS) dá fluxo hipnótico. Para mobile e demo curta, waves funcionam melhor (sessões fatiáveis).
4. **Meta-progressão** deve recompensar sem virar "forced failure": progressão amarrada à derrota (Rogue Legacy) frustra se o jogador sente que só o grind avança. (Fontes: [Game Developer](https://gamedeveloper.com/design/the-dangers-of-forced-failure-in-game-design); [Game-Wisdom](https://game-wisdom.com/critical/forced-failure-game-design), acessados em 2026-11-08.) Soulstone Survivors é citado como exemplo de **duas trilhas** bem separadas.
5. **Decisões por minuto**: Brotato dá ~1 loja + 1–3 level-ups por minuto de jogo; VS dá 1 escolha a cada ~20–40 s no início. Nosso round de 20–60 s + loja + cartas de level-up fica nessa faixa.
6. **Juice**: números de dano, hit-stop, shake, gibs e som grave são citados em toda review positiva do gênero (Megabonk "perfect brain rot"; Halls "packs a punch").
7. **Dificuldade escalonada por opção do jogador** (danger levels) em vez de uma curva única: estende a vida útil e dá conquistas.
8. **Risco do gênero**: saturação. Em 2026 há centenas de survivors; os que vendem têm **gancho visível no primeiro segundo do trailer** (3D no Megabonk, Diablo no Halls, IP no DRG). (Fonte: GamesRadar sobre o "gold rush", acessado em 2026-11-08: [link](https://gamesradar.com/games/action/vampire-survivors-kicked-off-a-game-development-gold-rush-but-has-a-legitimately-new-genre-emerged-between-the-cash-ins).)

## 7. Steam Next Fest de fevereiro de 2027

| Item | Data / regra | Fonte (acesso 2026-11-08) |
|---|---|---|
| Evento | **22/02/2027 10:00 PST → 01/03/2027 10:00 PST** | [Steamworks docs](https://partner.steamgames.com/doc/marketing/upcoming_events/nextfest/feb_2027) |
| Inscrição | fecha **10/01/2027 23:59 PST** | idem |
| Itens para revisão | até **08/02/2027** (mesma data do Press Preview, segundo a Valve) | idem |
| Build da demo | **25/01/2027** (fonte de terceiros; não confirmado na Steamworks) | [steampageanalyzer.com](https://www.steampageanalyzer.com/blog/steam-next-fest-february-2027) |
| Elegibilidade | qualquer jogo **não lançado** com demo jogável; um jogo participa **uma única vez** | Steamworks docs |
| Próxima edição | 14–21/06/2027 | [Steamworks upcoming events](https://partner.steamgames.com/doc/marketing/upcoming_events) |

Benchmarks (survey de Chris Zukowski, How To Market A Game, edição fev/2026, 182 respostas; replicado por vários sites):

- Mediana de **806 wishlists** ganhas no evento; p70 ≈ 1.839; p95 ≈ 13.461. Estimativa da GameDiscoverCo sobre todas as ~3.500 demos: mediana mais perto de **200** (o survey tem viés de quem se dá bem). (Fontes: [ziva.sh](https://ziva.sh/blogs/steam-next-fest-2026); [steampageanalyzer after Next Fest](https://www.steampageanalyzer.com/blog/after-steam-next-fest), acessados em 2026-11-08.)
- **Wishlists antes do evento** são o maior preditor (correlação ≈ 0,825): < 1.000 antes → mediana 322 ganhas; ≥ 100.000 → 12.882. Recomendação: **≥ 2.000 wishlists antes**. (Fontes: [blog.playio.co](https://blog.playio.co/steam-next-fest-marketing); [games.gg](https://games.gg/news/steam-next-fest-2027-developer-preparation/), acessados em 2026-11-08.)
- Conversão demo → wishlist: mediana **16–19%**, p70 ≈ 20–23%; abaixo de 10% indica problema na demo ou falta de prompt. (Fontes: games.gg; [gtstu.com](https://gtstu.com/2026/06/06/game-demo-strategy-indie/), acessados em 2026-11-08.)
- Demo lançada **meses antes** rende ~2,5× a mediana de quem lança durante o evento. (Fonte: ziva.sh, idem.)
- Demo ideal: **15–30 min**, termina num **gancho** com botão de wishlist na tela final; bugs/crashes matam conversão. (Fontes: [steampageanalyzer demo best practices](https://www.steampageanalyzer.com/blog/steam-demo-best-practices); [presskit.gg](https://presskit.gg/field-guides/how-to-build-game-demo); [GMTK newsletter](https://gmtk.substack.com/p/how-to-make-a-great-steam-next-fest), acessados em 2026-11-08.)
- Valve afirma que o Next Fest continua elevando wishlists e vendas para a maioria dos participantes. (Fonte: [Game Developer](https://www.gamedeveloper.com/business/steam-next-fest-continues-to-boost-wishlisting-and-sales-says-valve), acessado em 2026-11-08.)

## 8. Monetização, preço e plataformas

- **Preço do gênero na Steam**: US$ 4,99 (Brotato, 20MTD), ~US$ 6,66–9,99 (Halls, Megabonk), ~US$ 11–13 (Arms of God, DRG Survivor). US$ 4,99 é o piso que o mercado aceita para pixel art 2D sem IP.
- **Desconto de lançamento**: fontes de marketing recomendam 10–15% para converter wishlists; sem dado sólido de lift. Rever preços regionais trimestralmente (a Steam não atualiza sozinha). (Fontes: [steampageanalyzer pricing](https://www.steampageanalyzer.com/blog/steam-pricing-strategy); [bugnet.io](https://bugnet.io/blog/steam-launch-discounts-how-deep-should-you-go); [PC Gamer regional](https://www.pcgamer.com/au/the-weird-ecomomics-behind-steam-prices-around-the-world), acessados em 2026-11-08.) **HIPÓTESE**: 10% na 1ª semana.
- **DLC**: Brotato lançou DLC a US$ 3,99 (80% do base) 16 meses após o 1.0, junto de update grátis. Modelo replicável para um bioma novo em 2027–2028.
- **Android**: norma do gênero é **free + rewarded ads + IAP** (Brotato, VS). Premium existe (Brotato: Premium US$ 4,99) como segunda SKU. Nossa decisão (B-22) é premium primeiro; manter o código de monetização isolado para permitir uma SKU free depois.
- **Classificação (IARC/Google Play)**: questionário autodeclarado; faixa **16** quando a violência parece real; **Mature 17+** para violência intensa com sangue e gore. Ratings mal declarados foram removidos após denúncias (16 títulos em 2019). (Fontes: [Google Play help](https://support.google.com/googleplay/answer/6209544?hl=en); [9to5google](https://9to5google.com/guides/age-based-ratings/); [GameRevolution sobre a investigação da Wired](https://www.gamerevolution.com/news/522643-google-play-is-full-of-adult-games-rated-for-kids), acessados em 2026-11-08.) Declarar 16+/Mature honestamente; o toggle de gore não altera a classificação.

## 9. Tabela comparativa

| Mecânica | Brotato | Vampire Survivors | Halls of Torment | Megabonk | **Pinguin Survivors (decidido)** |
|---|---|---|---|---|---|
| Estrutura | 20 waves 20→60 s + loja | 30 min contínuos | ~30 min por hall | runs contínuas 3D | rounds 20→60 s + loja + boss a cada 10, endless |
| Mira | automática | automática | automática | automática | automática |
| Slots de arma | 6 | 6 armas + 6 passivos | 1 arma + habilidades | 1 arma + itens | **6** |
| Loja in-run | sim (4 ofertas, reroll, lock) | não (level-up) | não (level-up + quests) | sim (mercador no mapa) | **sim (4, reroll, lock)** |
| Level-up | 4 upgrades de stat | 3–4 armas/passivos | 3 habilidades | itens | **4 cartas de stat/exclusivas** |
| Moeda run | materiais (= XP) | ouro (meta) | ouro (meta) | ouro | **Fish (run)** + **Pérolas (meta)** |
| Dificuldade | Danger 0–5 | — (mapas/hyper) | Agony por hall | — | **Danger 0–5 por herói** |
| Personagens | ~40–60 | ~40+ | 11 | ~10 | 3 (+ exclusivas, superpoder) |
| Fim | boss wave 20 → endless | tempo | boss | — | **endless puro** |
| Preço | US$ 4,99 | US$ 4,99 | ~US$ 6,66 | US$ 9,99 | **US$ 4,99** |
| Mobile | F2P ads + IAP; Premium | F2P ads + DLC | — | — | **premium** |

## 10. Lições aplicáveis ao Pinguin Survivors

1. **Copiar a espinha dorsal do Brotato sem vergonha** (waves, loja, 6 slots, danger) — é o padrão que o público do gênero já sabe jogar; diferenciar no tema, gore, RPG persistente, superpoder e gambits.
2. **Sets/classes de arma** (melee/fogo/magia + subclasses) com bônus por quantidade: resolve a crítica "a arma não importa" e casa com os multiplicadores por herói.
3. **Combinar duas armas iguais → tier seguinte** é barato de implementar e dá decisão na loja.
4. **Abrir a página da Steam o quanto antes** (dezembro) e publicar a demo **antes** do Next Fest; meta mínima de 2.000 wishlists até 22/02/2027.
5. **Demo de 15–30 min com gancho**: ao vencer o boss do round 10, tela "Bob desbloqueado no jogo completo" + botão Wishlist; nunca "simplesmente parar".
6. **Gancho visual nos 3 primeiros segundos do trailer**: pinguins fofos + sangue DOOM + horda de 300. É o diferencial de marketing, não a mecânica.
7. **Duas trilhas de progressão separadas** (Fish na run, Pérolas no meta) evitam o "forced failure" e deixam a loja balanceável.
8. **Juice é feature de venda**: manter hit-stop, shake, gibs persistentes e números de dano em toda build pública.
9. **Preço US$ 4,99 + desconto de lançamento 10%**, DLC de bioma a ~US$ 3,99 em 2028 (hipótese).
10. **Android premium é exceção no gênero**: isolar a camada de monetização para poder lançar uma SKU free com rewarded ads se o premium não tracionar.
11. **Classificar 16+ com honestidade**; não contar com o toggle de gore para baixar a faixa.
12. **Comunidade antes do lançamento** (Reddit/Discord/devlogs) foi decisiva para Megabonk; abrir canal junto com a página da Steam.

## 11. Fontes

Todas acessadas em **2026-11-08**.

- Brotato Wiki: [Waves](https://brotato.wiki.spellsandguns.com/Waves) · [Shop](https://brotato.wiki.spellsandguns.com/Shop) · [Materials](https://brotato.wiki.spellsandguns.com/Materials) · [Weapons](https://brotato.wiki.spellsandguns.com/Weapons) · [Patch 1.0.0.3](https://brotato.wiki.spellsandguns.com/Patch_1.0.0.3) · [Abyssal Terrors DLC](https://brotato.wiki.spellsandguns.com/Abyssal_Terrors_DLC) · [Entrepreneur](https://brotato.wiki.spellsandguns.com/Entrepreneur)
- [bloxodes.com/wiki/brotato/weapons](https://bloxodes.com/wiki/brotato/weapons) · [rogueranker Brotato tier list](https://rogueranker.com/brotato-tier-list/) · [glama.ai spud-coach](https://glama.ai/mcp/servers/brendanlefebvre/spud-coach)
- [Brotato 1.0 press release (Game Developer)](https://www.gamedeveloper.com/press-release/brotato-10-release) · [raijin.gg Brotato](https://raijin.gg/app/1942280/Brotato) · [steambase.io Brotato](https://steambase.io/apps/brotato) · [Wikipedia Brotato](https://en.wikipedia.org/wiki/Brotato) · [LevelUp Game Pass](https://www.levelup.com/noticias/este-juego-la-rompio-en-xbox-game-pass-devs-celebran-mas-de-1-millon-de-descargas/)
- [SteamDB Abyssal Terrors](https://steamdb.info/app/2868390/subs) · [GamingOnLinux Abyssal Terrors + co-op](https://www.gamingonlinux.com/2024/10/thats-the-weekend-sorted-brotato-adds-4-player-local-co-op-and-abyssal-terrors-dlc-out-now)
- Brotato mobile: [apppricinglab](https://apppricinglab.com/app/google_play/com.brotato.shooting.survivors.action.roguelike) · [appgoblin free](https://appgoblin.info/apps/com.brotato.shooting.survivors.action.roguelike) · [appgoblin premium](https://appgoblin.info/apps/com.brotato.shooting.survivors.games.paid.android) · [App Store US](https://apps.apple.com/us/app/brotato/id6445884925)
- Vampire Survivors: [The Conversation](https://theconversation.com/vampire-survivors-how-developers-used-gambling-psychology-to-create-a-bafta-winning-game-203613) · [80.lv](https://80.lv/articles/vampire-survivors-developer-on-its-design-sudden-success) · [Game Developer](https://gamedeveloper.com/design/vampire-survivors-development-sounds-like-an-open-source-fueled-fever-dream) · [GoNintendo](https://gonintendo.com/contents/42432-vampire-survivors-dev-says-the-castlevania-influence-was-there-from-day-one) · [levvvel.com](https://levvvel.com/statistics/vampire-survivors/) · [steampulse.org](https://steampulse.org/game/1794680) · [GamesRadar (sorte e clones)](https://gamesradar.com/games/roguelike/vampire-survivors-creator-admits-his-success-was-lucky-amid-a-wave-of-cheap-mobile-knock-offs-for-everyone-else-they-have-to-stand-out-among-the-hundreds) · [GamesRadar (1 mi)](https://gamesradar.com/games/roguelike/before-selling-millions-of-copies-vampire-survivors-creator-says-hed-given-up-on-the-idea-of-success-and-hes-not-interested-in-making-something-just-to-be-successful) · [PC Gamer mobile](https://www.pcgamer.com/vampire-survivors-studio-says-it-couldnt-find-a-non-predatory-mobile-developer-so-it-did-the-job-itself) · [TouchArcade](https://toucharcade.com/2022/12/09/vampire-survivors-mobile-review-controller-cloud-save-sync-dlc-unlock-iphone-ipad-pro/) · [mobilegamer.biz](https://mobilegamer.biz/vampire-survivors-mobile-hits-3m-downloads/) · [App Store CA](https://apps.apple.com/ca/app/id6444525702?l=en-ca) · [GamesRadar gold rush](https://gamesradar.com/games/action/vampire-survivors-kicked-off-a-game-development-gold-rush-but-has-a-legitimately-new-genre-emerged-between-the-cash-ins)
- Arms of God: [Steam](https://store.steampowered.com/app/3100310) · [mein-mmo.de](https://mein-mmo.de/en/new-arpg-on-steam-looks-like-warhammer-with-divine-powers-reminiscent-of-diablo-4,1573085/) · [rogueliker.com](https://rogueliker.com/arms-of-god-early-access-impressions/) · [wasdland.com](https://www.wasdland.com/game/arms-of-god-3100310/)
- Outros: [raijin Halls of Torment](https://raijin.gg/app/2218750/Halls_of_Torment) · [datahumble Halls](https://datahumble.com/halls-of-torment-2218750) · [PC Gamer Halls review](https://www.pcgamer.com/games/action/halls-of-torment-review) · [Softpedia 20MTD](https://www.softpedia.com/reviews/games/pc/20-minutes-till-dawn-review-537336.shtml) · [Game World Observer DRG](https://gameworldobserver.com/2024/02/22/deep-rock-galactic-survivor-sales-500k-copies-first-week) · [raijin DRG](https://raijin.gg/app/2321470/Deep_Rock_Galactic_Survivor) · [Vaporlens DRG](https://vaporlens.app/app/2321470/deep_rock_galactic_survivor/stats/details) · [GamesRadar Megabonk](https://www.gamesradar.com/games/roguelike/out-of-nowhere-roguelike-hit-megabonk-has-sold-1-million-copies-in-2-weeks-solo-creator-says-ill-be-eating-spaghetti-with-extra-sauce-tonight) · [wnhub Megabonk](https://wnhub.io/news/stores-and-publishing/item-49000) · [Wikipedia Megabonk](https://en.wikipedia.org/wiki/Megabonk) · [finalboss Soulstone](https://finalboss.io/soulstone-survivors-1-0-hits-pc-consoles-why)
- Design: [itch.io post sobre runs por tempo](https://itch.io/post/16161084) · [Game Developer forced failure](https://gamedeveloper.com/design/the-dangers-of-forced-failure-in-game-design) · [Game-Wisdom forced failure](https://game-wisdom.com/critical/forced-failure-game-design)
- Next Fest: [Steamworks fev/2027](https://partner.steamgames.com/doc/marketing/upcoming_events/nextfest/feb_2027) · [Steamworks upcoming events](https://partner.steamgames.com/doc/marketing/upcoming_events) · [steampageanalyzer fev/2027](https://www.steampageanalyzer.com/blog/steam-next-fest-february-2027) · [steampageanalyzer after](https://www.steampageanalyzer.com/blog/after-steam-next-fest) · [steampageanalyzer demo best practices](https://www.steampageanalyzer.com/blog/steam-demo-best-practices) · [ziva.sh](https://ziva.sh/blogs/steam-next-fest-2026) · [blog.playio.co](https://blog.playio.co/steam-next-fest-marketing) · [games.gg](https://games.gg/news/steam-next-fest-2027-developer-preparation/) · [presskit.gg demo](https://presskit.gg/field-guides/how-to-build-game-demo) · [GMTK newsletter](https://gmtk.substack.com/p/how-to-make-a-great-steam-next-fest) · [gtstu.com demo](https://gtstu.com/2026/06/06/game-demo-strategy-indie/) · [Game Developer / Valve](https://www.gamedeveloper.com/business/steam-next-fest-continues-to-boost-wishlisting-and-sales-says-valve) · [How To Market A Game (arquivo jan/2026)](https://howtomarketagame.com/2025/03/26/archive-january-2026-benchmarks-how-many-wishlists-can-i-get-from-steam-next-fest/)
- Preço e rating: [steampageanalyzer pricing](https://www.steampageanalyzer.com/blog/steam-pricing-strategy) · [bugnet.io launch discounts](https://bugnet.io/blog/steam-launch-discounts-how-deep-should-you-go) · [PC Gamer regional](https://www.pcgamer.com/au/the-weird-ecomomics-behind-steam-prices-around-the-world) · [Google Play content ratings](https://support.google.com/googleplay/answer/6209544?hl=en) · [9to5google age ratings](https://9to5google.com/guides/age-based-ratings/) · [GameRevolution / Wired](https://www.gamerevolution.com/news/522643-google-play-is-full-of-adult-games-rated-for-kids)

### Lacunas (não encontradas; não inventadas)

- GDC talk ou postmortem oficial da Poncle sobre design do Vampire Survivors.
- Vendas do 20 Minutes Till Dawn.
- Data oficial da Valve para o upload da build da demo do Next Fest fev/2027 (só a data de itens para revisão, 08/02).
- Dados públicos de retenção D1/D7 de survivors no mobile.
