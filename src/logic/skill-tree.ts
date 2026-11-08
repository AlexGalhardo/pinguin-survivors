import type { HeroId } from '../config/constants';
import { buildTree, type HeroTree, TREE } from '../data/skill-tree';
import type { StatKey } from './stats';

const cache = new Map<HeroId, HeroTree>();

/** The (cached) passive tree of a hero. */
export function heroTree(hero: HeroId): HeroTree {
	let tree = cache.get(hero);
	if (!tree) {
		tree = buildTree(hero);
		cache.set(hero, tree);
	}
	return tree;
}

/** Tree points: one per level above 1, minus the nodes already allocated. */
export function treePoints(level: number, allocated: readonly string[]): number {
	return Math.max(0, Math.floor(level) - 1 - allocated.length);
}

/** Ranks of a node in an allocation (each rank is one entry of the id). */
export function rankOf(allocated: readonly string[], id: string): number {
	let n = 0;
	for (const a of allocated) if (a === id) n++;
	return n;
}

/**
 * Keeps only real node ids of this tree, at most `maxRank` entries per node, and only nodes
 * still linked to the start.
 */
export function sanitizeAllocation(tree: HeroTree, allocated: readonly unknown[]): string[] {
	const ranks = new Map<string, number>();
	for (const id of allocated) {
		if (typeof id !== 'string' || id === tree.start) continue;
		const node = tree.nodes[id];
		if (!node) continue;
		ranks.set(id, Math.min(node.maxRank, (ranks.get(id) ?? 0) + 1));
	}
	const linked = reachable(tree, new Set(ranks.keys()));
	return [...linked].flatMap((id) => Array<string>(ranks.get(id) ?? 1).fill(id));
}

/** Allocated nodes connected to the start through allocated nodes. */
function reachable(tree: HeroTree, allocated: ReadonlySet<string>): Set<string> {
	const seen = new Set<string>();
	const queue = [tree.start];
	while (queue.length > 0) {
		const id = queue.shift() as string;
		for (const next of tree.nodes[id]?.links ?? []) {
			if (seen.has(next) || !allocated.has(next)) continue;
			seen.add(next);
			queue.push(next);
		}
	}
	return seen;
}

/**
 * Shortest path of unallocated nodes from the allocated area (or the start) to `target`,
 * target included; empty when the target is already allocated or does not exist.
 */
export function pathTo(tree: HeroTree, allocated: readonly string[], target: string): string[] {
	if (!(target in tree.nodes) || target === tree.start || allocated.includes(target)) return [];
	const owned = new Set([tree.start, ...allocated]);
	const prev = new Map<string, string | null>();
	const queue: string[] = [];
	for (const id of owned) {
		prev.set(id, null);
		queue.push(id);
	}
	while (queue.length > 0) {
		const id = queue.shift() as string;
		if (id === target) break;
		for (const next of tree.nodes[id]?.links ?? []) {
			if (prev.has(next)) continue;
			prev.set(next, id);
			queue.push(next);
		}
	}
	const path: string[] = [];
	for (let id: string | null | undefined = target; id && !owned.has(id); id = prev.get(id))
		path.unshift(id);
	return path;
}

/** Allocates the path to `target` when there are enough points; returns the new allocation or null. */
export function allocate(
	tree: HeroTree,
	level: number,
	allocated: readonly string[],
	target: string,
): string[] | null {
	// An allocated ranked node takes one more rank for one point.
	const rank = rankOf(allocated, target);
	if (rank > 0) {
		const max = tree.nodes[target]?.maxRank ?? 1;
		return rank < max && treePoints(level, allocated) > 0 ? [...allocated, target] : null;
	}
	const path = pathTo(tree, allocated, target);
	if (path.length === 0 || path.length > treePoints(level, allocated)) return null;
	return [...allocated, ...path];
}

/**
 * One rank of a node can be refunded when the node keeps another rank, or when every other
 * allocated node stays linked to the start without it.
 */
export function canRefund(tree: HeroTree, allocated: readonly string[], id: string): boolean {
	const rank = rankOf(allocated, id);
	if (rank === 0) return false;
	if (rank > 1) return true;
	const rest = new Set(allocated.filter((a) => a !== id));
	return reachable(tree, rest).size === rest.size;
}

/** The allocation without one rank of `id` (its last entry). */
export function refundOne(allocated: readonly string[], id: string): string[] {
	const i = allocated.lastIndexOf(id);
	return i < 0 ? [...allocated] : [...allocated.slice(0, i), ...allocated.slice(i + 1)];
}

/** Pearl price to refund one node and to reset the whole tree. */
export function refundCost(): number {
	return TREE.refundCost;
}

export function resetCost(allocated: readonly string[]): number {
	return allocated.length * TREE.resetCostPerNode;
}

/** Sum of the stats of the allocated nodes. */
export function treeStats(
	tree: HeroTree,
	allocated: readonly string[],
): Partial<Record<StatKey, number>> {
	const out: Partial<Record<StatKey, number>> = {};
	for (const id of allocated) {
		for (const [key, value] of Object.entries(tree.nodes[id]?.stats ?? {}) as [
			StatKey,
			number,
		][])
			out[key] = (out[key] ?? 0) + value;
	}
	return out;
}

/**
 * Greedy allocation for the simulation and the bot: spends the points along the hero's preferred
 * branch order, taking the cheapest notable or keystone path each time.
 */
export function autoAllocate(
	tree: HeroTree,
	level: number,
	branchOrder: readonly number[] = [0, 1, 2],
): string[] {
	let allocated: string[] = [];
	for (const branch of branchOrder) {
		const goals = Object.values(tree.nodes)
			.filter((n) => n.branch === branch && (n.kind === 'notable' || n.kind === 'keystone'))
			.map((n) => n.id);
		for (;;) {
			const free = treePoints(level, allocated);
			if (free <= 0) return allocated;
			let best: string[] | null = null;
			for (const goal of goals) {
				const path = pathTo(tree, allocated, goal);
				if (path.length > 0 && path.length <= free && (!best || path.length < best.length))
					best = path;
			}
			if (!best) break;
			allocated = [...allocated, ...best];
		}
	}
	// Spend what is left on neighbors of the allocated area, in branch order.
	for (;;) {
		if (treePoints(level, allocated) <= 0) return allocated;
		const owned = new Set([tree.start, ...allocated]);
		let pick: string | undefined;
		for (const branch of [...branchOrder, -1]) {
			pick = [...owned]
				.flatMap((id) => tree.nodes[id]?.links ?? [])
				.find((id) => !owned.has(id) && tree.nodes[id]?.branch === branch);
			if (pick) break;
		}
		if (!pick) return allocated;
		allocated = [...allocated, pick];
	}
}
