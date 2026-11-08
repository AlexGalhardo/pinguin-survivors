import type { HeroId } from '../config/constants';

/** UI to game bridge (SDD-004 RF-03). The game binds the implementation; the UI never imports the game engine. */
export interface GameCommands {
	startRun: (hero: HeroId, weapon: string) => void;
	pickCard: (cardId: string) => void;
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
}

let impl: Partial<GameCommands> = {};

/** Called by the game once its scenes can honor the commands; later calls replace earlier ones. */
export function bindCommands(next: Partial<GameCommands>): void {
	impl = next;
}

/** Commands not bound yet are ignored, so UI built ahead of the game never throws. */
export const commands: GameCommands = {
	startRun: (hero, weapon) => impl.startRun?.(hero, weapon),
	pickCard: (id) => impl.pickCard?.(id),
	buy: (index) => impl.buy?.(index),
	reroll: () => impl.reroll?.(),
	lock: (index) => impl.lock?.(index),
	sell: (slot) => impl.sell?.(slot),
	fuse: (a, b) => impl.fuse?.(a, b),
	closeShop: () => impl.closeShop?.(),
	pause: () => impl.pause?.(),
	resume: () => impl.resume?.(),
};
