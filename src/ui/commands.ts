import type { StartRunRequest } from './components/HeroSelect';

/** UI to game bridge (SDD-004 RF-03). The game binds the implementation; the UI never imports the game engine. */
export interface GameCommands {
	/** Level-up: pick the card at `index` of the offered cards. */
	pickCard: (index: number) => void;
	/** Level-up: spend one card reroll (Workshop `insight`). */
	rerollCards: () => void;
	/** Shop: buy the offer in shop slot `index` (see `ShopOfferView.index`). */
	buy: (index: number) => void;
	/** Shop: pay the reroll price and redraw the unlocked offers. */
	reroll: () => void;
	/** Shop: toggle the lock of the offer in shop slot `index` (free). */
	lock: (index: number) => void;
	/** Shop: sell the weapon in build slot `slot` for `ShopWeaponView.sellValue` Fish. */
	sell: (slot: number) => void;
	/** Shop: merge build slots `a` and `b` (same weapon and tier) into the next tier. */
	fuse: (a: number, b: number) => void;
	closeShop: () => void;
	pause: () => void;
	resume: () => void;
	/** Pause: open the settings screen; its Back returns to the pause menu. */
	pauseSettings: () => void;
	/** Pause: wear a bag item. */
	equip: (id: string) => void;
	/** Pause: take off the item worn in `slot` (goes to the bag). */
	unequip: (slot: string) => void;
	/** Pause: quit the run (already confirmed in the UI). */
	quitRun: () => void;
	/** Run over: start a new run with the same hero, Danger and weapon. */
	playAgain: () => void;
	/** Run over: back to the main menu. */
	backToMenu: () => void;
}

let impl: Partial<GameCommands> = {};

/** Called by the game once its scenes can honor the commands; later calls replace earlier ones. */
export function bindCommands(next: Partial<GameCommands>): void {
	impl = next;
}

/** Commands not bound yet are ignored, so UI built ahead of the game never throws. */
export const commands: GameCommands = {
	pickCard: (index) => impl.pickCard?.(index),
	rerollCards: () => impl.rerollCards?.(),
	buy: (index) => impl.buy?.(index),
	reroll: () => impl.reroll?.(),
	lock: (index) => impl.lock?.(index),
	sell: (slot) => impl.sell?.(slot),
	fuse: (a, b) => impl.fuse?.(a, b),
	closeShop: () => impl.closeShop?.(),
	pause: () => impl.pause?.(),
	resume: () => impl.resume?.(),
	pauseSettings: () => impl.pauseSettings?.(),
	equip: (id) => impl.equip?.(id),
	unequip: (slot) => impl.unequip?.(slot),
	quitRun: () => impl.quitRun?.(),
	playAgain: () => impl.playAgain?.(),
	backToMenu: () => impl.backToMenu?.(),
};

/**
 * Menu-level commands the React menus need from the game. Bound once at boot (not per scene),
 * so they survive scene changes, unlike the in-run commands above.
 */
export interface MenuCommands {
	/** Starts a run; the game reads hero, danger and starting weapon from the request. */
	startRun: (request: StartRunRequest) => void;
	/** Resumes the saved run (`save.activeRun`). */
	continueRun: () => void;
	/** Settings volume changed: re-apply music and sfx volume. */
	refreshAudio: () => void;
	toggleFullscreen: () => void;
}

let menuImpl: Partial<MenuCommands> = {};

export function bindMenuCommands(next: Partial<MenuCommands>): void {
	menuImpl = next;
}

export const menuCommands: MenuCommands = {
	startRun: (request) => menuImpl.startRun?.(request),
	continueRun: () => menuImpl.continueRun?.(),
	refreshAudio: () => menuImpl.refreshAudio?.(),
	toggleFullscreen: () => menuImpl.toggleFullscreen?.(),
};
