import Phaser from 'phaser';
import { SFX } from '../art/manifest';
import { PALETTE } from '../config/palette';
import { CHARACTER_TEXT, MENU } from '../config/strings';
import { fitUiCamera } from '../core/viewport';
import { CHARACTER_IDS } from '../data/characters';
import { formatTime } from '../logic/format';
import { playSfx } from '../systems/AudioSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { addStarfield } from '../ui/backdrop';
import { MenuList } from '../ui/MenuList';
import { addPanel } from '../ui/PixelPanel';
import { addText } from '../ui/text';
import { pixelIn, pixelOut } from '../ui/transition';

const PANEL_W = 150;
const PANEL_H = 170;

/** Lifetime statistics, best run per class and the last 10 runs. */
export class RecordsScene extends Phaser.Scene {
	constructor() {
		super('Records');
	}

	create(): void {
		addStarfield(this);
		const save = SaveSystem.get();
		const title = addText(this, 0, 0, MENU.records, {
			scale: 2,
			color: PALETTE.amber,
			originX: 0.5,
		});
		const left = addPanel(this, 0, 0, PANEL_W, PANEL_H);
		const right = addPanel(this, 0, 0, PANEL_W, PANEL_H);
		const rows: [string, string][] = [
			[MENU.runs, `${save.stats.runs}`],
			[MENU.kills, `${save.stats.kills}`],
			[MENU.goldTotal, `${save.stats.goldEarned}`],
			[MENU.damage, `${save.stats.damageDealt}`],
			[MENU.time, formatTime(save.stats.timeSec)],
			[MENU.bosses, `${save.bossKills}`],
			['', ''],
			...CHARACTER_IDS.map((c): [string, string] => [
				`${MENU.best} ${CHARACTER_TEXT[c].name}`,
				`${MENU.waveReached} ${save.best[c].wave}`,
			]),
		];
		const leftTexts = rows.map(([l, v]) => [
			addText(this, 0, 0, l, { color: PALETTE.steel }),
			addText(this, 0, 0, v, { color: PALETTE.white, originX: 1 }),
		]);
		const histTitle = addText(this, 0, 0, MENU.lastRuns, { color: PALETTE.amber });
		const histTexts = save.history.map((h) =>
			addText(
				this,
				0,
				0,
				`${CHARACTER_TEXT[h.character].name.padEnd(8)} ${MENU.waveReached} ${String(h.wave).padStart(2)}  ${formatTime(h.timeSec)}`,
				{ color: PALETTE.white },
			),
		);
		if (histTexts.length === 0)
			histTexts.push(addText(this, 0, 0, MENU.noRuns, { color: PALETTE.steel }));
		const menu = new MenuList(this, [
			{
				label: MENU.back,
				onSelect: () => {
					playSfx(SFX.uiClick);
					pixelOut(this, () => this.scene.start('MainMenu'));
				},
			},
		]);
		this.input.keyboard?.on('keydown-ESC', () =>
			pixelOut(this, () => this.scene.start('MainMenu')),
		);
		pixelIn(this);
		fitUiCamera(this, (view) => {
			const cx = Math.round(view.width / 2);
			const top = Math.max(30, Math.round(view.height / 2 - PANEL_H / 2 - 10));
			title.setPosition(cx, top - 24);
			left.setPosition(cx - PANEL_W - 4, top);
			right.setPosition(cx + 4, top);
			leftTexts.forEach(([l, v], i) => {
				l?.setPosition(left.x + 6, top + 8 + i * 10);
				v?.setPosition(left.x + PANEL_W - 6, top + 8 + i * 10);
			});
			histTitle.setPosition(right.x + 6, top + 8);
			histTexts.forEach((t, i) => {
				t.setPosition(right.x + 6, top + 22 + i * 12);
			});
			menu.layout(cx, top + PANEL_H + 16);
		});
	}
}
