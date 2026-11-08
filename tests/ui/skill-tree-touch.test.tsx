import { afterAll, expect, test } from 'bun:test';

const uninstall = (await import('./dom')).installDom();
const { cleanup, fireEvent, render } = await import('@testing-library/react');
const { SkillTree } = await import('../../src/ui/components/SkillTree');
const { heroTree } = await import('../../src/logic/skill-tree');

afterAll(uninstall);

const tree = heroTree('jack');
const neighbor = tree.nodes[tree.start]?.links[0] as string;
const index = Object.keys(tree.nodes).indexOf(neighbor);

const setup = () => {
	const calls: string[] = [];
	const view = render(
		<SkillTree
			data={{
				heroes: ['jack'],
				hero: 'jack',
				level: 5,
				allocated: [],
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
	const buttons = view.container.querySelectorAll('button[aria-pressed]');
	const viewport = view.container.querySelector('.touch-none') as HTMLElement;
	return { calls, node: buttons[index] as HTMLElement, viewport };
};

test('touch: the first tap selects a node, the second tap on it allocates', () => {
	const { calls, node, viewport } = setup();
	fireEvent.pointerDown(viewport, { pointerId: 1, pointerType: 'touch' });
	fireEvent.pointerUp(viewport, { pointerId: 1, pointerType: 'touch' });
	fireEvent.click(node);
	expect(calls).toEqual([]);
	fireEvent.click(node);
	expect(calls).toEqual([`allocate:${neighbor}`]);
	cleanup();
});

test('mouse: one click allocates at once', () => {
	const { calls, node } = setup();
	fireEvent.click(node);
	expect(calls).toEqual([`allocate:${neighbor}`]);
	cleanup();
});
