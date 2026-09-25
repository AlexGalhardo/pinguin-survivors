import Phaser from 'phaser';
import { SFX } from '../art/manifest';
import { PALETTE } from '../config/palette';
import { MENU } from '../config/strings';
import { bus, GameEvent } from '../core/events';
import { settings } from '../core/settings';
import { fitUiCamera } from '../core/viewport';
import { AudioSystem, playSfx } from '../systems/AudioSystem';
import { MusicSystem } from '../systems/MusicSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { MenuList } from '../ui/MenuList';
import { addPanel } from '../ui/PixelPanel';
import { addText } from '../ui/text';

export interface SettingsData {
	/** Scene to wake up when closing (MainMenu or Pause). */
	from: string;
}

const VOLUME_STEP = 0.1;
const PANEL_W = 220;

/** SFX/music volume, fullscreen, screen shake and damage numbers; everything is persisted. */
export class SettingsScene extends Phaser.Scene {
	private from = 'MainMenu';
	private menu!: MenuList;

	constructor() {
		super('Settings');
	}

	init(data: SettingsData): void {
		this.from = data.from ?? 'MainMenu';
	}

	create(): void {
		const dim = this.add.rectangle(0, 0, 10, 10, PALETTE.void, 0.8).setOrigin(0, 0);
		const panel = addPanel(this, 0, 0, PANEL_W, 242);
		const title = addText(this, 0, 0, MENU.settings, {
			scale: 2,
			color: PALETTE.amber,
			originX: 0.5,
		});
		const vol = (key: 'sfxVolume' | 'musicVolume', dir: -1 | 1, wrap: boolean) => {
			let v = Math.round((settings[key] + dir * VOLUME_STEP) * 10) / 10;
			if (wrap && v > 1) v = 0;
			settings[key] = Math.min(1, Math.max(0, v));
			if (key === 'sfxVolume') AudioSystem.get()?.setVolume(settings.sfxVolume);
			else MusicSystem.get()?.applyVolume();
			this.changed();
		};
		const toggle = (key: 'screenShake' | 'damageNumbers' | 'reduceFlashes' | 'pauseOnBlur') => {
			settings[key] = !settings[key];
			this.changed();
		};
		this.menu = new MenuList(
			this,
			[
				{
					label: '',
					onSelect: () => vol('sfxVolume', 1, true),
					onAdjust: (d) => vol('sfxVolume', d, false),
				},
				{
					label: '',
					onSelect: () => vol('musicVolume', 1, true),
					onAdjust: (d) => vol('musicVolume', d, false),
				},
				{
					label: '',
					onSelect: () => this.toggleFullscreen(),
					onAdjust: () => this.toggleFullscreen(),
				},
				{
					label: '',
					onSelect: () => toggle('screenShake'),
					onAdjust: () => toggle('screenShake'),
				},
				{
					label: '',
					onSelect: () => toggle('damageNumbers'),
					onAdjust: () => toggle('damageNumbers'),
				},
				{ label: '', onSelect: () => this.textSize(), onAdjust: () => this.textSize() },
				{
					label: '',
					onSelect: () => toggle('reduceFlashes'),
					onAdjust: () => toggle('reduceFlashes'),
				},
				{
					label: '',
					onSelect: () => toggle('pauseOnBlur'),
					onAdjust: () => toggle('pauseOnBlur'),
				},
				{ label: MENU.back, onSelect: () => this.close() },
			],
			PANEL_W - 16,
		);
		this.refreshLabels();
		this.input.keyboard?.on('keydown-ESC', () => this.close());
		this.scale.on('enterfullscreen', this.onFullscreen, this);
		this.scale.on('leavefullscreen', this.onFullscreen, this);
		this.events.once('shutdown', () => {
			this.scale.off('enterfullscreen', this.onFullscreen, this);
			this.scale.off('leavefullscreen', this.onFullscreen, this);
		});
		fitUiCamera(this, (view) => {
			const cx = Math.round(view.width / 2);
			const top = Math.round(view.height / 2 - 121);
			dim.setSize(view.width, view.height);
			panel.setPosition(cx - PANEL_W / 2, top);
			title.setPosition(cx, top + 8);
			this.menu.layout(cx, top + 42);
		});
	}

	private onFullscreen(): void {
		settings.fullscreen = this.scale.isFullscreen;
		this.refreshLabels();
	}

	private toggleFullscreen(): void {
		if (this.scale.isFullscreen) this.scale.stopFullscreen();
		else this.scale.startFullscreen();
		settings.fullscreen = !this.scale.isFullscreen;
		this.changed();
	}

	private changed(): void {
		playSfx(SFX.uiClick);
		this.refreshLabels();
		SaveSystem.persist();
		bus(this.game).emit(GameEvent.SettingsChanged, undefined);
	}

	private refreshLabels(): void {
		const pct = (v: number) => `${Math.round(v * 100)}%`;
		const onOff = (v: boolean) => (v ? MENU.on : MENU.off);
		this.menu.setLabel(0, `${MENU.sfxVolume} ${pct(settings.sfxVolume)}`);
		this.menu.setLabel(1, `${MENU.musicVolume} ${pct(settings.musicVolume)}`);
		this.menu.setLabel(2, `${MENU.fullscreen} ${onOff(settings.fullscreen)}`);
		this.menu.setLabel(3, `${MENU.screenShake} ${onOff(settings.screenShake)}`);
		this.menu.setLabel(4, `${MENU.damageNumbers} ${onOff(settings.damageNumbers)}`);
		this.menu.setLabel(
			5,
			`${MENU.textSize} ${settings.damageTextSize >= 2 ? MENU.large : MENU.small}`,
		);
		this.menu.setLabel(6, `${MENU.reduceFlashes} ${onOff(settings.reduceFlashes)}`);
		this.menu.setLabel(7, `${MENU.pauseOnBlur} ${onOff(settings.pauseOnBlur)}`);
	}

	private textSize(): void {
		settings.damageTextSize = settings.damageTextSize >= 2 ? 1 : 2;
		this.changed();
	}

	private close(): void {
		playSfx(SFX.uiClick);
		this.scene.stop();
		this.scene.resume(this.from);
	}
}
