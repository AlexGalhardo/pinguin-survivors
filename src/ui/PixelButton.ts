import Phaser from 'phaser';
import { SFX, TEX } from '../art/manifest';
import { UI_SLICE } from '../art/placeholders/textures';
import { PALETTE } from '../config/palette';
import { playSfx } from '../systems/AudioSystem';
import { addText } from './text';

export type ButtonState = 'normal' | 'hover' | 'pressed' | 'disabled';

const TEXTURES: Record<ButtonState, string> = {
	normal: TEX.uiButton,
	hover: TEX.uiButtonHover,
	pressed: TEX.uiButtonPressed,
	disabled: TEX.uiButtonDisabled,
};

/** 9-slice pixel button with normal / hover / pressed / disabled states. Origin at the center. */
export class PixelButton extends Phaser.GameObjects.Container {
	readonly bg: Phaser.GameObjects.NineSlice;
	readonly label: Phaser.GameObjects.BitmapText;
	private btnState: ButtonState = 'normal';
	private enabled = true;
	private focused = false;
	/** Sound hook (defaults to the AudioSystem). */
	sfx: (key: string) => void = playSfx;

	constructor(
		scene: Phaser.Scene,
		x: number,
		y: number,
		text: string,
		private readonly onClick: () => void,
		width = 96,
		height = 18,
	) {
		super(scene, x, y);
		const s = UI_SLICE;
		this.bg = scene.add.nineslice(0, 0, TEXTURES.normal, undefined, width, height, s, s, s, s);
		this.label = addText(scene, 0, 0, text, { originX: 0.5, originY: 0.5 });
		this.add([this.bg, this.label]);
		this.bg.setInteractive({ useHandCursor: true });
		this.bg.on('pointerover', () => {
			if (!this.enabled) return;
			this.sfx(SFX.uiHover);
			this.apply('hover');
		});
		this.bg.on('pointerout', () => this.apply(this.focused ? 'hover' : 'normal'));
		this.bg.on('pointerdown', () => this.enabled && this.apply('pressed'));
		this.bg.on('pointerup', () => {
			if (!this.enabled) return;
			this.apply('hover');
			this.click();
		});
		scene.add.existing(this);
	}

	click(): void {
		if (!this.enabled) return;
		this.sfx(SFX.uiClick);
		this.onClick();
	}

	setText(text: string): this {
		this.label.setText(text);
		return this;
	}

	setEnabled(enabled: boolean): this {
		this.enabled = enabled;
		this.apply(enabled ? (this.focused ? 'hover' : 'normal') : 'disabled');
		return this;
	}

	get isEnabled(): boolean {
		return this.enabled;
	}

	/** Keyboard focus (same look as hover). */
	setFocused(focused: boolean): this {
		this.focused = focused;
		if (this.enabled) this.apply(focused ? 'hover' : 'normal');
		return this;
	}

	private apply(state: ButtonState): void {
		this.btnState = state;
		this.bg.setTexture(TEXTURES[state]);
		this.label.setTint(
			state === 'disabled'
				? PALETTE.slate
				: state === 'hover'
					? PALETTE.yellow
					: PALETTE.white,
		);
		this.label.y = state === 'pressed' ? 1 : 0;
	}

	get buttonState(): ButtonState {
		return this.btnState;
	}
}
