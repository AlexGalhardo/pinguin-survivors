import { type HeroTree, TREE } from '../data/skill-tree';

/** Columns per branch band: left cluster, spine, right cluster, then the lane of travel nodes. */
export const BAND = 4;

export interface GridCell {
	id: string;
	/** 1-based tier (depth along the spine). */
	row: number;
	/** 0-based column. */
	col: number;
}

export type GridDir = 'up' | 'down' | 'left' | 'right';

/**
 * Lays a hero tree out as a grid (ADR-026): one band per branch with the spine in the middle,
 * clusters on both sides (even clusters on the right) and travel nodes in the lane after the
 * band. Derived from the node ids, so it follows `buildTree` without touching its data. The
 * start node has no cell: the first spine node of every branch is always reachable.
 */
export function layoutGrid(tree: HeroTree): GridCell[] {
	const cells: GridCell[] = [];
	for (const node of Object.values(tree.nodes)) {
		if (node.kind === 'start') continue;
		const id = node.id;
		let m: RegExpMatchArray | null;
		if (node.kind === 'travel') {
			m = id.match(/\.ring(\d+)\.(\d+)\.(\d+)$/);
			if (m)
				cells.push({
					id,
					row: Number(m[1]) + Number(m[3]) - 1,
					col: Number(m[2]) * BAND + 3,
				});
			continue;
		}
		const b = node.branch * BAND;
		if (node.kind === 'keystone') cells.push({ id, row: TREE.spine, col: b + 1 });
		else if (/\.s\d+$/.test(id)) cells.push({ id, row: Number(id.match(/\d+$/)), col: b + 1 });
		else {
			m = id.match(/\.(?:c(\d+)\.(\d+)|n(\d+))$/);
			if (!m) continue;
			const c = Number(m[1] ?? m[3]);
			const k = m[2] ? Number(m[2]) : TREE.clusterSize + 1;
			cells.push({
				id,
				row: (TREE.clusters[c] as number) + k - 1,
				col: b + (c % 2 === 0 ? 2 : 0),
			});
		}
	}
	return cells;
}

/**
 * Next cell in a direction: left/right scan the row, up/down scan the column and, when the
 * column has nothing further, take the nearest column of the next row that has cells.
 * Null when there is none (the caller falls back to geometric focus).
 */
export function stepGrid(
	cells: readonly GridCell[],
	from: GridCell,
	dir: GridDir,
): GridCell | null {
	if (dir === 'left' || dir === 'right') {
		const d = dir === 'left' ? -1 : 1;
		return (
			cells
				.filter((c) => c.row === from.row && (c.col - from.col) * d > 0)
				.sort((a, b) => Math.abs(a.col - from.col) - Math.abs(b.col - from.col))[0] ?? null
		);
	}
	const d = dir === 'up' ? -1 : 1;
	const ahead = cells.filter((c) => (c.row - from.row) * d > 0);
	if (ahead.length === 0) return null;
	const nearest = Math.min(...ahead.map((c) => Math.abs(c.row - from.row)));
	return (
		ahead
			.filter((c) => c.col === from.col)
			.sort((a, b) => Math.abs(a.row - from.row) - Math.abs(b.row - from.row))[0] ??
		ahead
			.filter((c) => Math.abs(c.row - from.row) === nearest)
			.sort((a, b) => Math.abs(a.col - from.col) - Math.abs(b.col - from.col))[0] ??
		null
	);
}
