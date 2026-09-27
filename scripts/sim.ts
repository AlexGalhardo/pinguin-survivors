// Balance table from the headless model (PLAN 3.2): average death round per hero × level.
// Usage: bun scripts/sim.ts [runs=40]
import { HERO_IDS } from '../src/config/constants';
import { simulateMany } from '../src/logic/sim/run-sim';

const runs = Number(process.argv[2] ?? 40);
console.log('hero   lvl  avgRound  median  bossDeaths  avgKills  avgXp');
for (const hero of HERO_IDS) {
	for (const level of [1, 5, 10, 30]) {
		const s = simulateMany(hero, level, runs);
		console.log(
			`${hero.padEnd(6)} ${String(level).padStart(3)}  ${s.avgRound.toFixed(1).padStart(8)}  ${String(s.medianRound).padStart(6)}  ${String(s.bossDeaths).padStart(10)}  ${Math.round(s.avgKills).toString().padStart(8)}  ${Math.round(s.avgXp).toString().padStart(5)}`,
		);
	}
}
