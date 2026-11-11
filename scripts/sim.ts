// Balance table from the headless model (PLAN 2.6/3.2): death round per hero × level.
// Usage: bun scripts/sim.ts [runs=40] [--rounds] [--report [runs]] [--difficulty 0-2] [--speed 1|1.5|2] [--jsonl file [runs]]  (--rounds prints damage taken per round)
//        bun scripts/sim.ts [runs=40] --class <id>   one hero class against its base class (SDD-024 RF-07)
//        bun scripts/sim.ts [runs=40] --classes      every class against its base class, as a Markdown table
import { GAME_SPEEDS, type GameSpeed, HERO_IDS } from '../src/config/constants';
import { HERO_CLASSES } from '../src/data/classes';
import { DIFFICULTY_LEVELS, type Difficulty } from '../src/data/difficulty';
import { STARTING_WEAPONS } from '../src/data/unlocks';
import { WEAPON_LINE_BY_ID, type WeaponId } from '../src/data/weapons';
import { simulateMany, simulateRun } from '../src/logic/sim/run-sim';

const runs = Number(process.argv[2]) || 40;
const difficultyArg = Number(process.argv[process.argv.indexOf('--difficulty') + 1]);
const difficulty = (
	process.argv.includes('--difficulty') ? Math.min(2, Math.max(0, difficultyArg || 0)) : 1
) as Difficulty;
const speedArg = Number(process.argv[process.argv.indexOf('--speed') + 1]);
const speed = (
	process.argv.includes('--speed') && GAME_SPEEDS.some((v) => v === speedArg) ? speedArg : 1
) as GameSpeed;
const LEVELS = [1, 5, 10, 20, 30];

/** Death round of a class at the level that unlocks it and at 30, next to the base class of the hero. */
function classRows(def: (typeof HERO_CLASSES)[number]): string[] {
	const base = HERO_CLASSES.find((c) => c.hero === def.hero) as (typeof HERO_CLASSES)[number];
	return [def.unlockLevel, 30]
		.filter((level, i, all) => all.indexOf(level) === i)
		.map((level) => {
			const own = simulateMany(def.hero, level, runs, 1, difficulty, speed, def.id);
			const ref = simulateMany(def.hero, level, runs, 1, difficulty, speed, base.id);
			// Deaths pile up on boss rounds, so the median barely moves: the mean is what tells classes apart.
			const ratio = own.avgRound / ref.avgRound;
			const verdict = ratio > 1.5 || ratio < 0.67 ? 'fora' : 'ok';
			return `| ${def.id} | ${level} | ${own.avgRound.toFixed(1)} | ${ref.avgRound.toFixed(1)} | ${ratio.toFixed(2)} | ${own.medianRound} / ${ref.medianRound} | ${verdict} |`;
		});
}
const classArg = process.argv[process.argv.indexOf('--class') + 1];
if (process.argv.includes('--class') || process.argv.includes('--classes')) {
	const picked = process.argv.includes('--classes')
		? HERO_CLASSES.filter((c) => c.unlockLevel > 1)
		: HERO_CLASSES.filter((c) => c.id === classArg);
	if (picked.length === 0) throw new Error(`unknown class ${classArg}`);
	console.log(
		'| Classe | Nível | Round médio | Base | Razão | Mediana (classe / base) | Meta 0,67–1,5 |',
	);
	console.log('|---|---|---|---|---|---|---|');
	for (const def of picked) for (const row of classRows(def)) console.log(row);
	process.exit(0);
}
console.log(
	'hero   lvl  avgRound  median  past50  bossHit  bossTime  avgKills  avgXp  pearls  fishSpent',
);
for (const hero of HERO_IDS) {
	for (const level of LEVELS) {
		const s = simulateMany(hero, level, runs, 1, difficulty, speed);
		console.log(
			`${hero.padEnd(6)} ${String(level).padStart(3)}  ${s.avgRound.toFixed(1).padStart(8)}  ${String(s.medianRound).padStart(6)}  ${`${Math.round(s.past50 * 100)}%`.padStart(6)}  ${String(s.bossDeaths).padStart(7)}  ${String(s.bossTimeouts).padStart(8)}  ${Math.round(s.avgKills).toString().padStart(8)}  ${Math.round(s.avgXp).toString().padStart(5)}  ${Math.round(s.avgPearls).toString().padStart(6)}  ${Math.round(s.avgFishSpent).toString().padStart(9)}`,
		);
	}
}
if (process.argv.includes('--rounds')) {
	for (const hero of HERO_IDS)
		for (const level of LEVELS) {
			const r = simulateRun({ hero, level, seed: 100, difficulty, speed });
			console.log(
				`${hero} L${level} →${r.round}: ${r.perRound.map((d) => Math.round(d)).join(' ')}`,
			);
		}
}

// --report [runs=100]: balance goals #1, #5, #6 (docs/balancing-and-simulation.md A4).
// #1 is measured at L1; #5/#6 over all heroes at L10 (builds have time to fill the bar).
if (process.argv.includes('--report')) {
	const n = Number(process.argv[process.argv.indexOf('--report') + 1]) || 100;
	console.log('\n#1  L1 death round (median / max / share past 50)');
	for (const hero of HERO_IDS) {
		const rs = Array.from({ length: n }, (_, i) =>
			simulateRun({ hero, level: 1, seed: 100 + i, difficulty, speed }),
		).map((r) => r.round);
		rs.sort((a, b) => a - b);
		console.log(
			`${hero.padEnd(6)} median ${rs[Math.floor(n / 2)]}  max ${rs[n - 1]}  past50 ${Math.round((100 * rs.filter((r) => r > 50).length) / n)}%`,
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
			const r = simulateRun({ hero, level: 10, seed: 100 + i, difficulty, speed });
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

// --jsonl file [runs=30]: run-end events for scripts/balance-report.ts over hero × level × Difficulty.
// The tree is auto-allocated per level (simTree), as the bot does (ADR-019).
if (process.argv.includes('--jsonl')) {
	const file = process.argv[process.argv.indexOf('--jsonl') + 1] as string;
	const n = Number(process.argv[process.argv.indexOf('--jsonl') + 2]) || 30;
	const lines: string[] = [];
	for (const hero of HERO_IDS)
		for (const level of [1, 10, 20])
			for (const d of DIFFICULTY_LEVELS) {
				for (let i = 0; i < n; i++) {
					const r = simulateRun({ hero, level, seed: 100 + i, difficulty: d, speed });
					lines.push(
						JSON.stringify({
							version: 'sim',
							hero,
							difficulty: d,
							level,
							round: r.round,
							weapons: r.weapons,
							cause: r.cause === 'bossTimeout' ? 'bossTimeout' : 'death',
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
