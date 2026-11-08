import type { SfxKey } from '../data/sfx';

type Player = (key: SfxKey) => void;

let player: Player | null = null;

/** The game binds the SFX player once Phaser is up; before that (and in tests) menu sounds are no-ops. */
export function bindUiSound(next: Player | null): void {
	player = next;
}

/** Menu feedback: hover tick, confirm click, back click. */
export function uiSound(key: 'sfx.uiHover' | 'sfx.uiConfirm' | 'sfx.uiBack'): void {
	player?.(key);
}
