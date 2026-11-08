import { afterAll, describe, expect, test } from 'bun:test';

const uninstall = (await import('./dom')).installDom();
const { cleanup, fireEvent, render } = await import('@testing-library/react');
const { Shop, fusePartner } = await import('../../src/ui/components/Shop');
type Data = import('../../src/ui/components/Shop').ShopData;

afterAll(uninstall);

const data = (over: Partial<Data> = {}): Data => ({
	round: 3,
	fish: 50,
	offers: [
		{ kind: 'weapon', id: 'machete', tier: 1, price: 14, sets: ['blade'] },
		{ kind: 'weapon', id: 'knives', tier: 2, price: 26, sets: ['blade', 'thrown'] },
		{ kind: 'gear', id: 'helmet.wool', tier: 1, price: 18, sets: [] },
		null,
	],
	locks: [false, true, false, false],
	rerollPrice: 7,
	weapons: [
		{ id: 'machete', tier: 1, sellValue: 7 },
		{ id: 'machete', tier: 1, sellValue: 7 },
		{ id: 'knives', tier: 4, sellValue: 40 },
	],
	gear: [null, null, null, null, null],
	...over,
});

const actions = () => {
	const calls: string[] = [];
	return {
		calls,
		a: {
			buy: (i: number) => calls.push(`buy:${i}`),
			reroll: () => calls.push('reroll'),
			lock: (i: number) => calls.push(`lock:${i}`),
			sell: (s: number) => calls.push(`sell:${s}`),
			fuse: (x: number, y: number) => calls.push(`fuse:${x},${y}`),
			next: () => calls.push('next'),
		},
	};
};

describe('Shop', () => {
	test('renders offers with price, shows the reroll price and calls commands', () => {
		const { calls, a } = actions();
		const { getByText, getAllByText } = render(<Shop data={data()} actions={a} />);
		expect(getByText('BUY · 14')).toBeTruthy();
		expect(getByText('BUY · 26')).toBeTruthy();
		expect(getByText('SOLD')).toBeTruthy();
		expect(getByText('REROLL · 7')).toBeTruthy();
		fireEvent.click(getByText('BUY · 26'));
		fireEvent.click(getByText('REROLL · 7'));
		fireEvent.click(getAllByText('Lock')[0] as HTMLElement);
		fireEvent.click(getByText('Locked'));
		fireEvent.click(getByText('NEXT ROUND'));
		expect(calls).toEqual(['buy:1', 'reroll', 'lock:0', 'lock:1', 'next']);
		cleanup();
	});

	test('disables buy and reroll without enough Fish', () => {
		const { calls, a } = actions();
		const { getByText } = render(<Shop data={data({ fish: 10 })} actions={a} />);
		const buy = getByText('BUY · 14') as HTMLButtonElement;
		expect(buy.disabled).toBe(true);
		expect((getByText('REROLL · 7') as HTMLButtonElement).disabled).toBe(false);
		fireEvent.click(buy);
		expect(calls).toEqual([]);
		cleanup();
	});

	test('sell and fuse act on weapon slots; fuse only for equal pairs below tier IV', () => {
		const { calls, a } = actions();
		const d = data();
		expect(fusePartner(d.weapons, 0)).toBe(1);
		expect(fusePartner(d.weapons, 2)).toBe(-1);
		const { getAllByText, getByText } = render(<Shop data={d} actions={a} />);
		expect(getAllByText('FUSE').length).toBe(2);
		fireEvent.click(getAllByText('FUSE')[0] as HTMLElement);
		fireEvent.click(getByText('SELL · 40'));
		expect(calls).toEqual(['fuse:0,1', 'sell:2']);
		cleanup();
	});

	test('draws gear (name and rarity colour) and potion offers', () => {
		const { calls, a } = actions();
		const d = data({
			offers: [
				{ kind: 'gear', id: 'helmet.crown', tier: 3, price: 40, sets: [] },
				{ kind: 'potion', id: 'heal', tier: 1, price: 9, sets: [] },
				null,
				null,
			],
		});
		const { getByText, container } = render(<Shop data={d} actions={a} />);
		expect(getByText('Emperor Crown').className).toContain('text-rarity-legendary');
		expect(getByText('Heal')).toBeTruthy();
		expect(container.textContent).toContain('Potion');
		fireEvent.click(getByText('BUY · 9'));
		expect(calls).toEqual(['buy:1']);
		cleanup();
	});
});
