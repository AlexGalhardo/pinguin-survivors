import Phaser from 'phaser';
import { SFX } from '../art/manifest';
import { PALETTE } from '../config/palette';
import { MENU } from '../config/strings';
import { fitUiCamera } from '../core/viewport';
import { playSfx } from '../systems/AudioSystem';
import { MusicSystem } from '../systems/MusicSystem';
import { MenuList } from '../ui/MenuList';
import { addPanel } from '../ui/PixelPanel';
import { addText } from '../ui/text';

const PANEL_W = 170;

/** ESC during a wave: Resume, Settings, Quit run (with confirmation). */
export class PauseScene extends Phaser.Scene {
	private confirming = false;

	constructor() {
		super('Pause');
	}

	create(): void {
		this.confirming = false;
		const dim = this.add.rectangle(0, 0, 10, 10, PALETTE.void, 0.7).setOrigin(0, 0);
		const panel = addPanel(this, 0, 0, PANEL_W, 104);
		const title = addText(this, 0, 0, MENU.paused, {
			scale: 2,
			color: PALETTE.amber,
			originX: 0.5,
		});
		const main = new MenuList(this, [
			{ label: MENU.resume, onSelect: () => this.resume() },
			{
				label: MENU.settings,
				onSelect: () => {
					this.scene.pause();
					this.scene.launch('Settings', { from: 'Pause' });
				},
			},
			{ label: MENU.quitRun, onSelect: () => this.askQuit(true) },
		]);
		const confirmTitle = addText(this, 0, 0, MENU.quitConfirm, {
			color: PALETTE.red,
			originX: 0.5,
		}).setVisible(false);
		const confirm = new MenuList(this, [
			{ label: MENU.no, onSelect: () => this.askQuit(false) },
			{ label: MENU.yes, onSelect: () => this.quit() },
		]);
		const setMode = (confirming: boolean) => {
			this.confirming = confirming;
			main.active = !confirming;
			confirm.active = confirming;
			for (const b of main.buttons) b.setVisible(!confirming);
			for (const b of confirm.buttons) b.setVisible(confirming);
			confirmTitle.setVisible(confirming);
		};
		this.askQuit = (show: boolean) => {
			playSfx(SFX.uiClick);
			setMode(show);
		};
		setMode(false);
		this.input.keyboard?.on('keydown-ESC', () => {
			if (this.confirming) this.askQuit(false);
			else this.resume();
		});
		fitUiCamera(this, (view) => {
			const cx = Math.round(view.width / 2);
			const top = Math.round(view.height / 2 - 52);
			dim.setSize(view.width, view.height);
			panel.setPosition(cx - PANEL_W / 2, top);
			title.setPosition(cx, top + 8);
			main.layout(cx, top + 42);
			confirmTitle.setPosition(cx, top + 32);
			confirm.layout(cx, top + 52);
		});
	}

	/** Replaced in create() (needs the menus); declared for the menu callbacks. */
	private askQuit: (show: boolean) => void = () => {};

	private resume(): void {
		playSfx(SFX.uiClick);
		this.scene.stop();
		MusicSystem.get()?.duck(false);
		this.scene.resume('Game');
	}

	private quit(): void {
		playSfx(SFX.uiClick);
		this.scene.stop('Hud');
		this.scene.stop('Game');
		this.scene.stop();
		this.scene.start('MainMenu');
	}
}
