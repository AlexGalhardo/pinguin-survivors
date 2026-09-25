import Phaser from 'phaser';
import { SFX } from '../art/manifest';
import { PALETTE } from '../config/palette';
import { MENU } from '../config/strings';
import { fitUiCamera } from '../core/viewport';
import { ACHIEVEMENTS } from '../data/achievements';
import { playSfx } from '../systems/AudioSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { addStarfield } from '../ui/backdrop';
import { addIcon } from '../ui/IconFactory';
import { MenuList } from '../ui/MenuList';
import { addPanel } from '../ui/PixelPanel';
import { addText } from '../ui/text';
import { pixelIn, pixelOut } from '../ui/transition';

const PANEL_W = 300;
const ROW_H = 18;

/** Local achievements (D-43): unlocked ones in color, locked ones greyed out. */
export class AchievementsScene extends Phaser.Scene {
	constructor() {
		super('Achievements');
	}

	create(): void {
		addStarfield(this);
		const save = SaveSystem.get();
		const done = new Set(save.achievements);
		const title = addText(
			this,
			0,
			0,
			`${MENU.achievements} ${done.size}/${ACHIEVEMENTS.length}`,
			{
				scale: 2,
				color: PALETTE.amber,
				originX: 0.5,
			},
		);
		const panel = addPanel(this, 0, 0, PANEL_W, ACHIEVEMENTS.length * ROW_H + 8);
		const rows = ACHIEVEMENTS.map((a) => {
			const on = done.has(a.id);
			return {
				icon: addIcon(this, 0, 0, a.icon).setAlpha(on ? 1 : 0.3),
				name: addText(this, 0, 0, a.name, { color: on ? PALETTE.yellow : PALETTE.slate }),
				desc: addText(this, 0, 0, a.desc, { color: on ? PALETTE.silver : PALETTE.slate }),
			};
		});
		const menu = new MenuList(this, [{ label: MENU.back, onSelect: () => this.back() }]);
		this.input.keyboard?.on('keydown-ESC', () => this.back());
		fitUiCamera(this, (view) => {
			const cx = Math.round(view.width / 2);
			const top = Math.max(
				28,
				Math.round(view.height / 2 - (ACHIEVEMENTS.length * ROW_H) / 2 - 10),
			);
			title.setPosition(cx, top - 22);
			panel.setPosition(cx - PANEL_W / 2, top);
			rows.forEach((r, i) => {
				const y = top + 4 + i * ROW_H;
				r.icon.setPosition(cx - PANEL_W / 2 + 12, y + 8);
				r.name.setPosition(cx - PANEL_W / 2 + 24, y + 1);
				r.desc.setPosition(cx - PANEL_W / 2 + 24, y + 9);
			});
			menu.layout(cx, top + ACHIEVEMENTS.length * ROW_H + 22);
		});
		pixelIn(this);
	}

	private back(): void {
		playSfx(SFX.uiClick);
		pixelOut(this, () => this.scene.start('MainMenu'));
	}
}
