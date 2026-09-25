import Phaser from 'phaser';
import { SFX } from '../art/manifest';
import { PALETTE } from '../config/palette';
import { MENU } from '../config/strings';
import { fitUiCamera } from '../core/viewport';
import { META_UPGRADES } from '../data/meta';
import { buyUpgrade, nextCost, upgradeLevel } from '../logic/meta-upgrades';
import { playSfx } from '../systems/AudioSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { addStarfield } from '../ui/backdrop';
import { addIcon } from '../ui/IconFactory';
import { MenuList } from '../ui/MenuList';
import { addText } from '../ui/text';
import { pixelIn, pixelOut } from '../ui/transition';

const ROW_W = 300;

/** Permanent upgrade tree (1.0, D-42): spend Cores earned at the end of each run. */
export class UpgradesScene extends Phaser.Scene {
	private menu!: MenuList;
	private cores!: Phaser.GameObjects.BitmapText;

	constructor() {
		super('Upgrades');
	}

	create(): void {
		addStarfield(this);
		const title = addText(this, 0, 0, MENU.upgrades, {
			scale: 2,
			color: PALETTE.amber,
			originX: 0.5,
		});
		this.cores = addText(this, 0, 0, '', { color: PALETTE.cyan, originX: 0.5 });
		const hint = addText(this, 0, 0, MENU.upgradesHint, { color: PALETTE.steel, originX: 0.5 });
		this.menu = new MenuList(
			this,
			[
				...META_UPGRADES.map((u) => ({ label: '', onSelect: () => this.buy(u.id) })),
				{ label: MENU.back, onSelect: () => this.back() },
			],
			ROW_W,
			20,
		);
		const icons = META_UPGRADES.map((u) => addIcon(this, 0, 0, u.icon));
		this.refresh();
		this.input.keyboard?.on('keydown-ESC', () => this.back());
		fitUiCamera(this, (view) => {
			const cx = Math.round(view.width / 2);
			const top = Math.max(24, Math.round(view.height / 2 - 110));
			title.setPosition(cx, top - 18);
			this.cores.setPosition(cx, top);
			this.menu.layout(cx, top + 22);
			icons.forEach((ic, i) => {
				ic.setPosition(cx - ROW_W / 2 - 12, top + 22 + i * 20);
			});
			hint.setPosition(cx, top + 22 + (META_UPGRADES.length + 1) * 20);
		});
		pixelIn(this);
	}

	private refresh(): void {
		const save = SaveSystem.get();
		this.cores.setText(`${MENU.cores}: ${save.meta.cores}`);
		META_UPGRADES.forEach((u, i) => {
			const lvl = upgradeLevel(save, u.id);
			const cost = nextCost(save, u.id);
			const price = cost === null ? MENU.max : `${cost}`;
			this.menu.setLabel(i, `${u.name} ${u.desc}  ${lvl}/${u.costs.length}  ${price}`);
			this.menu.buttons[i]?.setEnabled(cost !== null && save.meta.cores >= cost);
		});
	}

	private buy(id: string): void {
		if (!buyUpgrade(SaveSystem.get(), id)) {
			this.cameras.main.shake(90, 0.004);
			return;
		}
		SaveSystem.persist();
		playSfx(SFX.buy);
		this.refresh();
	}

	private back(): void {
		playSfx(SFX.uiClick);
		pixelOut(this, () => this.scene.start('MainMenu'));
	}
}
