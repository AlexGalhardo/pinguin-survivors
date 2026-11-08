import { afterAll, beforeAll, describe, expect, test } from 'bun:test';

const uninstall = (await import('./dom')).installDom();
const { act, cleanup, fireEvent, render } = await import('@testing-library/react');
const { Router } = await import('../../src/ui/Router');
type View = import('../../src/ui/Router').MenuView;

afterAll(uninstall);
beforeAll(() => {
	// happy-dom has no layout: stack elements by first-seen order for spatial navigation.
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

const log: string[] = [];
const actionsOf = (names: string[]): never =>
	Object.fromEntries(
		names.map((name) => [
			name,
			(...args: unknown[]) => {
				log.push([name, ...args.map(String)].join(':'));
			},
		]),
	) as never;

describe('MainMenu', () => {
	test('lists continue only with a saved run and opens screens', () => {
		log.length = 0;
		const view = (continueRound: number | null, canQuit = false): View => ({
			screen: 'main-menu',
			data: { pearls: 12, points: 3, continueRound, canQuit },
			actions: actionsOf([
				'continueRun',
				'play',
				'heroes',
				'workshop',
				'achievements',
				'history',
				'settings',
				'quit',
			]),
		});
		const a = render(<Router view={view(null)} />);
		expect(a.queryByText('CONTINUE (ROUND 4)')).toBeNull();
		fireEvent.click(a.getByText('PLAY'));
		expect(log).toEqual(['play']);
		cleanup();
		const b = render(<Router view={view(4)} />);
		expect(b.getByText('CONTINUE (ROUND 4)')).toBeTruthy();
		expect(b.container.textContent).toContain('12 pearls');
		cleanup();
		// Quit only exists in the desktop and mobile shells.
		expect(render(<Router view={view(null)} />).queryByText('QUIT')).toBeNull();
		cleanup();
		fireEvent.click(render(<Router view={view(null, true)} />).getByText('QUIT'));
		expect(log.at(-1)).toBe('quit');
		cleanup();
	});
});

describe('HeroSelect', () => {
	const heroes = [
		{
			id: 'jack' as const,
			unlocked: true,
			level: 5,
			bestRound: 9,
			maxDanger: 2 as const,
			bestByDanger: [9, 4, 0, 0, 0, 0],
			weapons: ['machete', 'knives', 'fishBoomerang'],
		},
		{
			id: 'bob' as const,
			unlocked: false,
			level: 1,
			bestRound: 0,
			maxDanger: 0 as const,
			bestByDanger: [0, 0, 0, 0, 0, 0],
			weapons: ['doubleBarrel'],
		},
	];

	test('danger wraps within the hero unlock and start sends hero, danger and weapon', () => {
		let started: unknown;
		const { getAllByLabelText, getByText, container } = render(
			<Router
				view={{
					screen: 'hero-select',
					data: { heroes },
					actions: {
						start: (r) => {
							started = r;
						},
						back: () => {},
					},
				}}
			/>,
		);
		expect(container.textContent).toContain('Danger 0');
		const next = getAllByLabelText('+');
		const dangerNext = next[0] as HTMLElement;
		fireEvent.click(dangerNext);
		fireEvent.click(dangerNext);
		expect(container.textContent).toContain('Danger 2');
		fireEvent.click(dangerNext);
		expect(container.textContent).toContain('Danger 0');
		fireEvent.click(dangerNext);
		fireEvent.click(next[1] as HTMLElement);
		fireEvent.click(getByText('START RUN'));
		expect(started).toEqual({ hero: 'jack', danger: 1, weapon: 'knives' });
		cleanup();
	});

	test('a locked hero cannot start', () => {
		const { getByText } = render(
			<Router
				view={{
					screen: 'hero-select',
					data: { heroes },
					actions: actionsOf(['start', 'back']),
				}}
			/>,
		);
		fireEvent.click(getByText('BOB'));
		expect((getByText('START RUN') as HTMLButtonElement).disabled).toBe(true);
		cleanup();
	});
});

describe('Settings and Controls', () => {
	test('adjust buttons step a row; Esc goes back', () => {
		log.length = 0;
		const { getAllByLabelText, container } = render(
			<Router
				view={{
					screen: 'settings',
					data: {
						lang: 'en',
						resolution: 'auto',
						fullscreen: false,
						master: 0.5,
						music: 0.7,
						sfx: 1,
						gore: 'max',
						screenShake: true,
						bloom: false,
						damageNumbers: true,
						numberSize: 'normal',
						reducedFlashes: false,
						telemetry: false,
					},
					actions: actionsOf([
						'adjust',
						'controls',
						'exportSave',
						'exportTelemetry',
						'importSave',
						'back',
					]),
				}}
			/>,
		);
		expect(container.textContent).toContain('Master volume: 50%');
		fireEvent.click(getAllByLabelText('+')[3] as HTMLElement);
		fireEvent.click(getAllByLabelText('-')[0] as HTMLElement);
		key('Escape');
		expect(log).toEqual(['adjust:master:1', 'adjust:language:-1', 'back']);
		cleanup();
	});

	test('controls shows the waiting prompt and blocks Back meanwhile', () => {
		log.length = 0;
		const { container, getByText } = render(
			<Router
				view={{
					screen: 'controls',
					data: {
						rows: [
							{ action: 'up', keyLabel: 'W' },
							{ action: 'pause', keyLabel: 'P' },
						],
						waiting: 'pause',
					},
					actions: actionsOf(['rebind', 'reset', 'back']),
				}}
			/>,
		);
		expect(container.textContent).toContain('Move up: W');
		expect(container.textContent).toContain('Pause: press a key…');
		fireEvent.click(getByText('Move up: W'));
		key('Escape');
		expect(log).toEqual(['rebind:up']);
		cleanup();
	});
});

describe('HeroScreen and lists', () => {
	test('hero screen spends points, buys potions and switches to the workshop', () => {
		log.length = 0;
		const { getByText, container } = render(
			<Router
				view={{
					screen: 'hero',
					data: {
						heroes: ['jack'],
						hero: 'jack',
						level: 3,
						xp: 10,
						xpNext: 100,
						points: 2,
						stats: [{ key: 'maxHp', value: '150', step: '5' }],
						pearls: 20,
						potions: [{ type: 'heal', owned: 1, price: 10 }],
						gambits: [{ potion: null, condition: null }],
						weaponUnlocks: [],
						upgrades: [{ id: 'recovery', level: 1, max: 5, bonus: '+1', cost: 8 }],
					},
					actions: actionsOf([
						'selectHero',
						'spendPoint',
						'buyPotion',
						'cycleGambitPotion',
						'cycleGambitCondition',
						'buyUpgrade',
						'buyWeapon',
						'back',
					]),
				}}
			/>,
		);
		fireEvent.click(getByText(/Max HP: 150/));
		fireEvent.click(getByText('Heal: 1 owned · buy 10'));
		fireEvent.click(getByText('WORKSHOP'));
		expect(container.textContent).toContain('Recovery (HP regen)');
		fireEvent.click(getByText(/Recovery .HP regen.*buy 8/));
		expect(log).toEqual(['spendPoint:maxHp', 'buyPotion:heal', 'buyUpgrade:recovery']);
		cleanup();
	});

	test('history and achievements render rows; empty history shows the notice', () => {
		const a = render(
			<Router
				view={{ screen: 'history', data: { rows: [] }, actions: { back: () => {} } }}
			/>,
		);
		expect(a.container.textContent).toContain('No runs yet');
		cleanup();
		const b = render(
			<Router
				view={{
					screen: 'achievements',
					data: {
						done: 1,
						total: 2,
						points: 4,
						rows: [
							{
								id: 'a',
								name: 'Slayer I',
								description: 'Kill 10',
								unlocked: true,
								progress: 100,
							},
							{
								id: 'b',
								name: 'Slayer II',
								description: 'Kill 100',
								unlocked: false,
								progress: 40,
							},
						],
					},
					actions: { extras: () => {}, back: () => {} },
				}}
			/>,
		);
		expect(b.container.textContent).toContain('1/2 unlocked');
		expect(b.container.textContent).toContain('Kill 100  ·  40%');
		cleanup();
	});
});
