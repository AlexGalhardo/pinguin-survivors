import { HERO_IDS, type HeroId } from '../config/constants';
import { setResolution } from '../core/display';
import { exportSave, importSave, writeSave } from '../core/storage';
import { ACHIEVEMENT_SHOP, ACHIEVEMENTS } from '../data/achievements';
import { RESOLUTION_IDS } from '../data/display';
import { HEROES } from '../data/heroes';
import { GAMBIT_CONDITIONS, POTION_PRICES, POTION_TYPES } from '../data/potions';
import { UPGRADES } from '../data/upgrades';
import { LANGS, setLang } from '../i18n';
import { achievementProgress, availablePoints, buyExtra, extraLevel } from '../logic/achievements';
import { maxSelectableDanger } from '../logic/difficulty';
import { ACTIONS, type Action, DEFAULT_BINDS, keyLabel, rebind } from '../logic/keybinds';
import { freePoints, xpToNext } from '../logic/progression';
import { type GoreMode, NUMBER_SIZES, type SaveData } from '../logic/save';
import { getStat, heroStats, POINT_VALUES, type PointStat } from '../logic/stats';
import { buyUpgrade, upgradeCost, upgradeLevel } from '../logic/upgrades';
import { achievementDescription, achievementName } from './achievement-text';
import { menuCommands } from './commands';
import type { SettingsRow } from './components/Settings';
import type { MenuView } from './Router';
import { getUiSave, touchSave } from './save-bridge';
import { uiStore } from './store';

/** Builds each menu screen's data from the save and wires its actions (save mutation + game commands). */
export type MenuScreenId = MenuView['screen'];

const GORE: readonly GoreMode[] = ['max', 'reduced', 'goo'];

const cycle = <T>(list: readonly T[], value: T, dir: number): T =>
	list[(list.indexOf(value) + dir + list.length) % list.length] as T;

/** Menu-only UI state (not saved): selected hero on the hero screen and the action waiting for a key. */
const state: { hero: HeroId | null; waiting: Action | null } = { hero: null, waiting: null };

const go = (screen: MenuScreenId | 'none'): void => uiStore.set({ screen });
const toMenu = (): void => go('main-menu');

function persist(save: SaveData): void {
	writeSave(save);
	touchSave();
}

const PERCENT_STATS = new Set<string>(['attackSpeed', 'dodge', 'parry', 'crit']);

function formatStat(stat: string, value: number): string {
	if (PERCENT_STATS.has(stat) || stat.startsWith('resist.'))
		return `${Math.round(value * 1000) / 10}%`;
	return (Math.round(value * 10) / 10).toLocaleString();
}

const UPGRADE_PERCENT = new Set<string>(['damage', 'attackSpeed', 'xpGain', 'luck']);

function upgradeBonus(stat: string, value: number): string {
	return UPGRADE_PERCENT.has(stat)
		? `+${Math.round(value * 100)}%`
		: `+${Math.round(value * 10) / 10}`;
}

const EXTRA_PERCENT = new Set<string>([
	'crit',
	'critDamage',
	'dodge',
	'parry',
	'attackSpeed',
	'damage',
]);

function extraBonus(stat: string, value: number): string {
	return EXTRA_PERCENT.has(stat)
		? `+${Math.round(value * 1000) / 10}%`
		: `+${Math.round(value * 100) / 100}`;
}

function mainMenu(save: SaveData): MenuView {
	return {
		screen: 'main-menu',
		data: {
			pearls: save.pearls,
			points: availablePoints(save.achievements),
			continueRound: save.activeRun ? save.activeRun.nextRound : null,
		},
		actions: {
			continueRun: () => {
				go('none');
				menuCommands.continueRun();
			},
			play: () => go('hero-select'),
			heroes: () => go('hero'),
			// The Workshop is a tab of the hero screen.
			workshop: () => go('hero'),
			achievements: () => go('achievements'),
			history: () => go('history'),
			settings: () => go('settings'),
		},
	};
}

function heroSelect(save: SaveData): MenuView {
	return {
		screen: 'hero-select',
		data: {
			heroes: HERO_IDS.map((id) => ({
				id,
				unlocked: save.heroes[id].unlocked,
				level: save.heroes[id].level,
				bestRound: save.progress.hero[id].bestRound,
				maxDanger: maxSelectableDanger(save, id),
				bestByDanger: save.bestRoundByDanger[id],
				weapons: HEROES[id].startingWeapons,
			})),
		},
		actions: {
			start: (request) => {
				go('none');
				menuCommands.startRun(request);
			},
			back: toMenu,
		},
	};
}

function heroScreen(save: SaveData): MenuView {
	const unlocked = HERO_IDS.filter((h) => save.heroes[h].unlocked);
	const hero = state.hero && unlocked.includes(state.hero) ? state.hero : (unlocked[0] ?? 'jack');
	const h = save.heroes[hero];
	const stats = heroStats(HEROES[hero], h.level, h.points);
	const potionChoices = [null, ...POTION_TYPES] as const;
	const conditionChoices = [null, ...GAMBIT_CONDITIONS] as const;
	return {
		screen: 'hero',
		data: {
			heroes: unlocked,
			hero,
			level: h.level,
			xp: h.xp,
			xpNext: xpToNext(h.level),
			points: freePoints(h.level, h.points),
			stats: (Object.keys(POINT_VALUES) as PointStat[]).map((key) => ({
				key,
				value: formatStat(key, getStat(stats, key)),
				step: formatStat(key, POINT_VALUES[key]),
			})),
			pearls: save.pearls,
			potions: POTION_TYPES.map((type) => ({
				type,
				owned: save.potions[type],
				price: POTION_PRICES[type],
			})),
			gambits: save.gambits.map((g) => ({ potion: g.potion, condition: g.condition })),
			upgrades: UPGRADES.map((def) => {
				const level = upgradeLevel(save.upgrades, def.id);
				return {
					id: def.id,
					level,
					max: def.maxLevel,
					bonus: upgradeBonus(def.stat, def.perLevel * level),
					cost: upgradeCost(def, level),
				};
			}),
		},
		actions: {
			selectHero: (next) => {
				state.hero = next;
				touchSave();
			},
			spendPoint: (key) => {
				if (!(key in POINT_VALUES) || freePoints(h.level, h.points) <= 0) return;
				h.points[key] = (h.points[key] ?? 0) + 1;
				persist(save);
			},
			buyPotion: (type) => {
				const p = POTION_TYPES.find((x) => x === type);
				if (!p || save.pearls < POTION_PRICES[p]) return;
				save.pearls -= POTION_PRICES[p];
				save.potions[p]++;
				persist(save);
			},
			cycleGambitPotion: (slot, dir) => {
				const g = save.gambits[slot];
				if (!g) return;
				g.potion = cycle(potionChoices, g.potion, dir);
				if (g.potion && !g.condition) g.condition = 'hpBelow50';
				persist(save);
			},
			cycleGambitCondition: (slot) => {
				const g = save.gambits[slot];
				if (!g) return;
				g.condition = cycle(conditionChoices, g.condition, 1);
				persist(save);
			},
			buyUpgrade: (id) => {
				const def = UPGRADES.find((u) => u.id === id);
				if (!def) return;
				const left = buyUpgrade(def, save.upgrades, save.pearls);
				if (left === null) return;
				save.pearls = left;
				persist(save);
			},
			back: toMenu,
		},
	};
}

function pickImport(save: SaveData): void {
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = 'application/json,.json';
	input.onchange = async () => {
		const file = input.files?.[0];
		if (!file) return;
		const imported = await importSave(file, save.settings.lang);
		// In place: the game holds the same object.
		Object.assign(save, imported);
		setLang(save.settings.lang);
		setResolution(save.settings.resolution);
		persist(save);
		menuCommands.refreshAudio();
	};
	input.click();
}

function settings(save: SaveData): MenuView {
	const s = save.settings;
	const step = (row: SettingsRow, dir: -1 | 1): void => {
		const vol = (key: keyof typeof s.volume): void => {
			s.volume[key] = Math.min(
				1,
				Math.max(0, Math.round((s.volume[key] + dir * 0.1) * 10) / 10),
			);
			menuCommands.refreshAudio();
		};
		switch (row) {
			case 'language':
				s.lang = cycle(LANGS, s.lang, dir);
				setLang(s.lang);
				break;
			case 'resolution':
				s.resolution = cycle(RESOLUTION_IDS, s.resolution, dir);
				setResolution(s.resolution);
				break;
			case 'fullscreen':
				// Browser state, not saved; the game owns the user-gesture call.
				menuCommands.toggleFullscreen();
				break;
			case 'master':
			case 'music':
			case 'sfx':
				vol(row);
				break;
			case 'gore':
				s.gore = cycle(GORE, s.gore, dir);
				break;
			case 'shake':
				s.screenShake = !s.screenShake;
				break;
			case 'bloom':
				s.bloomOptIn = !s.bloomOptIn;
				break;
			case 'numbers':
				s.damageNumbers = !s.damageNumbers;
				break;
			case 'numberSize':
				s.numberSize = cycle(NUMBER_SIZES, s.numberSize, dir);
				break;
			case 'flashes':
				s.reducedFlashes = !s.reducedFlashes;
				break;
		}
		persist(save);
	};
	return {
		screen: 'settings',
		data: {
			lang: s.lang,
			resolution: s.resolution,
			fullscreen: typeof document !== 'undefined' && document.fullscreenElement !== null,
			master: s.volume.master,
			music: s.volume.music,
			sfx: s.volume.sfx,
			gore: s.gore,
			screenShake: s.screenShake,
			bloom: s.bloomOptIn,
			damageNumbers: s.damageNumbers,
			numberSize: s.numberSize,
			reducedFlashes: s.reducedFlashes,
		},
		actions: {
			adjust: step,
			controls: () => go('controls'),
			exportSave: () => exportSave(save),
			importSave: () => pickImport(save),
			back: toMenu,
		},
	};
}

/** Captures the next key for the action waiting to be rebound (Esc cancels, Enter is ignored). */
function captureKey(save: SaveData, action: Action): void {
	const onKey = (e: KeyboardEvent): void => {
		if (e.code === 'Enter') return;
		e.stopImmediatePropagation();
		e.preventDefault();
		window.removeEventListener('keydown', onKey, true);
		if (e.code !== 'Escape' && rebind(save.settings.keys, action, e.code)) writeSave(save);
		state.waiting = null;
		touchSave();
	};
	window.addEventListener('keydown', onKey, true);
}

function controls(save: SaveData): MenuView {
	const binds = save.settings.keys;
	return {
		screen: 'controls',
		data: {
			rows: ACTIONS.map((action) => ({ action, keyLabel: keyLabel(binds[action]) })),
			waiting: state.waiting,
		},
		actions: {
			rebind: (name) => {
				const action = ACTIONS.find((a) => a === name);
				if (!action || state.waiting) return;
				state.waiting = action;
				captureKey(save, action);
				touchSave();
			},
			reset: () => {
				Object.assign(binds, DEFAULT_BINDS);
				persist(save);
			},
			back: () => go('settings'),
		},
	};
}

function achievements(save: SaveData): MenuView {
	const unlockedAt = (id: string): number => save.achievements.unlocked[id] ?? 0;
	// Unlocked first (newest first), then the closest ones to completion.
	const sorted = [...ACHIEVEMENTS].sort((a, b) => {
		const ua = unlockedAt(a.id);
		const ub = unlockedAt(b.id);
		if (ua || ub) return ub - ua;
		return achievementProgress(b, save.progress) - achievementProgress(a, save.progress);
	});
	return {
		screen: 'achievements',
		data: {
			done: Object.keys(save.achievements.unlocked).length,
			total: ACHIEVEMENTS.length,
			points: availablePoints(save.achievements),
			rows: sorted.map((def) => ({
				id: def.id,
				name: achievementName(def),
				description: achievementDescription(def),
				unlocked: save.achievements.unlocked[def.id] !== undefined,
				progress: Math.round(achievementProgress(def, save.progress) * 100),
			})),
		},
		actions: { extras: () => go('extras'), back: toMenu },
	};
}

function extras(save: SaveData): MenuView {
	const ach = save.achievements;
	return {
		screen: 'extras',
		data: {
			points: availablePoints(ach),
			rows: ACHIEVEMENT_SHOP.map((e) => {
				const level = extraLevel(ach, e.id);
				const max = e.maxLevel ?? 1;
				return {
					id: e.id,
					level,
					max,
					bonus: extraBonus(e.stat ?? '', (e.perLevel ?? 0) * level),
					cost: level >= max ? null : e.cost,
				};
			}),
		},
		actions: {
			buy: (id) => {
				const def = ACHIEVEMENT_SHOP.find((e) => e.id === id);
				if (!def || buyExtra(ach, def) !== 'ok') return;
				persist(save);
			},
			back: () => go('achievements'),
		},
	};
}

function history(save: SaveData): MenuView {
	return {
		screen: 'history',
		data: {
			rows: save.history.map((r) => ({
				id: r.id,
				endedAt: r.endedAt,
				hero: r.hero,
				heroLevel: r.heroLevel,
				round: r.round,
				kills: r.kills,
				durationSec: r.durationSec,
				fishEarned: r.fishEarned,
				outcome: r.outcome,
			})),
		},
		actions: { back: toMenu },
	};
}

export function menuView(screen: MenuScreenId, save: SaveData): MenuView {
	switch (screen) {
		case 'main-menu':
			return mainMenu(save);
		case 'hero-select':
			return heroSelect(save);
		case 'hero':
			return heroScreen(save);
		case 'settings':
			return settings(save);
		case 'controls':
			return controls(save);
		case 'achievements':
			return achievements(save);
		case 'extras':
			return extras(save);
		case 'history':
			return history(save);
	}
}

/** The current menu screen for the published save, or null when none is open. */
export function currentMenuView(screen: MenuScreenId | 'none'): MenuView | null {
	const save = getUiSave();
	return screen === 'none' || !save ? null : menuView(screen, save);
}
