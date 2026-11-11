import { afterAll, describe, expect, test } from 'bun:test';

const uninstall = (await import('./dom')).installDom();
const { cleanup, render } = await import('@testing-library/react');
const { MainMenu } = await import('../../src/ui/components/MainMenu');
const { Pause } = await import('../../src/ui/components/Pause');
const { Shop } = await import('../../src/ui/components/Shop');
const { HudView } = await import('../../src/ui/components/Hud');
type Snapshot = import('../../src/ui/hud-bridge').HudSnapshot;
type MenuActions = import('../../src/ui/components/MainMenu').MainMenuActions;
type ShopActions = import('../../src/ui/components/Shop').ShopActions;

afterAll(uninstall);

const noop = (): void => {};
const menuActions: MenuActions = {
	continueRun: noop,
	play: noop,
	newGame: noop,
	load: noop,
	heroes: noop,
	workshop: noop,
	achievements: noop,
	history: noop,
	settings: noop,
	quit: noop,
};
const menu = (systems?: { tree: boolean; heroes: boolean }): string => {
	const { container } = render(
		<MainMenu
			data={{ continueRound: null, hasSlot: true, hasSaves: true, canQuit: false, systems }}
			actions={menuActions}
		/>,
	);
	const text = container.textContent ?? '';
	cleanup();
	return text;
};

describe('onboarding: systems hidden until they have a use (SDD-022)', () => {
	test('a new save has no skill tree and no hero screen in the main menu', () => {
		const fresh = menu({ tree: false, heroes: false });
		expect(fresh).toContain('PLAY');
		expect(fresh).toContain('ACHIEVEMENTS');
		expect(fresh).not.toContain('SKILL TREE');
		expect(fresh).not.toContain('HEROES & POTIONS');
		const later = menu({ tree: true, heroes: true });
		expect(later).toContain('SKILL TREE');
		expect(later).toContain('HEROES & POTIONS');
		// Callers that do not know about onboarding keep the whole list.
		expect(menu()).toContain('SKILL TREE');
	});

	test('the pause hides the skill tree entry until the hero has a point', () => {
		const actions = { resume: noop, settings: noop, tree: noop, quit: noop };
		const data = { weapons: [], stats: [], cards: [], gear: { slots: [] } };
		const locked = render(<Pause data={{ ...data, treeUnlocked: false }} actions={actions} />);
		expect(locked.container.textContent).toContain('RESUME');
		expect(locked.container.textContent).not.toContain('SKILL TREE');
		cleanup();
		const open = render(<Pause data={data} actions={actions} />);
		expect(open.container.textContent).toContain('SKILL TREE');
		cleanup();
	});

	test('the shop hides the tree button at level 1 and the materials until the run has one', () => {
		const actions: ShopActions = {
			buy: noop,
			reroll: noop,
			buyPotion: noop,
			tree: noop,
			lock: noop,
			sell: noop,
			fuse: noop,
			next: noop,
		};
		const data = {
			round: 1,
			fish: 10,
			offers: [],
			locks: [],
			rerollPrice: 3,
			weapons: [],
			gear: [],
		};
		const first = render(
			<Shop
				data={{ ...data, treeUnlocked: false, materials: { elite: 0, boss: 0 } }}
				actions={actions}
			/>,
		);
		expect(first.container.textContent).toContain('NEXT ROUND');
		expect(first.container.textContent).not.toContain('SKILL TREE');
		expect(first.container.querySelector('[title^="Marks"]')).toBeNull();
		cleanup();
		const later = render(
			<Shop data={{ ...data, materials: { elite: 1, boss: 0 } }} actions={actions} />,
		);
		expect(later.container.textContent).toContain('SKILL TREE');
		// Marks and Cores are drawn as icon and number; the sentence stays as the tooltip.
		expect(later.container.querySelector('[title="Marks 1 · Cores 0"]')?.textContent).toBe(
			'10',
		);
		cleanup();
	});
});

describe('pause sheet', () => {
	test('names the hero being played beside the build', () => {
		const actions = { resume: noop, settings: noop, tree: noop, quit: noop };
		const data = { weapons: [], stats: [], cards: [], gear: { slots: [] } };
		const { container } = render(<Pause data={{ ...data, hero: 'bob' }} actions={actions} />);
		expect(container.textContent).toContain('Bob');
		cleanup();
	});
});

describe('onboarding: first-run hints in the HUD', () => {
	const snapshot = (tip: Snapshot['tip']): Snapshot => ({
		hp: 100,
		maxHp: 100,
		level: 1,
		xp: 0,
		xpToNext: 10,
		fish: 0,
		kills: 0,
		round: 1,
		timeLeft: 30,
		bossRound: false,
		boss: null,
		superpower: null,
		elite: 'none',
		weapons: [],
		gear: [],
		gambits: [],
		healPotion: null,
		speed: 1,
		fps: 60,
		tip,
	});

	test('shows one line for the current tip and nothing when there is none', () => {
		const move = render(<HudView hud={snapshot('move')} />);
		expect(move.container.querySelector('[data-hud="tip"]')?.textContent).toBe(
			'Move with WASD or the left stick.',
		);
		cleanup();
		const auto = render(<HudView hud={snapshot('auto')} />);
		expect(auto.container.querySelector('[data-hud="tip"]')?.textContent).toContain(
			'attack on their own',
		);
		cleanup();
		const none = render(<HudView hud={snapshot(null)} />);
		expect(none.container.querySelector('[data-hud="tip"]')).toBeNull();
		cleanup();
	});
});
