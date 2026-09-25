import type Phaser from 'phaser';
import { SFX } from '../art/manifest';
import { claimKeyEvent } from '../logic/key-claim';
import { playSfx } from '../systems/AudioSystem';
import { PixelButton } from './PixelButton';

const MENU_KEYS = new Set([
	'ArrowUp',
	'KeyW',
	'ArrowDown',
	'KeyS',
	'ArrowLeft',
	'KeyA',
	'ArrowRight',
	'KeyD',
	'Enter',
	'Space',
]);

export interface MenuItem {
	label: string;
	onSelect: () => void;
	/** Left/right adjust (settings rows). */
	onAdjust?: (dir: -1 | 1) => void;
	enabled?: boolean;
}

/**
 * Vertical list of PixelButtons navigable with mouse and keyboard
 * (Up/Down or W/S to move, Enter/Space to select, Left/Right or A/D to adjust).
 */
export class MenuList {
	readonly buttons: PixelButton[] = [];
	private focus = 0;
	/** Inactive menus ignore the keyboard (e.g. a hidden confirmation). */
	active = true;
	private readonly onKey = (e: KeyboardEvent) => this.handleKey(e);

	constructor(
		private readonly scene: Phaser.Scene,
		private readonly items: MenuItem[],
		width = 140,
		private readonly spacing = 22,
	) {
		items.forEach((item, i) => {
			const b = new PixelButton(scene, 0, 0, item.label, () => item.onSelect(), width);
			b.setEnabled(item.enabled ?? true);
			b.bg.on('pointerover', () => this.setFocus(i, false));
			this.buttons.push(b);
		});
		scene.input.keyboard?.on('keydown', this.onKey);
		scene.events.once('shutdown', () => scene.input.keyboard?.off('keydown', this.onKey));
		this.setFocus(this.firstEnabled(0, 1), false);
	}

	/** Centers the list horizontally at cx starting at y. */
	layout(cx: number, y: number): void {
		this.buttons.forEach((b, i) => {
			b.setPosition(Math.round(cx), Math.round(y + i * this.spacing));
		});
	}

	get height(): number {
		return this.items.length * this.spacing;
	}

	setLabel(index: number, label: string): void {
		this.buttons[index]?.setText(label);
	}

	private firstEnabled(from: number, dir: 1 | -1): number {
		const n = this.items.length;
		for (let k = 0; k < n; k++) {
			const i = (((from + dir * k) % n) + n) % n;
			if (this.buttons[i]?.isEnabled) return i;
		}
		return from;
	}

	private setFocus(i: number, sound = true): void {
		if (sound && i !== this.focus) playSfx(SFX.uiHover);
		this.focus = i;
		this.buttons.forEach((b, j) => {
			b.setFocused(j === i);
		});
	}

	private handleKey(e: KeyboardEvent): void {
		if (!this.active || !this.scene.scene.isActive()) return;
		if (!MENU_KEYS.has(e.code) || !claimKeyEvent(e)) return;
		const n = this.items.length;
		switch (e.code) {
			case 'ArrowUp':
			case 'KeyW':
				this.setFocus(this.firstEnabled((this.focus + n - 1) % n, -1));
				break;
			case 'ArrowDown':
			case 'KeyS':
				this.setFocus(this.firstEnabled((this.focus + 1) % n, 1));
				break;
			case 'ArrowLeft':
			case 'KeyA':
				this.items[this.focus]?.onAdjust?.(-1);
				break;
			case 'ArrowRight':
			case 'KeyD':
				this.items[this.focus]?.onAdjust?.(1);
				break;
			case 'Enter':
			case 'Space':
				this.buttons[this.focus]?.click();
				break;
		}
	}
}
