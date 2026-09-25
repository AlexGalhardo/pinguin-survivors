import Phaser from 'phaser';
import { SFX } from '../art/manifest';
import { PALETTE } from '../config/palette';
import {
	CHARACTER_TEXT,
	MENU,
	PASSIVE_TEXT,
	STAT_SHORT,
	UNLOCK_TEXT,
	WEAPON_NAMES,
} from '../config/strings';
import { fitUiCamera } from '../core/viewport';
import { CHARACTER_IDS, CHARACTERS, type CharacterId } from '../data/characters';
import { SHAKE } from '../data/juice';
import { formatStatValue } from '../logic/format';
import { isUnlocked } from '../logic/meta';
import { computeStats, type StatKey } from '../logic/stats';
import { playSfx } from '../systems/AudioSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { addStarfield } from '../ui/backdrop';
import { addPanel } from '../ui/PixelPanel';
import { addText } from '../ui/text';
import { pixelIn, pixelOut } from '../ui/transition';

const CARD_W = 132;
const CARD_H = 204;
const GAP = 10;
const SHOWN_STATS: readonly StatKey[] = ['maxHp', 'armor', 'critChance', 'abilityPower'];

interface ClassCard {
	id: CharacterId;
	container: Phaser.GameObjects.Container;
	panel: Phaser.GameObjects.NineSlice;
}

/** Choose Warrior / Ranger / Mage: sprite, starting weapon, base stats and best wave. */
export class CharacterSelectScene extends Phaser.Scene {
	private cards: ClassCard[] = [];
	private focus = 0;
	private top = 0;

	constructor() {
		super('CharacterSelect');
	}

	create(): void {
		this.cards = [];
		this.focus = 0;
		addStarfield(this);
		const title = addText(this, 0, 0, MENU.chooseClass, {
			scale: 2,
			color: PALETTE.amber,
			originX: 0.5,
		});
		const hint = addText(this, 0, 0, MENU.selectHint, { color: PALETTE.steel, originX: 0.5 });
		CHARACTER_IDS.forEach((id, i) => {
			this.cards.push(this.buildCard(id, i));
		});
		fitUiCamera(this, (view) => {
			const cx = Math.round(view.width / 2);
			const totalW = this.cards.length * CARD_W + (this.cards.length - 1) * GAP;
			const top = Math.max(30, Math.round(view.height / 2 - CARD_H / 2));
			this.top = top;
			title.setPosition(cx, top - 26);
			this.cards.forEach((c, i) => {
				c.container.setPosition(Math.round(cx - totalW / 2 + i * (CARD_W + GAP)), top);
			});
			hint.setPosition(cx, top + CARD_H + 10);
			this.setFocus(this.focus, false);
		});
		this.input.keyboard?.on('keydown', (e: KeyboardEvent) => this.onKey(e));
		this.setFocus(0, false);
		pixelIn(this);
	}

	private buildCard(id: CharacterId, index: number): ClassCard {
		const def = CHARACTERS[id];
		const text = CHARACTER_TEXT[id];
		const stats = computeStats(def.stats);
		const container = this.add.container(0, 0);
		const panel = addPanel(this, 0, 0, CARD_W, CARD_H);
		const sprite = this.add.image(CARD_W / 2, 30, def.texture).setScale(2);
		const name = addText(this, CARD_W / 2, 58, text.name, {
			scale: 2,
			color: PALETTE.white,
			originX: 0.5,
		});
		const weapon = addText(this, CARD_W / 2, 78, WEAPON_NAMES[def.weapon], {
			color: PALETTE.cyan,
			originX: 0.5,
		});
		const desc = addText(this, CARD_W / 2, 92, text.desc, {
			color: PALETTE.silver,
			originX: 0.5,
			align: 'center',
		}).setMaxWidth(CARD_W - 10);
		container.add([panel, sprite, name, weapon, desc]);
		let y = 124;
		const rows: [string, string][] = [
			...SHOWN_STATS.map((k): [string, string] => [
				STAT_SHORT[k],
				formatStatValue(k, stats[k]),
			]),
			[STAT_SHORT.moveSpeed, `${def.speed}`],
		];
		for (const [label, value] of rows) {
			container.add(addText(this, 8, y, label, { color: PALETTE.steel }));
			container.add(
				addText(this, CARD_W - 8, y, value, { color: PALETTE.white, originX: 1 }),
			);
			y += 9;
		}
		const passive = addText(this, CARD_W / 2, 124 + 5 * 9 + 5, PASSIVE_TEXT[id], {
			color: PALETTE.green,
			originX: 0.5,
			align: 'center',
		}).setMaxWidth(CARD_W - 10);
		container.add(passive);
		if (!isUnlocked(SaveSystem.get(), id)) {
			sprite.setTint(PALETTE.void);
			const veil = this.add
				.rectangle(0, 0, CARD_W, CARD_H, PALETTE.void, 0.88)
				.setOrigin(0, 0);
			const lock = addText(this, CARD_W / 2, 30, MENU.locked, {
				scale: 2,
				color: PALETTE.red,
				originX: 0.5,
			});
			const how = addText(this, CARD_W / 2, 56, UNLOCK_TEXT[id], {
				color: PALETTE.silver,
				originX: 0.5,
				align: 'center',
			}).setMaxWidth(CARD_W - 16);
			container.add([veil, lock, how]);
		}
		const best = SaveSystem.get().best[id];
		if (best.wave > 0) {
			container.add(
				addText(this, CARD_W / 2, 6, `${MENU.best} ${MENU.waveReached} ${best.wave}`, {
					color: PALETTE.amber,
					originX: 0.5,
				}),
			);
		}
		panel.setInteractive({ useHandCursor: true });
		panel.on('pointerover', () => this.setFocus(index));
		panel.on('pointerdown', () => this.start(index));
		return { id, container, panel };
	}

	private setFocus(i: number, sound = true): void {
		if (sound && i !== this.focus) playSfx(SFX.uiHover);
		this.focus = i;
		this.cards.forEach((c, j) => {
			c.panel.setTint(j === i ? PALETTE.yellow : 0xffffff);
			c.container.y = this.top - (j === i ? 4 : 0);
		});
	}

	private onKey(e: KeyboardEvent): void {
		const n = this.cards.length;
		switch (e.code) {
			case 'ArrowLeft':
			case 'KeyA':
				this.setFocus((this.focus + n - 1) % n);
				break;
			case 'ArrowRight':
			case 'KeyD':
				this.setFocus((this.focus + 1) % n);
				break;
			case 'Digit1':
			case 'Digit2':
			case 'Digit3':
				this.start(Number(e.code.slice(-1)) - 1);
				break;
			case 'Enter':
			case 'Space':
				this.start(this.focus);
				break;
			case 'Escape':
				playSfx(SFX.uiClick);
				pixelOut(this, () => this.scene.start('MainMenu'));
				break;
		}
	}

	private start(i: number): void {
		const card = this.cards[i];
		if (!card) return;
		if (!isUnlocked(SaveSystem.get(), card.id)) {
			this.cameras.main.shake(SHAKE.uiError.ms, SHAKE.uiError.intensity);
			return;
		}
		playSfx(SFX.uiClick);
		pixelOut(this, () => this.scene.start('Game', { character: card.id }));
	}
}
