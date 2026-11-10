import { HERO_IDS, type HeroId } from '../../config/constants';
import { STARTING_WEAPONS } from '../../data/unlocks';
import { WEAPON_LINE_BY_ID, type WeaponId } from '../../data/weapons';
import type { RunEndEvent } from '../telemetry';

/**
 * Balance report (SDD-013 RF-03): turns run events (sim or bot JSONL) into tables and checks the
 * goals of docs/balancing-and-simulation.md A4. A goal without data is `n/d`, never a pass.
 */
/** Time a player spends in one shop and its level-up cards (SDD-006 A5). */
export const SHOP_SECONDS = 45;

/**
 * Goal windows for the 50-round campaign (PROPOSAL, docs/balancing-and-simulation.md A4): the old 30-round
 * windows scaled by 50/30 and rounded; `campaign` is the last campaign round, `endlessCap` the sim cut.
 */
export const GOAL_ROUNDS = {
	campaign: 50,
	endlessCap: 70,
	/** #1 new player: median death window and the round nobody passes. */
	l1Median: [13, 33],
	l1Max: 50,
	/** #2 L10: every hero passes this boss round; at most 5% die before `l10Early`. */
	l10Boss: 35,
	l10Early: 20,
	/** #3 L20: median past this round and under the endless cap. */
	l20Past: 50,
	/** #4 Danger: D0 reaches this many rounds past D1; D5 dies by `d5Max`. */
	dangerGap: 8,
	d5Max: 25,
} as const;

export type Status = '✓' | '✗' | 'n/d';

export interface GoalResult {
	id: number;
	profile: string;
	goal: string;
	status: Status;
	detail: string;
}

export function quantile(sorted: readonly number[], q: number): number {
	if (sorted.length === 0) return Number.NaN;
	const i = (sorted.length - 1) * q;
	const lo = Math.floor(i);
	const hi = Math.ceil(i);
	return (sorted[lo] as number) + ((sorted[hi] as number) - (sorted[lo] as number)) * (i - lo);
}

const sortedRounds = (events: readonly RunEndEvent[]): number[] =>
	events.map((e) => e.round).sort((a, b) => a - b);

export const median = (events: readonly RunEndEvent[]): number =>
	quantile(sortedRounds(events), 0.5);

const pick = (
	events: readonly RunEndEvent[],
	where: Partial<Pick<RunEndEvent, 'hero' | 'level' | 'danger'>>,
): RunEndEvent[] =>
	events.filter(
		(e) =>
			(where.hero === undefined || e.hero === where.hero) &&
			(where.level === undefined || e.level === where.level) &&
			(where.danger === undefined || e.danger === where.danger),
	);

const pct = (n: number): string => `${(n * 100).toFixed(1)}%`;
const nd = (id: number, profile: string, goal: string, why: string): GoalResult => ({
	id,
	profile,
	goal,
	status: 'n/d',
	detail: why,
});
const result = (
	id: number,
	profile: string,
	goal: string,
	ok: boolean,
	detail: string,
): GoalResult => ({ id, profile, goal, status: ok ? '✓' : '✗', detail });

/** Share of runs holding each weapon / set in the final build, ignoring the starting weapon. */
export function buildShares(events: readonly RunEndEvent[]): {
	weapons: Record<string, number>;
	sets: Record<string, number>;
} {
	const weapons: Record<string, number> = {};
	const sets: Record<string, number> = {};
	for (const e of events) {
		const ids = new Set(e.weapons.map((w) => w.split(':')[0] as string));
		ids.delete(STARTING_WEAPONS[e.hero][0]);
		const buildSets = new Set<string>();
		for (const id of ids) {
			weapons[id] = (weapons[id] ?? 0) + 1;
			for (const s of WEAPON_LINE_BY_ID[id as WeaponId]?.sets ?? []) buildSets.add(s);
		}
		for (const s of buildSets) sets[s] = (sets[s] ?? 0) + 1;
	}
	for (const m of [weapons, sets])
		for (const k of Object.keys(m)) m[k] = (m[k] as number) / events.length;
	return { weapons, sets };
}

/** One `bun scripts/perf.ts` result line. */
export interface PerfRun {
	avgFps: number;
	p95FrameMs: number;
	enemies: number;
	round: number;
}

export function evaluateGoals(
	allEvents: readonly RunEndEvent[],
	perf: readonly PerfRun[] = [],
): GoalResult[] {
	const out: GoalResult[] = [];
	// Goals #1 to #6 are about the sim; the real-game bot runs only feed #7.
	const events = allEvents.filter((e) => e.source !== 'bot');
	const botRuns = allEvents.filter((e) => e.source === 'bot');

	// #1 new player: L1, Danger 1, empty tree.
	{
		const goal = `mediana de morte entre os rounds ${GOAL_ROUNDS.l1Median[0]} e ${GOAL_ROUNDS.l1Median[1]}; nenhum herói passa do ${GOAL_ROUNDS.l1Max}`;
		const profile = 'L1, D1, árvore vazia';
		const rows = HERO_IDS.map((hero) => pick(events, { hero, level: 1, danger: 1 })).filter(
			(r) => r.length > 0,
		);
		if (rows.length === 0) out.push(nd(1, profile, goal, 'sem runs'));
		else {
			const meds = rows.map(median);
			const max = Math.max(...rows.flatMap((r) => r.map((e) => e.round)));
			out.push(
				result(
					1,
					profile,
					goal,
					meds.every(
						(m) => m >= GOAL_ROUNDS.l1Median[0] && m <= GOAL_ROUNDS.l1Median[1],
					) && max <= GOAL_ROUNDS.l1Max,
					`medianas ${meds.map((m) => m.toFixed(0)).join(' / ')}, máximo ${max}`,
				),
			);
		}
	}

	// #2 L10 with the auto-allocated tree (docs A4: at most 5% of the runs die before round 12).
	{
		const goal = `cada herói passa do boss ${GOAL_ROUNDS.l10Boss} em ≥ 1 run; ≤ 5% das runs morrem antes do round ${GOAL_ROUNDS.l10Early}`;
		const profile = 'L10, D1, árvore automática';
		const rows = HERO_IDS.map((hero) => pick(events, { hero, level: 10, danger: 1 }));
		if (rows.some((r) => r.length === 0))
			out.push(nd(2, profile, goal, 'falta herói sem runs'));
		else {
			const passes = rows.map((r) => r.some((e) => e.round > GOAL_ROUNDS.l10Boss));
			const early = rows.map(
				(r) => r.filter((e) => e.round < GOAL_ROUNDS.l10Early).length / r.length,
			);
			out.push(
				result(
					2,
					profile,
					goal,
					passes.every(Boolean) && early.every((e) => e <= 0.05),
					`passam do 20: ${passes.map((p, i) => `${HERO_IDS[i]} ${p ? 'sim' : 'não'}`).join(', ')}; morrem antes do ${GOAL_ROUNDS.l10Early}: ${early.map((e, i) => `${HERO_IDS[i]} ${pct(e)}`).join(', ')}`,
				),
			);
		}
	}

	// #3 L20 with the auto-allocated tree.
	{
		const goal = `os 3 heróis passam do round ${GOAL_ROUNDS.l20Past} (mediana) e morrem antes do ${GOAL_ROUNDS.endlessCap}`;
		const profile = 'L20, D1, árvore automática';
		const rows = HERO_IDS.map((hero) => pick(events, { hero, level: 20, danger: 1 }));
		if (rows.some((r) => r.length === 0))
			out.push(nd(3, profile, goal, 'falta herói sem runs'));
		else {
			const meds = rows.map(median);
			out.push(
				result(
					3,
					profile,
					goal,
					meds.every((m) => m > GOAL_ROUNDS.l20Past && m < GOAL_ROUNDS.endlessCap),
					`medianas ${meds.map((m) => m.toFixed(0)).join(' / ')}`,
				),
			);
		}
	}

	// #4 Danger 0 vs 1 vs 5 at L10.
	{
		const goal = `D0 chega ≥ ${GOAL_ROUNDS.dangerGap} rounds além do D1; D5 morre até o round ${GOAL_ROUNDS.d5Max}`;
		const profile = 'L10, D0 / D1 / D5';
		const d = (danger: 0 | 1 | 5) => pick(events, { level: 10, danger });
		if (d(0).length === 0 || d(1).length === 0 || d(5).length === 0)
			out.push(nd(4, profile, goal, 'faltam Danger 0, 1 ou 5'));
		else {
			const [m0, m1, m5] = [median(d(0)), median(d(1)), median(d(5))] as [
				number,
				number,
				number,
			];
			out.push(
				result(
					4,
					profile,
					goal,
					m0 >= m1 + GOAL_ROUNDS.dangerGap && m5 <= GOAL_ROUNDS.d5Max,
					`medianas D0 ${m0.toFixed(0)}, D1 ${m1.toFixed(0)}, D5 ${m5.toFixed(0)}`,
				),
			);
		}
	}

	// #5 build diversity. The per-hero 35% / 50% caps are an accepted exception (docs A4): with ~15
	// candidates for 5 free slots the average is already ~33%, and the class bonus is intentional.
	// What is required: every shop weapon shows up in >= 3% of the builds of at least one hero.
	{
		const goal =
			'toda arma de loja aparece em ≥ 3% das builds de pelo menos um herói (limites de 35% por arma e 50% por set por herói: exceção justificada, valores medidos abaixo)';
		const profile = 'L10, D1, por herói (armas da loja, sem a inicial)';
		const rows = pick(events, { level: 10, danger: 1 });
		const perHero = HERO_IDS.map((hero) => ({
			hero,
			rows: rows.filter((e) => e.hero === hero),
		}));
		if (perHero.some((h) => h.rows.length < 30))
			out.push(nd(5, profile, goal, 'menos de 30 runs em algum herói'));
		else {
			const top = (m: Record<string, number>) =>
				Object.entries(m).sort((a, b) => b[1] - a[1])[0] ?? ['-', 0];
			const shares = perHero.map(({ hero, rows: r }) => ({ hero, ...buildShares(r) }));
			const detail = shares
				.map((h) => {
					const w = top(h.weapons);
					const st = top(h.sets);
					return `${h.hero}: arma ${w[0]} ${pct(w[1])}, set ${st[0]} ${pct(st[1])}`;
				})
				.join('; ');
			// Exclusive weapons are only offered to their hero, so "some hero" is enough.
			const rare = Object.keys(WEAPON_LINE_BY_ID)
				.filter((id) => !HERO_IDS.some((h: HeroId) => STARTING_WEAPONS[h][0] === id))
				.map((id) => ({ id, best: Math.max(...shares.map((h) => h.weapons[id] ?? 0)) }))
				.filter((w) => w.best < 0.03);
			out.push(
				result(
					5,
					profile,
					goal,
					rare.length === 0,
					`${detail}; abaixo de 3% em todos os heróis: ${rare.map((w) => `${w.id} ${pct(w.best)}`).join(', ') || 'nenhuma'}`,
				),
			);
		}
	}

	// #6 economy.
	{
		const goal = 'Fish gasto / ganho entre 0,85 e 1,0; reroll ≤ 15% do gasto';
		const profile = 'todas as runs com Fish';
		const rows = events.filter((e) => e.fishEarned !== undefined && e.fishSpent !== undefined);
		const earned = rows.reduce((a, e) => a + (e.fishEarned ?? 0), 0);
		const spent = rows.reduce((a, e) => a + (e.fishSpent ?? 0), 0);
		if (rows.length === 0 || earned === 0) out.push(nd(6, profile, goal, 'sem dados de Fish'));
		else {
			const rerolled = rows.reduce((a, e) => a + (e.fishRerolled ?? 0), 0);
			const ratio = spent / earned;
			const share = spent === 0 ? 0 : rerolled / spent;
			out.push(
				result(
					6,
					profile,
					goal,
					ratio >= 0.85 && ratio <= 1 && share <= 0.15,
					`gasto/ganho ${ratio.toFixed(3)}, reroll ${pct(share)} do gasto`,
				),
			);
		}
	}

	// #7 duration: a player's L1 run = game time + SHOP_SECONDS per shop (the bot reads no screens),
	// the same estimate as the demo time (SDD-006 A5). Real-game bot runs win over the sim.
	{
		const goal = 'run L1 mediana entre 10 e 18 min (tempo de jogo + 45 s por loja)';
		const rows =
			botRuns.length > 0
				? pick(botRuns, { level: 1, danger: 1 })
				: pick(events, { level: 1, danger: 1 });
		const profile = botRuns.length > 0 ? 'L1, D1, bot do jogo real' : 'L1, D1, sim';
		if (rows.length === 0) out.push(nd(7, profile, goal, 'sem runs de L1'));
		else {
			const sorted = rows
				.map((e) => e.durationS + SHOP_SECONDS * Math.max(0, e.round - 1))
				.sort((a, b) => a - b);
			const min = quantile(sorted, 0.5) / 60;
			const game = quantile(
				rows.map((e) => e.durationS).sort((a, b) => a - b),
				0.5,
			);
			out.push(
				result(
					7,
					profile,
					goal,
					min >= 10 && min <= 18,
					`mediana ${min.toFixed(1)} min (tempo de jogo ${(game / 60).toFixed(1)} min, ${rows.length} runs)`,
				),
			);
		}
	}

	{
		const goal =
			'≥ 58 FPS médios e p95 ≤ 18 ms com 300 inimigos e 2.000 decalques (1920×1080, round 40)';
		const profile = 'build real, `bun scripts/perf.ts --round 40`';
		if (perf.length === 0)
			out.push(nd(8, profile, goal, 'sem medição (rodar `bun scripts/perf.ts`)'));
		else {
			const worstFps = Math.min(...perf.map((p) => p.avgFps));
			const worstP95 = Math.max(...perf.map((p) => p.p95FrameMs));
			out.push(
				result(
					8,
					profile,
					goal,
					worstFps >= 58 && worstP95 <= 18,
					`${perf.length} medições: FPS médio mínimo ${worstFps}, p95 máximo ${worstP95} ms`,
				),
			);
		}
	}
	return out;
}

/** Hero × level × Danger table: runs, median, p25/p75 and the share past the campaign (round 50). */
export function summaryRows(events: readonly RunEndEvent[]): string[][] {
	const keys = new Map<string, RunEndEvent[]>();
	for (const e of events) {
		const k = `${e.hero}|${e.level}|${e.danger}`;
		const bucket = keys.get(k);
		if (bucket) bucket.push(e);
		else keys.set(k, [e]);
	}
	const heroOrder = (h: string) => HERO_IDS.indexOf(h as HeroId);
	return [...keys.entries()]
		.map(([k, rows]) => ({ k, rows, parts: k.split('|') as [string, string, string] }))
		.sort(
			(a, b) =>
				heroOrder(a.parts[0]) - heroOrder(b.parts[0]) ||
				Number(a.parts[1]) - Number(b.parts[1]) ||
				Number(a.parts[2]) - Number(b.parts[2]),
		)
		.map(({ rows, parts }) => {
			const sorted = sortedRounds(rows);
			return [
				parts[0],
				parts[1],
				parts[2],
				String(rows.length),
				quantile(sorted, 0.5).toFixed(0),
				quantile(sorted, 0.25).toFixed(0),
				quantile(sorted, 0.75).toFixed(0),
				pct(rows.filter((r) => r.round > GOAL_ROUNDS.campaign).length / rows.length),
			];
		});
}

function table(head: string[], rows: string[][]): string {
	return [
		`| ${head.join(' | ')} |`,
		`|${head.map(() => '---').join('|')}|`,
		...rows.map((r) => `| ${r.join(' | ')} |`),
	].join('\n');
}

export function renderReport(
	events: readonly RunEndEvent[],
	meta: { date: string; sources: string[]; perf?: readonly PerfRun[] },
): string {
	const goals = evaluateGoals(events, meta.perf);
	const { weapons, sets } = buildShares(pick(events, { level: 10, danger: 1 }));
	const share = (m: Record<string, number>) =>
		Object.entries(m)
			.sort((a, b) => b[1] - a[1])
			.map(([id, v]) => [id, pct(v)]);
	return `${[
		`# Balanço automático (${meta.date})`,
		'',
		`Gerado por \`bun scripts/balance-report.ts\` a partir de ${events.length} runs (${meta.sources.join(', ')}). Metas da Parte A4 de [balancing-and-simulation.md](../balancing-and-simulation.md); \`n/d\` = sem dados para decidir, não conta como aprovado.`,
		'',
		'## Metas',
		'',
		table(
			['#', 'Perfil', 'Meta', 'Status', 'Medido'],
			goals.map((g) => [String(g.id), g.profile, g.goal, g.status, g.detail]),
		),
		'',
		'## Round de morte por herói, nível e Danger',
		'',
		table(
			['Herói', 'Nível', 'Danger', 'Runs', 'Mediana', 'p25', 'p75', 'Passa do 50'],
			summaryRows(events),
		),
		'',
		'## Armas nas builds finais (L10, D1, sem a arma inicial)',
		'',
		table(['Arma', 'Builds'], share(weapons)),
		'',
		table(['Set', 'Builds'], share(sets)),
	].join('\n')}\n`;
}
