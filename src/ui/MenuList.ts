import type Phaser from 'phaser';
import { PALETTE, toCss } from '../config/palette';
import { UI_FONT } from './font';

export interface MenuItem {
	/** Label is re-read on every refresh so values (volume, language…) stay current. */
	label: () => string;
	onSelect?: () => void;
	/** Left/right change the value (settings). */
	onAdjust?: (dir: -1 | 1) => void;
	disabled?: () => boolean;
}

export interface MenuOptions {
	x: number;
	y: number;
	fontSize?: number;
	spacing?: number;
	align?: 'left' | 'center';
	onBack?: () => void;
}

/**
 * Vertical menu navigable by keyboard (↑↓ / W S, ←→ / A D for values, Enter/Space, Esc) and
 * mouse (hover + click). Gamepad works through the synthetic key bridge.
 */
export class MenuList {
	private readonly texts: Phaser.GameObjects.Text[] = [];
	private focus = 0;
	private readonly spacing: number;

	constructor(
		scene: Phaser.Scene,
		private readonly items: MenuItem[],
		opts: MenuOptions,
	) {
		const size = opts.fontSize ?? 14;
		this.spacing = opts.spacing ?? size + 8;
		items.forEach((item, i) => {
			const text = scene.add
				.text(0, 0, '', {
					fontFamily: UI_FONT,
					fontSize: `${size}px`,
					color: toCss(PALETTE.textLight),
				})
				.setOrigin(opts.align === 'left' ? 0 : 0.5, 0)
				.setInteractive({ useHandCursor: true });
			text.on('pointerover', () => this.setFocus(i));
			text.on('pointerdown', (p: Phaser.Input.Pointer) => {
				this.setFocus(i);
				if (item.onAdjust) item.onAdjust(p.x < text.getBounds().centerX ? -1 : 1);
				else this.select();
				this.refresh();
			});
			this.texts.push(text);
		});
		const kb = scene.input.keyboard;
		const on = (keys: string[], fn: () => void) => {
			for (const k of keys) kb?.on(`keydown-${k}`, fn);
		};
		on(['UP', 'W'], () => this.move(-1));
		on(['DOWN', 'S'], () => this.move(1));
		on(['LEFT', 'A'], () => this.adjust(-1));
		on(['RIGHT', 'D'], () => this.adjust(1));
		on(['ENTER', 'SPACE'], () => this.select());
		on(['ESC', 'BACKSPACE'], () => opts.onBack?.());
		this.layout(opts.x, opts.y);
		this.setFocus(this.firstEnabled());
	}

	layout(x: number, y: number): void {
		this.texts.forEach((t, i) => {
			t.setPosition(Math.round(x), Math.round(y + i * this.spacing));
		});
	}

	get height(): number {
		return this.texts.length * this.spacing;
	}

	refresh(): void {
		this.texts.forEach((t, i) => {
			// The scene may have restarted inside the item callback (language change).
			if (!t.scene) return;
			const item = this.items[i] as MenuItem;
			const off = item.disabled?.() ?? false;
			const focused = i === this.focus;
			const label = item.label();
			t.setText(focused ? `> ${label} <` : label);
			t.setColor(toCss(off ? PALETTE.textDim : focused ? PALETTE.crit : PALETTE.textLight));
			t.setAlpha(off ? 0.5 : 1);
		});
	}

	private firstEnabled(): number {
		const i = this.items.findIndex((it) => !(it.disabled?.() ?? false));
		return Math.max(0, i);
	}

	private setFocus(i: number): void {
		this.focus = i;
		this.refresh();
	}

	private move(dir: -1 | 1): void {
		const n = this.items.length;
		for (let step = 1; step <= n; step++) {
			const i = (this.focus + dir * step + n) % n;
			if (!(this.items[i]?.disabled?.() ?? false)) {
				this.setFocus(i);
				return;
			}
		}
	}

	private adjust(dir: -1 | 1): void {
		this.items[this.focus]?.onAdjust?.(dir);
		this.refresh();
	}

	private select(): void {
		const item = this.items[this.focus];
		if (!item || item.disabled?.()) return;
		if (item.onSelect) item.onSelect();
		else item.onAdjust?.(1);
		this.refresh();
	}
}
