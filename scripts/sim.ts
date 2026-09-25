/**
 * Headless balance report: `bun scripts/sim.ts [runs]`.
 * Compares the simulated death waves with the targets of docs/balancing.md §10.
 */
import { CHARACTER_IDS } from '../src/data/characters';
import { simulateMany } from '../src/logic/sim/run-sim';

const runs = Number(process.argv[2] ?? 200);
console.log(`Starfall Survivors - balance sim (${runs} runs per row)`);
console.log('class     build    median  min  max');
for (const c of CHARACTER_IDS) {
	for (const strategy of ['random', 'good'] as const) {
		const s = simulateMany(c, strategy, runs);
		console.log(
			`${c.padEnd(9)} ${strategy.padEnd(8)} ${String(s.median).padStart(6)} ${String(s.min).padStart(4)} ${String(s.max).padStart(4)}`,
		);
	}
}
console.log(
	'Targets (§10): random build dies at waves 12-18; good build reaches 25+; none passes 60.',
);
