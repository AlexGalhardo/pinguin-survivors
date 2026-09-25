# Mercado de jogos de browser: itch.io, Poki e CrazyGames

> Pesquisa feita em 2026-09-25 para decidir onde (e se) publicar o Starfall Survivors.
> O objetivo principal do projeto continua sendo **diversão e aprendizado**; este documento serve para saber o que cada plataforma oferece e exige.
> Números de tráfego vêm de terceiros (Similarweb, Semrush, imprensa) e das próprias plataformas; trate-os como **ordem de grandeza**, não como valor exato. Fontes no fim.

## Resumo em uma tabela

| | **itch.io** | **Poki** | **CrazyGames** |
|---|---|---|---|
| Perfil | Loja/vitrine indie (download + browser), comunidade de devs | Maior portal de jogos web do mundo, curadoria forte | 2º maior portal web, aberto a qualquer dev, forte em Tier 1 |
| Escala | ~23 mi de visitas/mês (69 mi em 3 meses, ago/2026) | **100 mi de jogadores ativos/mês**; 625 mi de jogadores em 2025; 1 bi de partidas em um mês | **50+ mi de jogadores/mês** (35 mi medidos por terceiros no início de 2025) |
| Público | 73% homens, maior faixa 18–24; 33% EUA; gamers e devs indie | 54% mulheres, maior faixa 25–34 (mas bem distribuído); ~48% mobile; EUA 13%, Brasil 11%, Índia 8% | 52% homens, maior faixa 18–24; muito tráfego de escola/Chromebook |
| Entrada | Livre: qualquer um publica em minutos | Curada: envio → playtests com jogadores reais → revisão → release | Livre para enviar; Basic Launch (sem anúncios) → Full Launch (com anúncios) |
| Exclusividade | Nenhuma | **Exclusividade na web aberta** (Steam, lojas de app e consoles continuam livres) | Nenhuma |
| Monetização | Venda / "pague quanto quiser" / doação; você define o corte do itch (padrão **10%**) | Anúncios via SDK: **50/50** no tráfego que a Poki traz, **100%** no seu próprio tráfego | Anúncios via SDK (split não publicado; relatos de ~60% para o dev) + compras in-game para convidados (**70/30**) |
| Pagamento | Stripe/PayPal (taxa ~2,9% + US$0,30 além do corte) | Contrato de revenue share de longo prazo | Mensal via Tipalti, mínimo **€100** |
| SDK obrigatório | Não | Sim (tem SDK para Phaser/HTML5) | Só para Full Launch/monetizar |
| Limites técnicos | Web: ZIP ≤ 500 MB extraído, ≤ 1.000 arquivos, arquivo ≤ 200 MB | Download inicial ideal ≤ 5 MB, total ≤ 8 MB; carregar em < 10 s | Total ≤ 250 MB, ≤ 1.500 arquivos; inicial ≤ 50 MB (≤ 20 MB para a home mobile); Chromebook de 4 GB |
| Melhor para | Portfólio, feedback de devs, game jams, vender uma versão "completa" | Alcance máximo e renda com anúncios, se for aprovado | Validar com jogadores reais sem burocracia, renda com anúncios |

**Starfall Survivors hoje**: build de produção com **~1,5 MB** (416 kB gzip), 3 arquivos, sem assets externos. Cabe folgado nos três. Com a arte final em atlas PNG, a meta é continuar abaixo de **5 MB** para não perder a Poki como opção.

---

## 1. itch.io

### O que é
Loja e vitrine aberta para jogos indie, criada em 2013. Aceita jogos para download (Windows/Mac/Linux) e **jogáveis no navegador** (HTML5). É a casa das game jams (Ludum Dare, GMTK, js13k etc.) e de muitos protótipos e jogos experimentais.

### Números
- ~**69 milhões de visitas em 3 meses** (≈ 23 mi/mês), ranking global ~#478 (Similarweb, ago/2026).
- Visita média de ~4 min, 5,6 páginas por visita, rejeição de ~41%.
- Países: EUA 33%, Rússia 5%, Alemanha 5%, Reino Unido 4%, **Brasil 3,7%**.
- Público: **73% masculino**, maior faixa **18–24 anos**. Muitos são desenvolvedores, estudantes e fãs de indie.
- Centenas de milhares de projetos (mais de 200 mil jogos já em 2019): a concorrência por visibilidade é enorme.
- Pesquisa com 169 devs (How To Market A Game, 2025): **mediana de 1.582 visualizações por jogo na vida toda**; média de 54 mil puxada por poucos sucessos. Jogos **jogáveis no browser** convertem ~45% das visualizações em partidas, contra ~10% dos que só têm download.

### Monetização
- Preço fixo, "pague quanto quiser" (com mínimo opcional) ou grátis com doação.
- **Você escolhe a porcentagem do itch.io** (0–100%, padrão 10%). Taxas de pagamento (Stripe/PayPal, ~2,9% + US$0,30) são à parte.
- "Creator Day": alguns dias por ano o itch.io fica com 0%.
- Sem anúncios. Na prática, a maioria dos jogos pagos vende pouco (relatos de ~80% abaixo de US$50/mês).

### Vantagens
- Zero barreira: publica em minutos, sem SDK, sem exclusividade, sem contrato.
- Página própria bonita (capa, screenshots, devlog, comentários) e comunidade que dá feedback.
- Ótimo para portfólio e para participar de jams.
- Pode coexistir com qualquer outra plataforma (inclusive como página "oficial" do jogo).

### Desvantagens
- Pouco tráfego orgânico por jogo: sem divulgação própria (Reddit, TikTok, YouTube, jams), o jogo tende a ficar invisível.
- Público mais "gamer/dev", menos casual: jogadores críticos, mas pouco volume.
- Monetizar jogo de browser grátis é difícil (só doação).

### Requisitos técnicos (HTML5)
- ZIP com `index.html` na raiz; ≤ 1.000 arquivos; ≤ 500 MB extraído; nenhum arquivo acima de 200 MB; caminhos ≤ 240 caracteres.
- Opções de iframe: tamanho da viewport, botão de tela cheia, "mobile friendly". O jogo roda em `iframe` (nosso zoom inteiro e tela cheia já funcionam nesse cenário).

---

## 2. Poki

### O que é
Portal holandês fundado em 2014, hoje o **maior site de jogos grátis de browser do mundo**. Time de ~65 pessoas, sem investimento externo. Jogos como *Subway Surfers*, *Stickman Hook* (574 mi de partidas) e *Monkey Mart* (300 mi) vivem lá.

### Números
- **100 milhões de jogadores ativos por mês**; **625 milhões** de jogadores únicos em 2025; **1 bilhão de partidas** em um único mês.
- Mais de **600 estúdios** parceiros; os melhores faturam **até ~€1 milhão/ano**.
- Público equilibrado: **54% feminino**, maior faixa **25–34 anos**, idades bem distribuídas; **~48% mobile**.
- Países: EUA 13%, **Brasil 11%**, Índia 8% (Semrush).

### Monetização
- Receita de **anúncios** (intersticiais entre partidas e rewarded video opcional) via **Poki SDK**.
- **50/50** sobre jogadores que chegam pela Poki; **100% para o dev** sobre tráfego que ele traz (links diretos, redes sociais, busca).
- Contrato de revenue share de longo prazo, sem taxa inicial. Para não exclusivos existem acordos de valor fixo.
- eCPM de rewarded video (referência do mercado, antes do split): EUA US$15–28, Europa US$8–15, Brasil/Índia US$1–3. Intersticial paga ~metade; banner quase nada.

### Vantagens
- Maior alcance possível na web, com público casual (não só gamers) e forte no Brasil.
- Playtests com jogadores reais em poucas horas e ferramentas (Poki Inspector) para validar o jogo antes de lançar.
- Curadoria limita os lançamentos diários, então cada jogo aprovado recebe atenção de verdade.
- SDK oficial para **Phaser** e HTML5.

### Desvantagens
- **Curadoria**: nem todo jogo é aceito; eles procuram jogos que prendem nos primeiros segundos e funcionam bem no celular.
- **Exclusividade na web**: se publicar na Poki, não pode estar na CrazyGames nem em outros portais web (itch.io web também conta como web aberta; Steam e lojas de app ficam liberadas).
- Requisitos técnicos rígidos: download inicial pequeno (**≤ 5 MB ideal, ≤ 8 MB total**), carregar em menos de ~10 s, funcionar em celular (toque).
- Anúncios obrigatórios nos momentos que eles definem (pausas naturais: entre ondas, game over).

### O que o Starfall Survivors precisaria
- Integrar o Poki SDK (`gameplayStart`/`gameplayStop`, `commercialBreak` entre ondas, `rewardedBreak` opcional, por exemplo para um re-roll grátis).
- **Controles de toque** (hoje o jogo é teclado/mouse/gamepad; decisão D-03 deixou mobile fora do escopo).
- Tutorial ainda mais curto: o jogador casual decide em segundos.

---

## 3. CrazyGames

### O que é
Portal belga fundado em 2014, o **segundo maior** do mercado. Aberto a qualquer desenvolvedor, com um processo em duas etapas e muitos jogos multiplayer e .io.

### Números
- **50+ milhões de jogadores por mês** (dado da empresa), concentrados em mercados Tier 1; terceiros mediram ~35 mi/mês no início de 2025.
- Público: **52% masculino**, maior faixa **18–24 anos**. Muito tráfego escolar (Chromebooks).
- Um relato antigo de dev: ~€1,20 por mil partidas somando o portfólio; sem centenas de milhares de partidas a renda com anúncios é pequena.

### Monetização
- **Anúncios** via CrazyGames SDK (vídeo e banner). A porcentagem exata não é publicada; termos de jam de 2026 indicam **~60% para o dev** em anúncios.
- **Compras in-game** (só jogos convidados, via Xsolla): **70% dev / 30% CrazyGames** após recuperação de custos.
- Pagamento mensal via Tipalti (transferência ou PayPal) quando o saldo passa de **€100**; abaixo disso acumula.

### Vantagens
- **Sem exclusividade**: pode publicar também no itch.io, Steam, lojas de app.
- **Basic Launch**: o jogo vai ao ar sem anúncios e sem SDK para testar com jogadores reais e ver métricas (tempo de jogo, retenção). Se for bem, passa para Full Launch (com anúncios e mais promoção).
- Requisitos técnicos folgados (250 MB total, 50 MB inicial).
- Aceita desktop-only: mobile é opcional (mas dá mais alcance).

### Desvantagens
- Receita por jogador baixa sem volume grande; o split não é transparente.
- Proíbe anúncios externos e marcas de outros portais dentro do jogo.
- Conteúdo precisa respeitar **PEGI 12** e ter inglês (o Starfall já está em inglês e sem violência gráfica).
- Muita concorrência de jogos .io e multiplayer, que dominam a home.

### Requisitos técnicos
- Total ≤ 250 MB, ≤ 1.500 arquivos, **somente caminhos relativos** (o Vite precisa de `base: './'` no build de portal).
- Download inicial ≤ 50 MB (≤ 20 MB para aparecer na home mobile); carregamento ≤ 20 s.
- Rodar bem em Chrome e Edge (Safari e Firefox recomendados) e em **Chromebook de 4 GB**.
- Retomar o `AudioContext` após interrupções no iOS (nosso AudioSystem já destrava o áudio no primeiro input).
- Chamar o evento "gameplay start" do SDK quando o jogo começa de fato.

---

## Outras opções (menções)

| Plataforma | Resumo | Split para o dev |
|---|---|---|
| **Newgrounds** | Comunidade antiga, fiel e menor; valoriza projetos autorais e estranhos | Parte do pool de anúncios, mínimo US$50 |
| **GameDistribution** | Distribui o jogo para 4.000+ sites (350 mi de usuários/mês), pouca visibilidade de marca | 33% da receita líquida, mínimo €100 |
| **Y8** | Catálogo enorme e antigo de jogos casuais | 50% dos anúncios |
| **GitHub Pages / Vercel** | Hospedagem própria grátis; sem público, mas controle total | 100% (sem anúncios por padrão) |

---

## Recomendação para o Starfall Survivors

1. **Agora (aprendizado)**: publicar no **itch.io** como jogo grátis de browser (com "pague quanto quiser" opcional). Zero custo, zero exclusividade, página própria e feedback da comunidade. Participar de uma game jam temática é a melhor forma de ganhar visibilidade lá.
2. **Se quiser testar público casual**: enviar para a **CrazyGames em Basic Launch** (sem SDK, sem anúncios, sem exclusividade). As métricas de retenção dizem se vale investir em SDK/anúncios e em controles de toque.
3. **Poki só se o jogo for aprovado nos playtests** e se você aceitar a exclusividade web. Exige toque/mobile e SDK; em troca, é o maior alcance possível (e o Brasil é o 2º maior país da Poki).
4. Custos a lembrar: nenhuma das três cobra para publicar. O custo real é tempo (SDK, mobile, página, divulgação) e, na Poki, abrir mão de outros portais web.

### Checklist técnico antes de publicar em portal
- [ ] `base: './'` no `vite.config.ts` para caminhos relativos.
- [ ] Build ≤ 5 MB (manter o atlas de arte compacto).
- [ ] Botão de som e de tela cheia dentro do jogo (já existem nas Settings).
- [ ] Pausar e silenciar quando a aba perde o foco (já existe).
- [ ] Controles de toque (necessários para Poki e para a home mobile da CrazyGames).
- [ ] SDK da plataforma escolhida (camada fina em `src/core/`, desligada nos builds do itch.io).

## Fontes

- [Poki anuncia 625 milhões de jogadores (Yahoo Finance/AccessWire)](https://finance.yahoo.com/sectors/technology/articles/poki-announces-milestone-625-million-050000965.html)
- [How Poki builds the largest browser gaming playground](https://thepcenthusiast.com/how-poki-builds-the-largest-browser-gaming-playground/)
- [Poki Docs: Working with Poki](https://developers.poki.com/guide/working-with-poki) · [Requirements](https://developers.poki.com/guide/requirements-quality)
- [Similarweb: poki.com](https://www.similarweb.com/website/poki.com/) · [Semrush: poki.com](https://www.semrush.com/website/poki.com/overview)
- [CrazyGames FAQ](https://docs.crazygames.com/faq/) · [Technical requirements](https://docs.crazygames.com/requirements/technical/) · [Developer Portal](https://developer.crazygames.com/)
- [Cinevva: CrazyGames developer guide (2026)](https://app.cinevva.com/guides/publish-game-crazygames) · [Web game monetization (2026)](https://app.cinevva.com/guides/web-game-monetization)
- [Similarweb: crazygames.com](https://www.similarweb.com/website/crazygames.com/) · [Similarweb: itch.io](https://www.similarweb.com/website/itch.io/)
- [itch.io: Uploading HTML5 games](https://itch.io/docs/creators/html5)
- [How To Market A Game: benchmark de tráfego do itch.io (2025)](https://howtomarketagame.com/2025/05/12/benchmark-itch-io-traffic/)
- [itch.io Creator Day](https://en.techinbengali.com/itch-io-creator-day-100-percent-revenue-developers/)
- [Game Developer: The huge, hidden web game market](https://www.gamedeveloper.com/business/the-huge-hidden-web-game-market-no-one-talks-about-and-how-to-get-in-)
- [DEV: Where to publish a web game in 2026](https://dev.to/paulcrinigan/where-to-publish-a-web-game-in-2026-4318)
