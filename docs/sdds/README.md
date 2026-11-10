# SDDs — Spec-Driven Development

Cada SDD descreve **uma frente de implementação** antes do código: contexto, requisitos, especificação (dados, interfaces, arquivos), **critérios de aceite verificáveis** (comando, teste ou métrica), plano de testes, fora de escopo e dependências. O [ROADMAP.md](../../ROADMAP.md) referencia as SDDs e quebra cada uma em tarefas com responsável e DoD.
Regra: nenhuma tarefa de implementação começa sem a SDD correspondente em status **Aprovada**; mudar a spec durante a implementação exige editar a SDD primeiro.

| SDD | Frente | Depende de | Status |
|---|---|---|---|
| [SDD-001](SDD-001-arena-topdown.md) | Arena quadrada top-down, câmera, spawn, decalques, remoção do iso | — | Aprovada |
| [SDD-002](SDD-002-armas-slots-classes-tiers.md) | 6 slots, classes/sets, tiers I–IV (hoje raridade I–V, ADR-017), fusão, arma inicial | — | Aprovada (parcialmente superada) |
| [SDD-003](SDD-003-loja-cartas-economia.md) | Loja do fim de round, cartas de level-up, Fish/Pérolas | SDD-002, SDD-004 | Aprovada (parcialmente superada) |
| [SDD-004](SDD-004-ui-react-tailwind.md) | UI React + Tailwind v4 (HUD, menus, loja ARPG) | — | Aprovada |
| [SDD-005](SDD-005-danger-e-save-v2.md) | Danger 0–5, save schema v2 e migração (save hoje v3, sem migração) | SDD-003 | Aprovada (parcialmente superada) |
| [SDD-006](SDD-006-demo.md) | Build demo, gating, tela final, migração do save | SDD-004, SDD-005 | Aprovada |
| [SDD-007](SDD-007-ports-electron-capacitor.md) | Electron (Steam) e Capacitor (Android), camada `Platform` | SDD-004 | Aprovada |
| [SDD-008](SDD-008-site-astro-github-pages.md) | Site estático Astro 7.4 + demo em `/demo` + deploy GitHub Pages | SDD-006 | Aprovada |
| [SDD-009](SDD-009-i18n-es-zh.md) | Idiomas ES e ZH simplificado | SDD-004 | Aprovada |
| [SDD-010](SDD-010-remocao-de-vozes.md) | Remoção de vozes e legendas | — | Aprovada |
| [SDD-011](SDD-011-releases-vukem.md) | Versionamento vukem, retag e releases | — | Aprovada |
| [SDD-012](SDD-012-arte-topdown-e-vfx.md) | Produção de arte top-down (tiles, props, lojista, tiers, VFX) | SDD-001, SDD-002 | Aprovada |
| [SDD-013](SDD-013-balanceamento-e-simulacao.md) | Ferramentas de balanceamento: sim, bot, telemetria pós-1.0 | SDD-002, SDD-003, SDD-005 | Aprovada |
| [SDD-014](SDD-014-slots-de-save-suporte-e-pocao.md) | Três slots de save, itens de suporte nível 1–5 e poção de cura da run | SDD-003, SDD-005 | Aprovada |
| [SDD-015](SDD-015-ui-diablo-4-organica.md) | UI Diablo 4 orgânica (Estilo D): tokens, primitivos e as 16 telas | SDD-004 | Aprovada |
