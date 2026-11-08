import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';

const writes: unknown[] = [];
mock.module('../../src/core/storage', () => ({
	writeSave: (s: unknown) => {
		writes.push(s);
		return true;
	},
	exportSave: () => {},
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

describe('hero screen', () => {
	test('spending a point, buying a potion and an upgrade mutate and persist the save', () => {
		save.heroes.jack.level = 3;
		save.pearls = 100;
		const before = view('hero').data;
		expect(before.points).toBeGreaterThan(0);
		view('hero').actions.spendPoint('maxHp');
		expect(save.heroes.jack.points.maxHp).toBe(1);
		expect(view('hero').data.points).toBe(before.points - 1);
		view('hero').actions.buyPotion('heal');
		expect(save.potions.heal).toBe(1);
		expect(save.pearls).toBeLessThan(100);
		const up = view('hero').data.upgrades[0];
		if (!up || up.cost === null) throw new Error('upgrade');
		view('hero').actions.buyUpgrade(up.id);
		expect(save.upgrades[up.id]).toBe(1);
		expect(writes.length).toBe(3);
	});

	test('cannot spend points or pearls that are not there', () => {
		view('hero').actions.spendPoint('maxHp');
		view('hero').actions.buyPotion('heal');
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
