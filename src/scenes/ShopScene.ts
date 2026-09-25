import Phaser from 'phaser';
import { SFX } from '../art/manifest';
import { PALETTE } from '../config/palette';
import { RARITY_NAMES, STAT_SHORT, STRINGS, TAG_NAMES } from '../config/strings';
import { fitUiCamera } from '../core/viewport';
import { getItem } from '../data/items';
import type { Tag } from '../data/synergies';
import { formatStatDelta, formatStatValue } from '../logic/format';
import type { ShopOffer } from '../logic/shop';
import { STAT_KEYS, type StatKey, type Stats } from '../logic/stats';
import type { ViewSize } from '../logic/viewport';
import { playSfx } from '../systems/AudioSystem';
import { CardView } from '../ui/CardView';
import { addIcon } from '../ui/IconFactory';
import { PixelButton } from '../ui/PixelButton';
import { addPanel } from '../ui/PixelPanel';
import { addText } from '../ui/text';

export interface ShopData {
	wave: number;
	offers: ShopOffer[];
	gold(): number;
	/** Buys offer i; returns false when not affordable. */
	buy(index: number): boolean;
	/** Re-rolls the offers; returns null when not affordable. */
	reroll(): ShopOffer[] | null;
	rerollCost(): number;
	stats(): Stats;
	/** Max HP after the percentage modifier (shown instead of the raw stat). */
	maxHp(): number;
	items(): readonly string[];
	onContinue(): void;
	/** Toggles the lock of offer i (kept on re-roll and in the next shop). */
	toggleLock(index: number): void;
	/** Sells one owned item; returns the refund. */
	sell(itemId: string): number;
	sellValue(itemId: string): number;
	/** Tag counts and reached tier (synergies panel). */
	synergies(): { tag: Tag; count: number; tier: number }[];
}

const ITEM_W = 84;
const ITEM_H = 118;
const GAP = 6;
const STATS_W = 104;
/** Stats listed in the side panel (maxHpPct is folded into Max HP). */
const PANEL_STATS: readonly StatKey[] = STAT_KEYS.filter((k) => k !== 'maxHpPct');

/** Between waves: 4 items, buy, paid re-roll, Continue, current stats and owned items. */
export class ShopScene extends Phaser.Scene {
	private d!: ShopData;
	private cards: CardView[] = [];
	private focus = 0;
	private view!: ViewSize;
	private dim!: Phaser.GameObjects.Rectangle;
	private title!: Phaser.GameObjects.BitmapText;
	private goldText!: Phaser.GameObjects.BitmapText;
	private goldIcon!: Phaser.GameObjects.Image;
	private statsPanel!: Phaser.GameObjects.NineSlice;
	private statsTexts: Phaser.GameObjects.BitmapText[] = [];
	private ownedIcons: Phaser.GameObjects.GameObject[] = [];
	private reroll!: PixelButton;
	private cont!: PixelButton;
	private hint!: Phaser.GameObjects.BitmapText;

	constructor() {
		super('Shop');
	}

	init(data: ShopData): void {
		this.d = data;
		this.cards = [];
		this.statsTexts = [];
		this.ownedIcons = [];
		this.focus = 0;
	}

	create(): void {
		this.dim = this.add.rectangle(0, 0, 10, 10, PALETTE.void, 0.85).setOrigin(0, 0);
		this.title = addText(this, 0, 0, `${STRINGS.shop} - ${STRINGS.wave} ${this.d.wave + 1}`, {
			scale: 2,
			color: PALETTE.amber,
			originX: 0.5,
		});
		this.goldIcon = addIcon(this, 0, 0, 'gold');
		this.goldText = addText(this, 0, 0, '', { color: PALETTE.amber });
		this.statsPanel = addPanel(this, 0, 0, STATS_W, 10);
		this.reroll = new PixelButton(this, 0, 0, '', () => this.doReroll(), 110);
		this.cont = new PixelButton(this, 0, 0, STRINGS.continue, () => this.doContinue(), 90);
		this.hint = addText(this, 0, 0, STRINGS.shopHint, { color: PALETTE.steel, originX: 0.5 });
		this.buildCards();
		fitUiCamera(this, (view) => this.layout(view));
		this.bindKeys();
		this.refresh();
	}

	private buildCards(): void {
		for (const c of this.cards) c.destroy();
		this.cards = this.d.offers.map((offer, i) => {
			const item = getItem(offer.itemId);
			const lines = Object.entries(item?.mods ?? {}).map(([k, v]) => ({
				text: `${formatStatDelta(k as StatKey, v ?? 0)} ${STAT_SHORT[k as StatKey]}`,
				color: (v ?? 0) >= 0 ? PALETTE.green : PALETTE.red,
			}));
			const card = new CardView(
				this,
				0,
				0,
				{
					rarity: item?.rarity ?? 'common',
					rarityLabel: RARITY_NAMES[item?.rarity ?? 'common'],
					title: item?.name ?? offer.itemId,
					desc: '',
					lines,
					icon: item?.icon ?? 'unknown',
					iconScale: 1,
					hint: String(i + 1),
					footer: offer.sold ? STRINGS.sold : `${offer.price} ${STRINGS.gold}`,
					tag: offer.locked && !offer.sold ? STRINGS.locked : '',
				},
				ITEM_W,
				ITEM_H,
			);
			card.frame.on('pointerover', () => this.setFocus(i));
			card.frame.on('pointerdown', (p: Phaser.Input.Pointer) => {
				if (p.rightButtonDown()) this.doLock(i);
				else this.doBuy(i);
			});
			return card;
		});
	}

	private layout(view: ViewSize): void {
		this.view = view;
		this.dim.setSize(view.width, view.height);
		const cx = Math.round(view.width / 2);
		const cardsW = this.cards.length * ITEM_W + (this.cards.length - 1) * GAP;
		const totalW = STATS_W + 8 + cardsW;
		const left = Math.round(cx - totalW / 2);
		const top = Math.max(28, Math.round(view.height / 2 - 100));
		this.title.setPosition(cx, top - 24);
		this.statsPanel.setPosition(left, top);
		this.statsPanel.setSize(STATS_W, 12 + (PANEL_STATS.length + this.synergyRows()) * 9);
		const cardsLeft = left + STATS_W + 8;
		this.cards.forEach((c, i) => {
			c.place(Math.round(cardsLeft + ITEM_W / 2 + i * (ITEM_W + GAP)), top + ITEM_H / 2);
		});
		const by = top + ITEM_H + 16;
		this.goldIcon.setPosition(cardsLeft + 8, by);
		this.goldText.setPosition(cardsLeft + 18, by - 4);
		this.reroll.setPosition(cardsLeft + cardsW - 55 - 96, by);
		this.cont.setPosition(cardsLeft + cardsW - 45, by);
		this.layoutStats();
		const ownedBottom = this.layoutOwned(cardsLeft, by + 16, cardsW);
		const statsBottom = top + 12 + (PANEL_STATS.length + this.synergyRows()) * 9;
		this.hint.setPosition(cx, Math.max(ownedBottom, statsBottom) + 8);
	}

	private layoutStats(): void {
		for (const t of this.statsTexts) t.destroy();
		this.statsTexts = [];
		const stats = this.d.stats();
		const x = this.statsPanel.x + 5;
		let y = this.statsPanel.y + 6;
		for (const k of PANEL_STATS) {
			const value = k === 'maxHp' ? `${this.d.maxHp()}` : formatStatValue(k, stats[k]);
			this.statsTexts.push(addText(this, x, y, STAT_SHORT[k], { color: PALETTE.steel }));
			this.statsTexts.push(
				addText(this, x + STATS_W - 10, y, value, { color: PALETTE.white, originX: 1 }),
			);
			y += 9;
		}
		const active = this.d.synergies().filter((s) => s.count > 0);
		if (active.length > 0) {
			this.statsTexts.push(addText(this, x, y, STRINGS.synergies, { color: PALETTE.amber }));
			y += 9;
		}
		for (const s of active) {
			const color = s.tier > 0 ? PALETTE.green : PALETTE.steel;
			this.statsTexts.push(addText(this, x, y, TAG_NAMES[s.tag], { color }));
			this.statsTexts.push(
				addText(this, x + STATS_W - 10, y, `${s.count}`, { color, originX: 1 }),
			);
			y += 9;
		}
	}

	private synergyRows(): number {
		const n = this.d.synergies().filter((s) => s.count > 0).length;
		return n > 0 ? n + 1 : 0;
	}

	/** Draws the owned item icons; returns the bottom Y. */
	private layoutOwned(x: number, y: number, width: number): number {
		for (const o of this.ownedIcons) o.destroy();
		this.ownedIcons = [];
		const counts = new Map<string, number>();
		for (const id of this.d.items()) counts.set(id, (counts.get(id) ?? 0) + 1);
		let cx = x;
		let cy = y;
		for (const [id, n] of counts) {
			const item = getItem(id);
			const icon = addIcon(this, cx + 8, cy + 8, item?.icon ?? 'unknown');
			icon.setInteractive({ useHandCursor: true });
			icon.on('pointerover', () =>
				this.hint.setText(`${item?.name ?? id}: ${STRINGS.sell} +${this.d.sellValue(id)}`),
			);
			icon.on('pointerout', () => this.hint.setText(STRINGS.shopHint));
			icon.on('pointerdown', () => this.doSell(id));
			this.ownedIcons.push(icon);
			if (n > 1) {
				this.ownedIcons.push(
					addText(this, cx + 17, cy + 17, `${n}`, {
						color: PALETTE.yellow,
						originX: 1,
						originY: 1,
					}),
				);
			}
			cx += 18;
			if (cx + 18 > x + width) {
				cx = x;
				cy += 18;
			}
		}
		return counts.size > 0 ? cy + (cx === x ? 0 : 18) : y;
	}

	private refresh(): void {
		const gold = this.d.gold();
		this.goldText.setText(`${gold}`);
		const cost = this.d.rerollCost();
		this.reroll.setText(`${STRINGS.reroll} (${cost})`).setEnabled(gold >= cost);
		this.cards.forEach((c, i) => {
			c.setDimmed(this.d.offers[i]?.sold ?? true);
		});
		this.setFocus(this.focus);
	}

	private bindKeys(): void {
		this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
			const n = this.cards.length + 2;
			switch (e.code) {
				case 'Digit1':
				case 'Digit2':
				case 'Digit3':
				case 'Digit4':
					this.doBuy(Number(e.code.slice(-1)) - 1);
					break;
				case 'KeyL':
					if (this.focus < this.cards.length) this.doLock(this.focus);
					break;
				case 'KeyR':
					this.doReroll();
					break;
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
					this.activate(this.focus);
					break;
				case 'Escape':
					this.doContinue();
					break;
			}
		});
	}

	/** Focus index: 0..3 cards, 4 = re-roll, 5 = continue. */
	private setFocus(i: number): void {
		if (i !== this.focus) playSfx(SFX.uiHover);
		this.focus = i;
		const cards = this.cards.length;
		this.cards.forEach((c, j) => {
			c.setFocused(j === i);
		});
		this.reroll.setFocused(i === cards);
		this.cont.setFocused(i === cards + 1);
	}

	private activate(i: number): void {
		const cards = this.cards.length;
		if (i < cards) this.doBuy(i);
		else if (i === cards) this.doReroll();
		else this.doContinue();
	}

	private doBuy(i: number): void {
		const offer = this.d.offers[i];
		if (!offer || offer.sold) return;
		if (!this.d.buy(i)) {
			this.cameras.main.shake(80, 0.004);
			return;
		}
		playSfx(SFX.buy);
		this.buildCards();
		this.layout(this.view);
		// Move the focus to the next item still for sale, or to Continue.
		const next = this.d.offers.findIndex((o) => !o.sold);
		this.focus = next >= 0 ? next : this.cards.length + 1;
		this.refresh();
	}

	private doLock(i: number): void {
		const offer = this.d.offers[i];
		if (!offer || offer.sold) return;
		this.d.toggleLock(i);
		playSfx(SFX.uiClick);
		this.rebuild();
	}

	private doSell(itemId: string): void {
		if (this.d.sell(itemId) <= 0) return;
		playSfx(SFX.buy);
		this.hint.setText(STRINGS.shopHint);
		this.rebuild();
	}

	private rebuild(): void {
		this.buildCards();
		this.layout(this.view);
		this.refresh();
	}

	private doReroll(): void {
		const next = this.d.reroll();
		if (!next) return;
		playSfx(SFX.uiClick);
		this.d.offers = next;
		this.buildCards();
		this.layout(this.view);
		this.refresh();
	}

	private doContinue(): void {
		playSfx(SFX.uiClick);
		this.scene.stop();
		this.d.onContinue();
	}
}
