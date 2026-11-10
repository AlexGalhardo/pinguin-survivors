import { expect, test } from 'bun:test';
import { HERO_IDS } from '../../src/config/constants';
import { heroTree } from '../../src/logic/skill-tree';
import { BAND, layoutGrid, stepGrid } from '../../src/ui/skill-grid';

test('every node but the start has exactly one cell, with no two nodes sharing a cell', () => {
	for (const hero of HERO_IDS) {
		const tree = heroTree(hero);
		const cells = layoutGrid(tree);
		expect(cells.length).toBe(Object.keys(tree.nodes).length - 1);
		expect(new Set(cells.map((c) => `${c.row},${c.col}`)).size).toBe(cells.length);
	}
});

test('each branch fills its own band of columns', () => {
	const tree = heroTree('jack');
	const cells = layoutGrid(tree);
	for (const c of cells) {
		const node = tree.nodes[c.id];
		if (node && node.branch >= 0) expect(Math.floor(c.col / BAND)).toBe(node.branch);
	}
});

test('arrows step cell by cell and report null at the edge', () => {
	const cells = layoutGrid(heroTree('jack'));
	const s1 = cells.find((c) => c.row === 1 && c.col === 1);
	if (!s1) throw new Error('no first spine cell');
	expect(stepGrid(cells, s1, 'down')).toMatchObject({ row: 2, col: 1 });
	expect(stepGrid(cells, s1, 'up')).toBeNull();
	expect(stepGrid(cells, s1, 'left')).toBeNull();
	expect(stepGrid(cells, s1, 'right')?.row).toBe(1);
});
