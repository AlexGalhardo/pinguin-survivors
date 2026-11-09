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
			tree: () => calls.push('tree'),
			buyPotion: () => calls.push('buyPotion'),
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
		const { getByLabelText, getByText, queryByText } = render(<Shop data={d} actions={a} />);
		// The fixed action bar belongs to the picked weapon (slot 1 by default): it can fuse with its twin.
		fireEvent.click(getByText('FUSE'));
		// Picking the tier IV knives: only selling is offered.
		fireEvent.click(getByLabelText('Throwing Knives'));
		expect(queryByText('FUSE')).toBeNull();
		fireEvent.click(getByText('SELL · 40'));
		expect(calls).toEqual(['fuse:0,1', 'sell:2']);
		cleanup();
	});

	test('draws gear (name and rarity colour) and potion offers', () => {
		const { calls, a } = actions();
		const d = data({
			offers: [
				{ kind: 'gear', id: 'helmet.crown', tier: 3, price: 40, sets: [] },
				{ kind: 'potion', id: 'haste', tier: 1, price: 9, sets: [] },
				null,
				null,
			],
		});
		const { getByText, getAllByText, container } = render(<Shop data={d} actions={a} />);
		// Rarity III is green on the single I-V scale (palette.rarity3).
		expect(
			getAllByText('Emperor Crown')[0]?.closest('[style]')?.getAttribute('style') ?? '',
		).toMatch(/4fd06a|79, 208, 106/i);
		expect(getByText('Haste')).toBeTruthy();
		expect(container.textContent).toContain('Potion');
		fireEvent.click(getByText('BUY · 9'));
		expect(calls).toEqual(['buy:1']);
		cleanup();
	});

	test('the merchant speaks: opening line, then buy, no-Fish and reroll lines', async () => {
		const { merchantLine } = await import('../../src/ui/merchant');
		const lines = (e: 'open' | 'buy' | 'noFish' | 'reroll') =>
			[0, 0.4, 0.9].map((r) => merchantLine(e, () => r));
		const { calls, a } = actions();
		const { getByRole, getByText } = render(<Shop data={data({ fish: 40 })} actions={a} />);
		const said = () => getByRole('status').textContent ?? '';
		expect(lines('open')).toContain(said());
		fireEvent.click(getByText('BUY · 14'));
		expect(lines('buy')).toContain(said());
		expect(calls).toEqual(['buy:0']);
		fireEvent.click(getByText('REROLL · 7'));
		expect(lines('reroll')).toContain(said());
		cleanup();
	});

	test('running out of Fish after a purchase triggers the no-Fish line', async () => {
		const { merchantLine } = await import('../../src/ui/merchant');
		const { a } = actions();
		const { getByRole, getByText } = render(<Shop data={data({ fish: 14 })} actions={a} />);
		fireEvent.click(getByText('BUY · 14'));
		const noFish = [0, 0.4, 0.9].map((r) => merchantLine('noFish', () => r));
		expect(noFish).toContain(getByRole('status').textContent ?? '');
		cleanup();
	});

	test('the focused offer explains what buying does, with stats before and after in colour', () => {
		const { a } = actions();
		const d = data({
			offers: [
				{
					kind: 'gear',
					id: 'helmet.wool',
					tier: 1,
					price: 18,
					sets: [],
					description: {
						kind: 'gear',
						id: 'helmet.wool',
						rarity: 1,
						numeral: 'I',
						price: 18,
						outcome: { type: 'equip', slot: 'helmet' },
						affixes: [],
						baseStats: { maxHp: 6 },
						newAffixes: 0,
						statChanges: [{ stat: 'maxHp', before: 140, after: 146 }],
					},
				},
				null,
				null,
				null,
			],
		});
		const { container, getByText } = render(<Shop data={d} actions={a} />);
		expect(container.textContent).toContain('Worn at once (helmet).');
		expect(getByText('max HP 140 → 146').className).toContain('text-xp');
		cleanup();
	});
});
