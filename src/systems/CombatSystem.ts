import { PLAYER_INVULN } from '../data/enemies';
import type { GameScene } from '../scenes/GameScene';

/** Applies damage between the player and the enemies. */
export class CombatSystem {
	constructor(private readonly game: GameScene) {}

	/** Enemy -> player damage (contact or projectile). Returns true if the hit landed. */
	hurtPlayer(raw: number): boolean {
		const g = this.game;
		if (g.params.god || g.player.invuln > 0 || g.state.hp <= 0) return false;
		const taken = Math.max(1, Math.round(raw));
		g.state.hp = Math.max(0, g.state.hp - taken);
		g.player.hurt(PLAYER_INVULN);
		g.cameras.main.shake(80, 0.004);
		g.emitHp();
		return true;
	}
}
