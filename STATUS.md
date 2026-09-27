# Pinguin Survivors — Status do projeto

> Relatório local (fora do git). Gerado em **2026-09-27**. Build atual publicada no `main`: **v0.1.0-beta.2 · playdev-1**.
> Fonte da verdade continua sendo o [PLAN.md](PLAN.md); este arquivo resume onde estamos e o que falta para a **1.0.0**.

## 1. Resumo executivo

| | |
|---|---|
| **Fase atual** | BETA (fases 1–6 de sistemas praticamente fechadas) → entrando na Fase 7 (RC → 1.0) |
| **PLAN.md** | **123 itens concluídos · 12 abertos · 4 parciais** |
| **Qualidade** | 167 testes unitários (bun:test) + E2E completo (`bun run e2e`) passando; Biome, tsc e build verdes |
| **Performance** | 60 FPS médio (p95 16,9 ms) com 300 inimigos + 2.000 decalques a 2560×1080; Chrome 59 / Edge 59 / Firefox 58 FPS |
| **Resoluções** | 1366×768 → 4K, ultrawide 2560×1080 e Retina (@2×) sem scroll e em tela cheia |
| **Maior gargalo para a 1.0** | **Arte final (PixelLab)** — throughput de jobs e falhas do modelo v3 — e **balanceamento até o round 30** |
| **Estimativa até 1.0** | ~2–4 dias de trabalho contínuo dos agentes, dominados pela arte (ver §5) |

## 2. Como está o jogo hoje (o que você pode testar)

**Loop principal**
- 3 heróis com identidade própria: **Jack** (corpo a corpo, tanque, parry), **Bob** (armas de fogo, rápido, críticos — desbloqueia no boss 10), **Lucia** (magia elemental, frágil — desbloqueia no boss 20).
- **Dificuldade EASY / NORMAL / HARD** na seleção de herói (↑↓): ±25% em dano, vida, velocidade e drops dos inimigos.
- Rounds com timer, elites roxos/laranjas (com barra de vida), boss a cada 10 rounds (limite de 3 min).
- **3 biomas em loop** (endless): Antártida (1–10, urso polar), estação de pesquisa/porto (11–20, **Kraken do Porto**: tentáculo, tinta em leque, invoca marinheiros), cidade em ruínas (21–30, **Abominação**: investidas, poças de ácido, enxame de ratos). 6–7 inimigos próprios por bioma.
- Cartas no fim de cada round (raridades), evolução da arma assinada T1→T2→T3, **15 armas secundárias** (6 novas: bumerangue de peixe, minas, anel de fogo, totem de raios, nuvem de veneno, besta), cartas on-hit (sangrar, veneno, queimar, gelar, eletrocutar), superpoder no level 5 (Espaço / △).
- Obstáculos sólidos leves (rochas, caixotes, entulho) com desvio.
- Poções com gambits estilo FFXII, gore persistente (3 modos), escuridão com luzes estilo Diablo 4, bloom, hit-stop, zoom-punch, tremor.
- Falas dos heróis com **legendas** (7 eventos × 2 variações) — ainda **sem áudio de voz**.

**Meta-progressão**
- Level persistente e pontos de stat, **Oficina** (9 upgrades permanentes com Fish), **Loja de Extras** (10 bônus permanentes com pontos de conquista, nível 1–10), 131 conquistas, histórico das últimas 20 partidas, **Continuar** a run salva, export/import do save.

**Opções**: EN/PT-BR, resolução, tela cheia, volumes, gore, tremor, números de dano (tamanho), flashes reduzidos, bloom, legendas, **rebind de teclas** (tela Controles), gamepad completo, joystick de toque (base para mobile).

**Arte já no jogo (PixelLab)**: key art do menu, retratos, badge de conquista, as 10 armas, pickups (XP/peixe/carne), projéteis, heróis sem arma (Bob com idle animado, Jack/Lucia em rotações estáticas) e 6 zumbis + urso polar em 8 direções (estáticos). **Todo o resto ainda é placeholder desenhado por código** (tiles, inimigos dos biomas 2–3, bosses 2–3, ícones, molduras, VFX).

**Áudio**: 18 SFX + 3 músicas (menu/round/boss) do ElevenLabs. Faltam vozes, variações de SFX e música do round tardio.

## 3. As 3 frentes de trabalho

### 3.1 Linha principal (sistemas) — `wt/systems`
**Feito nesta sessão**: Oficina, recordes por herói, tela de desbloqueio, fullscreen, barra de HP dos elites, biomas 2–3 + Kraken/Abominação com IA própria, 6 secundárias + 3 cartas on-hit, obstáculos sólidos, canal de voz + legendas, bloom/luzes/zoom-punch, área real da magia de fogo, rebind/gamepad/touch/acessibilidade, auditoria i18n, E2E Playwright, script de performance, QA cross-browser/resoluções, loja de extras, dificuldade, builds `v0.1.0-beta.1` e `v0.1.0-beta.2 (playdev-1)`.

**Falta (meu lado)**
| Item | Esforço |
|---|---|
| **Áudio final (7.2)**: vozes EN + PT-BR dos 3 heróis (42 falas × 2 idiomas, roteiro já pronto em `src/i18n/voice.*.ts`), variações de SFX, música do round tardio — ElevenLabs | ~2–4 h + créditos ElevenLabs (verificar saldo) |
| QA 1.9: run real com Jack até o boss 10 sem erros (o bot automático é afetado por concorrência de GPU — ver §6) | ~1 h |
| Carregamento sob demanda dos atlas por bioma (junto com a frente de assets) | ~1 h |
| Revisão final de docs, créditos (PixelLab, ElevenLabs), build publicável itch.io (gore reduzido para portais) | ~2 h |
| `1.0.0-rc.1` → congelamento → `1.0.0` | após arte + balance |

### 3.2 Frente de balanceamento — `wt/balance`
**Já integrado no `dev`**: simulação headless modelando secundárias, superpoder, elites e política de cartas; bot de playtest com "cérebro" de desvio, injeção de save e política de cartas; sim/bot com biomas, bosses rotativos e upgrades da Oficina.
**Última calibração registrada** (balancing §10, heróis nível 1, NORMAL): Jack vivo no round 7 no limite; Bob morre no boss 10; Lucia morre no round 9 — dentro da meta de jogador novo (morrer entre 6 e 9).

_Situação detalhada e estimativa: ver §3.2.1 (resposta do agente)._

#### 3.2.1 Resposta da frente de balance
- **Integrado**: sim reescrita + teste de sanidade (determinística por seed); bot que joga o build real (desvio por campo de perigo, luta contra boss, superpoder, cartas, injeção de level/pontos/poções/upgrades, knobs de habilidade `--react`/`--mistakes`). Contato da sim calibrado com o bot. **Os números base de dano/stats ainda não mudaram.**
- **Local, ainda não integrado**: loop do endless (a cada 30 rounds, HP ×1,6 e dano ×1,5) e spawn ×0,5 nos rounds de boss.
- **Resultados do bot "médio"** (reação 0,2 s, 5% de erros, NORMAL, build do dev), no formato "round alcançado/melhor":

| Configuração | Jack | Bob | Lucia |
|---|---|---|---|
| Level 1, sem upgrades | 10/20 | 13/14 | 13/15 |
| Level 10 + Oficina 2 + poções | 14/20 | 18/39 | — |
| Level 20 + Oficina 4 | 42 | — | — |

- **Meta "level 10–20 com build razoável chega ao round 30": ainda NÃO atingida de forma consistente.** Gargalos: bosses (a arma mira o inimigo mais próximo, então o boss quase não apanha; o Kraken do round 20 mata muito) e variância das cartas.
- **Falta**: ajustar os bosses 20/30 e o `bossHpPerCycle`, reforçar Bob/Lucia no bioma 2, rodar mais seeds (2–3 por herói × nível), atualizar `balancing.md` e marcar o PLAN.
- **Pedidos para sistemas (linha principal)**: arma assinada priorizar boss/elite no alcance; cura parcial no fim do round (opcional).
- **Estimativa**: ~2–3 h de agente (cada lote do bot leva 40–60 min de relógio). Risco: variância alta com poucas seeds.
- **FPS**: a frente roda até 4 Chromes headless do bot em paralelo — isso **explica as quedas de FPS** nos meus testes. Combinado: no máximo 2 por vez.

### 3.3 Frente de assets — `wt/assets` (resposta do agente)
**Integrado no `dev`**: atlas core com as 10 armas, pickups e projéteis; heróis sem arma (Bob com idle animado, demais em rotação estática); inimigos zombiePenguin, bloaterPenguin, zombieSeal, zombieSkua, zombieScientist, zombieMedic e boss polarBear (rotações estáticas em 8 direções).
**Pronto localmente, entra no próximo lote**: walk animado do zombiePenguin e do Bob, idle completo da Lucia, 4 tiles iso da Antártida.

**Falta da seção 7.2**
| Item | Custo aprox. (gerações PixelLab) |
|---|---|
| Heróis: walk8/hurt/death × 3 (~50 jobs) + superpoder 1 direção × 3 (~45 cada) | ~185 |
| Jack sem arma "limpo" (base atual ainda tem machete em 2 direções) | variável |
| Inimigos do bioma 1: walk/attack restantes | ~45 jobs |
| Biomas 2–3: 13 concepts + Kraken + Abominação + morsa (modo pro se o v3 continuar falhando) | ~500 |
| Biomas 2–3: walk/attack | ~150 jobs |
| Tiles station/ruins + 9 decorações | ~70 |
| Ícones de cartas/stats/poções | ~40 |
| Molduras de UI | ~100 |
| VFX dos 3 superpoderes | ~60–100 |
| **Total restante** | **~900–1.200 gerações** |

- **Saldo PixelLab: 1.740 gerações** (renova em 26/10) → **cabe**, com folga pequena se os concepts forem em modo pro.
- **Tempo**: ~1 dia de geração contínua para heróis + bioma 1 + tiles + UI; os biomas 2–3 dependem do modelo v3 do PixelLab voltar a funcionar (15 de 16 falharam hoje).

## 4. O que falta para a 1.0.0 (checklist consolidado)

1. **Arte final** (frente de assets) — heróis animados, inimigos/bosses dos 3 biomas, tiles/decos, ícones, UI, VFX dos superpoderes; lazy-load por bioma.
2. **Áudio final** (linha principal) — vozes EN/PT-BR, SFX extras, música do round tardio.
3. **Balanceamento até o round 30** (frente de balance) — com os números novos (biomas 2–3, bosses, secundárias, dificuldade, Oficina/Extras), meta §9 do balancing e playtests reais.
4. **QA final** — run completa até o round 30 nos 3 heróis e 3 dificuldades; QA visual a 2560×1080 e no Mac M1; cross-browser de novo com a arte final.
5. **Release** — docs e créditos, build itch.io, `1.0.0-rc.1` (congelamento, só correções) → `1.0.0`.

## 5. Estimativa de prazo

| Bloco | Estimativa | Depende de |
|---|---|---|
| Arte bioma 1 + heróis + tiles + UI | ~1 dia | throughput PixelLab (10 slots, jobs de 2–15 min) |
| Arte biomas 2–3 | +1–2 dias | modelo v3 estável (ou modo pro, mais caro) |
| Áudio final | ~meio dia | créditos ElevenLabs |
| Balance até o round 30 | ~2–3 h de agente + ajustes de sistema (mira no boss) | arte não bloqueia; roda em paralelo |
| RC + QA + release | ~meio dia | tudo acima |
| **Total até 1.0.0** | **~2–4 dias** | |

## 6. Riscos e bloqueios

- **PixelLab v3 instável** — concepts dos biomas 2–3 podem ir para o modo pro (mais créditos).
- **2 jobs "fantasmas" presos a 95%** ocupando slots: `5ef60905…` e `50b266ab…`. **Ação sua**: cancelar no painel do PixelLab (o agente não tem permissão para esses dois).
- **Qualidade de templates em quadrúpedes** (foca, skua usam esqueleto de urso) — pode precisar de ajuste manual.
- **Quedas de FPS nos testes automáticos (explicado)**: o FPS caía de 58 para 1 de forma não reproduzível porque a frente de balance roda até 4 Chromes do bot ao mesmo tempo (concorrência de GPU). Limitado a 2. Ainda assim, **confirme jogando**: se ficar lento depois de ~20 s com Jack ou Lucia, me avise.
- **Histórico git antigo** com `2.0.0` (fase 0) ainda não reescrito — bloqueado por permissão; depende de você.

## 7. O que testar agora (playdev-1)

- Preview do build: `bunx --bun vite preview --port 4173` → http://localhost:4173 (ou `bun run dev` → http://localhost:5173).
- Rodapé deve mostrar **`v0.1.0-beta.2 · playdev-1`**.
- Roteiro sugerido:
  1. Menu → **Oficina** e **Conquistas → ENTER (Loja de Extras)**.
  2. **Jogar** → escolher dificuldade (↑↓) → run com Jack; TAB para 2×; pegar cartas; ver secundárias novas.
  3. Configurações → **Controles** (rebind), tamanho dos números, flashes reduzidos, bloom, legendas.
  4. Com `?skipMenu=1&hero=jack&round=20&god=1` você pula direto para o Kraken; `round=30` para a Abominação; `&difficulty=hard` força a dificuldade.
- Anote: sensação de dificuldade por bioma, bosses, legibilidade, FPS no seu hardware (M1 incluso).

## 8. Decisões que ainda dependem de você

- Cancelar os 2 jobs fantasmas no painel do PixelLab.
- Ajustes nos concepts dos inimigos (aprovados automaticamente — P-60) depois de testar.
- Reescrever o histórico git antigo (tags do Starfall) — opcional.
