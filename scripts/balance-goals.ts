// Balance goals #1–#6 (docs/balancing-and-simulation.md A4) from the headless sim, in one table.
// Usage: bun scripts/balance-goals.ts [runs=100] [--patch variant.json]
// A patch is a JSON object of `"OBJECT.path": value` overrides applied to the data in memory before
// the sim runs (nothing in src/ changes), so several candidate variants can be compared in parallel.
// Patchable objects: ECONOMY, SHOP, ROUNDS, HEROES, DANGER, EXTRA_WAVES, DROPS, HEAL_POTION, COMBAT.
import { readFileSync } from 'node:fs';
import { HERO_IDS } from '../src/config/constants';
import { COMBAT } from '../src/data/combat';
import { DANGER, type Danger, EXTRA_WAVES } from '../src/data/difficulty';
import { ECONOMY, SHOP } from '../src/data/economy';
import { DROPS } from '../src/data/equipment';
import { HEROES } from '../src/data/heroes';
import { HEAL_POTION } from '../src/data/potions';
import { ROUNDS } from '../src/data/rounds';
import { STARTING_WEAPONS } from '../src/data/unlocks';
import { simulateRun } from '../src/logic/sim/run-sim';

const TARGETS: Record<string, unknown> = {
	ECONOMY,
	SHOP,
	ROUNDS,
	HEROES,
	DANGER,
	EXTRA_WAVES,
	DROPS,
	HEAL_POTION,
	COMBAT,
};

/** Sets `value` at a dotted path (`HEROES.lucia.hp`, `SHOP.weaponPrices`); throws on a bad path. */
function applyPatch(path: string, value: unknown): void {
	const [root, ...keys] = path.split('.');
	let obj = TARGETS[root as string] as Record<string, unknown> | undefined;
	if (!obj || keys.length === 0) throw new Error(`patch: unknown object in "${path}"`);
	for (const k of keys.slice(0, -1)) {
		obj = obj[k] as Record<string, unknown> | undefined;
		if (!obj) throw new Error(`patch: bad path "${path}"`);
	}
	const last = keys[keys.length - 1] as string;
	if (!(last in obj)) throw new Error(`patch: "${path}" does not exist`);
	obj[last] = value;
}

const args = process.argv.slice(2);
const runs = Number(args.find((a) => /^\d+$/.test(a))) || 100;
const patchFile = args.includes('--patch') ? args[args.indexOf('--patch') + 1] : undefined;
if (patchFile) {
	const patch = JSON.parse(readFileSync(patchFile, 'utf8')) as Record<string, unknown>;
	for (const [path, value] of Object.entries(patch)) applyPatch(path, value);
	console.log(`patch ${patchFile}: ${Object.keys(patch).join(', ')}`);
}

const rounds = (hero: (typeof HERO_IDS)[number], level: number, danger: Danger): number[] =>
	Array.from(
		{ length: runs },
		(_, i) => simulateRun({ hero, level, seed: 100 + i, danger }).round,
	).sort((a, b) => a - b);
const median = (rs: number[]): number => rs[Math.floor(rs.length / 2)] ?? 0;
const share = (rs: number[], f: (r: number) => boolean): number =>
	Math.round((100 * rs.filter(f).length) / rs.length);
const mark = (ok: boolean): string => (ok ? 'ok ' : 'BAD');

console.log(`runs per profile: ${runs} (seeds 100..${99 + runs})`);
for (const hero of HERO_IDS) {
	const l1 = rounds(hero, 1, 1);
	const l10 = rounds(hero, 10, 1);
	const l20 = rounds(hero, 20, 1);
	const d0 = median(rounds(hero, 10, 0));
	const d5 = median(rounds(hero, 10, 5));
	const g1 = median(l1) >= 8 && median(l1) <= 20 && (l1[l1.length - 1] ?? 0) <= 30;
	const early = share(l10, (r) => r < 12);
	const past20 = share(l10, (r) => r > 20);
	const g2 = early <= 5 && past20 > 0;
	const g3 = median(l20) > 30 && share(l20, (r) => r > 60) === 0;
	const g4 = d0 >= median(l10) + 5 && d5 <= 15;
	console.log(
		`${hero.padEnd(6)} #1 ${mark(g1)} L1 median ${median(l1)} max ${l1[l1.length - 1]} | #2 ${mark(g2)} L10 median ${median(l10)} die<12 ${early}% past20 ${past20}% | #3 ${mark(g3)} L20 median ${median(l20)} past60 ${share(l20, (r) => r > 60)}% | #4 ${mark(g4)} D0 ${d0} D1 ${median(l10)} D5 ${d5}`,
	);
}

let earned = 0;
let spent = 0;
let rerolled = 0;
const weapons: Record<string, number> = {};
let total = 0;
for (const hero of HERO_IDS)
	for (let i = 0; i < runs; i++) {
		const r = simulateRun({ hero, level: 10, seed: 100 + i, danger: 1 });
		earned += r.fish;
		spent += r.fishSpent;
		rerolled += r.fishRerolled;
		total++;
		const ids = new Set(r.weapons.map((w) => w.split(':')[0] as string));
		ids.delete(STARTING_WEAPONS[hero][0]);
		for (const id of ids) weapons[id] = (weapons[id] ?? 0) + 1;
	}
const ratio = spent / earned;
const reroll = (100 * rerolled) / spent;
const rare = Object.entries(weapons).filter(([, c]) => (100 * c) / total < 3);
console.log(
	`#5 ${mark(rare.length === 0)} weapons under 3%: ${rare.map(([id]) => id).join(', ') || 'none'}`,
);
console.log(
	`#6 ${mark(ratio >= 0.85 && ratio <= 1 && reroll <= 15)} spent/earned ${ratio.toFixed(3)} reroll/spent ${reroll.toFixed(1)}%`,
);
