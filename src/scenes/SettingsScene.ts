import Phaser from 'phaser';
import { getSave, persist, setSave } from '../core/context';
import { setResolution } from '../core/display';
import { refreshMusicVolume } from '../core/music';
import { exportSave, importSave } from '../core/storage';
import { RESOLUTION_IDS } from '../data/display';
import { type I18nKey, LANGS, setLang, t } from '../i18n';
import { type GoreMode, NUMBER_SIZES } from '../logic/save';
import { ensureLangFont } from '../ui/lang-font';
import { MenuList } from './ui-phaser/MenuList';
import { setupScreen } from './ui-phaser/screen';

const GORE: GoreMode[] = ['max', 'reduced', 'goo'];
const cycle = <T>(list: readonly T[], value: T, dir: number): T =>
	list[(list.indexOf(value) + dir + list.length) % list.length] as T;

/** Settings from the main menu or the pause screen (docs/gdd.md §21). Saved on every change. */
export class SettingsScene extends Phaser.Scene {
	constructor() {
		super('Settings');
	}

	create(data: { from?: string }): void {
		const save = getSave(this);
		const s = save.settings;
		const back = () => {
			persist(this);
			if (data.from === 'Pause') {
				this.scene.stop();
				this.scene.wake('Pause');
			} else this.scene.start('MainMenu');
		};
		const pct = (v: number) => `${Math.round(v * 100)}%`;
		const vol = (key: keyof typeof s.volume) => ({
			onAdjust: (d: -1 | 1) => {
				s.volume[key] = Math.min(
					1,
					Math.max(0, Math.round((s.volume[key] + d * 0.1) * 10) / 10),
				);
				persist(this);
				refreshMusicVolume(this);
			},
		});
		const onOff = (v: boolean) => t(v ? 'on' : 'off');
		const menu = new MenuList(
			this,
			[
				{
					label: () =>
						t('settings.language', {
							v: t(`lang.${s.lang}` as I18nKey),
						}),
					onAdjust: (d) => {
						// Text rasterizes once: wait for the language font before rebuilding the scene.
						const next = cycle(LANGS, s.lang, d);
						void ensureLangFont(next).then(() => {
							s.lang = next;
							setLang(next);
							persist(this);
							this.scene.restart(data);
						});
					},
				},
				{
					label: () =>
						t('settings.resolution', { v: t(`res.${s.resolution}` as I18nKey) }),
					onAdjust: (d) => {
						s.resolution = cycle(RESOLUTION_IDS, s.resolution, d);
						setResolution(s.resolution);
						persist(this);
					},
				},
				{
					label: () => t('settings.fullscreen', { v: onOff(this.scale.isFullscreen) }),
					// Browser state, not saved: browsers only allow it from a user gesture.
					onAdjust: () => this.scale.toggleFullscreen(),
					onSelect: () => this.scale.toggleFullscreen(),
				},
				{
					label: () => t('settings.master', { v: pct(s.volume.master) }),
					...vol('master'),
				},
				{ label: () => t('settings.music', { v: pct(s.volume.music) }), ...vol('music') },
				{ label: () => t('settings.sfx', { v: pct(s.volume.sfx) }), ...vol('sfx') },
				{
					label: () => t('settings.gore', { v: t(`gore.${s.gore}` as I18nKey) }),
					onAdjust: (d) => {
						s.gore = cycle(GORE, s.gore, d);
						persist(this);
					},
				},
				{
					label: () => t('settings.shake', { v: onOff(s.screenShake) }),
					onAdjust: () => {
						s.screenShake = !s.screenShake;
						persist(this);
					},
				},
				{
					label: () => t('settings.bloom', { v: onOff(s.bloomOptIn) }),
					onAdjust: () => {
						s.bloomOptIn = !s.bloomOptIn;
						persist(this);
					},
				},
				{
					label: () => t('settings.numbers', { v: onOff(s.damageNumbers) }),
					onAdjust: () => {
						s.damageNumbers = !s.damageNumbers;
						persist(this);
					},
				},
				{
					label: () =>
						t('settings.numberSize', { v: t(`size.${s.numberSize}` as I18nKey) }),
					onAdjust: (d) => {
						s.numberSize = cycle(NUMBER_SIZES, s.numberSize, d);
						persist(this);
					},
				},
				{
					label: () => t('settings.reducedFlashes', { v: onOff(s.reducedFlashes) }),
					onAdjust: () => {
						s.reducedFlashes = !s.reducedFlashes;
						persist(this);
					},
				},
				{
					label: () => t('settings.controls'),
					onSelect: () => {
						persist(this);
						this.scene.start('Controls', data);
					},
				},
				{ label: () => t('settings.export'), onSelect: () => exportSave(getSave(this)) },
				{ label: () => t('settings.import'), onSelect: () => this.pickImport() },
				{ label: () => t('menu.back'), onSelect: back },
			],
			{ x: 0, y: 0, fontSize: 11, spacing: 16, onBack: back },
		);
		setupScreen(this, t('settings.title'), (view, cx) => {
			menu.layout(cx, Math.round(view.height / 2 - menu.height / 2 + 10));
		});
	}

	/** Hidden file input; the imported save goes through the same tolerant parser. */
	private pickImport(): void {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'application/json,.json';
		input.onchange = async () => {
			const file = input.files?.[0];
			if (!file) return;
			const save = await importSave(file, getSave(this).settings.lang);
			setSave(this.game, save);
			persist(this);
			setLang(save.settings.lang);
			setResolution(save.settings.resolution);
			this.scene.restart();
		};
		input.click();
	}
}
