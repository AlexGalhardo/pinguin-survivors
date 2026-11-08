# Segredos e dados sensíveis

- `PIXELLAB_API_TOKEN`, `ELEVENLABS_API_KEY` e qualquer outra chave vivem **só no `.env`** (gitignored). `.env.example` tem as chaves vazias.
- Nunca imprima, logue, cole em docs, prints, issues, commits ou relatórios o valor de um segredo. Scripts que leem o `.env` imprimem apenas o resultado (saldo, status), nunca o token. Se um segredo aparecer em um print ou log, avise o desenvolvedor para girá-lo.
- `TODO.md`, `STATUS.md` e `PLAN.md` são locais (gitignored); não os commite.
- `steam_appid.txt` e arquivos de assinatura Android (`*.jks`, `*.keystore`) são gitignored; CI usa secrets do repositório.
- Nunca envie o e-mail do desenvolvedor ou dados pessoais a serviços externos; contato público é o perfil do GitHub.
- Dependências novas e versões fixas: ver `.agents/rules/typescript.md`. Dependabot semanal (`.github/dependabot.yml`) para Bun e GitHub Actions.
