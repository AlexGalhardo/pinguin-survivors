import Phaser from 'phaser';
import { SFX } from '../art/manifest';
import { PALETTE } from '../config/palette';
import { STRINGS } from '../config/strings';
import { fitUiCamera } from '../core/viewport';
import type { Card } from '../data/cards';
import type { ViewSize } from '../logic/viewport';
import { playSfx } from '../systems/AudioSystem';
import { CARD_H, CARD_W, CardView } from '../ui/CardView';
import { cardText } from '../ui/card-text';
import { PixelButton } from '../ui/PixelButton';
import { addText } from '../ui/text';

export interface CardPickData {
	wave: number;
	cards: Card[];
	/** Called with the chosen card index. */
	onPick: (index: number) => void;
	/** Sound hook (AudioSystem). */
	sfx?: (key: string) => void;
	/** Paid re-roll: returns new cards, or null when not affordable. */
	reroll?: () => Card[] | null;
	rerollCost?: () => number;
	gold?: () => number;
}

const GAP = 10;

/** End-of-wave card choice: 3 cards, mouse (hover/click) or keys 1/2/3, arrows + Enter. */
export class CardPickScene extends Phaser.Scene {
	private data$!: CardPickData;
	private views: CardView[] = [];
	private focus = 0;
	private done = false;
	private dim!: Phaser.GameObjects.Rectangle;
	private title!: Phaser.GameObjects.BitmapText;
	private subtitle!: Phaser.GameObjects.BitmapText;
	private hint!: Phaser.GameObjects.BitmapText;
	private rerollBtn: PixelButton | null = null;
	private view!: ViewSize;

	constructor() {
		super('CardPick');
	}

	init(data: CardPickData): void {
		this.data$ = data;
		this.views = [];
		this.focus = 0;
		this.done = false;
	}

	create(): void {
		this.dim = this.add.rectangle(0, 0, 10, 10, PALETTE.void, 0.75).setOrigin(0, 0);
		this.title = addText(this, 0, 0, `${STRINGS.wave} ${this.data$.wave} ${STRINGS.cleared}`, {
			scale: 2,
			color: PALETTE.green,
			originX: 0.5,
		});
		this.subtitle = addText(this, 0, 0, STRINGS.chooseUpgrade, {
			color: PALETTE.white,
			originX: 0.5,
		});
		this.hint = addText(this, 0, 0, STRINGS.pickHint, { color: PALETTE.steel, originX: 0.5 });
		this.buildCards();
		if (this.data$.reroll) {
			this.rerollBtn = new PixelButton(this, 0, 0, '', () => this.doReroll(), 120);
			this.updateReroll();
		} else this.rerollBtn = null;
		fitUiCamera(this, (view) => this.layout(view));
		this.bindKeys();
		this.setFocus(0);
	}

	private updateReroll(): void {
		if (!this.rerollBtn) return;
		const cost = this.data$.rerollCost?.() ?? 0;
		const gold = this.data$.gold?.() ?? 0;
		this.rerollBtn
			.setText(`${STRINGS.reroll} (${cost} ${STRINGS.gold})`)
			.setEnabled(gold >= cost);
	}

	private doReroll(): void {
		if (this.done) return;
		const cards = this.data$.reroll?.();
		if (!cards) return;
		this.data$.cards = cards;
		for (const v of this.views) v.destroy();
		this.views = [];
		this.buildCards();
		this.layout(this.view);
		this.updateReroll();
	}

	private buildCards(): void {
		this.data$.cards.forEach((card, i) => {
			const t = cardText(card);
			const view = new CardView(this, 0, 0, {
				rarity: card.rarity,
				rarityLabel: t.rarity,
				title: t.title,
				desc: t.desc,
				tag: t.tag,
				icon: t.icon,
				hint: String(i + 1),
			});
			view.frame.on('pointerover', () => this.setFocus(i));
			view.frame.on('pointerdown', () => this.choose(i));
			this.views.push(view);
		});
	}

	private layout(view: ViewSize): void {
		this.view = view;
		this.dim.setSize(view.width, view.height);
		const cx = Math.round(view.width / 2);
		const totalW = this.views.length * CARD_W + (this.views.length - 1) * GAP;
		const cardY = Math.round(view.height / 2 + 10);
		this.views.forEach((v, i) => {
			v.place(Math.round(cx - totalW / 2 + CARD_W / 2 + i * (CARD_W + GAP)), cardY);
		});
		this.title.setPosition(cx, cardY - CARD_H / 2 - 36);
		this.subtitle.setPosition(cx, cardY - CARD_H / 2 - 16);
		this.hint.setPosition(cx, cardY + CARD_H / 2 + 8);
		this.rerollBtn?.setPosition(cx, cardY + CARD_H / 2 + 30);
	}

	private bindKeys(): void {
		const kb = this.input.keyboard;
		if (!kb) return;
		kb.on('keydown', (e: KeyboardEvent) => {
			const n = this.views.length;
			switch (e.code) {
				case 'Digit1':
				case 'Digit2':
				case 'Digit3':
				case 'Numpad1':
				case 'Numpad2':
				case 'Numpad3': {
					const i = Number(e.code.slice(-1)) - 1;
					if (i < n) this.choose(i);
					break;
				}
				case 'ArrowLeft':
				case 'KeyA':
					this.setFocus((this.focus + n - 1) % n);
					break;
				case 'ArrowRight':
				case 'KeyD':
					this.setFocus((this.focus + 1) % n);
					break;
				case 'Enter':
				case 'Space':
					this.choose(this.focus);
					break;
				case 'KeyR':
					this.doReroll();
					break;
			}
		});
	}

	private setFocus(i: number): void {
		if (i !== this.focus) (this.data$.sfx ?? playSfx)(SFX.uiHover);
		this.focus = i;
		this.views.forEach((v, j) => {
			v.setFocused(j === i);
		});
	}

	private choose(i: number): void {
		if (this.done || !this.views[i]) return;
		this.done = true;
		(this.data$.sfx ?? playSfx)(SFX.cardPick);
		const view = this.views[i];
		this.tweens.add({
			targets: view,
			scale: 1.08,
			duration: 120,
			yoyo: true,
			onComplete: () => {
				this.scene.stop();
				this.data$.onPick(i);
			},
		});
	}
}
