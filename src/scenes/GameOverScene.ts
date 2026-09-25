import Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { CHARACTER_TEXT, MENU, STRINGS } from '../config/strings';
import { fitUiCamera } from '../core/viewport';
import type { CharacterId } from '../data/characters';
import { getItem } from '../data/items';
import { formatTime } from '../logic/format';
import type { AbilityState, RunTotals } from '../logic/run-state';
import { addIcon } from '../ui/IconFactory';
import { MenuList } from '../ui/MenuList';
import { addPanel } from '../ui/PixelPanel';
import { addText } from '../ui/text';
import { pixelOut } from '../ui/transition';

export interface GameOverData {
	character: CharacterId;
	wave: number;
	totals: RunTotals;
	abilities: AbilityState[];
	items: string[];
	newBest: boolean;
	bestWave: number;
	cores?: number;
	achievements?: string[];
	/** Why the run ended (defaults to death). */
	reason?: 'died' | 'timeUp';
}

const PANEL_W = 250;
const ICON_COLS = 12;
const ICON_STEP = 18;
const MENU_SPACING = 22;

/** "YOU DIED — WAVE N", run statistics, build, record; Retry / Main Menu. */
export class GameOverScene extends Phaser.Scene {
	private d!: GameOverData;

	constructor() {
		super('GameOver');
	}

	init(data: GameOverData): void {
		this.d = data;
	}

	create(): void {
		const d = this.d;
		const dim = this.add.rectangle(0, 0, 10, 10, PALETTE.void, 0.85).setOrigin(0, 0);
		const headline = d.reason === 'timeUp' ? STRINGS.timeUp : STRINGS.youDied;
		const title = addText(this, 0, 0, `${headline} - ${STRINGS.wave} ${d.wave}`, {
			scale: 2,
			color: PALETTE.red,
			originX: 0.5,
		});
		const best = addText(
			this,
			0,
			0,
			d.newBest ? MENU.newBest : `${MENU.best} ${MENU.waveReached} ${d.bestWave}`,
			{ color: d.newBest ? PALETTE.yellow : PALETTE.steel, originX: 0.5 },
		);
		if (d.newBest) {
			this.tweens.add({ targets: best, alpha: 0.3, duration: 400, yoyo: true, repeat: -1 });
		}
		const rows: [string, string][] = [
			[CHARACTER_TEXT[d.character].name, ''],
			[MENU.time, formatTime(d.totals.timeSec)],
			[MENU.kills, `${d.totals.kills}`],
			[MENU.damage, `${Math.round(d.totals.damageDealt)}`],
			[MENU.goldTotal, `${d.totals.goldEarned}`],
			[MENU.coresEarned, `+${d.cores ?? 0}`],
		];
		const rowTexts = rows.map(([l, v]) => [
			addText(this, 0, 0, l, { color: PALETTE.steel }),
			addText(this, 0, 0, v, { color: PALETTE.white, originX: 1 }),
		]);
		const buildLabel = addText(this, 0, 0, MENU.build, { color: PALETTE.steel });
		const icons = [
			...d.abilities.map((a) => ({ icon: a.id, level: `${a.level}` })),
			...d.items.map((id) => ({ icon: getItem(id)?.icon ?? 'unknown', level: '' })),
		].map((b) => ({
			img: addIcon(this, 0, 0, b.icon),
			lvl: addText(this, 0, 0, b.level, { color: PALETTE.yellow, originX: 1, originY: 1 }),
		}));
		// Layout is derived from the build size so the buttons never cover the icons.
		const rowsTop = 44;
		const buildTop = rowsTop + rows.length * 10 + 4;
		const iconRows = Math.max(1, Math.ceil(icons.length / ICON_COLS));
		const menuTop = buildTop + 12 + iconRows * ICON_STEP + 14;
		const panelH = menuTop + MENU_SPACING * 2 + 4;
		const panel = addPanel(this, 0, 0, PANEL_W, panelH);
		this.children.sendToBack(panel);
		this.children.sendToBack(dim);
		const menu = new MenuList(
			this,
			[
				{ label: MENU.retry, onSelect: () => this.retry() },
				{ label: MENU.mainMenu, onSelect: () => this.toMenu() },
			],
			140,
			MENU_SPACING,
		);
		fitUiCamera(this, (view) => {
			const cx = Math.round(view.width / 2);
			const top = Math.max(4, Math.round(view.height / 2 - panelH / 2));
			const left = cx - PANEL_W / 2;
			dim.setSize(view.width, view.height);
			panel.setPosition(left, top);
			title.setPosition(cx, top + 8);
			best.setPosition(cx, top + 28);
			rowTexts.forEach(([l, v], i) => {
				l?.setPosition(left + 10, top + rowsTop + i * 10);
				v?.setPosition(left + PANEL_W - 10, top + rowsTop + i * 10);
			});
			const by = top + buildTop;
			buildLabel.setPosition(left + 10, by);
			icons.forEach((ic, i) => {
				const x = left + 10 + (i % ICON_COLS) * ICON_STEP;
				const y = by + 12 + Math.floor(i / ICON_COLS) * ICON_STEP;
				ic.img.setPosition(x + 8, y + 8);
				ic.lvl.setPosition(x + 17, y + 17);
			});
			// MenuList positions button centers; buttons are 18 px tall.
			menu.layout(cx, top + menuTop + 9);
		});
	}

	private retry(): void {
		pixelOut(this, () => {
			this.scene.stop('Hud');
			this.scene.stop();
			this.scene.start('Game', { character: this.d.character });
		});
	}

	private toMenu(): void {
		pixelOut(this, () => {
			this.scene.stop('Hud');
			this.scene.stop('Game');
			this.scene.stop();
			this.scene.start('MainMenu');
		});
	}
}
