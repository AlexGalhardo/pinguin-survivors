import Phaser from 'phaser';
import { PALETTE, toCss } from '../config/palette';
import { sfx } from '../core/audio';
import { trackZoom } from '../core/viewport';
import type { Rarity } from '../data/cards';
import { type I18nKey, t } from '../i18n';
import type { Build } from '../logic/build';
import type { CardOffer } from '../logic/cards';
import { cardDescription, cardName } from '../ui/card-text';
import { TITLE_FONT, UI_FONT, UI_WEIGHT } from '../ui/font';

export interface CardPickData {
	round: number;
	offers: CardOffer[];
	build: Build;
	onPick: (index: number) => void;
}

const CARD_W = 200;
const CARD_H = 270;
const GAP = 24;
/** Colored rarity band at the top of each card. */
const BAND_H = 30;

const RARITY_COLOR: Record<Rarity, number> = {
	common: PALETTE.rarityCommon,
	rare: PALETTE.rarityRare,
	epic: PALETTE.rarityEpic,
	legendary: PALETTE.rarityLegendary,
};

/** 3 upgrade cards between rounds, with the game paused (docs/gdd.md §21 §CardPick). */
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
		const style = (size: number, color: number, wrap?: number, bold = false) => ({
			fontFamily: UI_FONT,
			fontSize: `${size}px`,
			fontStyle: bold ? 'bold' : UI_WEIGHT,
			color: toCss(color),
			align: 'center',
			wordWrap: wrap ? { width: wrap } : undefined,
			lineSpacing: 3,
			stroke: toCss(PALETTE.night),
			strokeThickness: bold ? 3 : 0,
		});
		const dim = this.add.rectangle(0, 0, 10, 10, PALETTE.night, 0.8).setOrigin(0, 0);
		const title = this.add
			.text(0, 0, t('cards.title', { n: data.round }), {
				...style(30, PALETTE.crit, undefined, true),
				fontFamily: TITLE_FONT,
			})
			.setOrigin(0.5, 0);
		const hint = this.add
			.text(0, 0, t('cards.hint'), style(14, PALETTE.textDim))
			.setOrigin(0.5, 0);

		data.offers.forEach((offer, i) => {
			const color = RARITY_COLOR[offer.rarity];
			const top = -CARD_H / 2;
			const bg = this.add
				.rectangle(0, 0, CARD_W, CARD_H, 0x141820, 0.98)
				.setStrokeStyle(3, color)
				.setInteractive({ useHandCursor: true });
			const band = this.add
				.rectangle(0, top + BAND_H / 2, CARD_W - 6, BAND_H - 3, color, 0.3)
				.setOrigin(0.5);
			const rarity = this.add
				.text(
					0,
					top + BAND_H / 2,
					t(`rarity.${offer.rarity}` as I18nKey).toUpperCase(),
					style(14, color, undefined, true),
				)
				.setOrigin(0.5);
			const name = this.add
				.text(
					0,
					top + BAND_H + 14,
					cardName(offer.card),
					style(20, PALETTE.textLight, CARD_W - 20, true),
				)
				.setOrigin(0.5, 0);
			const divider = this.add
				.rectangle(0, top + BAND_H + 14 + name.height + 10, CARD_W - 40, 2, color, 0.6)
				.setOrigin(0.5);
			const desc = this.add
				.text(
					0,
					divider.y + 12,
					cardDescription(offer.card, offer.rarity),
					style(15, 0xd9dee8, CARD_W - 24),
				)
				.setOrigin(0.5, 0);
			const tag = this.add
				.text(
					0,
					CARD_H / 2 - 42,
					this.tagText(offer, data.build),
					style(13, color, CARD_W - 20, true),
				)
				.setOrigin(0.5, 0);
			const key = this.add
				.text(
					0,
					CARD_H / 2 - 22,
					`[ ${i + 1} ]`,
					style(13, PALETTE.textDim, undefined, true),
				)
				.setOrigin(0.5, 0);
			const card = this.add.container(0, 0, [
				bg,
				band,
				rarity,
				name,
				divider,
				desc,
				tag,
				key,
			]);
			card.setData('bg', bg).setData('color', color);
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
			title.setPosition(Math.round(cx), Math.round(cy - CARD_H / 2 - 56));
			hint.setPosition(Math.round(cx), Math.round(cy + CARD_H / 2 + 22));
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
			const on = j === this.focus;
			c.setScale(on ? 1.06 : 1);
			c.y = this.centerY - (on ? 8 : 0);
			const bg = c.getData('bg') as Phaser.GameObjects.Rectangle;
			bg.setStrokeStyle(on ? 5 : 3, on ? PALETTE.crit : (c.getData('color') as number));
		});
	}

	private pick(i: number, data: CardPickData): void {
		if (this.picked || i < 0 || i >= this.cards.length) return;
		this.picked = true;
		sfx(this, 'sfx.card');
		data.onPick(i);
		this.scene.stop();
	}
}
