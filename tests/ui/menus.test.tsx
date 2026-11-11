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
			data: { continueRound, canQuit, hasSlot: true, hasSaves: true },
			actions: actionsOf([
				'continueRun',
				'play',
				'newGame',
				'load',
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
		// The old subtitle and wallet footer are gone.
		expect(b.container.textContent).not.toContain('pearls');
		expect(b.container.textContent).not.toContain('penguins');
		cleanup();
		// Quit only exists in the desktop and mobile shells.
		expect(render(<Router view={view(null)} />).queryByText('QUIT')).toBeNull();
		cleanup();
		fireEvent.click(render(<Router view={view(null, true)} />).getByText('QUIT'));
		expect(log.at(-1)).toBe('quit');
		cleanup();
	});
});

describe('MainMenu without a loaded slot', () => {
	test('shows new game and load, hides the entries that need a slot', () => {
		log.length = 0;
		const view = (hasSaves: boolean): View => ({
			screen: 'main-menu',
			data: {
				continueRound: null,
				canQuit: false,
				hasSlot: false,
				hasSaves,
			},
			actions: actionsOf(['newGame', 'load', 'settings']),
		});
		const a = render(<Router view={view(false)} />);
		expect(a.queryByText('PLAY')).toBeNull();
		expect(a.queryByText('LOAD GAME')).toBeNull();
		expect(a.queryByText('MATCH HISTORY')).toBeNull();
		fireEvent.click(a.getByText('NEW GAME'));
		cleanup();
		fireEvent.click(render(<Router view={view(true)} />).getByText('LOAD GAME'));
		expect(log).toEqual(['newGame', 'load']);
		cleanup();
	});
});

describe('SaveSlots', () => {
	const row = (hero: 'jack' | 'bob', level: number) => ({
		hero,
		level,
		bestRound: 12,
		playedSec: 3725,
		savedAt: 0,
		inRun: false,
	});
	const view = (mode: 'load' | 'new'): View => ({
		screen: 'save-slots',
		data: { mode, slots: [row('jack', 7), null, row('bob', 3)], active: 0 },
		actions: actionsOf(['pick', 'remove', 'back']),
	});

	test('load lists the slots with their summary and loads the picked one', () => {
		log.length = 0;
		const r = render(<Router view={view('load')} />);
		expect(r.container.textContent).toContain('Jack · level 7 · best round 12');
		expect(r.container.textContent).toContain('Empty slot');
		expect(r.container.textContent).toContain('1h 02m');
		fireEvent.click(r.getAllByText('LOAD')[2] as HTMLElement);
		expect(log).toEqual(['pick:2']);
		cleanup();
	});

	test('delete and overwrite ask for confirmation first', () => {
		log.length = 0;
		const del = render(<Router view={view('load')} />);
		fireEvent.click(del.getAllByText('DELETE')[0] as HTMLElement);
		expect(log).toEqual([]);
		expect(del.container.textContent).toContain('Delete slot 1?');
		expect(document.activeElement?.textContent).toBe('CANCEL');
		fireEvent.click(del.getByText('CONFIRM'));
		expect(log).toEqual(['remove:0']);
		cleanup();
		log.length = 0;
		const fresh = render(<Router view={view('new')} />);
		// The empty slot starts at once; a used one asks.
		fireEvent.click(fresh.getAllByText('START HERE')[1] as HTMLElement);
		expect(log).toEqual(['pick:1']);
		fireEvent.click(fresh.getAllByText('START HERE')[0] as HTMLElement);
		expect(fresh.container.textContent).toContain('Slot 1 already has a game');
		fireEvent.click(fresh.getByText('CANCEL'));
		expect(log).toEqual(['pick:1']);
		fireEvent.click(fresh.getAllByText('START HERE')[0] as HTMLElement);
		fireEvent.click(fresh.getByText('CONFIRM'));
		expect(log).toEqual(['pick:1', 'pick:0']);
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
			maxDifficulty: 2 as const,
			bestByDifficulty: [9, 4, 0],
			weapons: ['machete', 'knives', 'fishBoomerang'],
		},
		{
			id: 'bob' as const,
			unlocked: false,
			level: 1,
			bestRound: 0,
			maxDifficulty: 0 as const,
			bestByDifficulty: [0, 0, 0],
			weapons: ['doubleBarrel'],
		},
	];

	test('difficulty wraps within the hero unlock and start sends hero, difficulty and weapon', () => {
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
		// The choice sits under its own section title: the row shows the level and its best round.
		const picked = (): string =>
			container.querySelector('[data-pick="difficulty"]')?.textContent ?? '';
		expect(picked()).toContain('Normal');
		expect(picked()).toContain('best round 4');
		const next = getAllByLabelText('+');
		const difficultyNext = next[0] as HTMLElement;
		fireEvent.click(difficultyNext);
		expect(picked()).toContain('Hard');
		fireEvent.click(difficultyNext);
		expect(picked()).toContain('Easy');
		fireEvent.click(difficultyNext);
		expect(picked()).toContain('Normal');
		fireEvent.click(next[1] as HTMLElement);
		fireEvent.click(getByText('START RUN'));
		expect(started).toEqual({
			hero: 'jack',
			difficulty: 1,
			weapon: 'knives',
			heroClass: 'jack.survivor',
		});

		cleanup();
	});

	test('the class row cycles through the classes the hero level allows and goes in the request', () => {
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
		const picked = (): string =>
			container.querySelector('[data-pick="class"]')?.textContent ?? '';
		// Level 5: the base class and the first unlock; the next one is announced.
		expect(picked()).toContain('Survivor');
		expect(picked()).toContain('Next class at hero level 10.');
		expect(container.textContent).toContain('The hero as is: no changes.');
		const next = getAllByLabelText('+');
		fireEvent.click(next[2] as HTMLElement);
		expect(picked()).toContain('Berserker');
		expect(container.textContent).toContain('+25% damage');
		expect(container.textContent).toContain('-15% max HP');
		fireEvent.click(getByText('START RUN'));
		expect((started as { heroClass?: string }).heroClass).toBe('jack.berserker');
		fireEvent.click(next[2] as HTMLElement);
		expect(picked()).toContain('Survivor');
		cleanup();
	});

	test('the sheet shows the hero stats, superpower, weapon and what Difficulty changes', () => {
		const { container } = render(
			<Router
				view={{
					screen: 'hero-select',
					data: { heroes },
					actions: actionsOf(['start', 'back']),
				}}
			/>,
		);
		const text = container.textContent ?? '';
		expect(text).toContain('Red Harvest');
		expect(text).toContain('140');
		expect(text).toContain('Enemy HP');
		expect(text).toContain('Sweeps an arc');
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
		const { getAllByLabelText, getByText, container } = render(
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
						gameSpeed: 1,
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
		expect(container.textContent).toContain('Language');
		expect(container.textContent).not.toContain('Master volume');
		fireEvent.click(getAllByLabelText('-')[0] as HTMLElement);
		fireEvent.click(getByText('Audio'));
		expect(container.textContent).toContain('Master volume: 50%');
		fireEvent.click(getAllByLabelText('+')[0] as HTMLElement);
		fireEvent.focus(getAllByLabelText('+')[1] as HTMLElement);
		key('Escape');
		expect(log).toEqual(['adjust:language:-1', 'adjust:master:1', 'back']);
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

describe('Controls on a phone', () => {
	test('pages the key rows', () => {
		const win = window as unknown as { matchMedia?: unknown };
		win.matchMedia = () => ({
			matches: true,
			addEventListener: () => {},
			removeEventListener: () => {},
		});
		const rows = ['up', 'down', 'left', 'right', 'super', 'speed', 'pause'].map((action) => ({
			action,
			keyLabel: 'X',
		}));
		const r = render(
			<Router
				view={{
					screen: 'controls',
					data: { rows, waiting: null },
					actions: actionsOf(['rebind', 'reset', 'back']),
				}}
			/>,
		);
		expect(r.queryByText('Pause: X')).toBeNull();
		expect(r.container.textContent).toContain('1/2');
		fireEvent.click(r.getByText('›'));
		expect(r.queryByText('Pause: X')).toBeTruthy();
		cleanup();
		win.matchMedia = undefined;
	});
});

describe('HeroScreen and lists', () => {
	test('hero screen opens the skill tree and buys potions', () => {
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
						treePoints: 2,
						pearls: 20,
						potions: [{ type: 'shield', owned: 1, price: 10 }],
						gambits: [{ potion: null, condition: null }],
						weaponUnlocks: [],
					},
					actions: actionsOf([
						'selectHero',
						'openTree',
						'buyPotion',
						'cycleGambitPotion',
						'cycleGambitCondition',
						'buyWeapon',
						'back',
					]),
				}}
			/>,
		);
		fireEvent.click(getByText('SKILL TREE · POINTS 2'));
		fireEvent.click(
			container.querySelector('[aria-label="Shield: 1 owned · buy 10"]') as HTMLElement,
		);
		expect(container.textContent).toContain('SKILL TREE');
		expect(log).toEqual(['openTree', 'buyPotion:shield']);
		cleanup();
	});

	test('gambit slots cycle the potion and the condition', () => {
		log.length = 0;
		const { getByLabelText } = render(
			<Router
				view={{
					screen: 'hero',
					data: {
						heroes: ['jack'],
						hero: 'jack',
						level: 3,
						xp: 10,
						xpNext: 100,
						treePoints: 0,
						pearls: 0,
						potions: [],
						gambits: [{ potion: 'shield', condition: 'hpBelow25' }],
						weaponUnlocks: [],
					},
					actions: actionsOf([
						'selectHero',
						'openTree',
						'cycleGambitPotion',
						'cycleGambitCondition',
					]),
				}}
			/>,
		);
		fireEvent.click(getByLabelText('Slot 1: Shield when HP < 25%'));
		fireEvent.click(getByLabelText('Change condition'));
		expect(log).toEqual(['cycleGambitPotion:0:1', 'cycleGambitCondition:0']);
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
		expect(b.container.textContent).toContain('40%');
		fireEvent.focus(b.getByText('Slayer II'));
		expect(b.container.textContent).toContain('Kill 100');
		cleanup();
	});

	test('long lists page with PageDown and the pager buttons', () => {
		const rows = Array.from({ length: 20 }, (_, i) => ({
			id: `a${i}`,
			name: `Name ${i}`,
			description: 'd',
			unlocked: false,
			progress: 0,
		}));
		const a = render(
			<Router
				view={{
					screen: 'achievements',
					data: { done: 0, total: 20, points: 0, rows },
					actions: { extras: () => {}, back: () => {} },
				}}
			/>,
		);
		expect(a.container.textContent).toContain('PAGE 1 / 3');
		expect(a.queryByText('Name 8')).toBeNull();
		fireEvent.keyDown(window, { code: 'PageDown' });
		expect(a.container.textContent).toContain('PAGE 2 / 3');
		expect(a.getAllByText('Name 8').length).toBeGreaterThan(0);
		fireEvent.click(a.getByLabelText('Previous page'));
		expect(a.container.textContent).toContain('PAGE 1 / 3');
		cleanup();
	});
});

describe('MainMenu on a phone', () => {
	test('pages the entries instead of scrolling', () => {
		const win = window as unknown as { matchMedia?: unknown };
		win.matchMedia = () => ({
			matches: true,
			addEventListener: () => {},
			removeEventListener: () => {},
		});
		const view: View = {
			screen: 'main-menu',
			data: {
				continueRound: 4,
				canQuit: true,
				hasSlot: true,
				hasSaves: true,
			},
			actions: actionsOf([
				'continueRun',
				'play',
				'newGame',
				'load',
				'heroes',
				'workshop',
				'achievements',
				'history',
				'settings',
				'quit',
			]),
		};
		const r = render(<Router view={view} />);
		expect(r.queryByText('CONTINUE (ROUND 4)')).toBeTruthy();
		expect(r.queryByText('QUIT')).toBeNull();
		expect(r.container.textContent).toContain('1/2');
		fireEvent.click(r.getByLabelText('+'));
		expect(r.queryByText('CONTINUE (ROUND 4)')).toBeNull();
		expect(r.queryByText('QUIT')).toBeTruthy();
		expect(r.container.textContent).toContain('2/2');
		cleanup();
		win.matchMedia = undefined;
	});
});
