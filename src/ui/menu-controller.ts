import { GAME_SPEEDS, HERO_IDS, type HeroId } from '../config/constants';
import { setResolution } from '../core/display';
import { platform } from '../core/platform';
import {
	activeSlot,
	deleteSlot,
	exportSave,
	exportTelemetry,
	hasActiveSlot,
	importSave,
	loadSlot,
	slotSummaries,
	startNewSlot,
	writeSave,
} from '../core/storage';
import { ACHIEVEMENT_SHOP, ACHIEVEMENTS } from '../data/achievements';
import { isDemoBuild } from '../data/demo';
import { RESOLUTION_IDS } from '../data/display';
import { GAMBIT_CONDITIONS, POTION_PRICES, POTION_TYPES } from '../data/potions';
import { type I18nKey, LANGS, setLang, t } from '../i18n';
import { achievementProgress, availablePoints, buyExtra, extraLevel } from '../logic/achievements';
import { demoAllowsHero, demoDifficulty, demoHidesAchievement } from '../logic/demo';
import { maxSelectableDifficulty } from '../logic/difficulty';
import {
	ACTIONS,
	type Action,
	bindConflict,
	DEFAULT_BINDS,
	keyLabel,
	rebind,
} from '../logic/keybinds';
import { systemUnlocked } from '../logic/onboarding';
import { xpToNext } from '../logic/progression';
import { type GoreMode, NUMBER_SIZES, type SaveData } from '../logic/save';
import {
	allocate,
	canRefund,
	heroTree,
	refundCost,
	refundOne,
	resetCost,
	treePoints,
} from '../logic/skill-tree';
import { availableStartingWeapons, buyStartingWeapon, unlockableWeapons } from '../logic/unlocks';
import { achievementDescription, achievementName } from './achievement-text';
import { menuCommands } from './commands';
import type { SettingsRow } from './components/Settings';
import { ensureLangFont } from './lang-font';
import { announceUnlocks } from './onboarding-ui';
import type { MenuView } from './Router';
import { publishUnlock } from './run-bridge';
import { getUiSave, touchSave } from './save-bridge';
import { uiStore } from './store';
import { showToast } from './toast';

/** Builds each menu screen's data from the save and wires its actions (save mutation + game commands). */
export type MenuScreenId = MenuView['screen'];

const GORE: readonly GoreMode[] = ['max', 'reduced', 'goo'];

const cycle = <T>(list: readonly T[], value: T, dir: number): T =>
	list[(list.indexOf(value) + dir + list.length) % list.length] as T;

/** Menu-only UI state (not saved): selected hero on the hero screen and the action waiting for a key. */
const state: {
	hero: HeroId | null;
	waiting: Action | null;
	/** Set when settings were opened from the pause menu: Back runs this instead of going to the main menu. */
	settingsBack: (() => void) | null;
	/** Set while the tree is open from a run: only that hero, and Back returns to the run. */
	treeBack: (() => void) | null;
	/** What the save slot screen is for: pick the slot of a new game or load an existing one. */
	slotsMode: 'load' | 'new';
} = { hero: null, waiting: null, settingsBack: null, treeBack: null, slotsMode: 'load' };

/** Opens the settings screen over a running game; `back` restores the caller (pause menu). */
/**
 * Opens the skill tree from a run (pause or shop): only the run's hero, and Back calls `back`
 * (the game applies the new tree to the run's stats there).
 */
export function openTreeFrom(hero: HeroId, back: () => void): void {
	state.hero = hero;
	state.treeBack = back;
	go('skill-tree');
}

export function openSettingsFrom(back: () => void): void {
	state.settingsBack = back;
	go('settings');
}

const go = (screen: MenuScreenId | 'none'): void => uiStore.set({ screen });
const toMenu = (): void => go('main-menu');

function persist(save: SaveData): void {
	writeSave(save);
	touchSave();
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

/** Real fullscreen (browser) or a window that covers the whole screen (the Electron shell). */
function isFullscreen(): boolean {
	if (typeof document === 'undefined') return false;
	return (
		document.fullscreenElement !== null ||
		(platform().kind === 'electron' &&
			window.innerWidth >= screen.width &&
			window.innerHeight >= screen.height)
	);
}

function mainMenu(save: SaveData): MenuView {
	// Back from a run: say what the progress just opened, once (SDD-022 RF-02).
	if (hasActiveSlot()) announceUnlocks();
	return {
		screen: 'main-menu',
		data: {
			systems: {
				tree: systemUnlocked(save, 'tree'),
				heroes: systemUnlocked(save, 'heroes'),
			},
			hasSlot: hasActiveSlot(),
			hasSaves: slotSummaries().some((s) => s !== null),
			continueRound: hasActiveSlot() && save.activeRun ? save.activeRun.nextRound : null,
			canQuit: platform().kind !== 'web',
		},
		actions: {
			continueRun: () => {
				go('none');
				menuCommands.continueRun();
			},
			play: () => go('hero-select'),
			newGame: () => {
				state.slotsMode = 'new';
				go('save-slots');
			},
			load: () => {
				state.slotsMode = 'load';
				go('save-slots');
			},
			heroes: () => go('hero'),
			workshop: () => go('skill-tree'),
			achievements: () => go('achievements'),
			history: () => go('history'),
			settings: () => go('settings'),
			quit: () => platform().quit(),
		},
	};
}

/** The three save slots: load one, start a new game in one (overwriting) or delete one. */
function saveSlots(save: SaveData): MenuView {
	return {
		screen: 'save-slots',
		data: { mode: state.slotsMode, slots: slotSummaries(), active: activeSlot() },
		actions: {
			pick: (slot) => {
				if (state.slotsMode === 'new') {
					startNewSlot(save, slot);
					state.hero = null;
					touchSave();
					go('hero-select');
				} else if (loadSlot(save, slot)) {
					state.hero = null;
					touchSave();
					toMenu();
				}
			},
			remove: (slot) => {
				deleteSlot(save, slot);
				touchSave();
				if (!slotSummaries().some((s) => s !== null) && state.slotsMode === 'load')
					toMenu();
			},
			back: toMenu,
		},
	};
}

function heroSelect(save: SaveData): MenuView {
	return {
		screen: 'hero-select',
		data: {
			heroes: HERO_IDS.map((id) => ({
				id,
				unlocked: save.heroes[id].unlocked && demoAllowsHero(id),
				demoLocked: !demoAllowsHero(id),
				level: save.heroes[id].level,
				bestRound: save.progress.hero[id].bestRound,
				maxDifficulty: demoDifficulty(maxSelectableDifficulty(save, id)),
				bestByDifficulty: save.bestRoundByDifficulty[id],
				weapons: availableStartingWeapons(save, id),
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

function heroOf(save: SaveData): HeroId {
	const unlocked = HERO_IDS.filter((h) => save.heroes[h].unlocked);
	return state.hero && unlocked.includes(state.hero) ? state.hero : (unlocked[0] ?? 'jack');
}

function heroScreen(save: SaveData): MenuView {
	const unlocked = HERO_IDS.filter((h) => save.heroes[h].unlocked);
	const hero = heroOf(save);
	const h = save.heroes[hero];
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
			treePoints: treePoints(h.level, h.tree),
			pearls: save.pearls,
			potions: POTION_TYPES.map((type) => ({
				type,
				owned: save.potions[type],
				price: POTION_PRICES[type],
			})),
			gambits: save.gambits.map((g) => ({ potion: g.potion, condition: g.condition })),
			weaponUnlocks: isDemoBuild() ? [] : unlockableWeapons(save, hero),
		},
		actions: {
			selectHero: (next) => {
				state.hero = next;
				touchSave();
			},
			openTree: () => go('skill-tree'),
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
			buyWeapon: (weapon) => {
				if (isDemoBuild()) return;
				const id = unlockableWeapons(save, hero).find((u) => u.weapon === weapon)?.weapon;
				if (!id || !buyStartingWeapon(save, hero, id)) return;
				persist(save);
				publishUnlock({ kind: 'weapon', id });
			},
			back: toMenu,
		},
	};
}

/** Passive skill tree of the selected hero (ADR-019): allocate paths, refund or reset for Pearls. */
function skillTree(save: SaveData): MenuView {
	const inRun = state.treeBack !== null;
	const unlocked = HERO_IDS.filter((h) => save.heroes[h].unlocked);
	const hero = heroOf(save);
	const h = save.heroes[hero];
	const tree = heroTree(hero);
	return {
		screen: 'skill-tree',
		data: {
			heroes: inRun ? [hero] : unlocked,
			hero,
			level: h.level,
			allocated: h.tree,
			points: treePoints(h.level, h.tree),
			pearls: save.pearls,
			refundCost: refundCost(),
			resetCost: resetCost(h.tree),
		},
		actions: {
			selectHero: (next) => {
				state.hero = next;
				touchSave();
			},
			allocate: (id) => {
				const next = allocate(tree, h.level, h.tree, id);
				if (!next) return;
				h.tree = next;
				persist(save);
			},
			refund: (id) => {
				if (!canRefund(tree, h.tree, id) || save.pearls < refundCost()) return;
				save.pearls -= refundCost();
				h.tree = refundOne(h.tree, id);
				persist(save);
			},
			reset: () => {
				const cost = resetCost(h.tree);
				if (h.tree.length === 0 || save.pearls < cost) return;
				save.pearls -= cost;
				h.tree = [];
				persist(save);
			},
			back: () => {
				const back = state.treeBack;
				state.treeBack = null;
				if (back) back();
				else go('hero');
			},
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
		// With no slot loaded the file becomes a new game in the first free slot.
		if (!hasActiveSlot()) startNewSlot(save, Math.max(0, slotSummaries().indexOf(null)));
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
			case 'language': {
				// The CJK font loads on demand, so the language switches once it is ready.
				const next = cycle(LANGS, s.lang, dir);
				void ensureLangFont(next).then(() => {
					s.lang = next;
					setLang(next);
					persist(save);
				});
				return;
			}
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
			case 'speed':
				s.gameSpeed = cycle(GAME_SPEEDS, s.gameSpeed, dir);
				break;
			case 'telemetry':
				s.telemetry = !s.telemetry;
				break;
		}
		persist(save);
	};
	return {
		screen: 'settings',
		data: {
			lang: s.lang,
			resolution: s.resolution,
			fullscreen: isFullscreen(),
			master: s.volume.master,
			music: s.volume.music,
			sfx: s.volume.sfx,
			gore: s.gore,
			screenShake: s.screenShake,
			bloom: s.bloomOptIn,
			damageNumbers: s.damageNumbers,
			numberSize: s.numberSize,
			reducedFlashes: s.reducedFlashes,
			gameSpeed: s.gameSpeed,
			telemetry: s.telemetry,
		},
		actions: {
			adjust: step,
			controls: () => go('controls'),
			exportSave: () => exportSave(save),
			exportTelemetry: () => exportTelemetry(save),
			importSave: () => pickImport(save),
			back: () => {
				const back = state.settingsBack;
				state.settingsBack = null;
				if (back) back();
				else toMenu();
			},
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
		if (e.code !== 'Escape') {
			// The key belonged to another action: the two swap, and the player is told which moved.
			const other = bindConflict(save.settings.keys, action, e.code);
			const freed = save.settings.keys[action];
			if (rebind(save.settings.keys, action, e.code)) {
				writeSave(save);
				if (other)
					showToast(
						t('controls.swapped', {
							action: t(`action.${other}` as I18nKey),
							key: keyLabel(freed),
						}),
					);
			}
		}
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
	const visible = ACHIEVEMENTS.filter((a) => !demoHidesAchievement(a));
	const sorted = [...visible].sort((a, b) => {
		const ua = unlockedAt(a.id);
		const ub = unlockedAt(b.id);
		if (ua || ub) return ub - ua;
		return achievementProgress(b, save.progress) - achievementProgress(a, save.progress);
	});
	return {
		screen: 'achievements',
		data: {
			done: Object.keys(save.achievements.unlocked).length,
			total: visible.length,
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
		case 'skill-tree':
			return skillTree(save);
		case 'save-slots':
			return saveSlots(save);
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
