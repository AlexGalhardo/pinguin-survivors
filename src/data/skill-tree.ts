import type { HeroId } from '../config/constants';
import type { StatKey } from '../logic/stats';

/**
 * Passive skill tree per hero (ADR-019, inspired by Path of Exile 2; research in
 * docs/research/poe2-passive-tree.md). It replaces the Workshop and the old stat points:
 * every hero level above 1 gives one tree point.
 *
 * Each hero has a start node and three themed branches (120° apart). A branch is a spine of
 * small nodes with four notable clusters and a keystone at the tip; travel rings join the
 * branches so hybrid builds are possible. The layout is generated, the numbers live here.
 */

/** Branch order the simulation and the playtest bot spend points in (survival first for the fragile heroes). */
export const SIM_BRANCH_ORDER: Record<HeroId, readonly number[]> = {
	jack: [1, 0, 2],
	bob: [0, 2, 1],
	lucia: [1, 0, 2],
};

export type NodeKind = 'start' | 'small' | 'notable' | 'keystone' | 'travel';

export interface TreeNode {
	id: string;
	kind: NodeKind;
	/** Branch index 0-2 (travel and start nodes: -1). */
	branch: number;
	/** Name key for notables and keystones (`tree.n.<name>`); small nodes are described by their stats. */
	name?: string;
	x: number;
	y: number;
	stats: Partial<Record<StatKey, number>>;
	links: string[];
}

export interface HeroTree {
	hero: HeroId;
	start: string;
	nodes: Readonly<Record<string, TreeNode>>;
	/** Branch theme keys (`tree.b.<theme>`), in branch order. */
	branches: readonly string[];
}

/** Value of one old stat point, the unit the tree is tuned in (balancing §8d). */
const UNIT: Partial<Record<StatKey, number>> = {
	maxHp: 5,
	armor: 1,
	regen: 0.1,
	attackSpeed: 0.01,
	crit: 0.005,
	critDamage: 0.03,
	dodge: 0.005,
	parry: 0.005,
	damage: 0.01,
	'tagMul.melee': 0.015,
	'tagMul.firearm': 0.015,
	'tagMul.magic': 0.015,
	'resist.fire': 0.01,
	'resist.ice': 0.01,
	'resist.earth': 0.01,
	'resist.energy': 0.01,
	moveSpeed: 1.5,
	pickupRange: 4,
	xpGain: 0.02,
	luck: 0.01,
	area: 0.015,
	bleedChance: 0.01,
	burnChance: 0.01,
	chillChance: 0.01,
	shockChance: 0.01,
	harvesting: 0.02,
	cardRerolls: 1,
};

export const TREE = {
	/** A small node is worth this many old stat points (the tree also absorbs the Workshop). */
	smallUnits: 1.5,
	/** Spine length per branch; the keystone sits on the last node. */
	spine: 12,
	/** Spine indices with a side cluster (3 small nodes + 1 notable), alternating sides. */
	clusters: [3, 5, 8, 10],
	clusterSize: 3,
	/** Spine indices joined to the next branch by a travel ring, and how many travel nodes each ring has. */
	rings: [
		{ at: 4, nodes: 3 },
		{ at: 9, nodes: 5 },
	],
	/** Layout spacing in tree units. */
	step: 70,
	clusterStep: 52,
	/** Pearls to refund one node (it must not cut other nodes off) and per node on a full reset. */
	refundCost: 2,
	resetCostPerNode: 1,
	/** Stats travel nodes cycle through. */
	travel: ['maxHp', 'regen', 'armor', 'attackSpeed'] as readonly StatKey[],
} as const;

interface Notable {
	name: string;
	/** Stat → units of `UNIT` (or the raw value for `cardRerolls`). */
	units: Partial<Record<StatKey, number>>;
}

interface BranchDef {
	theme: string;
	small: readonly StatKey[];
	notables: readonly [Notable, Notable, Notable, Notable];
	/** Keystone: raw values (a strong bonus with a real drawback). */
	keystone: { name: string; stats: Partial<Record<StatKey, number>> };
}

const HUNTER_NOTABLES = {
	scavenger: { name: 'scavenger', units: { harvesting: 5, luck: 2 } },
	scholar: { name: 'scholar', units: { xpGain: 5 } },
	fleetFoot: { name: 'fleetFoot', units: { moveSpeed: 4, dodge: 3 } },
	insight: { name: 'insight', units: { cardRerolls: 1 } },
} as const satisfies Record<string, Notable>;

export const TREE_BRANCHES: Record<HeroId, readonly [BranchDef, BranchDef, BranchDef]> = {
	jack: [
		{
			theme: 'blade',
			small: ['tagMul.melee', 'crit', 'critDamage', 'attackSpeed'],
			notables: [
				{ name: 'keenEdge', units: { crit: 3, critDamage: 3 } },
				{ name: 'butcher', units: { 'tagMul.melee': 4, bleedChance: 3 } },
				{ name: 'whirlwind', units: { attackSpeed: 4, area: 3 } },
				{ name: 'executioner', units: { critDamage: 5, damage: 3 } },
			],
			keystone: {
				name: 'bloodFrenzy',
				stats: { 'tagMul.melee': 0.35, bleedChance: 0.1, maxHp: -40 },
			},
		},
		{
			theme: 'bulwark',
			small: ['maxHp', 'armor', 'parry', 'regen'],
			notables: [
				{ name: 'ironHide', units: { armor: 5, maxHp: 3 } },
				{ name: 'riposte', units: { parry: 5, critDamage: 2 } },
				{ name: 'secondWind', units: { regen: 5, maxHp: 3 } },
				{
					name: 'warded',
					units: {
						'resist.fire': 3,
						'resist.ice': 3,
						'resist.earth': 3,
						'resist.energy': 3,
					},
				},
			],
			keystone: { name: 'fortress', stats: { armor: 12, parry: 0.08, moveSpeed: -12 } },
		},
		{
			theme: 'hunter',
			small: ['moveSpeed', 'pickupRange', 'xpGain', 'luck'],
			notables: [
				HUNTER_NOTABLES.scavenger,
				HUNTER_NOTABLES.scholar,
				HUNTER_NOTABLES.fleetFoot,
				HUNTER_NOTABLES.insight,
			],
			keystone: {
				name: 'fortuneSeeker',
				stats: { luck: 0.15, harvesting: 0.2, damage: -0.1 },
			},
		},
	],
	bob: [
		{
			theme: 'gunner',
			small: ['tagMul.firearm', 'crit', 'critDamage', 'attackSpeed'],
			notables: [
				{ name: 'deadeye', units: { crit: 4, critDamage: 3 } },
				{ name: 'rapidFire', units: { attackSpeed: 5 } },
				{ name: 'hollowPoint', units: { 'tagMul.firearm': 5, bleedChance: 2 } },
				{ name: 'marksman', units: { critDamage: 5, damage: 2 } },
			],
			keystone: { name: 'triggerHappy', stats: { attackSpeed: 0.3, crit: -0.05 } },
		},
		{
			theme: 'demolition',
			small: ['area', 'damage', 'burnChance', 'resist.fire'],
			notables: [
				{ name: 'bigBoom', units: { area: 5 } },
				{ name: 'napalm', units: { burnChance: 5, 'resist.fire': 2 } },
				{ name: 'shrapnel', units: { damage: 4, bleedChance: 2 } },
				{ name: 'blastProof', units: { armor: 3, maxHp: 3 } },
			],
			keystone: {
				name: 'scorchedEarth',
				stats: { area: 0.3, burnChance: 0.1, moveSpeed: -10 },
			},
		},
		{
			theme: 'agility',
			small: ['moveSpeed', 'dodge', 'pickupRange', 'xpGain'],
			notables: [
				{ name: 'evasion', units: { dodge: 5 } },
				HUNTER_NOTABLES.scholar,
				HUNTER_NOTABLES.scavenger,
				HUNTER_NOTABLES.insight,
			],
			keystone: { name: 'ghost', stats: { dodge: 0.1, moveSpeed: 10, maxHp: -30 } },
		},
	],
	lucia: [
		{
			theme: 'fire',
			small: ['tagMul.magic', 'burnChance', 'damage', 'resist.fire'],
			notables: [
				{ name: 'pyromancy', units: { burnChance: 5, damage: 2 } },
				{ name: 'ignite', units: { 'tagMul.magic': 5 } },
				{ name: 'emberSkin', units: { 'resist.fire': 4, regen: 3 } },
				{ name: 'combustion', units: { area: 3, damage: 3 } },
			],
			keystone: { name: 'inferno', stats: { 'tagMul.magic': 0.35, maxHp: -20 } },
		},
		{
			theme: 'ice',
			small: ['area', 'chillChance', 'maxHp', 'armor'],
			notables: [
				{ name: 'frostbite', units: { chillChance: 5 } },
				{ name: 'glacier', units: { armor: 4, maxHp: 3 } },
				{ name: 'blizzard', units: { area: 5 } },
				{ name: 'coldBlood', units: { 'resist.ice': 4, regen: 2 } },
			],
			keystone: {
				name: 'permafrost',
				stats: { chillChance: 0.15, area: 0.2, attackSpeed: -0.15 },
			},
		},
		{
			theme: 'storm',
			small: ['attackSpeed', 'shockChance', 'crit', 'moveSpeed'],
			notables: [
				{ name: 'conductor', units: { shockChance: 5 } },
				{ name: 'overcharge', units: { attackSpeed: 5 } },
				{ name: 'staticField', units: { crit: 4, critDamage: 2 } },
				HUNTER_NOTABLES.insight,
			],
			keystone: { name: 'stormcaller', stats: { shockChance: 0.12, crit: 0.05, armor: -6 } },
		},
	],
};

function scaled(
	units: Partial<Record<StatKey, number>>,
	mul: number,
): Partial<Record<StatKey, number>> {
	const out: Partial<Record<StatKey, number>> = {};
	for (const [key, n] of Object.entries(units) as [StatKey, number][]) {
		// Card rerolls are whole: a notable gives exactly `n` of them.
		out[key] = key === 'cardRerolls' ? n : round4((UNIT[key] ?? 0) * n * mul);
	}
	return out;
}

function round4(v: number): number {
	return Math.round(v * 10000) / 10000;
}

/** Builds the tree of one hero (pure and deterministic; cached by `heroTree`). */
export function buildTree(hero: HeroId): HeroTree {
	const nodes: Record<string, TreeNode> = {};
	const add = (n: Omit<TreeNode, 'links'>): TreeNode => {
		const node = { ...n, links: [] };
		nodes[n.id] = node;
		return node;
	};
	const link = (a: TreeNode, b: TreeNode): void => {
		a.links.push(b.id);
		b.links.push(a.id);
	};
	const start = add({ id: `${hero}.start`, kind: 'start', branch: -1, x: 0, y: 0, stats: {} });
	const defs = TREE_BRANCHES[hero];
	const spines: TreeNode[][] = [];
	defs.forEach((def, b) => {
		const angle = -Math.PI / 2 + (b * 2 * Math.PI) / 3;
		const dx = Math.cos(angle);
		const dy = Math.sin(angle);
		const spine: TreeNode[] = [start];
		let smallIndex = 0;
		const nextSmall = (): Partial<Record<StatKey, number>> => {
			const stat = def.small[smallIndex++ % def.small.length] as StatKey;
			return scaled({ [stat]: 1 }, TREE.smallUnits);
		};
		for (let i = 1; i <= TREE.spine; i++) {
			const r = i * TREE.step;
			const isKey = i === TREE.spine;
			const node = add({
				id: isKey ? `${hero}.${def.theme}.key` : `${hero}.${def.theme}.s${i}`,
				kind: isKey ? 'keystone' : 'small',
				branch: b,
				name: isKey ? def.keystone.name : undefined,
				x: round4(dx * r),
				y: round4(dy * r),
				stats: isKey ? { ...def.keystone.stats } : nextSmall(),
			});
			link(spine[i - 1] as TreeNode, node);
			spine.push(node);
		}
		TREE.clusters.forEach((at, c) => {
			const side = c % 2 === 0 ? 1 : -1;
			// Perpendicular to the spine, leaning slightly outward so clusters fan out.
			const px = -dy * side;
			const py = dx * side;
			let prev = spine[at] as TreeNode;
			for (let k = 1; k <= TREE.clusterSize + 1; k++) {
				const isNotable = k === TREE.clusterSize + 1;
				const notable = def.notables[c] as Notable;
				const off = k * TREE.clusterStep;
				const node = add({
					id: isNotable
						? `${hero}.${def.theme}.n${c}`
						: `${hero}.${def.theme}.c${c}.${k}`,
					kind: isNotable ? 'notable' : 'small',
					branch: b,
					name: isNotable ? notable.name : undefined,
					x: round4(prev.x + px * TREE.clusterStep + dx * off * 0.25),
					y: round4(prev.y + py * TREE.clusterStep + dy * off * 0.25),
					stats: isNotable ? scaled(notable.units, 1) : nextSmall(),
				});
				link(prev, node);
				prev = node;
			}
		});
		spines.push(spine);
	});
	// Travel rings: arcs between neighbor branches at the same spine radius.
	let travelIndex = 0;
	for (const ring of TREE.rings) {
		for (let b = 0; b < 3; b++) {
			const from = (spines[b] as TreeNode[])[ring.at] as TreeNode;
			const to = (spines[(b + 1) % 3] as TreeNode[])[ring.at] as TreeNode;
			const r = ring.at * TREE.step;
			const a0 = Math.atan2(from.y, from.x);
			let a1 = Math.atan2(to.y, to.x);
			if (a1 < a0) a1 += Math.PI * 2;
			let prev = from;
			for (let k = 1; k <= ring.nodes; k++) {
				const a = a0 + ((a1 - a0) * k) / (ring.nodes + 1);
				const stat = TREE.travel[travelIndex++ % TREE.travel.length] as StatKey;
				const node = add({
					id: `${hero}.ring${ring.at}.${b}.${k}`,
					kind: 'travel',
					branch: -1,
					x: round4(Math.cos(a) * r),
					y: round4(Math.sin(a) * r),
					stats: scaled({ [stat]: 1 }, TREE.smallUnits),
				});
				link(prev, node);
				prev = node;
			}
			link(prev, to);
		}
	}
	return { hero, start: start.id, nodes, branches: defs.map((d) => d.theme) };
}
