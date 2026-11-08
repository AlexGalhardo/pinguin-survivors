import { describe, expect, test } from 'bun:test';
import { HERO_IDS } from '../src/config/constants';
import {
	allocate,
	autoAllocate,
	canRefund,
	heroTree,
	pathTo,
	rankOf,
	refundOne,
	sanitizeAllocation,
	treePoints,
	treeStats,
} from '../src/logic/skill-tree';

describe('skill tree data', () => {
	for (const hero of HERO_IDS) {
		test(`${hero}: three branches with 4 notables and a keystone, all nodes linked`, () => {
			const tree = heroTree(hero);
			const nodes = Object.values(tree.nodes);
			expect(nodes.length).toBeGreaterThanOrEqual(100);
			for (let b = 0; b < 3; b++) {
				expect(nodes.filter((n) => n.branch === b && n.kind === 'notable')).toHaveLength(4);
				expect(nodes.filter((n) => n.branch === b && n.kind === 'keystone')).toHaveLength(
					1,
				);
			}
			// Every node is reachable from the start.
			for (const n of nodes) {
				if (n.id === tree.start) continue;
				expect(pathTo(tree, [], n.id).length).toBeGreaterThan(0);
			}
			// Links are symmetric.
			for (const n of nodes)
				for (const l of n.links) expect(tree.nodes[l]?.links).toContain(n.id);
		});

		test(`${hero}: nodes never overlap on screen`, () => {
			const nodes = Object.values(heroTree(hero).nodes);
			for (let i = 0; i < nodes.length; i++)
				for (let j = i + 1; j < nodes.length; j++) {
					const a = nodes[i];
					const b = nodes[j];
					if (!a || !b) continue;
					expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(28);
				}
		});
	}
});

describe('skill tree allocation', () => {
	const tree = heroTree('jack');
	const notable = Object.values(tree.nodes).find((n) => n.kind === 'notable' && n.branch === 0);

	test('one point per level above 1', () => {
		expect(treePoints(1, [])).toBe(0);
		expect(treePoints(10, ['a', 'b'])).toBe(7);
	});

	test('allocating a far node takes the whole shortest path, if the points allow', () => {
		if (!notable) throw new Error('no notable');
		const path = pathTo(tree, [], notable.id);
		expect(path.at(-1)).toBe(notable.id);
		expect(allocate(tree, path.length, [], notable.id)).toBeNull();
		const after = allocate(tree, path.length + 1, [], notable.id);
		expect(after).toEqual(path);
		expect(pathTo(tree, after ?? [], notable.id)).toEqual([]);
	});

	test('only nodes that do not cut others off can be refunded', () => {
		if (!notable) throw new Error('no notable');
		const path = pathTo(tree, [], notable.id);
		expect(canRefund(tree, path, notable.id)).toBe(true);
		expect(canRefund(tree, path, path[0] as string)).toBe(false);
	});

	test('sanitize drops unknown, over-ranked and disconnected nodes', () => {
		if (!notable) throw new Error('no notable');
		const path = pathTo(tree, [], notable.id);
		// A single-rank node repeated keeps one entry.
		const single = path.find((id) => tree.nodes[id]?.maxRank === 1) as string;
		expect(sanitizeAllocation(tree, [...path, single, 'bogus', 3]).sort()).toEqual(
			[...path].sort(),
		);
		expect(sanitizeAllocation(tree, [notable.id])).toEqual([]);
	});

	test('stats add up over the allocated nodes', () => {
		const key = Object.values(tree.nodes).find((n) => n.kind === 'keystone' && n.branch === 0);
		if (!key) throw new Error('no keystone');
		const path = pathTo(tree, [], key.id);
		const stats = treeStats(tree, path);
		expect(stats.maxHp).toBeLessThan(0); // Blood Frenzy's drawback
		expect(stats['tagMul.melee']).toBeGreaterThan(0.35);
	});

	test('auto allocation spends every point it can and stays connected', () => {
		for (const level of [1, 10, 40, 100]) {
			const picked = autoAllocate(tree, level);
			expect(picked.length).toBeLessThanOrEqual(level - 1);
			expect(new Set(picked).size).toBe(picked.length);
			expect(sanitizeAllocation(tree, picked)).toHaveLength(picked.length);
		}
		expect(autoAllocate(tree, 40).length).toBe(39);
	});
});

describe('ranked nodes (0/5)', () => {
	const tree = heroTree('jack');
	const ranked = Object.values(tree.nodes).find((n) => n.maxRank > 1);

	test('three ranked nodes per branch, each up to 5 ranks', () => {
		const all = Object.values(tree.nodes).filter((n) => n.maxRank > 1);
		expect(all).toHaveLength(9);
		for (const n of all) expect(n.maxRank).toBe(5);
	});

	test('each rank costs one point, stacks the bonus and refunds one rank at a time', () => {
		if (!ranked) throw new Error('no ranked node');
		let a = allocate(tree, 20, [], ranked.id) ?? [];
		const one = treeStats(tree, a);
		for (let i = 0; i < 6; i++) a = allocate(tree, 20, a, ranked.id) ?? a;
		expect(rankOf(a, ranked.id)).toBe(5);
		const five = treeStats(tree, a);
		for (const [k, v] of Object.entries(ranked.stats))
			expect((five as Record<string, number>)[k]).toBeCloseTo(
				((one as Record<string, number>)[k] ?? 0) + 4 * v,
			);
		expect(canRefund(tree, a, ranked.id)).toBe(true);
		expect(rankOf(refundOne(a, ranked.id), ranked.id)).toBe(4);
		// Saved ranks above the cap are trimmed.
		expect(rankOf(sanitizeAllocation(tree, [...a, ranked.id, ranked.id]), ranked.id)).toBe(5);
	});
});
