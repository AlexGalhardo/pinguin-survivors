import { afterAll, beforeAll, describe, expect, test } from 'bun:test';

const uninstall = (await import('./dom')).installDom();
const { act, cleanup, fireEvent, render } = await import('@testing-library/react');
const { LevelUpCards } = await import('../../src/ui/components/LevelUpCards');
const { Pause } = await import('../../src/ui/components/Pause');
const { GameOver } = await import('../../src/ui/components/GameOver');
const { Unlock } = await import('../../src/ui/components/Unlock');
const { inputGrace } = await import('../../src/ui/input-grace');

afterAll(uninstall);
beforeAll(() => {
	// The grace window has its own tests; the other screen tests click right after mounting.
	inputGrace.ms = 0;
	// happy-dom has no layout: stack the buttons by document order for spatial navigation.
	let n = 0;
	const order = new WeakMap<object, number>();
	window.HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
		if (!order.has(this)) order.set(this, n++);
		const y = (order.get(this) ?? 0) * 50;
		return {
			x: 0,
			y,
			width: 40,
			height: 40,
			top: y,
			left: 0,
			right: 40,
			bottom: y + 40,
		} as DOMRect;
	};
});

const key = (code: string): void => {
	act(() => {
		window.dispatchEvent(
			new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }),
		);
	});
};

describe('LevelUpCards', () => {
	const data = (rerollsLeft: number) => ({
		level: 5,
		rerollsLeft,
		cards: [
			{
				id: 'maxHp',
				rarity: 'common' as const,
				name: 'Thick Blubber',
				description: '+12 max HP',
			},
			{
				id: 'crit',
				rarity: 'legendary' as const,
				name: 'Sharp Eye',
				description: '+14% crit',
			},
		],
	});

	test('shows rarity, text and picks by click; reroll shows the counter', () => {
		const calls: string[] = [];
		const actions = {
			pick: (i: number) => calls.push(`pick:${i}`),
			reroll: () => calls.push('reroll'),
		};
		const { getByText } = render(<LevelUpCards data={data(2)} actions={actions} />);
		expect(getByText('Legendary')).toBeTruthy();
		expect(getByText('+12 max HP')).toBeTruthy();
		fireEvent.click(getByText('Sharp Eye'));
		fireEvent.click(getByText('REROLL · 2 left'));
		expect(calls).toEqual(['pick:1', 'reroll']);
		cleanup();
	});

	test('Enter picks the focused card; reroll is disabled at 0', () => {
		const calls: string[] = [];
		const actions = {
			pick: (i: number) => calls.push(`pick:${i}`),
			reroll: () => calls.push('reroll'),
		};
		const { getByText } = render(<LevelUpCards data={data(0)} actions={actions} />);
		key('Enter');
		expect(calls).toEqual(['pick:0']);
		expect((getByText('REROLL · 0 left') as HTMLButtonElement).disabled).toBe(true);
		cleanup();
	});
});

describe('LevelUpCards hotkeys', () => {
	test('1-4 pick the card and R rerolls only while rerolls are left', () => {
		const calls: string[] = [];
		const card = (id: string) => ({
			id,
			rarity: 'common' as const,
			name: id,
			description: id,
		});
		const actions = {
			pick: (i: number) => calls.push(`pick:${i}`),
			reroll: () => calls.push('reroll'),
		};
		const view = (rerollsLeft: number) => (
			<LevelUpCards
				data={{ level: 2, rerollsLeft, cards: [card('maxHp'), card('crit')] }}
				actions={actions}
			/>
		);
		const { rerender } = render(view(1));
		key('Digit2');
		key('Digit3');
		key('KeyR');
		rerender(view(0));
		key('KeyR');
		expect(calls).toEqual(['pick:1', 'reroll']);
		cleanup();
	});
});

describe('Pause', () => {
	const data = {
		weapons: [{ slot: 0, id: 'machete', tier: 2 as const }],
		stats: [{ key: 'maxHp', value: '140' }],
		cards: [],
		gear: { slots: [] },
	};

	test('quit needs confirmation; Esc cancels the confirmation, then resumes', () => {
		const calls: string[] = [];
		const actions = {
			resume: () => calls.push('resume'),
			settings: () => calls.push('settings'),
			tree: () => calls.push('tree'),
			quit: () => calls.push('quit'),
		};
		const { container, getByText, queryByText } = render(
			<Pause data={data} actions={actions} />,
		);
		expect(container.textContent).toContain('140');
		fireEvent.click(getByText('QUIT RUN'));
		expect(calls).toEqual([]);
		expect(queryByText('YES, QUIT')).not.toBeNull();
		key('Escape');
		expect(queryByText('YES, QUIT')).toBeNull();
		key('Escape');
		expect(calls).toEqual(['resume']);
		fireEvent.click(getByText('SETTINGS'));
		fireEvent.click(getByText('QUIT RUN'));
		fireEvent.click(getByText('YES, QUIT'));
		expect(calls).toEqual(['resume', 'settings', 'quit']);
		cleanup();
	});
});

describe('Pause card', () => {
	test('focusing a weapon slot shows its tooltip card', () => {
		const data = {
			weapons: [{ slot: 0, id: 'machete', tier: 2 as const }],
			stats: [],
			cards: [],
			gear: { slots: [] },
		};
		const actions = { resume() {}, settings() {}, tree() {}, quit() {} };
		const { container, getByLabelText } = render(<Pause data={data} actions={actions} />);
		expect(container.textContent).toContain('Focus an item');
		fireEvent.focus(getByLabelText('Machete'));
		expect(container.textContent).toContain('Weapon · II');
		cleanup();
	});
});

describe('GameOver', () => {
	test('shows the summary and fires play again / menu', () => {
		const calls: string[] = [];
		const { container, getByText } = render(
			<GameOver
				data={{
					bossTimeout: false,
					round: 12,
					kills: 340,
					seconds: 605,
					damage: 12345,
					xp: 80,
					fish: 55,
					pearls: 6,
					levels: 3,
					newBest: true,
				}}
				actions={{ playAgain: () => calls.push('again'), menu: () => calls.push('menu') }}
			/>,
		);
		const text = container.textContent ?? '';
		expect(text).toContain('YOU DIED');
		expect(text).toContain('Round 12');
		expect(text).toContain('340 kills');
		expect(text).toContain('10:05');
		expect(text).toContain('+6 Pearls');
		expect(text).toContain('NEW BEST!');
		fireEvent.click(getByText('PLAY AGAIN'));
		key('Escape');
		expect(calls).toEqual(['again', 'menu']);
		cleanup();
	});
});

describe('input grace', () => {
	test('GameOver ignores clicks and Esc until the grace window passed', async () => {
		inputGrace.ms = 60;
		const calls: string[] = [];
		const { getByText } = render(
			<GameOver
				data={{
					bossTimeout: false,
					round: 1,
					kills: 1,
					seconds: 1,
					damage: 1,
					xp: 1,
					fish: 1,
					pearls: 0,
					levels: 0,
					newBest: false,
				}}
				actions={{ playAgain: () => calls.push('again'), menu: () => calls.push('menu') }}
			/>,
		);
		fireEvent.click(getByText('PLAY AGAIN'));
		key('Escape');
		expect(calls).toEqual([]);
		await new Promise((r) => setTimeout(r, 90));
		fireEvent.click(getByText('PLAY AGAIN'));
		expect(calls).toEqual(['again']);
		inputGrace.ms = 0;
		cleanup();
	});
});

describe('Unlock', () => {
	test('hero unlock shows the title and dismisses with Enter', () => {
		const calls: string[] = [];
		const { container } = render(
			<Unlock
				data={{ kind: 'hero', hero: 'bob' }}
				actions={{ dismiss: () => calls.push('ok') }}
			/>,
		);
		expect(container.textContent).toContain('BOB UNLOCKED!');
		key('Enter');
		expect(calls).toEqual(['ok']);
		cleanup();
	});

	test('weapon unlock shows the weapon name', () => {
		const { container } = render(
			<Unlock data={{ kind: 'weapon', id: 'hammer' }} actions={{ dismiss: () => {} }} />,
		);
		expect(container.textContent).toContain('NEW WEAPON');
		expect(container.textContent).toContain('Sledgehammer');
		cleanup();
	});
});

describe('DemoEnd', () => {
	test('shows the summary, the Bob teaser and a wishlist button with the Steam URL', async () => {
		const { DemoEnd } = await import('../../src/ui/components/DemoEnd');
		const calls: string[] = [];
		const { container, getByText } = render(
			<DemoEnd
				data={{
					won: true,
					round: 10,
					kills: 500,
					seconds: 600,
					damage: 99999,
					bobLocked: true,
					wishlistUrl: 'https://store.steampowered.com/app/TBD',
				}}
				actions={{
					wishlist: () => calls.push('wishlist'),
					playAgain: () => calls.push('again'),
					menu: () => calls.push('menu'),
				}}
			/>,
		);
		expect(container.textContent).toContain('DEMO COMPLETE');
		expect(container.textContent).toContain('Round 10');
		expect(container.textContent).toContain('Bob is unlocked in the full game');
		const wish = getByText('WISHLIST ON STEAM');
		expect(wish.getAttribute('data-href')).toBe('https://store.steampowered.com/app/TBD');
		fireEvent.click(wish);
		fireEvent.click(getByText('PLAY AGAIN'));
		key('Escape');
		expect(calls).toEqual(['wishlist', 'again', 'menu']);
		cleanup();
	});

	test('ignores input during the grace window', async () => {
		const { DemoEnd } = await import('../../src/ui/components/DemoEnd');
		inputGrace.ms = 60;
		const calls: string[] = [];
		const { getByText } = render(
			<DemoEnd
				data={{
					won: true,
					round: 10,
					kills: 1,
					seconds: 5,
					damage: 1,
					bobLocked: false,
					wishlistUrl: 'x',
				}}
				actions={{
					wishlist: () => calls.push('wishlist'),
					playAgain: () => {},
					menu: () => calls.push('menu'),
				}}
			/>,
		);
		fireEvent.click(getByText('WISHLIST ON STEAM'));
		key('Escape');
		expect(calls).toEqual([]);
		await new Promise((r) => setTimeout(r, 90));
		fireEvent.click(getByText('WISHLIST ON STEAM'));
		expect(calls).toEqual(['wishlist']);
		inputGrace.ms = 0;
		cleanup();
	});

	test('a lost demo hides the teaser when Bob is already unlocked', async () => {
		const { DemoEnd } = await import('../../src/ui/components/DemoEnd');
		const { container } = render(
			<DemoEnd
				data={{
					won: false,
					round: 4,
					kills: 1,
					seconds: 5,
					damage: 1,
					bobLocked: false,
					wishlistUrl: 'x',
				}}
				actions={{ wishlist: () => {}, playAgain: () => {}, menu: () => {} }}
			/>,
		);
		expect(container.textContent).toContain('DEMO OVER');
		expect(container.textContent).not.toContain('Bob is unlocked');
		cleanup();
	});
});
