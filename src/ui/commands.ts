import type { HeroId } from '../config/constants';

/** UI to game bridge (SDD-004 RF-03). The game binds the implementation; the UI never imports the game engine. */
export interface GameCommands {
	startRun: (hero: HeroId, weapon: string) => void;
	pickCard: (cardId: string) => void;
	buy: (offerId: string) => void;
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
	buy: (id) => impl.buy?.(id),
	closeShop: () => impl.closeShop?.(),
	pause: () => impl.pause?.(),
	resume: () => impl.resume?.(),
};
