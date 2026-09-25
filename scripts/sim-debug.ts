/** Per-wave trace of one simulated run: `bun scripts/sim-debug.ts mage random 1`. */
import type { CharacterId } from '../src/data/characters';
import { type BuildStrategy, simulateRun } from '../src/logic/sim/run-sim';

const [c = 'mage', s = 'random', seed = '1'] = process.argv.slice(2);
const r = simulateRun(c as CharacterId, s as BuildStrategy, Number(seed), (t) =>
	console.log(JSON.stringify(t)),
);
console.log('death wave', r.deathWave);
