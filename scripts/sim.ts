// Balance table from the headless model (PLAN 2.6/3.2): death round per hero × level.
// Usage: bun scripts/sim.ts [runs=40] [--rounds]  (--rounds prints damage taken per round)
import { HERO_IDS } from '../src/config/constants';
import { simulateMany, simulateRun } from '../src/logic/sim/run-sim';

const runs = Number(process.argv[2] ?? 40);
const LEVELS = [1, 5, 10, 20, 30];
console.log('hero   lvl  avgRound  median  past30  bossDeaths  avgKills  avgXp');
for (const hero of HERO_IDS) {
	for (const level of LEVELS) {
		const s = simulateMany(hero, level, runs);
		console.log(
			`${hero.padEnd(6)} ${String(level).padStart(3)}  ${s.avgRound.toFixed(1).padStart(8)}  ${String(s.medianRound).padStart(6)}  ${`${Math.round(s.past30 * 100)}%`.padStart(6)}  ${String(s.bossDeaths).padStart(10)}  ${Math.round(s.avgKills).toString().padStart(8)}  ${Math.round(s.avgXp).toString().padStart(5)}`,
		);
	}
}
if (process.argv.includes('--rounds')) {
	for (const hero of HERO_IDS)
		for (const level of LEVELS) {
			const r = simulateRun({ hero, level, seed: 100 });
			console.log(
				`${hero} L${level} →${r.round}: ${r.perRound.map((d) => Math.round(d)).join(' ')}`,
			);
		}
}
