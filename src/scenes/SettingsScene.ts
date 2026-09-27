import Phaser from 'phaser';
import { getSave, persist, setSave } from '../core/context';
import { setResolution } from '../core/display';
import { exportSave, importSave } from '../core/storage';
import { RESOLUTION_IDS } from '../data/display';
import { type I18nKey, LANGS, setLang, t } from '../i18n';
import type { GoreMode } from '../logic/save';
import { MenuList } from '../ui/MenuList';
import { setupScreen } from '../ui/screen';

const GORE: GoreMode[] = ['max', 'reduced', 'goo'];
const cycle = <T>(list: readonly T[], value: T, dir: number): T =>
	list[(list.indexOf(value) + dir + list.length) % list.length] as T;

/** Settings from the main menu or the pause screen (docs/ui-hud.md). Saved on every change. */
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
			},
		});
		const onOff = (v: boolean) => t(v ? 'on' : 'off');
		const menu = new MenuList(
			this,
			[
				{
					label: () =>
						t('settings.language', {
							v: s.lang === 'en' ? 'English' : 'Português (BR)',
						}),
					onAdjust: (d) => {
						s.lang = cycle(LANGS, s.lang, d);
						setLang(s.lang);
						persist(this);
						this.scene.restart(data);
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
					label: () => t('settings.master', { v: pct(s.volume.master) }),
					...vol('master'),
				},
				{ label: () => t('settings.music', { v: pct(s.volume.music) }), ...vol('music') },
				{ label: () => t('settings.sfx', { v: pct(s.volume.sfx) }), ...vol('sfx') },
				{ label: () => t('settings.voice', { v: pct(s.volume.voice) }), ...vol('voice') },
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
					label: () => t('settings.numbers', { v: onOff(s.damageNumbers) }),
					onAdjust: () => {
						s.damageNumbers = !s.damageNumbers;
						persist(this);
					},
				},
				{ label: () => t('settings.export'), onSelect: () => exportSave(getSave(this)) },
				{ label: () => t('settings.import'), onSelect: () => this.pickImport() },
				{ label: () => t('menu.back'), onSelect: back },
			],
			{ x: 0, y: 0, fontSize: 12, spacing: 18, onBack: back },
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
