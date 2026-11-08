// Balance table from the headless model (PLAN 2.6/3.2): death round per hero × level.
// Usage: bun scripts/sim.ts [runs=40] [--rounds] [--report [runs]] [--danger 0-5] [--jsonl file [runs]]  (--rounds prints damage taken per round)
import { HERO_IDS } from '../src/config/constants';
import { DANGER_LEVELS, type Danger } from '../src/data/difficulty';
import { STARTING_WEAPONS } from '../src/data/unlocks';
import { WEAPON_LINE_BY_ID, type WeaponId } from '../src/data/weapons';
import { simulateMany, simulateRun } from '../src/logic/sim/run-sim';

const runs = Number(process.argv[2]) || 40;
const dangerArg = Number(process.argv[process.argv.indexOf('--danger') + 1]);
const danger = (
	process.argv.includes('--danger') ? Math.min(5, Math.max(0, dangerArg || 0)) : 1
) as Danger;
const LEVELS = [1, 5, 10, 20, 30];
console.log('hero   lvl  avgRound  median  past30  bossDeaths  avgKills  avgXp  pearls  fishSpent');
for (const hero of HERO_IDS) {
	for (const level of LEVELS) {
		const s = simulateMany(hero, level, runs, 1, danger);
		console.log(
			`${hero.padEnd(6)} ${String(level).padStart(3)}  ${s.avgRound.toFixed(1).padStart(8)}  ${String(s.medianRound).padStart(6)}  ${`${Math.round(s.past30 * 100)}%`.padStart(6)}  ${String(s.bossDeaths).padStart(10)}  ${Math.round(s.avgKills).toString().padStart(8)}  ${Math.round(s.avgXp).toString().padStart(5)}  ${Math.round(s.avgPearls).toString().padStart(6)}  ${Math.round(s.avgFishSpent).toString().padStart(9)}`,
		);
	}
}
if (process.argv.includes('--rounds')) {
	for (const hero of HERO_IDS)
		for (const level of LEVELS) {
			const r = simulateRun({ hero, level, seed: 100, danger });
			console.log(
				`${hero} L${level} →${r.round}: ${r.perRound.map((d) => Math.round(d)).join(' ')}`,
			);
		}
}

// --report [runs=100]: balance goals #1, #5, #6 (docs/balancing-and-simulation.md A4).
// #1 is measured at L1; #5/#6 over all heroes at L10 (builds have time to fill the bar).
if (process.argv.includes('--report')) {
	const n = Number(process.argv[process.argv.indexOf('--report') + 1]) || 100;
	console.log('\n#1  L1 death round (median / max / share past 30)');
	for (const hero of HERO_IDS) {
		const rs = Array.from({ length: n }, (_, i) =>
			simulateRun({ hero, level: 1, seed: 100 + i, danger }),
		).map((r) => r.round);
		rs.sort((a, b) => a - b);
		console.log(
			`${hero.padEnd(6)} median ${rs[Math.floor(n / 2)]}  max ${rs[n - 1]}  past30 ${Math.round((100 * rs.filter((r) => r > 30).length) / n)}%`,
		);
	}
	const weapons: Record<string, number> = {};
	const sets: Record<string, number> = {};
	let earned = 0;
	let spent = 0;
	let rerolled = 0;
	let total = 0;
	for (const hero of HERO_IDS)
		for (let i = 0; i < n; i++) {
			const r = simulateRun({ hero, level: 10, seed: 100 + i, danger });
			total++;
			earned += r.fish;
			spent += r.fishSpent;
			rerolled += r.fishRerolled;
			// The starting weapon is the player's pick among three, not a shop outcome: not counted.
			const ids = new Set(r.weapons.map((w) => w.split(':')[0] as string));
			ids.delete(STARTING_WEAPONS[hero][0]);
			const buildSets = new Set<string>();
			for (const id of ids) {
				weapons[id] = (weapons[id] ?? 0) + 1;
				for (const set of WEAPON_LINE_BY_ID[id as WeaponId].sets) buildSets.add(set);
			}
			for (const set of buildSets) sets[set] = (sets[set] ?? 0) + 1;
		}
	console.log('\n#5  share of final builds, shop weapons only (all heroes, L10)');
	for (const [id, c] of Object.entries(weapons).sort((a, b) => b[1] - a[1]))
		console.log(`weapon ${id.padEnd(14)} ${((100 * c) / total).toFixed(1)}%`);
	for (const [id, c] of Object.entries(sets).sort((a, b) => b[1] - a[1]))
		console.log(`set    ${id.padEnd(14)} ${((100 * c) / total).toFixed(1)}%`);
	console.log(
		`\n#6  spent/earned ${(spent / earned).toFixed(3)}  reroll/spent ${((100 * rerolled) / spent).toFixed(1)}%`,
	);
}

// --jsonl file [runs=30]: run-end events for scripts/balance-report.ts over hero × level × Danger.
// The tree is auto-allocated per level (simTree), as the bot does (ADR-019).
if (process.argv.includes('--jsonl')) {
	const file = process.argv[process.argv.indexOf('--jsonl') + 1] as string;
	const n = Number(process.argv[process.argv.indexOf('--jsonl') + 2]) || 30;
	const lines: string[] = [];
	for (const hero of HERO_IDS)
		for (const level of [1, 10, 20])
			for (const d of DANGER_LEVELS) {
				for (let i = 0; i < n; i++) {
					const r = simulateRun({ hero, level, seed: 100 + i, danger: d });
					lines.push(
						JSON.stringify({
							version: 'sim',
							hero,
							danger: d,
							level,
							round: r.round,
							weapons: r.weapons,
							cause: r.diedToBoss ? 'bossTimeout' : 'death',
							durationS: Math.round(r.seconds),
							platform: 'web',
							source: 'sim',
							fishEarned: r.fish,
							fishSpent: r.fishSpent,
							fishRerolled: r.fishRerolled,
						}),
					);
				}
			}
	await Bun.write(file, `${lines.join('\n')}\n`);
	console.log(`${file}: ${lines.length} runs`);
}
