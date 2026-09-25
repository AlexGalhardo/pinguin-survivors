import Phaser from 'phaser';
import { iconKey, TEX } from '../art/manifest';
import { UI_SLICE } from '../art/placeholders/textures';
import { PALETTE } from '../config/palette';
import type { Rarity } from '../data/rarity';
import { addText } from './text';

export const CARD_W = 112;
export const CARD_H = 124;
const HOVER_LIFT = 5;

export const RARITY_FRAME: Record<Rarity, string> = {
	common: TEX.uiCardCommon,
	rare: TEX.uiCardRare,
	epic: TEX.uiCardEpic,
	legendary: TEX.uiCardLegendary,
};

export const RARITY_COLOR: Record<Rarity, number> = {
	common: PALETTE.silver,
	rare: PALETTE.blue,
	epic: PALETTE.orchid,
	legendary: PALETTE.amber,
};

export interface CardViewContent {
	rarity: Rarity;
	rarityLabel: string;
	title: string;
	desc: string;
	tag?: string;
	icon: string;
	/** Small hint drawn at the top-left (e.g. the hotkey "1"). */
	hint?: string;
	/** Extra line at the bottom (e.g. a price). */
	footer?: string;
	footerColor?: number;
}

/** Pixel-art card: rarity frame (9-slice), icon, title, description and tags. */
export class CardView extends Phaser.GameObjects.Container {
	readonly frame: Phaser.GameObjects.NineSlice;
	private baseY: number;
	private focused = false;

	constructor(
		scene: Phaser.Scene,
		x: number,
		y: number,
		c: CardViewContent,
		w = CARD_W,
		h = CARD_H,
	) {
		super(scene, x, y);
		this.baseY = y;
		const s = UI_SLICE;
		this.frame = scene.add.nineslice(0, 0, RARITY_FRAME[c.rarity], undefined, w, h, s, s, s, s);
		const color = RARITY_COLOR[c.rarity];
		const top = -h / 2;
		const icon = scene.add.image(0, top + 30, iconKey(c.icon)).setScale(2);
		const rarity = addText(scene, 0, top + 6, c.rarityLabel, { color, originX: 0.5 });
		const title = addText(scene, 0, top + 52, c.title, {
			color: PALETTE.white,
			originX: 0.5,
			align: 'center',
		}).setMaxWidth(w - 12);
		const desc = addText(scene, 0, top + 76, c.desc, {
			color: PALETTE.silver,
			originX: 0.5,
			align: 'center',
		}).setMaxWidth(w - 12);
		this.add([this.frame, icon, rarity, title, desc]);
		if (c.tag) {
			this.add(addText(scene, 0, h / 2 - 22, c.tag, { color: PALETTE.green, originX: 0.5 }));
		}
		if (c.hint) {
			this.add(addText(scene, -w / 2 + 5, top + 6, c.hint, { color: PALETTE.steel }));
		}
		if (c.footer) {
			this.add(
				addText(scene, 0, h / 2 - 12, c.footer, {
					color: c.footerColor ?? PALETTE.amber,
					originX: 0.5,
				}),
			);
		}
		this.frame.setTint(PALETTE.silver);
		this.frame.setInteractive({ useHandCursor: true });
		scene.add.existing(this);
	}

	/** Moves the card (resting position; focus lifts it from here). */
	place(x: number, y: number): void {
		this.baseY = y;
		this.setPosition(x, y - (this.focused ? HOVER_LIFT : 0));
	}

	setFocused(focused: boolean): void {
		if (this.focused === focused) return;
		this.focused = focused;
		this.y = this.baseY - (focused ? HOVER_LIFT : 0);
		this.frame.setTint(focused ? 0xffffff : PALETTE.silver);
	}
}
