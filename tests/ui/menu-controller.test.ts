import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';

const writes: unknown[] = [];
/** In-memory stand-in for the three slots of `core/storage`. */
const slotFake = { bound: false, active: 0, used: [false, false, false] };
mock.module('../../src/core/storage', () => ({
	hasActiveSlot: () => slotFake.bound,
	activeSlot: () => (slotFake.bound ? slotFake.active : null),
	slotSummaries: () =>
		slotFake.used.map((u) =>
			u
				? { hero: 'jack', level: 1, bestRound: 0, playedSec: 0, savedAt: 0, inRun: false }
				: null,
		),
	startNewSlot: (_save: unknown, i: number) => {
		slotFake.bound = true;
		slotFake.active = i;
		slotFake.used[i] = true;
	},
	loadSlot: (_save: unknown, i: number) => {
		if (!slotFake.used[i]) return false;
		slotFake.bound = true;
		slotFake.active = i;
		return true;
	},
	deleteSlot: (_save: unknown, i: number) => {
		slotFake.used[i] = false;
		if (slotFake.active === i) slotFake.bound = false;
	},
	writeSave: (s: unknown) => {
		writes.push(s);
		return true;
	},
	exportSave: () => {},
	exportTelemetry: () => {},
	importSave: async () => {
		throw new Error('not used');
	},
}));
mock.module('../../src/core/display', () => ({ setResolution: () => {} }));
mock.module('../../src/ui/lang-font', () => ({ ensureLangFont: async () => {} }));

const { defaultSave } = await import('../../src/logic/save');
const { menuView } = await import('../../src/ui/menu-controller');
const { bindMenuCommands } = await import('../../src/ui/commands');
const { uiStore } = await import('../../src/ui/store');
const { runUiStore } = await import('../../src/ui/run-bridge');
const { setLang } = await import('../../src/i18n');
type SaveData = import('../../src/logic/save').SaveData;

let save: SaveData;
const calls: string[] = [];

function view<S extends import('../../src/ui/Router').MenuView['screen']>(screen: S) {
	const v = menuView(screen, save);
	if (v.screen !== screen) throw new Error(`expected ${screen}`);
	return v as Extract<typeof v, { screen: S }>;
}

// The language is process-global: do not leak pt-BR into other test files.
afterEach(() => setLang('en'));

beforeEach(() => {
	save = defaultSave('en');
	writes.length = 0;
	calls.length = 0;
	Object.assign(slotFake, { bound: false, active: 0, used: [false, false, false] });
	uiStore.set({ screen: 'main-menu' });
	bindMenuCommands({
		startRun: (r) => calls.push(`start:${r.hero}:${r.danger}:${r.weapon}`),
		continueRun: () => calls.push('continue'),
		refreshAudio: () => calls.push('audio'),
		toggleFullscreen: () => calls.push('fullscreen'),
	});
});

describe('main menu and hero select', () => {
	test('wallet and continue come from the save; play opens hero select', () => {
		save.pearls = 7;
		expect(view('main-menu').data).toMatchObject({ pearls: 7, continueRound: null });
		view('main-menu').actions.play();
		expect(uiStore.get().screen).toBe('hero-select');
	});

	test('hero select exposes danger caps and starting weapons; start closes the menu', () => {
		const d = view('hero-select').data;
		const jack = d.heroes.find((h) => h.id === 'jack');
		expect(jack?.maxDanger).toBe(1);
		expect(jack?.weapons).toEqual(['machete', 'knives', 'fishBoomerang']);
		expect(d.heroes.find((h) => h.id === 'bob')?.unlocked).toBe(false);
		view('hero-select').actions.start({ hero: 'jack', danger: 1, weapon: 'knives' });
		expect(calls).toEqual(['start:jack:1:knives']);
		expect(uiStore.get().screen).toBe('none');
	});
});

describe('save slots', () => {
	test('without a loaded slot the menu offers a new game only; hero entries need a slot', () => {
		expect(view('main-menu').data).toMatchObject({ hasSlot: false, hasSaves: false });
		view('main-menu').actions.newGame();
		expect(uiStore.get().screen).toBe('save-slots');
		const d = view('save-slots').data;
		expect(d).toMatchObject({ mode: 'new', active: null });
		expect(d.slots).toEqual([null, null, null]);
	});

	test('new game in a slot binds it and opens hero select; load switches; delete empties', () => {
		view('main-menu').actions.newGame();
		view('save-slots').actions.pick(1);
		expect(uiStore.get().screen).toBe('hero-select');
		expect(view('main-menu').data).toMatchObject({ hasSlot: true, hasSaves: true });
		view('main-menu').actions.load();
		expect(view('save-slots').data).toMatchObject({ mode: 'load', active: 1 });
		view('save-slots').actions.pick(1);
		expect(uiStore.get().screen).toBe('main-menu');
		view('main-menu').actions.load();
		view('save-slots').actions.remove(1);
		expect(view('main-menu').data).toMatchObject({ hasSlot: false, hasSaves: false });
		// Nothing left to load: back to the main menu.
		expect(uiStore.get().screen).toBe('main-menu');
	});
});

describe('hero screen', () => {
	test('the skill tree allocates paths, refunds leaves and resets for pearls', () => {
		save.heroes.jack.level = 10;
		save.pearls = 100;
		expect(view('hero').data.treePoints).toBe(9);
		view('skill-tree').actions.allocate('jack.blade.n0');
		const taken = save.heroes.jack.tree.length;
		expect(taken).toBeGreaterThan(0);
		expect(view('skill-tree').data.points).toBe(9 - taken);
		view('skill-tree').actions.refund('jack.blade.n0');
		expect(save.heroes.jack.tree).toHaveLength(taken - 1);
		expect(save.pearls).toBe(98);
		view('skill-tree').actions.reset();
		expect(save.heroes.jack.tree).toHaveLength(0);
		expect(save.pearls).toBe(98 - (taken - 1));
		expect(writes.length).toBe(3);
	});

	test('cannot allocate without points or refund without pearls', () => {
		view('skill-tree').actions.allocate('jack.blade.n0');
		view('hero').actions.buyPotion('shield');
		expect(writes.length).toBe(0);
	});

	test('a starting weapon is bought with pearls, listed in the select and announced', () => {
		save.pearls = 500;
		const offer = view('hero').data.weaponUnlocks.find((u) => u.weapon === 'hammer');
		if (!offer) throw new Error('hammer should be for sale');
		view('hero').actions.buyWeapon('hammer');
		expect(save.pearls).toBe(500 - offer.cost);
		expect(save.unlocks.startingWeapons.jack).toEqual(['hammer']);
		expect(view('hero').data.weaponUnlocks.some((u) => u.weapon === 'hammer')).toBe(false);
		expect(view('hero-select').data.heroes[0]?.weapons).toContain('hammer');
		expect(runUiStore.get().unlock).toEqual({ kind: 'weapon', id: 'hammer' });
		view('hero').actions.buyWeapon('hammer');
		expect(save.pearls).toBe(500 - offer.cost);
	});

	test('no weapon without pearls, and other heroes exclusives are not for sale', () => {
		view('hero').actions.buyWeapon('hammer');
		expect(save.unlocks.startingWeapons.jack).toEqual([]);
		expect(view('hero').data.weaponUnlocks.some((u) => u.weapon === 'grenadeBelt')).toBe(false);
		expect(writes.length).toBe(0);
	});

	test('gambit potion cycles and gets a default condition', () => {
		view('hero').actions.cycleGambitPotion(0, 1);
		expect(save.gambits[0]?.potion).not.toBeNull();
		expect(save.gambits[0]?.condition).toBe('hpBelow50');
	});
});

describe('settings and controls', () => {
	test('settings rows mutate the save; volume re-applies audio; fullscreen is a game command', () => {
		const a = view('settings').actions;
		const master = save.settings.volume.master;
		a.adjust('master', -1);
		expect(save.settings.volume.master).toBeCloseTo(master - 0.1);
		a.adjust('gore', 1);
		a.adjust('shake', 1);
		a.adjust('fullscreen', 1);
		expect(save.settings.screenShake).toBe(!defaultSave('en').settings.screenShake);
		expect(calls).toEqual(['audio', 'fullscreen']);
		expect(view('settings').data.master).toBeCloseTo(master - 0.1);
	});

	test('language cycles through the 4 supported languages', async () => {
		const seen: string[] = [];
		for (let i = 0; i < 3; i++) {
			view('settings').actions.adjust('language', 1);
			await new Promise((r) => setTimeout(r, 0));
			seen.push(save.settings.lang);
		}
		expect(seen).toEqual(['pt-BR', 'es', 'zh-CN']);
	});

	test('controls reset restores the default binds', () => {
		save.settings.keys.up = 'KeyI';
		view('controls').actions.reset();
		expect(save.settings.keys.up).toBe('KeyW');
		expect(view('controls').data.rows[0]).toEqual({ action: 'up', keyLabel: 'W' });
	});
});

describe('lists', () => {
	test('achievements, extras and history build from the save', () => {
		expect(view('achievements').data.total).toBeGreaterThan(0);
		expect(view('achievements').data.done).toBe(0);
		save.achievements.unlocked.kills_1 = 1;
		expect(view('achievements').data.done).toBe(1);
		expect(view('extras').data.rows.length).toBeGreaterThan(0);
		expect(view('history').data.rows).toEqual([]);
	});

	test('back actions navigate', () => {
		view('settings').actions.controls();
		expect(uiStore.get().screen).toBe('controls');
		view('controls').actions.back();
		expect(uiStore.get().screen).toBe('settings');
		view('achievements').actions.extras();
		view('extras').actions.back();
		expect(uiStore.get().screen).toBe('achievements');
	});
});
