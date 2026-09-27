import Phaser from 'phaser';
import { PALETTE, toCss } from '../config/palette';
import { trackZoom } from '../core/viewport';
import type { Rarity } from '../data/cards';
import { type I18nKey, t } from '../i18n';
import type { Build } from '../logic/build';
import type { CardOffer } from '../logic/cards';
import { cardDescription, cardName } from '../ui/card-text';
import { UI_FONT } from '../ui/font';

export interface CardPickData {
	round: number;
	offers: CardOffer[];
	build: Build;
	onPick: (index: number) => void;
}

const CARD_W = 132;
const CARD_H = 176;
const GAP = 14;

const RARITY_COLOR: Record<Rarity, number> = {
	common: PALETTE.rarityCommon,
	rare: PALETTE.rarityRare,
	epic: PALETTE.rarityEpic,
	legendary: PALETTE.rarityLegendary,
};

/** 3 upgrade cards between rounds, with the game paused (docs/ui-hud.md §CardPick). */
export class CardPickScene extends Phaser.Scene {
	private cards: Phaser.GameObjects.Container[] = [];
	private focus = 0;
	private picked = false;
	/** Layout center; the camera worldView only updates on the next render. */
	private centerY = 0;

	constructor() {
		super('CardPick');
	}

	create(data: CardPickData): void {
		this.cards = [];
		this.focus = 0;
		this.picked = false;
		const style = (size: number, color: number, wrap?: number) => ({
			fontFamily: UI_FONT,
			fontSize: `${size}px`,
			color: toCss(color),
			align: 'center',
			wordWrap: wrap ? { width: wrap } : undefined,
		});
		const dim = this.add.rectangle(0, 0, 10, 10, PALETTE.night, 0.75).setOrigin(0, 0);
		const title = this.add
			.text(0, 0, t('cards.title', { n: data.round }), style(16, PALETTE.textLight))
			.setOrigin(0.5, 0);
		const hint = this.add
			.text(0, 0, t('cards.hint'), style(8, PALETTE.textDim))
			.setOrigin(0.5, 0);

		data.offers.forEach((offer, i) => {
			const color = RARITY_COLOR[offer.rarity];
			const bg = this.add
				.rectangle(0, 0, CARD_W, CARD_H, 0x151a24, 0.96)
				.setStrokeStyle(2, color)
				.setInteractive({ useHandCursor: true });
			const tag = this.add
				.text(0, -CARD_H / 2 + 8, this.tagText(offer, data.build), style(8, color))
				.setOrigin(0.5, 0);
			const name = this.add
				.text(
					0,
					-CARD_H / 2 + 26,
					cardName(offer.card),
					style(12, PALETTE.textLight, CARD_W - 12),
				)
				.setOrigin(0.5, 0);
			const desc = this.add
				.text(
					0,
					-6,
					cardDescription(offer.card, offer.rarity),
					style(9, PALETTE.textDim, CARD_W - 16),
				)
				.setOrigin(0.5, 0);
			const rarity = this.add
				.text(0, CARD_H / 2 - 16, t(`rarity.${offer.rarity}` as I18nKey), style(8, color))
				.setOrigin(0.5, 0);
			const key = this.add.text(
				-CARD_W / 2 + 6,
				CARD_H / 2 - 16,
				String(i + 1),
				style(8, PALETTE.textDim),
			);
			const card = this.add.container(0, 0, [bg, tag, name, desc, rarity, key]);
			bg.on('pointerover', () => this.setFocus(i));
			bg.on('pointerdown', () => this.pick(i, data));
			this.cards.push(card);
		});

		const kb = this.input.keyboard;
		kb?.on('keydown-ONE', () => this.pick(0, data));
		kb?.on('keydown-TWO', () => this.pick(1, data));
		kb?.on('keydown-THREE', () => this.pick(2, data));
		kb?.on('keydown-LEFT', () => this.setFocus(this.focus - 1));
		kb?.on('keydown-RIGHT', () => this.setFocus(this.focus + 1));
		kb?.on('keydown-A', () => this.setFocus(this.focus - 1));
		kb?.on('keydown-D', () => this.setFocus(this.focus + 1));
		kb?.on('keydown-ENTER', () => this.pick(this.focus, data));

		const cam = this.cameras.main;
		trackZoom(this, cam, (view) => {
			cam.centerOn(view.width / 2, view.height / 2);
			dim.setSize(view.width, view.height);
			const cx = view.width / 2;
			const cy = view.height / 2;
			this.centerY = Math.round(cy);
			title.setPosition(Math.round(cx), Math.round(cy - CARD_H / 2 - 40));
			hint.setPosition(Math.round(cx), Math.round(cy + CARD_H / 2 + 16));
			const total = this.cards.length * CARD_W + (this.cards.length - 1) * GAP;
			for (const [i, c] of this.cards.entries())
				c.setPosition(
					Math.round(cx - total / 2 + CARD_W / 2 + i * (CARD_W + GAP)),
					Math.round(cy),
				);
			this.setFocus(this.focus);
		});
	}

	private tagText(offer: CardOffer, build: Build): string {
		const e = offer.card.effect;
		if (e.type === 'evolve') return t('cards.evolve');
		const level =
			e.type === 'secondary'
				? build.secondaries[e.weapon]
				: e.type === 'perk'
					? build.perks[e.perk]
					: undefined;
		if (level) return t('cards.level', { from: level, to: level + 1 });
		if (offer.card.hero)
			return t('cards.exclusive', {
				hero: t(`hero.${offer.card.hero}` as I18nKey).toUpperCase(),
			});
		return e.type === 'stat' ? '' : t('cards.new');
	}

	private setFocus(i: number): void {
		const n = this.cards.length;
		if (n === 0) return;
		this.focus = (i + n) % n;
		this.cards.forEach((c, j) => {
			c.setScale(j === this.focus ? 1.05 : 1);
			c.y = this.centerY - (j === this.focus ? 6 : 0);
		});
	}

	private pick(i: number, data: CardPickData): void {
		if (this.picked || i < 0 || i >= this.cards.length) return;
		this.picked = true;
		data.onPick(i);
		this.scene.stop();
	}
}
