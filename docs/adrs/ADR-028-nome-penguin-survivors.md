# ADR-028 — O jogo passa a se chamar Penguin Survivors

**Data** 2026-11-11 · **Status** Aceito (2026-11-11, desenvolvedor no chat, decisão B-33) · **Decisão de origem** rodada de sugestões comerciais: "Trocar para Penguin Survivors".

## Contexto

O jogo nasceu como "Pinguin Survivors". "Pinguin" é a grafia alemã e holandesa; em inglês, o idioma da página da Steam, da imprensa e da busca, a palavra é "Penguin". Na capsule e nos resultados de busca o nome antigo lê como erro de digitação. A página da Steam e a ficha da Google Play ainda não existem, então a troca custa pouco agora e muito depois.

## Decisão

O nome de exibição passa a ser **Penguin Survivors** em tudo o que o jogador, a loja ou a imprensa veem. Os identificadores internos que não aparecem para ninguém continuam como estão, para não mover saves nem quebrar links.

**Muda:**

- o título do jogo (`game.title` nos 4 idiomas, `<title>` e descrição do `index.html`);
- o `productName` do Electron (o executável vira `Penguin Survivors.exe` e `Penguin Survivors Demo.exe`);
- o nome do app e o **`applicationId` do Android** (`xyz.lekzera.penguinsurvivors`): na Google Play o id é público e definitivo depois da primeira publicação, então troca antes dela;
- os nomes dos arquivos anexados às releases (`penguin-survivors-<versão>-windows-x64.zip`, `…-demo-…` e `…-android-debug.apk`) e dos artefatos dos workflows;
- site, press kit, README, docs, wireframes e textos de marketing.

**Não muda:**

- o repositório e as URLs (`github.com/AlexGalhardo/pinguin-survivors`, `alexgalhardo.github.io/pinguin-survivors/`) até o desenvolvedor renomear o repositório (ROADMAP F2.4); `REPO_URL` e `SITE_BASE` trocam junto;
- os nomes dos pacotes (`pinguin-survivors`, `pinguin-survivors-desktop`, `pinguin-survivors-mobile`, `pinguin-survivors-site`) e o `appId` do Electron (`xyz.lekzera.pinguin-survivors`). A pasta de dados do desktop sai do nome do pacote, então o save continua em `%APPDATA%/pinguin-survivors-desktop/` e nenhuma migração é necessária;
- as chaves de armazenamento (`pinguin-survivors-save-*`, `pinguin-survivors-telemetry-*`), as chaves de assets, a classe `PinguinBridge` e as skills `pinguin-*`;
- as tags, as releases publicadas, o `CHANGELOG.md` das versões já lançadas, os relatórios em `docs/reports/` e as branches de legado.

## Alternativas

- **Manter "Pinguin Survivors":** preserva a marca original, mas carrega o risco de busca e de parecer erro para o público em inglês. Rejeitado pelo desenvolvedor.
- **Outro nome, sem "Survivors":** o sufixo é saturado, mas diz o gênero em uma palavra e combina com o que já foi produzido (key art, site, trailer). Rejeitado.
- **Renomear também pacotes, `appId` do Electron e chaves de save:** não muda nada do que o jogador vê e obrigaria a migrar a pasta de save do desktop e a configuração do Steam Auto-Cloud. Rejeitado: custo sem retorno.

## Consequências

- Quem instalou o APK de teste antigo vê um app novo ao lado do antigo (id diferente) e começa com save vazio. Aceito: antes da 1.0 o save não tem compatibilidade retroativa.
- O caminho do Steam Auto-Cloud documentado em [architecture.md](../architecture.md) §9 não muda.
- Os scripts que procuram o executável (`scripts/build-desktop.ts`, `scripts/smoke-desktop.ts`) usam o nome novo.
- Depois do rename do repositório (F2.4): atualizar `REPO_URL` em `scripts/lib/release-notes.ts`, `SITE_BASE` em `pages.yml`, os links do README e do site.
