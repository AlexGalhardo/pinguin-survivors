import { afterAll, expect, test } from 'bun:test';

const uninstall = (await import('./dom')).installDom();
const { cleanup, fireEvent, render } = await import('@testing-library/react');
const { SkillTree } = await import('../../src/ui/components/SkillTree');
const { heroTree } = await import('../../src/logic/skill-tree');
const { TREE_BRANCHES } = await import('../../src/data/skill-tree');
const { layoutGrid } = await import('../../src/ui/skill-grid');

afterAll(uninstall);

const tree = heroTree('jack');
const neighbor = tree.nodes[tree.start]?.links[0] as string;

const setup = (allocated: string[] = []) => {
	const calls: string[] = [];
	const view = render(
		<SkillTree
			data={{
				heroes: ['jack'],
				hero: 'jack',
				level: 5,
				allocated,
				points: 5,
				pearls: 0,
				refundCost: 0,
				resetCost: 0,
			}}
			actions={{
				selectHero: () => {},
				allocate: (id) => calls.push(`allocate:${id}`),
				refund: (id) => calls.push(`refund:${id}`),
				reset: () => {},
				back: () => {},
			}}
		/>,
	);
	const grid = view.container.querySelector('[data-tree-grid]') as HTMLElement;
	const cell = (id: string) => grid.querySelector(`[data-node="${id}"]`) as HTMLElement;
	return { calls, grid, cell, view };
};

const state = (el: HTMLElement) => el.getAttribute('data-state');

test('the grid renders every node of every branch, one square each', () => {
	const { grid } = setup();
	const squares = grid.querySelectorAll('[data-node]');
	expect(squares.length).toBe(Object.keys(tree.nodes).length - 1);
	for (const theme of TREE_BRANCHES.jack.map((b) => b.theme))
		expect(grid.querySelector(`[data-node^="jack.${theme}."]`)).not.toBeNull();
	cleanup();
});

test('squares show locked, available, bought and max states, with rank on ranked nodes', () => {
	const ranked = `jack.${TREE_BRANCHES.jack[0].theme}.s1`;
	const second = `jack.${TREE_BRANCHES.jack[0].theme}.s2`;
	const third = `jack.${TREE_BRANCHES.jack[0].theme}.s3`;
	const { cell } = setup([ranked, ranked, second]);
	expect(state(cell(ranked))).toBe('bought');
	expect(cell(ranked).textContent).toContain('2/5');
	expect(state(cell(second))).toBe('max');
	expect(state(cell(third))).toBe('available');
	expect(state(cell(`jack.${TREE_BRANCHES.jack[0].theme}.s9`))).toBe('locked');
	cleanup();
});

test('arrows move the focus cell by cell and the details follow it', () => {
	const theme = TREE_BRANCHES.jack[0].theme;
	const { cell, view } = setup();
	const s1 = cell(`jack.${theme}.s1`);
	s1.focus();
	fireEvent.keyDown(s1, { code: 'ArrowDown' });
	expect(document.activeElement).toBe(cell(`jack.${theme}.s2`));
	fireEvent.keyDown(document.activeElement as Element, { code: 'ArrowUp' });
	expect(document.activeElement).toBe(s1);
	const cells = layoutGrid(tree);
	const c = cells.find((x) => x.id === `jack.${theme}.s1`);
	const right = cells.find((x) => x.row === c?.row && x.col > (c?.col ?? 0));
	fireEvent.keyDown(s1, { code: 'ArrowRight' });
	expect(document.activeElement).toBe(cell(right?.id ?? ''));
	expect(view.container.querySelector('[data-tree-detail]')?.textContent).not.toBe('');
	cleanup();
});

test('touch: the first tap selects a square, the second tap on it allocates', () => {
	const { calls, grid, cell } = setup();
	const node = cell(neighbor);
	fireEvent.pointerDown(grid, { pointerId: 1, pointerType: 'touch' });
	fireEvent.click(node);
	expect(calls).toEqual([]);
	fireEvent.click(node);
	expect(calls).toEqual([`allocate:${neighbor}`]);
	cleanup();
});

test('mouse: one click allocates at once', () => {
	const { calls, cell } = setup();
	fireEvent.click(cell(neighbor));
	expect(calls).toEqual([`allocate:${neighbor}`]);
	cleanup();
});
